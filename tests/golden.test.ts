// 번호 생성 규칙이 바뀌지 않았는지 확인하는 "골든" 테스트.
// 아래 값은 v1(커밋 e8ad2f8)의 lib/lotto.ts 가 실제로 만든 결과를 그대로 기록한 것이다.
// 이 테스트가 실패하면 번호 규칙이 바뀐 것이므로, 의도한 변경이 아니라면 되돌려야 한다.

import { describe, expect, it } from "vitest";
import { generateGames, makeSeed } from "@/lib/lotto";
import { interpretDream } from "@/lib/service";
import { getSymbolBySlug } from "@/lib/symbols";

const sym = (slug: string) => {
  const s = getSymbolBySlug(slug);
  if (!s) throw new Error(`no symbol ${slug}`);
  return s;
};

const CASES = [
  {
    normalizedDream: "돼지 꿈",
    date: "2026-09-30",
    slugs: ["pig"],
    counter: 0,
    seed: 1412796921,
    games: [
      { numbers: [9,10,11,14,33,37], reasons: ["돼지 꿈 → 재물", "행운 보충", "행운 보충", "행운 보충", "행운 보충", "돼지 꿈 → 재물"] },
      { numbers: [19,20,24,26,36,37], reasons: ["행운 보충", "돼지 꿈 → 재물", "행운 보충", "돼지 꿈 → 재물", "행운 보충", "돼지 꿈 → 재물"] },
      { numbers: [9,20,25,26,28,33], reasons: ["돼지 꿈 → 재물", "돼지 꿈 → 재물", "행운 보충", "돼지 꿈 → 재물", "행운 보충", "행운 보충"] },
      { numbers: [3,8,21,22,26,37], reasons: ["행운 보충", "행운 보충", "행운 보충", "행운 보충", "돼지 꿈 → 재물", "돼지 꿈 → 재물"] },
      { numbers: [3,10,27,30,37,42], reasons: ["돼지 꿈 → 재물", "행운 보충", "행운 보충", "행운 보충", "돼지 꿈 → 재물", "행운 보충"] },
    ],
  },
  {
    normalizedDream: "돼지 꿈",
    date: "2026-09-30",
    slugs: ["pig"],
    counter: 3,
    seed: 1412796921,
    games: [
      { numbers: [5,9,26,30,37,38], reasons: ["행운 보충", "돼지 꿈 → 재물", "돼지 꿈 → 재물", "행운 보충", "행운 보충", "행운 보충"] },
      { numbers: [13,20,24,26,28,44], reasons: ["행운 보충", "돼지 꿈 → 재물", "행운 보충", "돼지 꿈 → 재물", "행운 보충", "행운 보충"] },
      { numbers: [3,8,20,23,26,36], reasons: ["행운 보충", "행운 보충", "돼지 꿈 → 재물", "행운 보충", "돼지 꿈 → 재물", "행운 보충"] },
      { numbers: [3,16,20,23,24,38], reasons: ["돼지 꿈 → 재물", "행운 보충", "돼지 꿈 → 재물", "행운 보충", "행운 보충", "행운 보충"] },
      { numbers: [6,9,13,17,26,41], reasons: ["행운 보충", "돼지 꿈 → 재물", "행운 보충", "행운 보충", "돼지 꿈 → 재물", "행운 보충"] },
    ],
  },
  {
    normalizedDream: "용과 불과 돈과 똥",
    date: "2026-10-01",
    slugs: ["dragon", "fire", "money", "poop"],
    counter: 0,
    seed: 1319304663,
    games: [
      { numbers: [2,11,14,15,37,42], reasons: ["행운 보충", "행운 보충", "행운 보충", "똥 꿈 → 재물", "불 꿈 → 재물", "용 꿈 → 직장"] },
      { numbers: [7,18,20,30,31,45], reasons: ["행운 보충", "행운 보충", "불 꿈 → 재물", "행운 보충", "용 꿈 → 직장", "행운 보충"] },
      { numbers: [4,6,10,20,38,42], reasons: ["행운 보충", "행운 보충", "행운 보충", "불 꿈 → 재물", "행운 보충", "용 꿈 → 직장"] },
      { numbers: [4,9,11,25,33,43], reasons: ["행운 보충", "불 꿈 → 재물", "행운 보충", "용 꿈 → 직장", "돈 꿈 → 재물", "행운 보충"] },
      { numbers: [1,9,13,26,39,43], reasons: ["행운 보충", "불 꿈 → 재물", "행운 보충", "불 꿈 → 재물", "행운 보충", "불 꿈 → 재물"] },
    ],
  },
  {
    normalizedDream: "아무 상징 없는 꿈",
    date: "2026-09-30",
    slugs: [],
    counter: 0,
    seed: 3413224095,
    games: [
      { numbers: [2,7,13,15,23,43], reasons: ["행운 보충", "행운 보충", "행운 보충", "행운 보충", "행운 보충", "행운 보충"] },
      { numbers: [1,10,13,18,26,37], reasons: ["행운 보충", "행운 보충", "행운 보충", "행운 보충", "행운 보충", "행운 보충"] },
      { numbers: [6,17,19,20,37,40], reasons: ["행운 보충", "행운 보충", "행운 보충", "행운 보충", "행운 보충", "행운 보충"] },
      { numbers: [2,19,35,37,39,40], reasons: ["행운 보충", "행운 보충", "행운 보충", "행운 보충", "행운 보충", "행운 보충"] },
      { numbers: [6,9,10,13,23,37], reasons: ["행운 보충", "행운 보충", "행운 보충", "행운 보충", "행운 보충", "행운 보충"] },
    ],
  },
];

describe("번호 생성 골든 테스트 (v1 결과와 동일해야 함)", () => {
  for (const c of CASES) {
    it(`${c.normalizedDream} / ${c.date} / counter ${c.counter}`, () => {
      expect(makeSeed(c.normalizedDream, c.date)).toBe(c.seed);
      const games = generateGames({
        normalizedDream: c.normalizedDream,
        date: c.date,
        symbols: c.slugs.map(sym),
        counter: c.counter,
      });
      expect(games).toEqual(c.games);
    });
  }

  it("전체 흐름(interpretDream)도 v1과 같은 상징·번호", async () => {
    const res = await interpretDream("돼지가 집으로 들어오고 마당에 불이 활활 타는 꿈을 꿨어요", {
      now: new Date("2026-09-30T03:00:00Z"),
    });
    expect(res.symbols.map((s) => s.slug)).toEqual(["pig", "fire", "house"]);
    expect(res.games.map((game) => game.numbers)).toEqual([[10,17,26,30,37,42],[4,12,15,20,38,43],[6,14,20,35,38,42],[7,17,20,21,31,37],[5,9,20,32,35,37]]);
  });
});
