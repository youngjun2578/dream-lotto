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
  /**
   * 같은 문장에 contextWords 가운데 하나가 있을 때만 인정하는 표현.
   * 예) 이별의 "헤어졌"은 연인·남자친구… 와 함께 나올 때만 ("친구와 놀다 헤어졌어요"는 이별이 아니다)
   */
  contextTerms?: string[];
  contextWords?: string[];
  /**
   * 이 상징으로 잡지 않을 자리. 단어 첫머리에서 시작하는 이 표현과 겹치는 표현은 버린다.
   * 예) 자녀의 "딸이" ← "손녀딸이", 달의 "달이" ← "한 달이 지났다"
   */
  exclude?: string[];
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

/**
 * "안 다쳤다", "못 잡았다", "다치지 않았다", "잡지 못했다" 처럼 부정된 행동인지.
 * 띄어 쓰지 않은 "못받았다", 줄여 쓴 "잡진 못했다", "받지를 못했다"도 부정으로 본다.
 */
function isNegated(text: string, start: number, end: number): boolean {
  if (/(^| )(안|못) ?$/.test(text.slice(Math.max(0, start - 3), start))) return true;
  return /^[^ ]*(지|진)(는|도|를)? ?(않|못|마)/.test(text.slice(end, end + 8));
}

/** 보조 동사로도 쓰이는 '주다·드리다' 활용형 (주는 행동·받는 행동의 표현 가운데) */
const GIVE_VERB = /^(주(는|었|고|던|셨|시)|줬|드리|드렸|드린)/;

/** 이 앞말 뒤의 '주다'는 물건이 실제로 건너가는 주는 행동이다. (건네 줬어요, 쥐여 주셨어요, 나눠 줬어요 …) */
export const GIVING_HOSTS = [
  "건네", "쥐여", "쥐어", "나눠", "나누어", "빌려", "보내", "부쳐", "넘겨", "물려", "돌려", "되돌려",
  "갖다", "가져다", "안겨", "꺼내", "내어", "덜어", "떼어", "집어", "떠", "따라", "부어", "씌워", "끼워", "사",
  "선물해", "전해", "전달해", "대접해", "송금해", "이체해", "입금해", "기부해", "기증해", "배달해",
];

/** 이 앞말 뒤의 '주다'는 앞 동사를 돕는 보조 동사다. ('-해'로 끝나는 말은 목록 없이 보조 동사로 본다) */
export const HELPING_HOSTS = [
  "도와", "알려", "가르쳐", "들어", "기다려", "지켜", "안아", "업어", "태워", "놀아", "웃어", "불러", "읽어",
  "보여", "찾아", "잡아", "열어", "닫아", "닦아", "씻겨", "빗어", "잘라", "깨워", "재워", "덮어", "받아", "맞춰",
  "감싸", "쓰다듬어", "만져", "풀어", "밀어", "끌어", "데려다", "바래다", "봐", "믿어", "고쳐", "치워", "옮겨",
  "일으켜", "세워", "달래", "꾸며", "발라", "묶어", "말려", "비춰", "밝혀", "만들어", "차려", "구워", "끓여", "써",
];

/** '-해'로 끝나지만 동사가 아닌 말 ("올해 줬어요"의 '올해') */
const NOT_VERB_HAE = new Set(["올해", "새해", "지난해", "그해", "첫해", "이듬해", "동해", "서해", "남해", "피해", "손해"]);

/**
 * '주다·드리다'가 앞 동사를 돕는 보조 동사로 쓰였는지. ("진찰해 줬어요", "도와 드렸어요", "가르쳐 주셨어요")
 * 바로 앞 단어가 GIVING_HOSTS 면 주는 행동, '-해'로 끝나거나 HELPING_HOSTS 에 있으면 보조 동사다.
 * 그 밖의 앞말("돈을 줬어요", "친구가 주셨어요")은 단독으로 쓴 주다로 본다.
 * 띄어 쓰지 않은 "도와줬어요"는 두 글자 활용형이 단어 첫머리가 아니라서 원래 잡히지 않는다.
 */
function isHelpingVerb(text: string, start: number, term: string): boolean {
  if (!GIVE_VERB.test(term)) return false;
  const prev = text.slice(0, start).trimEnd().split(" ").pop() ?? "";
  if (!prev || GIVING_HOSTS.includes(prev)) return false;
  return HELPING_HOSTS.includes(prev) || (prev.endsWith("해") && !NOT_VERB_HAE.has(prev));
}

/** 이 문장에서 찾을 표현: 이름·동의어 + (같은 문장에 문맥 단어가 있으면) 문맥 표현 */
function termsIn(text: string, symbol: MatchableSymbol): Set<string> {
  const words = [symbol.keyword, ...symbol.synonyms];
  if (symbol.contextTerms && symbol.contextWords?.some((w) => text.includes(normalizeDream(w)))) {
    words.push(...symbol.contextTerms);
  }
  return new Set(words.map(normalizeDream).filter(Boolean));
}

/** exclude 표현이 단어 첫머리에서 시작하는 자리 [start, end) 목록 */
function excludedSpans(text: string, exclude: string[] | undefined): [number, number][] {
  if (!exclude) return [];
  return exclude.flatMap((phrase) => {
    const term = normalizeDream(phrase);
    return term ? findAll(text, term).filter((s) => isWordStart(text, s)).map((s): [number, number] => [s, s + term.length]) : [];
  });
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
      const blocked = excludedSpans(text, symbol.exclude);
      for (const term of termsIn(text, symbol)) {
        for (const start of findAll(text, term)) {
          const end = start + term.length;
          const accepted = symbol.strict
            ? isStrictHit(text, start, end)
            : term.length > 1 || isStandalone(text, start, end);
          if (accepted && !blocked.some(([s, e]) => start < e && s < end)) {
            hits.push({ symbol, start: offset + start, end: offset + end, sentence });
          }
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
 * 보조 동사로 쓴 '주다·드리다'("진찰해 줬어요")는 주고받는 행동으로 보지 않는다. (isHelpingVerb)
 */
function findActionHits(sentences: string[], actions: DreamAction[]): ActionHit[] {
  const hits: ActionHit[] = [];
  let offset = 0;
  sentences.forEach((text, sentence) => {
    for (const action of actions) {
      for (const term of new Set(action.synonyms.map(normalizeDream).filter(Boolean))) {
        for (const start of findAll(text, term)) {
          if (term.length <= 2 && !isWordStart(text, start)) continue;
          if (isHelpingVerb(text, start, term)) continue;
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
