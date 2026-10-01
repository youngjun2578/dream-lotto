// 꿈 문장에서 사전 상징(과 행동) 찾기

import { normalizeDream } from "./normalize";
import type { DreamAction, Situation } from "./types";

export const MAX_MATCHED_SYMBOLS = 4;
/** 상징 "뒤"에 나온 행동은 이 글자 수 안이면 짝지어 준다. (예: "돼지가 집으로 들어왔다") */
export const ACTION_AFTER_LIMIT = 30;
/** 상징 "앞"에 나온 행동은 더 가까워야 한다. (예: "들어온 돼지") */
export const ACTION_BEFORE_LIMIT = 12;

/**
 * 한 글자 상징(소, 용, 물, 불, 돈…) 뒤에 붙어도 되는 말.
 * "용이", "돈을", "불꿈" 은 인정하고 "용서", "돈가스", "불안" 은 걸러낸다.
 */
const PARTICLES = new Set([
  "", "이", "가", "을", "를", "은", "는", "의", "에", "도", "만", "와", "과", "로", "으로",
  "에서", "에게", "한테", "처럼", "까지", "이랑", "랑", "하고", "이나", "나", "이다", "이야",
  "이었다", "였다", "인데",
]);

/** 매처가 필요로 하는 최소한의 상징 정보 (화면에서도 가볍게 쓸 수 있도록) */
export interface MatchableSymbol {
  slug: string;
  keyword: string;
  synonyms: string[];
  weight: number;
  /** 다른 뜻으로 흔히 쓰이는 이름이라 엄격하게 찾는다. (isStrictHit 참고) */
  strict?: boolean;
  situations?: Situation[];
}

export interface DreamMatch<T extends MatchableSymbol> {
  symbol: T;
  situation?: Situation;
}

interface Span {
  start: number;
  end: number;
  /** 몇 번째 문장인지 */
  sentence: number;
}

interface SymbolHit<T> extends Span {
  symbol: T;
}

interface ActionHit extends Span {
  action: DreamAction;
  /** "안 다쳤다", "다치지 않았다"처럼 부정된 행동 */
  negated: boolean;
}

/** 문장 부호와 줄바꿈으로 문장을 나눈 뒤 각각 정규화한다. */
export function splitSentences(dream: string): string[] {
  return dream.split(/[.!?;。…\n\r]+/).map(normalizeDream).filter(Boolean);
}

function findAll(text: string, term: string): number[] {
  const found: number[] = [];
  for (let from = 0; ; ) {
    const start = text.indexOf(term, from);
    if (start === -1) return found;
    found.push(start);
    from = start + 1;
  }
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

/** 단어의 첫머리인지 (앞이 문장 시작이거나 띄어쓰기) */
function isWordStart(text: string, start: number): boolean {
  return start === 0 || text[start - 1] === " ";
}

/**
 * strict 상징(말, 눈, 새, 별, 아버지 …)의 표현은 더 엄격하게 인정한다.
 * 1) 단어 첫머리에서 시작해야 한다. ("할아버지" ≠ 아버지, "냄새가 날" ≠ 새, "건강을" ≠ 강)
 * 2) 한 글자 이름은 바로 뒤에 '꿈'이 올 때만 인정한다. ("말 꿈", "말꿈")
 *    "말을 했다", "눈을 떴다", "새 옷", "별로"처럼 다른 뜻이 흔해서, 나머지는 동의어의 구체적인 표현으로 찾는다.
 */
function isStrictHit(text: string, start: number, end: number): boolean {
  if (!isWordStart(text, start)) return false;
  return end - start > 1 || /^ ?꿈/.test(text.slice(end));
}

/** "안 다쳤다", "못 잡았다", "다치지 않았다", "잡지 못했다" 처럼 부정된 행동인지 */
function isNegated(text: string, start: number, end: number): boolean {
  if (/(^| )(안|못) $/.test(text.slice(Math.max(0, start - 3), start))) return true;
  return /^[^ ]*지(는|도)? ?(않|못|마)/.test(text.slice(end, end + 8));
}

/**
 * 모든 문장에서 상징 위치를 찾는다.
 * 같은 글자에 여러 표현이 겹치면 긴 표현이 자리를 차지한다. (물고기 > 물)
 * 위치(start/end)는 문장들을 이어 붙인 전체 기준이라 문장 순서가 유지된다.
 */
function findSymbolHits<T extends MatchableSymbol>(sentences: string[], symbols: T[]): SymbolHit<T>[] {
  const hits: SymbolHit<T>[] = [];
  let offset = 0;
  sentences.forEach((text, sentence) => {
    for (const symbol of symbols) {
      const terms = new Set([symbol.keyword, ...symbol.synonyms].map(normalizeDream).filter(Boolean));
      for (const term of terms) {
        for (const start of findAll(text, term)) {
          const end = start + term.length;
          const accepted = symbol.strict
            ? isStrictHit(text, start, end)
            : term.length > 1 || isStandalone(text, start, end);
          if (accepted) hits.push({ symbol, start: offset + start, end: offset + end, sentence });
        }
      }
    }
    offset += text.length + 1;
  });

  hits.sort((a, b) => b.end - b.start - (a.end - a.start) || a.start - b.start);
  const taken: SymbolHit<T>[] = [];
  for (const hit of hits) {
    if (!taken.some((t) => hit.start < t.end && t.start < hit.end)) taken.push(hit);
  }
  return taken;
}

/** 가중치 높은 순, 같으면 먼저 나온 순으로 최대 4개 */
function rankSymbols<T extends MatchableSymbol>(hits: SymbolHit<T>[]): T[] {
  const firstPos = new Map<T, number>();
  for (const hit of hits) {
    const prev = firstPos.get(hit.symbol);
    if (prev === undefined || hit.start < prev) firstPos.set(hit.symbol, hit.start);
  }
  return [...firstPos.entries()]
    .sort(([a, posA], [b, posB]) => b.weight - a.weight || posA - posB)
    .slice(0, MAX_MATCHED_SYMBOLS)
    .map(([symbol]) => symbol);
}

/**
 * 모든 문장에서 행동(활용형) 위치를 찾는다.
 * 2글자 이하 활용형("먹는", "타는")은 단어 첫머리에서만 인정한다. ("도와주는", "불타는" 오인식 방지)
 */
function findActionHits(sentences: string[], actions: DreamAction[]): ActionHit[] {
  const hits: ActionHit[] = [];
  let offset = 0;
  sentences.forEach((text, sentence) => {
    for (const action of actions) {
      for (const term of new Set(action.synonyms.map(normalizeDream).filter(Boolean))) {
        for (const start of findAll(text, term)) {
          if (term.length <= 2 && !isWordStart(text, start)) continue;
          const end = start + term.length;
          hits.push({
            action,
            start: offset + start,
            end: offset + end,
            sentence,
            negated: isNegated(text, start, end),
          });
        }
      }
    }
    offset += text.length + 1;
  });
  return hits;
}

/** 같은 위치에서 시작하는 행동끼리 묶는다. (예: "타는"은 타다/불타다 둘 다) */
function groupByStart(hits: ActionHit[]): ActionHit[][] {
  const groups: ActionHit[][] = [];
  for (const hit of hits) {
    const last = groups[groups.length - 1];
    if (last && last[0].start === hit.start) last.push(hit);
    else groups.push([hit]);
  }
  return groups;
}

/**
 * 상징과 같은 문장에 있는 행동으로 상황 풀이를 고른다.
 * 1) 상징 뒤(30자 이내)의 행동을 순서대로 보면서 상황 풀이가 있는 행동 중 "마지막" 것을 고른다.
 *    이야기의 결말이 더 중요해서다. (예: 잡았다가 → 놓쳤다, 불이 났는데 → 껐다)
 *    상황 풀이가 없는 행동을 만나면 거기서 멈춘다. 그 뒤는 다른 이야기일 가능성이 크다.
 *    상징 글자 안에 든 행동(예: '장례식', '불타')도 여기서 함께 본다. 풀이가 없으면 건너뛴다.
 *    같은 상징이 다시 나오면 거기까지만 본다. (예: "아기를 낳았는데 아기가 웃었다")
 * 2) 뒤에서 못 찾으면 상징 바로 앞(12자 이내)의 가장 가까운 행동 하나만 본다. (예: "들어온 돼지")
 * "안 다쳤다", "잡지 못했다"처럼 부정된 행동은 없는 것으로 친다.
 */
function pickSituation<T extends MatchableSymbol>(
  symbolHits: SymbolHit<T>[],
  actionHits: ActionHit[],
  situations: Situation[],
): Situation | undefined {
  const situationOf = (a: ActionHit) => situations.find((s) => s.action === a.action.slug);
  const hits = [...symbolHits].sort((a, b) => a.start - b.start);
  let best: { rank: number; situation: Situation } | undefined;

  hits.forEach((hit, i) => {
    const inSentence = actionHits.filter((a) => a.sentence === hit.sentence && !a.negated);
    const next = hits[i + 1];
    const scanEnd = next && next.sentence === hit.sentence ? next.start : Infinity;

    let chosen: Situation | undefined;
    let rank = 1;
    const after = inSentence
      .filter((a) => a.start >= hit.start && a.start < scanEnd && a.start - hit.end <= ACTION_AFTER_LIMIT)
      .sort((x, y) => x.start - y.start);
    for (const group of groupByStart(after)) {
      const found = group.map(situationOf).find(Boolean);
      if (found) chosen = found;
      else if (!group.every((a) => a.end <= hit.end)) break; // 상징 글자 밖의, 풀이 없는 행동에서 멈춤
    }

    if (!chosen) {
      const before = inSentence.filter((a) => a.end <= hit.start && hit.start - a.end <= ACTION_BEFORE_LIMIT);
      const nearestEnd = Math.max(...before.map((a) => a.end));
      chosen = before.filter((a) => a.end === nearestEnd).map(situationOf).find(Boolean);
      rank = 2;
    }

    if (chosen && (!best || rank < best.rank)) best = { rank, situation: chosen };
  });
  return best?.situation;
}

/** 꿈 문장에서 상징을 찾는다. (가중치 높은 순, 같으면 먼저 나온 순으로 최대 4개) */
export function matchSymbols<T extends MatchableSymbol>(dream: string, symbols: T[]): T[] {
  return rankSymbols(findSymbolHits(splitSentences(dream), symbols));
}

/**
 * 꿈 문장에서 상징과 행동을 함께 찾는다.
 * 상징마다 함께 나온 행동에 맞는 상황 풀이(situation)가 있으면 붙여 준다.
 */
export function matchDream<T extends MatchableSymbol>(
  dream: string,
  symbols: T[],
  actions: DreamAction[],
): DreamMatch<T>[] {
  const sentences = splitSentences(dream);
  const symbolHits = findSymbolHits(sentences, symbols);
  const actionHits = findActionHits(sentences, actions);

  return rankSymbols(symbolHits).map((symbol) => {
    const situation = symbol.situations?.length
      ? pickSituation(symbolHits.filter((h) => h.symbol === symbol), actionHits, symbol.situations)
      : undefined;
    return situation ? { symbol, situation } : { symbol };
  });
}

/** 테스트·디버깅용: 문장에서 찾은 행동 slug 목록 (등장 순서) */
export function findActions(dream: string, actions: DreamAction[]): string[] {
  const hits = findActionHits(splitSentences(dream), actions).sort((a, b) => a.start - b.start);
  return [...new Set(hits.map((h) => h.action.slug))];
}
