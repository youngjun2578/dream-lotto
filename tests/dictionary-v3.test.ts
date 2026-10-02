// 사전 확장 3차 정비(3-A)에서 정한 것
// - 임신하는 꿈과 태몽은 다른 상징이다. 임신 상징은 slug·숫자 후보를 그대로 두고 '태몽'만 뗐다.
// - 태몽 상징은 태몽 가이드로 이어지고, 임신 여부·성별·앞날을 단정하지 않는다.
// - 달은 strict 이고, 기존 30개 상징에도 새 한 글자 동의어를 넣지 않는다.

import { describe, expect, it } from "vitest";
import { getAllSymbols, getSymbolBySlug } from "@/lib/symbols";
import { normalizeDream } from "@/lib/normalize";
import { isV1 } from "./v1-symbols";

const textsOf = (slug: string) => {
  const s = getSymbolBySlug(slug)!;
  return [s.meaning, s.body, ...s.situations.flatMap((sit) => [sit.title, sit.meaning])].join("\n");
};

describe("임신과 태몽", () => {
  it("임신 상징은 slug·이름·숫자 후보가 그대로이고, 표현과 본문에서 태몽을 뗐다", () => {
    const pregnancy = getSymbolBySlug("pregnancy")!;
    expect(pregnancy).toMatchObject({ keyword: "임신", category: "사람", weight: 3, numbers: [1, 12, 18, 29, 35] });
    expect(pregnancy.synonyms).not.toContain("태몽");
    expect(pregnancy.body).not.toMatch(/태몽처럼/);
    expect(pregnancy.body).toContain("[태몽](/dream/taemong-dream)");
  });

  it("태몽 상징은 태몽 가이드와 임신 상징으로 이어진다", () => {
    const taemong = getSymbolBySlug("taemong-dream")!;
    expect(taemong).toMatchObject({ keyword: "태몽", category: "사람" });
    expect(taemong.body).toContain("(/guide/taemong)");
    expect(taemong.body).toContain("(/dream/pregnancy)");
  });

  it("태몽·임신 풀이는 성별이나 임신 여부를 예측하지 않는다", () => {
    for (const slug of ["taemong-dream", "pregnancy"]) {
      expect(textsOf(slug), slug).not.toMatch(/(아들|딸)(을|이)?\s?(낳|가질|생길|태어날)|임신(한|이)?\s?(것이다|거예요|확실)|성별은 (아들|딸)/);
    }
  });
});

describe("기존 30개 상징 정비", () => {
  it("달은 strict 로 찾는다 (한 글자 '달'은 '달 꿈'일 때만)", () => {
    expect(getSymbolBySlug("moon")?.strict).toBe(true);
  });

  it("기존 30개 상징의 한 글자 동의어는 원래 있던 것뿐이다 (새로 넣지 않는다)", () => {
    const LEGACY = ["소", "뱀", "용", "범", "왕", "물", "불", "산", "달", "똥", "돈", "금", "집"];
    const oneChar = getAllSymbols()
      .filter((s) => isV1(s.slug))
      .flatMap((s) => s.synonyms.filter((w) => normalizeDream(w).length === 1));
    expect(oneChar.filter((w) => !LEGACY.includes(w))).toEqual([]);
  });
});
