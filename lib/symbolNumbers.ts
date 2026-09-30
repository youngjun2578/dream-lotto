// 상징 → 행운 숫자 후보를 만드는 규칙 (README "숫자 후보 규칙" 참고)
// symbols.json 의 numbers 는 이 함수 결과와 같아야 한다. (tests/symbols.test.ts 에서 검사)

import type { Category } from "./types";

/** 카테고리별 숫자 구간의 시작값 (각 9칸: 1–9, 10–18, 19–27, 28–36, 37–45) */
export const CATEGORY_BASE: Record<Category, number> = {
  동물: 1,
  사람: 10,
  자연: 19,
  행동: 28,
  물건: 37,
};

/** 대표 숫자에 더해 가는 간격. 45와 서로소라서 5개까지 겹치지 않는다. */
export const NUMBER_STEP = 17;

/** 키워드 글자들의 유니코드 값 합 (띄어쓰기 제외) */
export function keywordCode(keyword: string): number {
  let sum = 0;
  for (const ch of keyword.replace(/\s/g, "")) {
    sum += ch.codePointAt(0)!;
  }
  return sum;
}

/** 규칙에 따라 숫자 후보(오름차순)를 계산한다. 개수 = weight + 2 */
export function candidateNumbers(keyword: string, category: Category, weight: number): number[] {
  const first = CATEGORY_BASE[category] + (keywordCode(keyword) % 9);
  const count = weight + 2;
  const numbers: number[] = [];
  for (let k = 0; k < count; k++) {
    numbers.push(((first - 1 + NUMBER_STEP * k) % 45) + 1);
  }
  return numbers.sort((a, b) => a - b);
}
