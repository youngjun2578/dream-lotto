// 프로젝트 전체에서 쓰는 공통 타입 모음

export const CATEGORIES = ["동물", "사람", "자연", "행동", "물건"] as const;
export type Category = (typeof CATEGORIES)[number];

export const FORTUNE_TYPES = ["재물", "연애", "건강", "직장", "주의"] as const;
export type FortuneType = (typeof FORTUNE_TYPES)[number];

/** data/symbols.json 한 항목 */
export interface DreamSymbol {
  slug: string;
  keyword: string;
  synonyms: string[];
  category: Category;
  meaning: string;
  fortune_type: FortuneType;
  numbers: number[];
  weight: 1 | 2 | 3;
  body: string;
}

/** API 응답에 들어가는 상징별 풀이 */
export interface SymbolReading {
  slug: string;
  keyword: string;
  meaning: string;
  fortune_type: FortuneType;
}

/** 꿈 상징과 관계없이 균등 랜덤으로 채운 번호의 이유 */
export const FILL_REASON = "행운 보충";

/** 로또 한 게임: numbers[i] 를 뽑은 이유가 reasons[i] */
export interface LottoGame {
  numbers: number[];
  reasons: string[];
}

/** POST /api/interpret 응답 */
export interface InterpretResponse {
  summary: string;
  symbols: SymbolReading[];
  games: LottoGame[];
  /** 번호 계산에 쓴 기준 날짜 (Asia/Seoul, YYYY-MM-DD) */
  date: string;
  /** 다시 뽑기 횟수 (처음은 0) */
  counter: number;
}
