// 풀이 문장 톤 검사: 단정하거나 출처가 불분명한 표현을 쓰지 않는다. (배포 전 점검 작업 D)
// 전통 해석은 "전통적으로 ~라고 해석하기도 해요", 가능성은 "~일 수 있어요"처럼 쓴다.

import { describe, expect, it } from "vitest";
import { getAllGuides } from "@/lib/guides";
import { getAllSymbols } from "@/lib/symbols";

/** [ 이름, 찾을 표현 ] — 문장 하나씩 검사한다. */
const RULES: [string, RegExp][] = [
  ["출처 불명 단정 (전통 해몽에서는)", /전통 해몽에서는?/],
  ["절대 표현", /틀림없이|무조건|100\s?%|확실히|확실한/],
  // "반드시 ~는 아니에요"처럼 부정하는 문장은 괜찮다.
  ["반드시 (부정문 제외)", /반드시(?![^.?!]*(아니|않))/],
  // 문장 끝이 "~로 봐요 / ~고 풀어요 / ~로 풀이해요 / ~로 해석해요 / ~로 여겨요"로 단정하는 경우
  ["단정형 풀이", /(고|로) (풀어요|풀이해요|풀이돼요|해석해요|해석돼요|봐요|여겨요|여겨져요)[.!?]?$/],
];

/** ㄹ 받침 + "거예요"(…할 거예요) = 앞날을 단정하는 말 */
function predicts(sentence: string): boolean {
  return [...sentence.matchAll(/([가-힣]) 거예요/g)].some((m) => (m[1].codePointAt(0)! - 0xac00) % 28 === 8);
}

function sentences(text: string): string[] {
  return text
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1") // [돼지](/dream/pig) → 돼지
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function problems(texts: { where: string; text: string }[]): string[] {
  return texts.flatMap(({ where, text }) =>
    sentences(text).flatMap((s) => [
      ...RULES.filter(([, re]) => re.test(s)).map(([name]) => `${where} [${name}] ${s}`),
      ...(predicts(s) ? [`${where} [예측 단정] ${s}`] : []),
    ]),
  );
}

describe("풀이 문장 톤", () => {
  it("상황 풀이 128개에 단정·출처 불명 표현이 없다", () => {
    const texts = getAllSymbols().flatMap((s) =>
      s.situations.map((sit) => ({ where: `${s.slug}/${sit.action}`, text: sit.meaning })),
    );
    expect(texts).toHaveLength(128);
    expect(problems(texts)).toEqual([]);
  });

  it("가이드 5편에 단정·출처 불명 표현이 없다", () => {
    const texts = getAllGuides().flatMap((g) => [
      { where: `${g.slug} 소개`, text: g.description },
      ...g.sections.flatMap((sec) => sec.blocks.flat().map((text) => ({ where: `${g.slug} «${sec.heading}»`, text }))),
    ]);
    expect(problems(texts)).toEqual([]);
  });

  it("상징 일반 풀이(요약·본문 30개)도 같은 기준을 지킨다", () => {
    const texts = getAllSymbols().flatMap((s) => [
      { where: `${s.slug}.meaning`, text: s.meaning },
      ...s.body.split("\n\n").map((text) => ({ where: `${s.slug}.body`, text })),
    ]);
    expect(problems(texts)).toEqual([]);
  });

  it("검사 규칙 자체가 동작한다", () => {
    expect(problems([{ where: "t", text: "전통 해몽에서는 길몽으로 봐요." }])).toHaveLength(2);
    expect(problems([{ where: "t", text: "곧 돈이 들어올 거예요." }])).toHaveLength(1);
    expect(problems([{ where: "t", text: "마음이 드러난 거예요." }])).toEqual([]); // 설명하는 말은 괜찮다
    expect(problems([{ where: "t", text: "나쁜 일이 반드시 생긴다는 뜻은 아니에요." }])).toEqual([]);
    expect(problems([{ where: "t", text: "전통적으로 길몽으로 해석하기도 해요." }])).toEqual([]);
  });
});
