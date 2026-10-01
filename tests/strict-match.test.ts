// strict 상징 매칭 규칙 (lib/matcher.ts 의 isStrictHit)
// 이름이 다른 뜻으로 흔히 쓰이는 상징(말, 눈, 새, 아버지 …)은
// 1) 표현이 단어 첫머리에서 시작할 때만, 2) 한 글자 이름은 바로 뒤에 '꿈'이 올 때만 인정한다.

import { describe, expect, it } from "vitest";
import { matchDream, matchSymbols, type MatchableSymbol } from "@/lib/matcher";
import { getAllActions } from "@/lib/actions";

const horse: MatchableSymbol = {
  slug: "horse",
  keyword: "말",
  synonyms: ["말을 타", "백마"],
  weight: 2,
  strict: true,
  situations: [{ action: "ride", title: "말을 타는 꿈", meaning: "가. 나." }],
};
const father: MatchableSymbol = { slug: "father", keyword: "아버지", synonyms: ["아빠"], weight: 2, strict: true };
/** strict 가 아닌 기존 방식의 한 글자 상징 */
const cow: MatchableSymbol = { slug: "cow", keyword: "소", synonyms: ["소"], weight: 2 };
const SYMBOLS = [horse, father, cow];
const slugs = (dream: string) => matchSymbols(dream, SYMBOLS).map((s) => s.slug);

describe("strict 상징", () => {
  it("한 글자 이름은 바로 뒤에 '꿈'이 올 때만 인정한다", () => {
    expect(slugs("말 꿈을 꿨어요")).toEqual(["horse"]);
    expect(slugs("말꿈을 꿨어요")).toEqual(["horse"]);
    expect(slugs("엄마가 나한테 말을 했어요")).toEqual([]);
    expect(slugs("말이 안 되는 꿈이었어요")).toEqual([]);
    expect(slugs("말했어요")).toEqual([]);
    expect(slugs("거짓말 꿈을 꿨어요")).toEqual([]);
  });

  it("두 글자 이상 표현은 단어 첫머리에서 시작할 때만 인정한다", () => {
    expect(slugs("말을 타고 달렸어요")).toEqual(["horse"]);
    expect(slugs("하얀 백마가 나타났어요")).toEqual(["horse"]);
    expect(slugs("아버지가 웃으셨어요")).toEqual(["father"]);
    expect(slugs("우리 아빠가 나왔어요")).toEqual(["father"]);
    expect(slugs("할아버지가 나왔어요")).toEqual([]);
    expect(slugs("거짓말을 타일렀어요")).toEqual([]);
  });

  it("strict 가 아닌 상징은 예전 규칙 그대로 (띄어 쓴 한 글자 + 조사)", () => {
    expect(slugs("소 한 마리가 있었어요")).toEqual(["cow"]);
    expect(slugs("소가 들어왔어요")).toEqual(["cow"]);
    expect(slugs("소꿈을 꿨어요")).toEqual(["cow"]);
    expect(slugs("소리가 났어요")).toEqual([]);
  });

  it("strict 상징도 상황 풀이는 똑같이 고른다", () => {
    const [match] = matchDream("말을 타고 들판을 달렸어요", SYMBOLS, getAllActions());
    expect(match.symbol.slug).toBe("horse");
    expect(match.situation?.action).toBe("ride");
  });
});
