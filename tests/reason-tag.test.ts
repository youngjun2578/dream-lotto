import { describe, expect, it } from "vitest";
import { reasonTag } from "@/lib/reasonTag";
import { FILL_REASON } from "@/lib/types";

describe("reasonTag (번호 이유 → 화면 태그)", () => {
  it('"돼지 꿈 → 재물" → "돼지 → 재물" (운세 유형 색을 위해 유형도 돌려준다)', () => {
    expect(reasonTag("돼지 꿈 → 재물")).toEqual({ label: "돼지 → 재물", fortune: "재물" });
    expect(reasonTag("전 애인 꿈 → 연애")).toEqual({ label: "전 애인 → 연애", fortune: "연애" });
  });

  it("꾸미는 말로 끝나는 행동 상징은 '꿈'을 남긴다", () => {
    expect(reasonTag("이빨 빠지는 꿈 → 주의")).toEqual({ label: "이빨 빠지는 꿈 → 주의", fortune: "주의" });
    expect(reasonTag("하늘을 나는 꿈 → 직장")).toEqual({ label: "하늘을 나는 꿈 → 직장", fortune: "직장" });
  });

  it("형식이 다르면 그대로 보여 준다", () => {
    expect(reasonTag(FILL_REASON)).toEqual({ label: FILL_REASON });
  });
});
