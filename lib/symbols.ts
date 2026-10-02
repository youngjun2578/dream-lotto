// 꿈 상징 사전 데이터 불러오기 + 유효성 검사
// 데이터는 카테고리별 파일(data/symbols/*.json)에 나눠 저장한다.
// 2단계에서 Supabase 로 옮길 때는 이 파일의 함수 내용만 바꾸면 된다.

import animal from "@/data/symbols/animal.json";
import behavior from "@/data/symbols/behavior.json";
import love from "@/data/symbols/love.json";
import nature from "@/data/symbols/nature.json";
import object from "@/data/symbols/object.json";
import person from "@/data/symbols/person.json";
import { getAllActions } from "./actions";
import { DICTIONARY_CATEGORIES, FORTUNE_TYPES, type DictionaryCategory, type DreamAction, type DreamSymbol } from "./types";

/** 카테고리 ↔ 파일 이름 (이 순서대로 합쳐서 사용) */
export const SYMBOL_FILES: { category: DictionaryCategory; file: string; items: unknown[] }[] = [
  { category: "동물", file: "animal.json", items: animal },
  { category: "사람", file: "person.json", items: person },
  { category: "자연", file: "nature.json", items: nature },
  { category: "행동", file: "behavior.json", items: behavior },
  { category: "물건", file: "object.json", items: object },
  { category: "연애·결혼", file: "love.json", items: love },
];

/** 검사 전의 원본 데이터 (모든 파일을 합친 것, 테스트용) */
export const rawSymbolData: unknown[] = SYMBOL_FILES.flatMap((f) => f.items);

const SYMBOLS = rawSymbolData as DreamSymbol[];

export const MIN_BODY_LENGTH = 300;
export const MIN_SITUATIONS = 3;
export const MAX_SITUATIONS = 5;

export function getAllSymbols(): DreamSymbol[] {
  return SYMBOLS;
}

export function getSymbolBySlug(slug: string): DreamSymbol | undefined {
  return SYMBOLS.find((s) => s.slug === slug);
}

export function getSymbolsByCategory(category: DictionaryCategory): DreamSymbol[] {
  return SYMBOLS.filter((s) => s.category === category);
}

/**
 * "비슷한 꿈" 링크: 같은 카테고리의 다른 상징, 그리고 다른 카테고리 중 같은 운세 유형인 상징.
 * (두 목록에 같은 상징이 겹치지 않는다)
 */
export function getRelatedSymbols(symbol: DreamSymbol): { sameCategory: DreamSymbol[]; sameFortune: DreamSymbol[] } {
  const others = SYMBOLS.filter((s) => s.slug !== symbol.slug);
  return {
    sameCategory: others.filter((s) => s.category === symbol.category),
    sameFortune: others.filter((s) => s.category !== symbol.category && s.fortune_type === symbol.fortune_type),
  };
}

/**
 * 홈 화면 "인기 꿈 키워드"에 보여줄 상징 (가중치 3인 대표 길몽 + 자주 찾는 꿈).
 * 민감 소재(sensitive)는 먼저 권하지 않는다. 결과 화면의 '이런 단어를 넣어 보세요'도 이 목록을 쓴다.
 */
export function getPopularSymbols(): DreamSymbol[] {
  const extra = ["teeth", "snake", "ex-lover", "chased"];
  return SYMBOLS.filter((s) => !s.sensitive && (s.weight === 3 || extra.includes(s.slug)));
}

function sentenceCount(text: string): number {
  return text.split(/(?<=[.!?])\s+/).filter(Boolean).length;
}

export interface ValidateOptions {
  /** situations 가 비어 있어도 되는지 (작성 중인 상징을 허용할 때만 true) */
  allowEmptySituations?: boolean;
  /** 상황 풀이의 action 이 들어 있어야 하는 행동 사전 */
  actions?: DreamAction[];
}

/**
 * 사전 데이터 검사. 문제가 있으면 사람이 읽을 수 있는 오류 문장 목록을 돌려준다.
 * (빈 배열이면 통과)
 */
export function validateSymbols(data: unknown, options: ValidateOptions = {}): string[] {
  const { allowEmptySituations = false, actions = getAllActions() } = options;
  const actionSlugs = new Set(actions.map((a) => a.slug));
  const errors: string[] = [];
  if (!Array.isArray(data)) return ["상징 데이터는 배열이어야 합니다."];

  const slugs = new Set<string>();
  data.forEach((item, i) => {
    const s = item as Partial<DreamSymbol>;
    const where = `#${i} (${s?.slug ?? "slug 없음"})`;

    for (const field of ["slug", "keyword", "meaning", "body"] as const) {
      if (typeof s[field] !== "string" || s[field]!.trim() === "") {
        errors.push(`${where}: ${field} 가 비어 있습니다.`);
      }
    }
    if (typeof s.slug === "string") {
      if (!/^[a-z0-9-]+$/.test(s.slug)) errors.push(`${where}: slug 는 영문 소문자/숫자/- 만 쓸 수 있습니다.`);
      if (slugs.has(s.slug)) errors.push(`${where}: slug 가 중복됩니다.`);
      slugs.add(s.slug);
    }
    if (!Array.isArray(s.synonyms) || s.synonyms.length === 0 || s.synonyms.some((w) => typeof w !== "string" || !w.trim())) {
      errors.push(`${where}: synonyms 는 비어 있지 않은 문자열 배열이어야 합니다.`);
    }
    if (!DICTIONARY_CATEGORIES.includes(s.category as DictionaryCategory)) {
      errors.push(`${where}: category 는 ${DICTIONARY_CATEGORIES.join("/")} 중 하나여야 합니다.`);
    }
    if (!FORTUNE_TYPES.includes(s.fortune_type as DreamSymbol["fortune_type"])) {
      errors.push(`${where}: fortune_type 은 ${FORTUNE_TYPES.join("/")} 중 하나여야 합니다.`);
    }
    if (![1, 2, 3].includes(s.weight as number)) {
      errors.push(`${where}: weight 는 1, 2, 3 중 하나여야 합니다.`);
    }
    if (s.strict !== undefined && typeof s.strict !== "boolean") {
      errors.push(`${where}: strict 는 true/false 여야 합니다.`);
    }
    if (s.sensitive !== undefined && typeof s.sensitive !== "boolean") {
      errors.push(`${where}: sensitive 는 true/false 여야 합니다.`);
    }
    const isWordList = (v: unknown) => Array.isArray(v) && v.length > 0 && v.every((w) => typeof w === "string" && w.trim());
    for (const field of ["contextTerms", "contextWords", "exclude"] as const) {
      if (s[field] !== undefined && !isWordList(s[field])) errors.push(`${where}: ${field} 는 비어 있지 않은 문자열 배열이어야 합니다.`);
    }
    if ((s.contextTerms === undefined) !== (s.contextWords === undefined)) {
      errors.push(`${where}: contextTerms 와 contextWords 는 함께 써야 합니다.`);
    }
    const nums = s.numbers;
    if (!Array.isArray(nums) || nums.length < 3 || nums.length > 5) {
      errors.push(`${where}: numbers 는 3~5개여야 합니다.`);
    } else {
      if (nums.some((n) => !Number.isInteger(n) || n < 1 || n > 45)) {
        errors.push(`${where}: numbers 는 1~45 사이 정수여야 합니다.`);
      }
      if (new Set(nums).size !== nums.length) errors.push(`${where}: numbers 에 중복이 있습니다.`);
    }
    if (typeof s.meaning === "string") {
      const sentences = sentenceCount(s.meaning);
      if (sentences < 2 || sentences > 3) errors.push(`${where}: meaning 은 2~3문장이어야 합니다. (현재 ${sentences}문장)`);
    }
    if (typeof s.body === "string" && s.body.length < MIN_BODY_LENGTH) {
      errors.push(`${where}: body 는 ${MIN_BODY_LENGTH}자 이상이어야 합니다. (현재 ${s.body.length}자)`);
    }
    errors.push(...validateSituations(s.situations, where, actionSlugs, allowEmptySituations));
  });
  return errors;
}

function validateSituations(value: unknown, where: string, actionSlugs: Set<string>, allowEmpty: boolean): string[] {
  const errors: string[] = [];
  if (!Array.isArray(value)) return [`${where}: situations 는 배열이어야 합니다.`];
  if (value.length === 0 && allowEmpty) return [];
  if (value.length < MIN_SITUATIONS || value.length > MAX_SITUATIONS) {
    errors.push(`${where}: situations 는 ${MIN_SITUATIONS}~${MAX_SITUATIONS}개여야 합니다. (현재 ${value.length}개)`);
  }
  const used = new Set<string>();
  value.forEach((item, j) => {
    const sit = item as Partial<{ action: string; title: string; meaning: string }>;
    const at = `${where} situations[${j}]`;
    if (typeof sit.action !== "string" || !actionSlugs.has(sit.action)) {
      errors.push(`${at}: action "${sit.action}" 이 data/actions.json 에 없습니다.`);
    } else {
      if (used.has(sit.action)) errors.push(`${at}: 같은 action 이 두 번 쓰였습니다.`);
      used.add(sit.action);
    }
    if (typeof sit.title !== "string" || !sit.title.trim().endsWith("꿈")) {
      errors.push(`${at}: title 은 "~꿈"으로 끝나야 합니다.`);
    }
    if (typeof sit.meaning !== "string") {
      errors.push(`${at}: meaning 이 비어 있습니다.`);
    } else {
      const sentences = sentenceCount(sit.meaning);
      if (sentences < 2 || sentences > 3) errors.push(`${at}: meaning 은 2~3문장이어야 합니다. (현재 ${sentences}문장)`);
    }
  });
  return errors;
}

/** 각 파일에 그 파일의 카테고리 상징만 들어 있는지 검사 */
export function validateSymbolFiles(files = SYMBOL_FILES): string[] {
  const errors: string[] = [];
  for (const { category, file, items } of files) {
    items.forEach((item, i) => {
      const s = item as Partial<DreamSymbol>;
      if (s?.category !== category) {
        errors.push(`${file} #${i} (${s?.slug}): category 가 "${category}" 이어야 합니다. (현재 "${s?.category}")`);
      }
    });
  }
  return errors;
}
