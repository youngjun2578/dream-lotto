// 사전 카테고리: 카테고리 페이지 주소(slug), 숫자 후보 구간, 카테고리 페이지 소개 문장
// 카테고리 페이지: /dream/category/{slug} (slug 는 data/symbols/{slug}.json 파일 이름과 같다)

import { DICTIONARY_CATEGORIES, type Category, type DictionaryCategory } from "./types";

export interface CategoryInfo {
  name: DictionaryCategory;
  slug: string;
  /** 숫자 후보 규칙(lib/symbolNumbers.ts)에서 쓰는 구간 */
  numberCategory: Category;
  /** 카테고리 페이지 첫 문단 */
  intro: string;
}

const INFO: Omit<CategoryInfo, "name">[] = [
  {
    slug: "animal",
    numberCategory: "동물",
    intro:
      "돼지, 용, 뱀처럼 꿈에 자주 나오는 동물을 모았어요. 동물의 모습과 움직임에 따라 재물운으로 읽기도 하고, 조심할 일을 알려 주는 꿈으로 읽기도 해요.",
  },
  {
    slug: "person",
    numberCategory: "사람",
    intro:
      "가족과 친구, 직장 사람처럼 꿈에 나온 사람을 모았어요. 꿈속 인물은 실제 그 사람에 대한 이야기라기보다 나와의 관계와 내 마음을 비추는 경우가 많아요.",
  },
  {
    slug: "nature",
    numberCategory: "자연",
    intro:
      "물, 불, 해, 달처럼 자연이 나오는 꿈을 모았어요. 날씨와 풍경에 담긴 기운으로 지금 하는 일의 흐름을 읽어 보는 풀이가 많아요.",
  },
  {
    slug: "behavior",
    numberCategory: "행동",
    intro:
      "하늘을 날거나 떨어지거나 쫓기는 것처럼 꿈속에서 겪은 일, 이가 빠지거나 머리카락이 잘리는 것처럼 몸에 생긴 일을 모았어요. 같은 장면이라도 그때 느낀 기분에 따라 풀이가 달라질 수 있어요.",
  },
  {
    slug: "object",
    numberCategory: "물건",
    intro:
      "돈, 반지, 집, 자동차처럼 꿈에 나온 물건과 음식, 그리고 학교·회사·병원 같은 장소를 모았어요. 물건을 얻었는지 잃었는지, 새것인지 낡은 것인지에 따라 풀이가 달라지기도 해요.",
  },
  {
    slug: "love",
    numberCategory: "사람",
    intro:
      "연인, 짝사랑, 고백, 결혼식처럼 연애와 결혼에 관한 꿈을 모았어요. 꿈속 연애는 상대에 대한 사실보다 지금 내 마음과 바람을 비추는 이야기로 읽어 보세요.",
  },
];

/** 사전 카테고리 정보 (DICTIONARY_CATEGORIES 순서) */
export const CATEGORY_INFO: CategoryInfo[] = DICTIONARY_CATEGORIES.map((name, i) => ({ name, ...INFO[i] }));

export function getCategoryInfo(name: DictionaryCategory): CategoryInfo {
  return CATEGORY_INFO.find((c) => c.name === name)!;
}

export function getCategoryBySlug(slug: string): CategoryInfo | undefined {
  return CATEGORY_INFO.find((c) => c.slug === slug);
}

/** 숫자 후보를 만들 때 쓰는 구간 ('연애·결혼'은 '사람') */
export function numberCategory(name: DictionaryCategory): Category {
  return getCategoryInfo(name).numberCategory;
}

export function categoryPath(name: DictionaryCategory): string {
  return `/dream/category/${getCategoryInfo(name).slug}`;
}
