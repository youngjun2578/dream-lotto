// 꿈 상징 사전 데이터 불러오기 + 유효성 검사
// 2단계에서 Supabase 로 옮길 때는 이 파일의 함수 내용만 바꾸면 된다.

import raw from "@/data/symbols.json";
import { CATEGORIES, FORTUNE_TYPES, type Category, type DreamSymbol } from "./types";

const SYMBOLS = raw as DreamSymbol[];

export const MIN_BODY_LENGTH = 300;

export function getAllSymbols(): DreamSymbol[] {
  return SYMBOLS;
}

export function getSymbolBySlug(slug: string): DreamSymbol | undefined {
  return SYMBOLS.find((s) => s.slug === slug);
}

export function getSymbolsByCategory(category: Category): DreamSymbol[] {
  return SYMBOLS.filter((s) => s.category === category);
}

/** 홈 화면 "인기 꿈 키워드"에 보여줄 상징 (가중치 3인 대표 길몽 + 자주 찾는 꿈) */
export function getPopularSymbols(): DreamSymbol[] {
  const extra = ["teeth", "snake", "ex-lover", "chased"];
  return SYMBOLS.filter((s) => s.weight === 3 || extra.includes(s.slug));
}

/**
 * 사전 데이터 검사. 문제가 있으면 사람이 읽을 수 있는 오류 문장 목록을 돌려준다.
 * (빈 배열이면 통과)
 */
export function validateSymbols(data: unknown): string[] {
  const errors: string[] = [];
  if (!Array.isArray(data)) return ["symbols.json 은 배열이어야 합니다."];

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
    if (!CATEGORIES.includes(s.category as Category)) {
      errors.push(`${where}: category 는 ${CATEGORIES.join("/")} 중 하나여야 합니다.`);
    }
    if (!FORTUNE_TYPES.includes(s.fortune_type as DreamSymbol["fortune_type"])) {
      errors.push(`${where}: fortune_type 은 ${FORTUNE_TYPES.join("/")} 중 하나여야 합니다.`);
    }
    if (![1, 2, 3].includes(s.weight as number)) {
      errors.push(`${where}: weight 는 1, 2, 3 중 하나여야 합니다.`);
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
      const sentences = s.meaning.split(/(?<=[.!?])\s+/).filter(Boolean).length;
      if (sentences < 2 || sentences > 3) errors.push(`${where}: meaning 은 2~3문장이어야 합니다. (현재 ${sentences}문장)`);
    }
    if (typeof s.body === "string" && s.body.length < MIN_BODY_LENGTH) {
      errors.push(`${where}: body 는 ${MIN_BODY_LENGTH}자 이상이어야 합니다. (현재 ${s.body.length}자)`);
    }
  });
  return errors;
}
