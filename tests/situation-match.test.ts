// 상징 + 행동을 함께 찾아 상황 풀이를 고르는지 검사

import { describe, expect, it } from "vitest";
import { getAllActions } from "@/lib/actions";
import { NO_SYMBOL_SUMMARY } from "@/lib/interpret/ruleBased";
import { ACTION_AFTER_LIMIT, findActions, matchDream } from "@/lib/matcher";
import { interpretDream } from "@/lib/service";
import { getAllSymbols } from "@/lib/symbols";

const SYMBOLS = getAllSymbols();
const ACTIONS = getAllActions();
const NOW = new Date("2026-09-30T03:00:00Z");

/** "slug+action" 목록으로 간단히 비교 (상황이 없으면 slug 만) */
const pairs = (dream: string) =>
  matchDream(dream, SYMBOLS, ACTIONS).map((m) => (m.situation ? `${m.symbol.slug}+${m.situation.action}` : m.symbol.slug));

describe("findActions (행동 찾기)", () => {
  it("활용형으로 행동을 찾는다", () => {
    expect(findActions("돼지가 집으로 들어왔어요", ACTIONS)).toEqual(["enter"]);
    expect(findActions("뱀에게 물렸다", ACTIONS)).toEqual(["bite"]);
    expect(findActions("호랑이한테 쫓기다가 절벽에서 떨어졌다", ACTIONS)).toEqual(["chased", "fall"]);
  });

  it("2글자 활용형은 단어 첫머리에서만 인정 (도와주는 ≠ 주는)", () => {
    expect(findActions("친구가 도와주는 꿈", ACTIONS)).not.toContain("give");
    expect(findActions("할머니가 돈을 주는 꿈", ACTIONS)).toContain("give");
  });
});

describe("matchDream (상징 + 행동 → 상황 풀이)", () => {
  it("상징 뒤에 나온 행동과 짝지어 상황 풀이를 붙인다", () => {
    expect(pairs("돼지가 집으로 들어오는 꿈을 꿨어요")).toEqual(["pig+enter", "house"]);
    expect(pairs("뱀에게 물렸어요")).toEqual(["snake+bite"]);
    expect(pairs("구렁이가 몸을 칭칭 감았다")).toEqual(["snake+wrap"]);
  });

  it("상징마다 가장 가까운 행동을 고른다", () => {
    expect(pairs("돼지가 들어오고 뱀에게 물렸다")).toEqual(["pig+enter", "snake+bite"]);
  });

  it("'돼지가 도망쳤다'는 돼지+달아나다 이고, 쫓기는 꿈으로 보지 않는다", () => {
    expect(pairs("돼지가 도망쳤어요")).toEqual(["pig+escape"]);
  });

  it("앞에 나온 행동도 가까우면 인정한다 (들어온 돼지)", () => {
    expect(pairs("마당으로 들어온 돼지를 봤다")).toEqual(["pig+enter"]);
  });

  it("다른 문장의 행동이나 너무 먼 행동은 짝짓지 않는다", () => {
    expect(pairs("돼지를 봤어요. 그리고 친구가 집에 들어왔어요.")).toEqual(["pig", "house"]);
    const far = `돼지가 ${"아주 ".repeat(Math.ceil(ACTION_AFTER_LIMIT / 3) + 1)}들어왔다`;
    expect(pairs(far)).toEqual(["pig"]);
  });

  it("그 상징에 없는 행동이면 일반 풀이만 (돼지 + 먹다)", () => {
    expect(pairs("돼지를 먹었다")).toEqual(["pig"]);
  });

  it("상징 매칭 결과(순서·개수)는 matchSymbols 와 같다", () => {
    expect(pairs("돼지 용 불 돈 똥 조상 대통령 태양이 모두 나온 꿈")).toHaveLength(4);
  });
});

describe("interpretDream 에 상황 풀이 반영", () => {
  it("상황 풀이가 있으면 그 풀이를 meaning 과 요약에 우선 사용한다", async () => {
    const res = await interpretDream("돼지가 집으로 들어오는 꿈을 꿨어요", { now: NOW });
    const pig = SYMBOLS.find((s) => s.slug === "pig")!;
    const enter = pig.situations.find((s) => s.action === "enter")!;
    expect(res.symbols[0].meaning).toBe(enter.meaning);
    expect(res.summary.startsWith(enter.meaning.split(/(?<=[.!?])\s+/)[0])).toBe(true);
    expect(res.situations).toEqual([{ slug: "pig", action: "enter", title: enter.title }]);
  });

  it("상황 풀이가 없으면 일반 풀이 그대로, situations 는 빈 배열", async () => {
    const res = await interpretDream("돼지 꿈", { now: NOW });
    expect(res.symbols[0].meaning).toBe(SYMBOLS.find((s) => s.slug === "pig")!.meaning);
    expect(res.situations).toEqual([]);
  });

  it("상징이 없으면 기본 템플릿 (행동만 있어도)", async () => {
    const res = await interpretDream("누군가 들어왔다가 나갔다", { now: NOW });
    expect(res.summary).toBe(NO_SYMBOL_SUMMARY);
    expect(res.situations).toEqual([]);
  });

  it("행동·상황 풀이는 번호에 영향을 주지 않는다", async () => {
    const a = await interpretDream("돼지 꿈", { now: NOW });
    const b = await interpretDream("돼지 꿈", { now: NOW, actions: [] });
    expect(b.games).toEqual(a.games);
  });
});
