import { afterEach, describe, expect, it, vi } from "vitest";
import {
  FILL_REASON,
  GAME_COUNT,
  buildScoreTable,
  generateGames,
  makeSeed,
  mulberry32,
} from "@/lib/lotto";
import { getSymbolBySlug } from "@/lib/symbols";
import type { DreamSymbol, LottoGame } from "@/lib/types";

const sym = (slug: string): DreamSymbol => {
  const s = getSymbolBySlug(slug);
  if (!s) throw new Error(`no symbol ${slug}`);
  return s;
};

function expectValidGame(game: LottoGame) {
  expect(game.numbers).toHaveLength(6);
  expect(game.reasons).toHaveLength(6);
  expect(new Set(game.numbers).size).toBe(6);
  for (const n of game.numbers) {
    expect(Number.isInteger(n)).toBe(true);
    expect(n).toBeGreaterThanOrEqual(1);
    expect(n).toBeLessThanOrEqual(45);
  }
  expect(game.numbers).toEqual([...game.numbers].sort((a, b) => a - b));
}

afterEach(() => vi.restoreAllMocks());

describe("mulberry32 / makeSeed", () => {
  it("같은 시드면 같은 수열, 값은 0 이상 1 미만", () => {
    const a = mulberry32(12345);
    const b = mulberry32(12345);
    for (let i = 0; i < 1000; i++) {
      const x = a();
      expect(x).toBe(b());
      expect(x).toBeGreaterThanOrEqual(0);
      expect(x).toBeLessThan(1);
    }
  });

  it("시드는 32비트 부호 없는 정수이고 입력이 같으면 같다", () => {
    const seed = makeSeed("돼지 꿈", "2026-09-30");
    expect(seed).toBe(makeSeed("돼지 꿈", "2026-09-30"));
    expect(Number.isInteger(seed)).toBe(true);
    expect(seed).toBeGreaterThanOrEqual(0);
    expect(seed).toBeLessThanOrEqual(0xffffffff);
    expect(seed).not.toBe(makeSeed("돼지 꿈", "2026-10-01"));
  });
});

describe("generateGames", () => {
  const dreams: Array<[string, DreamSymbol[]]> = [
    ["아무 상징 없는 꿈", []],
    ["돼지 꿈", [sym("pig")]],
    ["용과 불과 돈과 똥", [sym("dragon"), sym("fire"), sym("money"), sym("poop")]],
    ["반지 꿈", [sym("ring")]],
  ];

  it("모든 게임이 1~45, 중복 없는 6개, 오름차순", () => {
    for (const [dream, symbols] of dreams) {
      for (const date of ["2026-01-01", "2026-09-30", "2027-12-31"]) {
        for (let counter = 0; counter < 20; counter++) {
          const games = generateGames({ normalizedDream: dream, date, symbols, counter });
          expect(games).toHaveLength(GAME_COUNT);
          games.forEach(expectValidGame);
        }
      }
    }
  });

  it("같은 꿈 + 같은 날짜면 항상 같은 결과", () => {
    const input = { normalizedDream: "돼지 꿈", date: "2026-09-30", symbols: [sym("pig")] };
    expect(generateGames(input)).toEqual(generateGames(input));
  });

  it("날짜가 다르면 다른 결과", () => {
    const base = { normalizedDream: "돼지 꿈", symbols: [sym("pig")] };
    const a = generateGames({ ...base, date: "2026-09-30" });
    const b = generateGames({ ...base, date: "2026-10-01" });
    expect(a).not.toEqual(b);
  });

  it("다시 뽑기(카운터)를 하면 다른 결과, 같은 카운터면 같은 결과", () => {
    const base = { normalizedDream: "돼지 꿈", date: "2026-09-30", symbols: [sym("pig")] };
    const first = generateGames({ ...base, counter: 0 });
    const again = generateGames({ ...base, counter: 1 });
    expect(first).not.toEqual(again);
    expect(generateGames({ ...base, counter: 1 })).toEqual(again);
  });

  it("상징이 매칭되면 꿈 번호 2~3개가 그 상징의 numbers 후보 안에서 나온다", () => {
    const symbols = [sym("pig"), sym("fire")];
    const candidates = new Set(symbols.flatMap((s) => s.numbers));
    for (let counter = 0; counter < 50; counter++) {
      const games = generateGames({ normalizedDream: "돼지와 불", date: "2026-09-30", symbols, counter });
      for (const game of games) {
        const dreamIdx = game.reasons.map((r, i) => (r === FILL_REASON ? -1 : i)).filter((i) => i >= 0);
        expect(dreamIdx.length).toBeGreaterThanOrEqual(2);
        expect(dreamIdx.length).toBeLessThanOrEqual(3);
        for (const i of dreamIdx) {
          expect(candidates.has(game.numbers[i])).toBe(true);
          expect(game.reasons[i]).toMatch(/^(돼지|불) 꿈 → 재물$/);
        }
      }
    }
  });

  it("꿈 번호의 이유는 그 숫자를 후보로 가진 상징을 가리킨다", () => {
    const symbols = [sym("pig"), sym("ring")];
    const games = generateGames({ normalizedDream: "돼지 반지", date: "2026-09-30", symbols });
    for (const game of games) {
      game.numbers.forEach((n, i) => {
        if (game.reasons[i] === "돼지 꿈 → 재물") expect(sym("pig").numbers).toContain(n);
        if (game.reasons[i] === "반지 꿈 → 연애") expect(sym("ring").numbers).toContain(n);
      });
    }
  });

  it("상징이 0개면 6개 모두 '행운 보충'(균등 랜덤)", () => {
    const games = generateGames({ normalizedDream: "알 수 없는 꿈", date: "2026-09-30", symbols: [] });
    for (const game of games) {
      expect(game.reasons.every((r) => r === FILL_REASON)).toBe(true);
    }
  });

  it("Math.random 을 쓰지 않는다", () => {
    const spy = vi.spyOn(Math, "random");
    generateGames({ normalizedDream: "돼지 꿈", date: "2026-09-30", symbols: [sym("pig")] });
    expect(spy).not.toHaveBeenCalled();
  });
});

describe("buildScoreTable", () => {
  it("상징의 numbers 에 weight 를 더한다 (겹치는 숫자는 합산)", () => {
    const pig = sym("pig"); // weight 3
    const fire = sym("fire"); // weight 3
    const table = buildScoreTable([pig, fire]);
    const shared = pig.numbers.filter((n) => fire.numbers.includes(n));
    expect(shared.length).toBeGreaterThan(0);
    for (const n of shared) expect(table.get(n)?.score).toBe(6);
    for (const n of pig.numbers.filter((n) => !shared.includes(n))) expect(table.get(n)?.score).toBe(3);
  });
});
