// 입력 도우미: 입력 중인 단어로 사전 키워드를 추천한다. (화면에서 쓰는 순수 함수)

import type { DreamAction, DreamSymbol } from "./types";

/** 추천에 쓰는 단어 하나 */
export interface VocabEntry {
  term: string;
  slug: string;
  weight: number;
}

/**
 * 추천 단어 목록 만들기 (서버에서 한 번 만들어 화면에 넘긴다)
 * - 상징 이름(keyword)과 명사형 동의어만 넣는다. "떨어지", "불타"처럼 행동 사전에 있는 동사 조각은 빼고,
 *   "해가 뜨"처럼 띄어쓰기가 든 매칭용 표현도 뺀다.
 * - 행동 카테고리 상징(쫓기는, 이빨 빠지는 …)은 이름만 넣는다.
 * - strict 상징의 한 글자 이름(말, 새 …)은 넣지 않는다. ("조랑말", "참새" 같은 동의어는 넣는다)
 */
export function buildVocabulary(symbols: DreamSymbol[], actions: DreamAction[]): VocabEntry[] {
  const verbFragments = new Set(actions.flatMap((a) => a.synonyms));
  const seen = new Set<string>();
  const vocab: VocabEntry[] = [];
  for (const s of symbols) {
    const nouns = s.category === "행동" ? [] : s.synonyms.filter((w) => !w.includes(" ") && !verbFragments.has(w));
    // strict 상징의 한 글자 이름(말, 새 …)은 그 글자만으로는 상징으로 잡히지 않으므로 추천하지 않는다.
    const names = s.strict && s.keyword.length === 1 ? [] : [s.keyword];
    for (const term of [...names, ...nouns]) {
      if (seen.has(term)) continue;
      seen.add(term);
      vocab.push({ term, slug: s.slug, weight: s.weight });
    }
  }
  return vocab;
}

const CHOSEONG = "ㄱㄲㄴㄷㄸㄹㅁㅂㅃㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎ";

function choseongOf(ch: string): string | undefined {
  const code = ch.charCodeAt(0) - 0xac00;
  if (code < 0 || code > 11171) return undefined;
  return CHOSEONG[Math.floor(code / 588)];
}

/** 지금 쓰고 있는 마지막 단어 (한글·영문·숫자만). 띄어쓰기로 끝나면 빈 문자열 */
export function currentWord(text: string): string {
  const m = /([0-9A-Za-zㄱ-ㆎ가-힣]+)$/.exec(text);
  return m ? m[1] : "";
}

function startsWithWord(term: string, word: string): boolean {
  if (term.startsWith(word)) return true;
  // 한글을 치는 도중(예: "ㄷ")에는 첫 글자의 초성으로 찾는다.
  return word.length === 1 && CHOSEONG.includes(word) && choseongOf(term[0]) === word;
}

/** 입력 중인 단어로 시작하는 사전 단어 (가중치 높은 순 → 짧은 순, 최대 limit 개) */
export function suggestTerms(text: string, vocabulary: VocabEntry[], limit = 6): VocabEntry[] {
  const word = currentWord(text);
  if (!word) return [];
  return vocabulary
    .filter((v) => v.term !== word && startsWithWord(v.term, word))
    .sort((a, b) => b.weight - a.weight || a.term.length - b.term.length)
    .slice(0, limit);
}

/** 입력 중인 단어를 추천 단어로 바꾸고, 이어서 쓰기 쉽게 띄어쓰기를 붙인다. */
export function applySuggestion(text: string, term: string): string {
  const word = currentWord(text);
  return `${text.slice(0, text.length - word.length)}${term} `;
}

/** 입력창 끝에 단어를 덧붙인다. (0개 안내의 칩을 눌렀을 때) */
export function appendTerm(text: string, term: string): string {
  const base = text.trimEnd();
  return base ? `${base} ${term} ` : `${term} `;
}
