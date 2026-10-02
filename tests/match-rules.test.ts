// 매칭 보조 규칙 (사전 확장 3차, lib/matcher.ts)
// 1) contextTerms: 같은 문장에 contextWords 가운데 하나가 있을 때만 인정하는 표현
// 2) exclude: 단어 첫머리에서 시작하는 이 표현과 겹치는 자리는 그 상징으로 잡지 않는다
// 3) 부정된 행동: 띄어 쓰지 않은 "못받았다", 줄여 쓴 "잡진 못했다", "받지를 못했다"도 부정
// 실제 사전에서 쓰는 곳(이별, 자녀, 달, 금)은 tests/symbol-inputs.test.ts 에서 확인한다.

import { describe, expect, it } from "vitest";
import { getAllActions } from "@/lib/actions";
import { matchDream, matchSymbols, type MatchableSymbol } from "@/lib/matcher";
import { validateSymbols } from "@/lib/symbols";
import { getSymbolBySlug } from "@/lib/symbols";

const breakup: MatchableSymbol = {
  slug: "breakup",
  keyword: "이별",
  synonyms: ["이별"],
  weight: 1,
  contextTerms: ["헤어졌"],
  contextWords: ["애인", "남친"],
};
const child: MatchableSymbol = { slug: "child", keyword: "자녀", synonyms: ["딸이"], weight: 1, exclude: ["손녀딸"] };
const moon: MatchableSymbol = {
  slug: "moon",
  keyword: "달",
  synonyms: ["달이"],
  weight: 1,
  strict: true,
  exclude: ["한 달"],
};
const slugs = (dream: string, symbols: MatchableSymbol[]) => matchSymbols(dream, symbols).map((s) => s.slug);

describe("문맥 표현 (contextTerms)", () => {
  it("문맥 단어가 같은 문장에 있으면 인정한다", () => {
    expect(slugs("애인과 헤어졌어요", [breakup])).toEqual(["breakup"]);
    expect(slugs("남친이랑 크게 다투고 헤어졌어요", [breakup])).toEqual(["breakup"]);
  });

  it("문맥 단어가 없거나 다른 문장에 있으면 인정하지 않는다", () => {
    expect(slugs("친구와 놀다 헤어졌어요", [breakup])).toEqual([]);
    expect(slugs("애인이 나왔어요. 친구와 놀다 헤어졌어요", [breakup])).toEqual([]);
  });

  it("이름·동의어는 문맥과 상관없이 그대로 찾는다", () => {
    expect(slugs("이별하는 꿈", [breakup])).toEqual(["breakup"]);
  });
});

describe("제외 표현 (exclude)", () => {
  it("제외 표현과 겹치는 자리는 버린다", () => {
    expect(slugs("손녀딸이 웃었어요", [child])).toEqual([]);
    expect(slugs("한 달이 지났어요", [moon])).toEqual([]);
  });

  it("겹치지 않는 자리는 그대로 찾는다", () => {
    expect(slugs("딸이 웃었어요", [child])).toEqual(["child"]);
    expect(slugs("손녀딸이 웃고 딸이 울었어요", [child])).toEqual(["child"]);
    expect(slugs("달이 떴어요", [moon])).toEqual(["moon"]);
  });

  it("제외 표현은 단어 첫머리에서 시작할 때만 쓴다 ('환한 달'의 '한 달'은 제외가 아니다)", () => {
    expect(slugs("환한 달이 떴어요", [moon])).toEqual(["moon"]);
  });
});

describe("부정된 행동", () => {
  const money = getSymbolBySlug("money")!;
  const thief = getSymbolBySlug("thief")!;
  const pairs = (dream: string) =>
    matchDream(dream, [money, thief], getAllActions()).map((m) => (m.situation ? `${m.symbol.slug}+${m.situation.action}` : m.symbol.slug));

  it("부정된 행동은 상황 풀이에 쓰지 않는다", () => {
    expect(pairs("돈을 받았어요")).toEqual(["money+receive"]);
    for (const dream of ["돈을 안 받았어요", "돈을 못 받았어요", "돈을 못받았어요", "돈을 받지 못했어요", "돈을 받지를 못했어요", "돈을 받진 않았어요"]) {
      expect(pairs(dream), dream).toEqual(["money"]);
    }
    expect(pairs("도둑을 잡진 못했어요")).toEqual(["thief"]);
  });

  it("'편안', '방안'처럼 '안'으로 끝나는 말 뒤의 행동은 부정이 아니다", () => {
    expect(pairs("편안하게 돈을 받았어요")).toEqual(["money+receive"]);
  });
});

describe("데이터 검사", () => {
  const base = getSymbolBySlug("breakup")!;

  it("contextTerms 와 contextWords 는 함께 쓰고, exclude 는 비어 있지 않은 문자열 배열이어야 한다", () => {
    expect(validateSymbols([{ ...base, contextWords: undefined }]).join()).toMatch(/함께 써야/);
    expect(validateSymbols([{ ...base, exclude: [] }]).join()).toMatch(/exclude/);
    expect(validateSymbols([{ ...base, contextTerms: [""] }]).join()).toMatch(/contextTerms/);
    expect(validateSymbols([base])).toEqual([]);
  });
});
