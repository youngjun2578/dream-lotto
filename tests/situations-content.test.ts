// 상황별 풀이 원고 품질 검사 (작업 2)
// - 모든 상징에 3~5개
// - 제목을 그대로 입력하면 그 상황 풀이가 골라진다 (행동 사전과 원고가 서로 맞는지)
// - 상징끼리 같은 문장 틀이 반복되지 않는다

import { describe, expect, it } from "vitest";
import { getAllActions } from "@/lib/actions";
import { matchDream } from "@/lib/matcher";
import { getAllSymbols, MAX_SITUATIONS, MIN_SITUATIONS, validateSymbols } from "@/lib/symbols";

const SYMBOLS = getAllSymbols();
const ACTIONS = getAllActions();

const sentencesOf = (text: string) => text.split(/(?<=[.!?])\s+/).filter(Boolean);
const ALL_SENTENCES = SYMBOLS.flatMap((s) =>
  s.situations.flatMap((sit) => sentencesOf(sit.meaning).map((text) => ({ slug: s.slug, text }))),
);

/** 같은 key 를 쓰는 상징(slug) 목록 */
function groupBy(keyOf: (text: string) => string): Map<string, Set<string>> {
  const map = new Map<string, Set<string>>();
  for (const { slug, text } of ALL_SENTENCES) {
    const key = keyOf(text);
    if (!map.has(key)) map.set(key, new Set());
    map.get(key)!.add(slug);
  }
  return map;
}

describe("상황별 풀이 원고", () => {
  it(`모든 상징에 ${MIN_SITUATIONS}~${MAX_SITUATIONS}개씩 있고 검사를 통과한다`, () => {
    expect(validateSymbols(SYMBOLS)).toEqual([]);
    for (const s of SYMBOLS) {
      expect(s.situations.length, s.slug).toBeGreaterThanOrEqual(MIN_SITUATIONS);
      expect(s.situations.length, s.slug).toBeLessThanOrEqual(MAX_SITUATIONS);
    }
  });

  it("비어 있는 situations 는 이제 허용하지 않는다", () => {
    expect(validateSymbols([{ ...SYMBOLS[0], situations: [] }]).join()).toMatch(/3~5개/);
  });

  it("제목을 꿈으로 입력하면 바로 그 상황 풀이가 골라진다", () => {
    for (const s of SYMBOLS) {
      for (const sit of s.situations) {
        const match = matchDream(sit.title, SYMBOLS, ACTIONS).find((m) => m.symbol.slug === s.slug);
        expect(match?.situation?.action, `${s.slug}: "${sit.title}"`).toBe(sit.action);
      }
    }
  });

  it("같은 문장이 두 번 나오지 않는다", () => {
    const texts = ALL_SENTENCES.map((x) => x.text);
    const dups = texts.filter((t, i) => texts.indexOf(t) !== i);
    expect(dups).toEqual([]);
  });

  it("문장 첫머리(두 어절)가 세 상징 이상에서 반복되지 않는다", () => {
    const repeated = [...groupBy((t) => t.split(" ").slice(0, 2).join(" "))].filter(([, slugs]) => slugs.size > 2);
    expect(repeated.map(([key, slugs]) => `${key} (${[...slugs].join(",")})`)).toEqual([]);
  });

  it("같은 문장 끝맺음(세 어절)이 여섯 상징 이상에서 반복되지 않는다", () => {
    const repeated = [...groupBy((t) => t.split(" ").slice(-3).join(" "))].filter(([, slugs]) => slugs.size > 5);
    expect(repeated.map(([key, slugs]) => `${key} (${slugs.size})`)).toEqual([]);
  });

  it("상황 제목은 상징 안에서도, 전체에서도 겹치지 않는다", () => {
    const titles = SYMBOLS.flatMap((s) => s.situations.map((sit) => sit.title));
    expect(new Set(titles).size).toBe(titles.length);
  });
});
