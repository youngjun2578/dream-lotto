import { describe, expect, it } from "vitest";
import { MAX_MATCHED_SYMBOLS, matchSymbols } from "@/lib/matcher";
import { getAllSymbols } from "@/lib/symbols";

const ALL = getAllSymbols();
const slugs = (dream: string) => matchSymbols(dream, ALL).map((s) => s.slug);

describe("matchSymbols", () => {
  it("keyword 와 synonyms 로 상징을 찾는다", () => {
    expect(slugs("돼지가 나왔어요")).toEqual(["pig"]);
    expect(slugs("멧돼지한테 쫓겼다")).toEqual(["pig", "chased"]);
    expect(slugs("헤어진 연인이 나왔어")).toEqual(["ex-lover"]);
  });

  it("가중치 높은 순, 같으면 먼저 나온 순", () => {
    // 집(2) → 돼지(3): 돼지가 먼저
    expect(slugs("집에 돼지가 들어왔다")).toEqual(["pig", "house"]);
    // 바다(2), 물고기(2): 먼저 나온 순
    expect(slugs("바다에서 물고기를 잡았다")).toEqual(["sea", "fish"]);
  });

  it(`최대 ${MAX_MATCHED_SYMBOLS}개까지만`, () => {
    const result = slugs("돼지 용 불 돈 똥 조상 대통령 태양이 모두 나온 꿈");
    expect(result).toHaveLength(MAX_MATCHED_SYMBOLS);
    expect(matchSymbols("돼지 용 불 돈 똥", ALL).every((s) => s.weight === 3)).toBe(true);
  });

  it("긴 표현이 우선: 물고기는 물이 아니다, 산불은 산이 아니다", () => {
    expect(slugs("물고기를 잡았다")).toEqual(["fish"]);
    expect(slugs("산불이 났다")).toEqual(["fire"]);
  });

  it("한 글자 상징은 독립된 단어일 때만 (조사·'꿈'은 허용)", () => {
    expect(slugs("용이 하늘로 올라갔다")).toContain("dragon");
    expect(slugs("용꿈을 꿨어요")).toEqual(["dragon"]);
    expect(slugs("소 한 마리가 있었다")).toEqual(["cow"]);
    expect(slugs("돈을 주웠다")).toEqual(["money"]);
  });

  it("한 글자 상징이 다른 단어 속에 있으면 무시", () => {
    expect(slugs("내용이 잘 기억나지 않아요")).toEqual([]);
    expect(slugs("너무 불안했어요")).toEqual([]);
    expect(slugs("친구를 용서했다")).toEqual(["friend"]); // '용서'의 용은 잡지 않는다 (친구는 사전 확장 1차에서 추가)
    expect(slugs("지금 돈가스를 먹었다")).toEqual([]);
    expect(slugs("선물을 받았다")).toEqual(["gift"]); // '선물'의 물은 잡지 않는다 (선물은 사전 확장 3차에서 추가)
  });

  it("아무 상징도 없으면 빈 배열", () => {
    expect(slugs("오늘은 평범한 하루였다")).toEqual([]);
    expect(slugs("")).toEqual([]);
  });
});
