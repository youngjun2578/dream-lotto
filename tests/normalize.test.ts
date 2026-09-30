import { describe, expect, it } from "vitest";
import { InputError, MAX_DREAM_LENGTH, normalizeDream, prepareDream } from "@/lib/normalize";

describe("normalizeDream", () => {
  it("특수문자·이모지는 공백으로, 연속 공백은 하나로", () => {
    expect(normalizeDream("  돼지가!!  나왔어요 🐷  ")).toBe("돼지가 나왔어요");
    expect(normalizeDream("돼지\n\n\t꿈…")).toBe("돼지 꿈");
  });

  it("전각 문자와 영문 대소문자를 통일한다", () => {
    expect(normalizeDream("ＤＲＡＧＯＮ 꿈")).toBe("dragon 꿈");
  });

  it("같은 뜻의 입력은 같은 문장이 된다", () => {
    expect(normalizeDream("돼지 꿈!!")).toBe(normalizeDream("돼지   꿈"));
  });
});

describe("prepareDream", () => {
  it("빈 입력은 거부", () => {
    expect(() => prepareDream("")).toThrow(InputError);
    expect(() => prepareDream("    ")).toThrow(InputError);
    expect(() => prepareDream("!!! ~~~ ???")).toThrow(InputError);
  });

  it("문자열이 아니면 거부", () => {
    expect(() => prepareDream(undefined)).toThrow(InputError);
    expect(() => prepareDream(123)).toThrow(InputError);
  });

  it("500자까지는 허용, 500자 초과는 거부 (잘라내지 않음)", () => {
    expect(prepareDream("가".repeat(MAX_DREAM_LENGTH))).toHaveLength(MAX_DREAM_LENGTH);
    expect(() => prepareDream("가".repeat(MAX_DREAM_LENGTH + 1))).toThrow(/500자/);
  });

  it("앞뒤 공백은 길이에 세지 않는다", () => {
    expect(() => prepareDream(`  ${"가".repeat(MAX_DREAM_LENGTH)}  `)).not.toThrow();
  });
});
