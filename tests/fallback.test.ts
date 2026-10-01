// 매칭 폴백 점검 (배포 전 점검 작업 E)
// 상징·행동이 사전에 없거나 애매할 때 풀이가 어색하게 붙지 않는지 15개 입력으로 고정한다.

import { describe, expect, it } from "vitest";
import { NO_SYMBOL_SUMMARY } from "@/lib/interpret/ruleBased";
import { interpretDream } from "@/lib/service";
import { getAllSymbols } from "@/lib/symbols";

const NOW = new Date("2026-10-01T03:00:00Z");
const firstSentence = (text: string) => text.split(/(?<=[.!?])\s+/)[0];

/** [입력, 기대하는 "상징+행동"(상황 풀이가 없으면 상징만)] */
const CASES: [string, string[]][] = [
  ["돼지가 도망쳤어요", ["pig+escape"]], // '도망'은 쫓기는 꿈이 아니라 돼지가 달아나는 꿈
  ["돼지가 집에 들어왔어요", ["pig+enter", "house"]], // 집에는 '들어오다' 풀이가 없어 일반 풀이
  ["안 다쳤어요", []], // 행동만 있고 상징 없음 (부정된 행동)
  ["오늘은 평범한 하루였어요", []], // 상징 없음
  ["돼지를 먹었어요", ["pig"]], // 돼지에 '먹다' 풀이 없음 → 일반 풀이
  ["뱀에게 물렸어요", ["snake+bite"]],
  ["돌아가신 할머니가 돈을 주셨어요", ["ancestor+receive", "money+receive"]], // '주셨다' = 내가 받음
  ["집에 불이 났는데 아무도 안 다쳤어요", ["fire+burn", "house+burn"]], // '안 다쳤어요'는 무시
  ["금반지를 잃어버려서 한참 찾았어요", ["gold+lose"]], // '한참 찾았다'는 줍는 꿈이 아님
  ["은행에서 돈을 찾았어요", ["money"]], // 돈을 '찾다'(인출)는 줍는 꿈이 아님
  ["엄마가 아기를 낳았어요", ["mother", "baby+birth"]], // 어머니(사전 확장 1차)에는 '낳다' 풀이가 없어 일반 풀이
  ["시험을 망치는 꿈을 꿨어요", []], // 사전에 없는 꿈 → 길몽이라고 단정하지 않는다
  ["도둑을 잡지 못했어요", ["thief"]], // 부정된 '잡다'는 무시
  ["이 꿈 무슨 뜻이에요?", []], // '이'(이빨)로 잘못 잡지 않는다
  ["돼지를 먹고 나서 집으로 들어왔어요", ["pig", "house"]], // 풀이 없는 행동에서 멈춘다
];

describe("매칭 폴백 15개 입력", () => {
  for (const [dream, expected] of CASES) {
    it(`"${dream}" → ${expected.join(", ") || "상징 없음"}`, async () => {
      const res = await interpretDream(dream, { now: NOW });
      const got = res.symbols.map((s) => {
        const sit = res.situations.find((x) => x.slug === s.slug);
        return sit ? `${s.slug}+${sit.action}` : s.slug;
      });
      expect(got).toEqual(expected);

      if (expected.length === 0) {
        // 상징이 없으면 안내 문구만, 꿈 내용과 어긋날 수 있는 '길몽' 같은 풀이는 붙이지 않는다.
        expect(res.summary).toBe(NO_SYMBOL_SUMMARY);
        expect(res.summary).not.toMatch(/길몽|흉몽|평온/);
        expect(res.games).toHaveLength(5);
        return;
      }
      // 요약 첫 문장은 첫 상징의 (상황) 풀이 첫 문장
      const first = res.symbols[0];
      expect(res.summary.startsWith(firstSentence(first.meaning))).toBe(true);
      // 일반 풀이로 대신한 상징은 사전의 일반 풀이를 그대로 쓴다.
      for (const s of res.symbols) {
        if (!res.situations.some((x) => x.slug === s.slug)) {
          expect(s.meaning).toBe(getAllSymbols().find((x) => x.slug === s.slug)!.meaning);
        }
      }
    });
  }

  it("다른 사람이 아기를 낳은 꿈에도 어색하지 않다 ('직접' 같은 말이 없다)", async () => {
    const res = await interpretDream("엄마가 아기를 낳았어요", { now: NOW });
    expect(res.symbols.find((s) => s.slug === "baby")!.meaning).not.toMatch(/직접/);
  });

  it("비슷한 글자로 엉뚱한 상징을 잡지 않는다", async () => {
    for (const dream of ["불안해서 잠을 못 잤어요", "물건을 잃어버렸어요", "돈까스를 먹었어요", "pig dream"]) {
      expect((await interpretDream(dream, { now: NOW })).symbols, dream).toEqual([]);
    }
  });
});
