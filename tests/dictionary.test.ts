// 사전 v2 데이터 구조 검사: 카테고리별 파일, 행동 사전, 상황 풀이

import { describe, expect, it } from "vitest";
import { getAllActions, MIN_ACTIONS, rawActionData, validateActions } from "@/lib/actions";
import { getAllSymbols, rawSymbolData, SYMBOL_FILES, validateSymbolFiles, validateSymbols } from "@/lib/symbols";
import { DICTIONARY_CATEGORIES, type DreamSymbol } from "@/lib/types";

describe("data/symbols/*.json (카테고리별 파일)", () => {
  it("파일마다 그 카테고리 상징만 들어 있다", () => {
    expect(validateSymbolFiles()).toEqual([]);
  });

  it("파일 6개를 합치면 전체 사전이 된다 (v1 순서 + 연애·결혼)", () => {
    expect(SYMBOL_FILES.map((f) => f.file)).toEqual([
      "animal.json",
      "person.json",
      "nature.json",
      "behavior.json",
      "object.json",
      "love.json",
    ]);
    expect(SYMBOL_FILES.map((f) => f.category)).toEqual([...DICTIONARY_CATEGORIES]);
    expect(getAllSymbols()).toHaveLength(rawSymbolData.length);
  });

  it("다른 카테고리 상징이 섞이면 잡아낸다", () => {
    const pig = getAllSymbols()[0];
    const errors = validateSymbolFiles([{ category: "사람", file: "person.json", items: [pig] }]);
    expect(errors.join()).toMatch(/category 가 "사람"/);
  });
});

describe("data/actions.json (행동 사전)", () => {
  it(`유효성 검사 통과 (${MIN_ACTIONS}개 이상, slug 중복 없음, 활용형 2글자 이상)`, () => {
    expect(validateActions(rawActionData)).toEqual([]);
    expect(getAllActions().length).toBeGreaterThanOrEqual(MIN_ACTIONS);
  });

  it("요청된 기본 행동이 모두 있다", () => {
    const verbs = getAllActions().map((a) => a.verb);
    for (const verb of ["들어오다", "쫓기다", "먹다", "죽다", "잡다", "물다", "날다", "떨어지다"]) {
      expect(verbs).toContain(verb);
    }
  });

  it("잘못된 행동 데이터를 잡아낸다", () => {
    const ok = getAllActions()[0];
    expect(validateActions([ok, ok]).join()).toMatch(/중복/);
    expect(validateActions([{ ...ok, synonyms: ["들"] }]).join()).toMatch(/2글자/);
    expect(validateActions([{ ...ok, verb: "들어오" }]).join()).toMatch(/기본형/);
    expect(validateActions([{ ...ok, slug: "Enter" }]).join()).toMatch(/slug/);
  });
});

describe("situations (상황별 풀이)", () => {
  const pig = getAllSymbols().find((s) => s.slug === "pig")!;
  const withSituations = (situations: unknown): DreamSymbol => ({ ...pig, situations } as DreamSymbol);

  it("상황 풀이의 action 은 모두 행동 사전에 있다", () => {
    const actionSlugs = new Set(getAllActions().map((a) => a.slug));
    for (const s of getAllSymbols()) {
      for (const sit of s.situations) expect(actionSlugs.has(sit.action), `${s.slug}: ${sit.action}`).toBe(true);
    }
  });

  it("개수는 3~5개", () => {
    expect(validateSymbols([withSituations(pig.situations.slice(0, 2))]).join()).toMatch(/3~5개/);
  });

  it("없는 행동, 중복 행동, 제목 형식, 문장 수를 검사한다", () => {
    const [a, b, c] = pig.situations;
    expect(validateSymbols([withSituations([a, b, { ...c, action: "no-such" }])]).join()).toMatch(/actions\.json 에 없/);
    expect(validateSymbols([withSituations([a, b, { ...c, action: a.action }])]).join()).toMatch(/두 번/);
    expect(validateSymbols([withSituations([a, b, { ...c, title: "돼지 들어옴" }])]).join()).toMatch(/꿈"으로 끝/);
    expect(validateSymbols([withSituations([a, b, { ...c, meaning: "한 문장뿐이에요." }])]).join()).toMatch(/2~3문장/);
  });
});
