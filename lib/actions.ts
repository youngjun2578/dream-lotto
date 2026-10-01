// 꿈속 행동 사전 (data/actions.json) 불러오기 + 유효성 검사

import raw from "@/data/actions.json";
import type { DreamAction } from "./types";

/** 검사 전의 원본 데이터 (테스트용) */
export const rawActionData: unknown = raw;

const ACTIONS = raw as DreamAction[];

export const MIN_ACTIONS = 30;

export function getAllActions(): DreamAction[] {
  return ACTIONS;
}

export function getActionBySlug(slug: string): DreamAction | undefined {
  return ACTIONS.find((a) => a.slug === slug);
}

/** 행동 사전 검사. 빈 배열이면 통과 */
export function validateActions(data: unknown): string[] {
  const errors: string[] = [];
  if (!Array.isArray(data)) return ["actions.json 은 배열이어야 합니다."];
  if (data.length < MIN_ACTIONS) errors.push(`행동은 ${MIN_ACTIONS}개 이상이어야 합니다. (현재 ${data.length}개)`);

  const slugs = new Set<string>();
  data.forEach((item, i) => {
    const a = item as Partial<DreamAction>;
    const where = `#${i} (${a?.slug ?? "slug 없음"})`;
    if (typeof a.slug !== "string" || !/^[a-z]+(-[a-z]+)*$/.test(a.slug)) {
      errors.push(`${where}: slug 는 영문 소문자와 - 만 쓸 수 있습니다.`);
    } else {
      if (slugs.has(a.slug)) errors.push(`${where}: slug 가 중복됩니다.`);
      slugs.add(a.slug);
    }
    if (typeof a.verb !== "string" || !a.verb.endsWith("다")) {
      errors.push(`${where}: verb 는 "~다"로 끝나는 기본형이어야 합니다.`);
    }
    if (!Array.isArray(a.synonyms) || a.synonyms.length === 0) {
      errors.push(`${where}: synonyms(활용형)가 비어 있습니다.`);
    } else {
      if (a.synonyms.some((w) => typeof w !== "string" || w.replace(/\s/g, "").length < 2)) {
        errors.push(`${where}: 활용형은 2글자 이상이어야 합니다. (1글자는 오인식이 많아요)`);
      }
      if (new Set(a.synonyms).size !== a.synonyms.length) errors.push(`${where}: 활용형에 중복이 있습니다.`);
    }
  });
  return errors;
}
