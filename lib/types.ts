// 프로젝트 전체에서 쓰는 공통 타입 모음

/** 숫자 후보 규칙(lib/symbolNumbers.ts)의 카테고리. 카테고리마다 숫자 구간(9칸)이 하나씩 있다. */
export const CATEGORIES = ["동물", "사람", "자연", "행동", "물건"] as const;
export type Category = (typeof CATEGORIES)[number];

/**
 * 사전 카테고리: 사전 목록·카테고리 페이지·상세 페이지에 보이는 분류 (lib/categories.ts)
 * 숫자 구간은 5개(각 9칸)뿐이라, '연애·결혼'은 숫자 후보를 '사람' 구간으로 만든다.
 */
export const DICTIONARY_CATEGORIES = [...CATEGORIES, "연애·결혼"] as const;
export type DictionaryCategory = (typeof DICTIONARY_CATEGORIES)[number];

export const FORTUNE_TYPES = ["재물", "연애", "건강", "직장", "주의"] as const;
export type FortuneType = (typeof FORTUNE_TYPES)[number];

/** data/actions.json 한 항목: 꿈속 행동 (예: 들어오다, 쫓기다) */
export interface DreamAction {
  slug: string;
  /** 기본형 (예: "들어오다") */
  verb: string;
  /** 문장에서 찾을 활용형 (예: "들어오", "들어와", "들어왔") */
  synonyms: string[];
}

/** 상징 + 행동 조합의 풀이 (예: 돼지 + 들어오다 → "돼지가 집으로 들어오는 꿈") */
export interface Situation {
  /** data/actions.json 의 slug */
  action: string;
  /** 화면에 보여줄 제목 */
  title: string;
  meaning: string;
}

/** data/symbols/*.json 한 항목 */
export interface DreamSymbol {
  slug: string;
  keyword: string;
  synonyms: string[];
  category: DictionaryCategory;
  meaning: string;
  fortune_type: FortuneType;
  numbers: number[];
  weight: 1 | 2 | 3;
  /**
   * 이름이 다른 뜻으로 흔히 쓰이는 상징(말, 눈, 새, 아버지 …)이면 true.
   * 표현이 단어 첫머리에서 시작할 때만 찾고, 한 글자 이름은 '말 꿈'처럼 '꿈'이 붙을 때만 찾는다. (lib/matcher.ts)
   */
  strict?: boolean;
  /**
   * 같은 문장에 contextWords 가운데 하나가 있을 때만 찾는 표현. 둘은 함께 쓴다. (lib/matcher.ts)
   * 예) 이별: "헤어졌"은 연인·남자친구·남편 … 이 같은 문장에 있을 때만 이별로 잡는다.
   */
  contextTerms?: string[];
  contextWords?: string[];
  /**
   * 이 상징으로 잡지 않을 자리. 단어 첫머리에서 시작하는 이 표현과 겹치는 표현은 버린다. (lib/matcher.ts)
   * 예) 자녀: "손녀딸이"의 "딸이", 달: "한 달이 지났다"의 "달이"
   */
  exclude?: string[];
  /**
   * 죽음·돌아가신 가족·장례식·병원·귀신처럼 슬픔이나 불안을 건드릴 수 있는 소재면 true.
   * 홈 '인기 꿈 키워드'처럼 먼저 권하는 자리에는 내보내지 않는다. 사전 페이지·검색·매칭·번호는 그대로다. (lib/symbols.ts)
   */
  sensitive?: boolean;
  body: string;
  situations: Situation[];
}

/** 매처 결과: 찾은 상징과, 함께 나온 행동에 맞는 상황 풀이(있을 때만) */
export interface SymbolMatch {
  symbol: DreamSymbol;
  situation?: Situation;
}

/** API 응답의 상황 풀이 정보 (어떤 상징이 어떤 상황으로 풀이됐는지) */
export interface SituationReading {
  slug: string;
  action: string;
  title: string;
}

/** API 응답에 들어가는 상징별 풀이 (상황 풀이가 있으면 meaning 에 그 풀이가 들어간다) */
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
  /** 상황 풀이가 적용된 상징 목록 (없으면 빈 배열) */
  situations: SituationReading[];
  games: LottoGame[];
  /** 번호 계산에 쓴 기준 날짜 (Asia/Seoul, YYYY-MM-DD) */
  date: string;
  /** 다시 뽑기 횟수 (처음은 0) */
  counter: number;
  /** 공유 링크용 값 (/r/[share]). 꿈 원문은 들어 있지 않다. */
  share: string;
}
