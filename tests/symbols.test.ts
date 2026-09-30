import { describe, expect, it } from "vitest";
import raw from "@/data/symbols.json";
import { matchSymbols } from "@/lib/matcher";
import { candidateNumbers } from "@/lib/symbolNumbers";
import { getAllSymbols, validateSymbols } from "@/lib/symbols";
import type { DreamSymbol } from "@/lib/types";

const ALL = getAllSymbols();

describe("data/symbols.json", () => {
  it("유효성 검사 통과 (필수 필드, 숫자 범위, slug 중복, body 길이 등)", () => {
    expect(validateSymbols(raw)).toEqual([]);
  });

  it("상징이 30개 이상", () => {
    expect(ALL.length).toBeGreaterThanOrEqual(30);
  });

  it("numbers 가 README 의 숫자 후보 규칙과 일치", () => {
    for (const s of ALL) {
      const expected = candidateNumbers(s.keyword, s.category, s.weight);
      expect(s.numbers, `${s.slug} 의 numbers 는 ${JSON.stringify(expected)} 이어야 합니다`).toEqual(expected);
    }
  });

  it("모든 상징이 자기 키워드로 매칭된다", () => {
    for (const s of ALL) {
      const found = matchSymbols(`${s.keyword} 꿈을 꿨어요`, ALL).map((m) => m.slug);
      expect(found, s.slug).toContain(s.slug);
    }
  });
});

describe("validateSymbols 가 잘못된 데이터를 잡아낸다", () => {
  const good = ALL[0];
  const clone = (patch: Partial<DreamSymbol> | Record<string, unknown>) => ({ ...good, ...patch });

  it("slug 중복", () => {
    expect(validateSymbols([good, clone({})]).join()).toMatch(/중복/);
  });

  it("숫자 범위 밖 / 개수 부족 / 숫자 중복", () => {
    expect(validateSymbols([clone({ numbers: [0, 5, 10] })]).join()).toMatch(/1~45/);
    expect(validateSymbols([clone({ numbers: [5, 10, 46] })]).join()).toMatch(/1~45/);
    expect(validateSymbols([clone({ numbers: [5, 10] })]).join()).toMatch(/3~5개/);
    expect(validateSymbols([clone({ numbers: [5, 5, 10] })]).join()).toMatch(/중복/);
  });

  it("필수 필드 누락", () => {
    expect(validateSymbols([clone({ keyword: "" })]).join()).toMatch(/keyword/);
    expect(validateSymbols([clone({ synonyms: [] })]).join()).toMatch(/synonyms/);
    expect(validateSymbols([clone({ category: "음식" })]).join()).toMatch(/category/);
    expect(validateSymbols([clone({ fortune_type: "행운" })]).join()).toMatch(/fortune_type/);
    expect(validateSymbols([clone({ weight: 5 })]).join()).toMatch(/weight/);
    expect(validateSymbols([clone({ body: "짧은 본문" })]).join()).toMatch(/300자/);
  });
});
