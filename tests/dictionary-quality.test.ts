// 사전 품질 검사 (사전 확장 1차)
// - slug·키워드·표현이 상징끼리 겹치지 않는다
// - 한 상징의 표현이 다른 상징의 표현 안에 들어 있는 경우는 어느 쪽으로 잡을지 정해 둔 것뿐이다
// - 새로 넣는 상징에는 한 글자 동의어를 쓰지 않는다
// - 새 상징을 넣어도 기존 30개 상징의 매칭 결과는 그대로다

import { describe, expect, it } from "vitest";
import { getAllActions } from "@/lib/actions";
import { MAX_MATCHED_SYMBOLS, matchDream, matchSymbols } from "@/lib/matcher";
import { normalizeDream } from "@/lib/normalize";
import { getAllSymbols } from "@/lib/symbols";
import type { DreamSymbol } from "@/lib/types";
import { isV1 } from "./v1-symbols";

const ALL = getAllSymbols();
const ACTIONS = getAllActions();

const V1 = ALL.filter((s) => isV1(s.slug));
const ADDED = ALL.filter((s) => !isV1(s.slug));

const termsOf = (s: DreamSymbol) => [...new Set([s.keyword, ...s.synonyms].map(normalizeDream).filter(Boolean))];

/** 그 표현만 입력했을 때 쓸 문장 (strict 상징의 한 글자 이름은 '꿈'이 붙어야 잡힌다) */
const inputFor = (s: DreamSymbol, term: string) => (s.strict && term.length === 1 ? `${term} 꿈` : term);

/**
 * 한 상징의 표현이 다른 상징의 표현 안에 들어 있어서 같은 자리에서 함께 잡히는 경우와, 그때 잡히는 상징.
 * (같은 자리에서는 긴 표현이 이긴다) 새로 생기면 어느 쪽으로 잡을지 정한 뒤 여기에 적는다.
 * 형식: "안에 든 상징 < 긴 표현의 상징:표현 → 결과"
 */
const DECIDED_CONFLICTS = [
  // 사전 v1
  "baby < pig:아기돼지 → pig",
  "ring < gold:금반지 → gold",
  "wedding < ring:결혼반지 → ring",
  // 동물: 새끼 동물은 아기(사람)가 아니라 그 동물로, 반달곰은 달이 아니라 곰으로, 도둑고양이는 도둑이 아니라 고양이로
  "baby < dog:아기 강아지 → dog",
  "baby < cat:아기 고양이 → cat",
  "baby < bird:아기 새 → bird",
  "baby < turtle:아기 거북 → turtle",
  "baby < bear:아기 곰 → bear",
  "thief < cat:도둑고양이 → cat",
  "sea < turtle:바다거북 → turtle",
  "moon < bear:반달곰 → bear",
];

function findConflicts(): string[] {
  const rows: string[] = [];
  for (const outer of ALL) {
    for (const term of termsOf(outer)) {
      const input = inputFor(outer, term);
      const result = matchSymbols(input, ALL).map((s) => s.slug);
      for (const inner of ALL) {
        if (inner !== outer && matchSymbols(input, [inner]).length > 0) {
          rows.push(`${inner.slug} < ${outer.slug}:${term} → ${result.join(",")}`);
        }
      }
    }
  }
  return rows;
}

describe("slug·키워드·표현 중복", () => {
  it("slug 와 키워드가 상징끼리 겹치지 않는다", () => {
    const slugs = ALL.map((s) => s.slug);
    const keywords = ALL.map((s) => normalizeDream(s.keyword));
    expect(slugs.filter((x, i) => slugs.indexOf(x) !== i)).toEqual([]);
    expect(keywords.filter((x, i) => keywords.indexOf(x) !== i)).toEqual([]);
  });

  it("같은 표현(키워드·동의어)이 두 상징에 들어 있지 않다", () => {
    const owner = new Map<string, string>();
    const dups: string[] = [];
    for (const s of ALL) {
      for (const term of termsOf(s)) {
        const prev = owner.get(term);
        if (prev && prev !== s.slug) dups.push(`${term}: ${prev}, ${s.slug}`);
        owner.set(term, s.slug);
      }
    }
    expect(dups).toEqual([]);
  });

  it("한 상징 안에서도 동의어가 겹치지 않는다", () => {
    for (const s of ALL) {
      const words = s.synonyms.map(normalizeDream);
      expect(words.filter((w, i) => words.indexOf(w) !== i), s.slug).toEqual([]);
    }
  });

  it("새로 넣은 상징에는 한 글자 동의어가 없다 (다른 뜻으로 잘못 잡히기 쉬워서)", () => {
    const oneChar = ADDED.flatMap((s) => s.synonyms.filter((w) => normalizeDream(w).length === 1).map((w) => `${s.slug}:${w}`));
    expect(oneChar).toEqual([]);
  });
});

describe("상징끼리 표현이 겹치는 경우", () => {
  it("모든 표현은 그것만 입력해도 자기 상징으로 잡힌다", () => {
    const dead = ALL.flatMap((s) =>
      termsOf(s)
        .filter((term) => !matchSymbols(inputFor(s, term), ALL).some((m) => m.slug === s.slug))
        .map((term) => `${s.slug}:${term}`),
    );
    expect(dead).toEqual([]);
  });

  it("다른 상징의 표현 안에 든 경우는 정해 둔 것뿐이다", () => {
    expect(findConflicts().sort()).toEqual([...DECIDED_CONFLICTS].sort());
  });
});

describe("기존 30개 상징 회귀 검사", () => {
  const pairsOf = (dream: string, symbols: DreamSymbol[]) =>
    matchDream(dream, symbols, ACTIONS).map((m) => (m.situation ? `${m.symbol.slug}+${m.situation.action}` : m.symbol.slug));

  /** 기존 상징의 상황 제목·표현과 기존 테스트·예시 문장 */
  const CORPUS = [
    ...V1.flatMap((s) => s.situations.map((sit) => sit.title)),
    ...V1.flatMap((s) => termsOf(s).map((term) => `${term} 꿈을 꿨어요`)),
    "돼지가 집으로 들어오고 마당에 불이 활활 타는 꿈을 꿨어요",
    "돼지가 집으로 들어오고 뱀에게 물렸어요",
    "커다란 돼지가 집 안으로 들어와서 제 품에 안겼어요.",
    "돌아가신 할머니가 환하게 웃으면서 돈을 주셨어요.",
    "하늘을 날다가 갑자기 떨어져서 깜짝 놀라 깼어요.",
    "구렁이가 몸을 칭칭 감더니 팔을 물었어요.",
    "이가 흔들리다가 우수수 빠져서 너무 놀랐어요.",
    "돼지가 도망쳤어요",
    "돼지를 먹고 나서 집으로 들어왔어요",
    "집에 불이 났는데 아무도 안 다쳤어요",
    "금반지를 잃어버려서 한참 찾았어요",
    "은행에서 돈을 찾았어요",
    "엄마가 아기를 낳았어요",
    "도둑을 잡지 못했어요",
    "도둑이 들어와서 지갑을 훔쳐 갔어요",
    "물고기를 잡았다가 놓쳤어요",
    "바다에서 물고기를 잡았다",
    "멧돼지한테 쫓겼다",
    "헤어진 연인이 나왔어",
    "산불이 났다",
    "용꿈을 꿨어요",
    "소 한 마리가 있었다",
    "할머니 장례식에 갔어요",
    "아기를 낳았는데 아기가 방긋 웃었어요",
    "마당으로 들어온 돼지를 봤다",
    "새 집으로 이사하는 꿈을 꿨어요",
    "이사하는 꿈을 꿨어요",
    "물이 불어나서 집이 잠겼어요",
    "바닷물에 빠져서 허우적거렸어요",
    "흙탕물을 마셨어요",
    "웨딩드레스를 입고 결혼식을 올렸어요",
  ];

  it("새 상징을 넣어도 기존 상징의 매칭 결과(상징·상황 풀이·순서)는 그대로다", () => {
    const changed = CORPUS.flatMap((dream) => {
      const before = pairsOf(dream, V1);
      const all = pairsOf(dream, ALL);
      const after = all.filter((p) => isV1(p.split("+")[0]));
      // 상징이 4개까지만 나오므로, 새 상징 때문에 4개가 꽉 찼으면 기존 상징 일부가 빠질 수 있다.
      const same =
        all.length === MAX_MATCHED_SYMBOLS ? after.every((p) => before.includes(p)) : after.join() === before.join();
      return same ? [] : [`"${dream}": ${before.join(" ")} → ${all.join(" ")}`];
    });
    expect(changed).toEqual([]);
  });
});
