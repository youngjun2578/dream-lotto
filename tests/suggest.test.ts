import { describe, expect, it } from "vitest";
import { getAllActions } from "@/lib/actions";
import { appendTerm, applySuggestion, buildVocabulary, currentWord, suggestTerms } from "@/lib/suggest";
import { getAllSymbols } from "@/lib/symbols";

const VOCAB = buildVocabulary(getAllSymbols(), getAllActions());
const terms = (text: string) => suggestTerms(text, VOCAB).map((v) => v.term);

describe("추천 단어 목록", () => {
  it("상징 이름과 명사형 동의어만 들어 있다 (동사 조각·띄어쓰기 표현 제외)", () => {
    const all = VOCAB.map((v) => v.term);
    for (const word of ["돼지", "멧돼지", "구렁이", "송아지", "이빨 빠지는", "쫓기는", "하늘을 나는"]) expect(all).toContain(word);
    for (const fragment of ["불타", "불탔", "떨어지", "쫓기", "죽었", "해가 뜨", "이가 빠"]) expect(all).not.toContain(fragment);
    expect(new Set(all).size).toBe(all.length);
  });

  it("strict 상징의 한 글자 이름과 조사만 붙인 표현은 추천하지 않는다", () => {
    const all = VOCAB.map((v) => v.term);
    for (const name of ["말", "새", "쥐", "비가", "별을", "강을", "새가"]) expect(all).not.toContain(name);
    for (const word of ["조랑말", "참새", "생쥐", "강아지", "강가"]) expect(all).toContain(word);
  });
});

describe("suggestTerms", () => {
  it("입력 중인 마지막 단어로 시작하는 단어를 추천한다", () => {
    expect(currentWord("어젯밤에 돼")).toBe("돼");
    expect(terms("어젯밤에 돼")).toEqual(expect.arrayContaining(["돼지"]));
    expect(terms("큰 구")).toContain("구렁이");
  });

  it("한글 입력 도중의 초성(ㄷ)으로도 찾는다", () => {
    expect(terms("ㄷ")).toEqual(expect.arrayContaining(["돼지", "돈"]));
  });

  it("가중치 높은 상징이 먼저, 최대 6개", () => {
    const list = suggestTerms("ㄷ", VOCAB);
    expect(list.length).toBeLessThanOrEqual(6);
    expect(list[0].weight).toBe(3);
  });

  it("이미 다 쓴 단어나 띄어쓰기 뒤에는 추천하지 않는다", () => {
    expect(terms("돼지")).not.toContain("돼지");
    expect(terms("돼지 ")).toEqual([]);
    expect(terms("")).toEqual([]);
  });
});

describe("applySuggestion / appendTerm", () => {
  it("입력 중인 단어를 바꾸고 띄어쓰기를 붙인다", () => {
    expect(applySuggestion("어젯밤에 돼", "돼지")).toBe("어젯밤에 돼지 ");
    expect(applySuggestion("ㄷ", "돼지")).toBe("돼지 ");
  });

  it("0개 안내 칩: 입력 끝에 단어를 덧붙인다", () => {
    expect(appendTerm("", "돼지")).toBe("돼지 ");
    expect(appendTerm("무서운 꿈을 꿨어요  ", "뱀")).toBe("무서운 꿈을 꿨어요 뱀 ");
  });
});
