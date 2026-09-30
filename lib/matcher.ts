// 꿈 문장에서 사전 상징 찾기

import { normalizeDream } from "./normalize";
import type { DreamSymbol } from "./types";

export const MAX_MATCHED_SYMBOLS = 4;

/**
 * 한 글자 상징(소, 용, 물, 불, 돈…) 뒤에 붙어도 되는 말.
 * "용이", "돈을", "불꿈" 은 인정하고 "용서", "돈가스", "불안" 은 걸러낸다.
 */
const PARTICLES = new Set([
  "", "이", "가", "을", "를", "은", "는", "의", "에", "도", "만", "와", "과", "로", "으로",
  "에서", "에게", "한테", "처럼", "까지", "이랑", "랑", "하고", "이나", "나", "이다", "이야",
  "이었다", "였다", "인데",
]);

interface Hit {
  symbol: DreamSymbol;
  start: number;
  end: number;
}

/** 한 글자 표현이 독립된 단어로 쓰였는지 검사 (앞은 띄어쓰기/문장 시작, 뒤는 조사/'꿈'/'들') */
function isStandalone(text: string, start: number, end: number): boolean {
  if (start > 0 && text[start - 1] !== " ") return false;
  const space = text.indexOf(" ", end);
  let rest = text.slice(end, space === -1 ? text.length : space);
  if (rest.startsWith("들")) rest = rest.slice(1);
  if (rest.startsWith("꿈")) rest = rest.slice(1);
  return PARTICLES.has(rest);
}

/**
 * 정규화된 꿈 문장에서 상징을 찾는다.
 * - keyword 와 synonyms 로 검색
 * - 같은 글자에 여러 표현이 겹치면 긴 표현을 우선 (물고기 > 물)
 * - 가중치 높은 순, 같으면 먼저 나온 순으로 최대 4개
 */
export function matchSymbols(dream: string, symbols: DreamSymbol[]): DreamSymbol[] {
  const text = normalizeDream(dream);
  if (!text) return [];

  const hits: Hit[] = [];
  for (const symbol of symbols) {
    const terms = new Set([symbol.keyword, ...symbol.synonyms].map(normalizeDream).filter(Boolean));
    for (const term of terms) {
      let from = 0;
      while (true) {
        const start = text.indexOf(term, from);
        if (start === -1) break;
        const end = start + term.length;
        if (term.length > 1 || isStandalone(text, start, end)) {
          hits.push({ symbol, start, end });
        }
        from = start + 1;
      }
    }
  }

  // 긴 표현부터 자리를 차지하고, 이미 차지한 글자와 겹치는 짧은 표현은 버린다.
  hits.sort((a, b) => b.end - b.start - (a.end - a.start) || a.start - b.start);
  const taken: Hit[] = [];
  for (const hit of hits) {
    if (!taken.some((t) => hit.start < t.end && t.start < hit.end)) taken.push(hit);
  }

  // 상징별로 가장 먼저 나온 위치만 남긴다.
  const firstPos = new Map<DreamSymbol, number>();
  for (const hit of taken) {
    const prev = firstPos.get(hit.symbol);
    if (prev === undefined || hit.start < prev) firstPos.set(hit.symbol, hit.start);
  }

  return [...firstPos.entries()]
    .sort(([a, posA], [b, posB]) => b.weight - a.weight || posA - posB)
    .slice(0, MAX_MATCHED_SYMBOLS)
    .map(([symbol]) => symbol);
}
