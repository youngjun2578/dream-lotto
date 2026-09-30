// 해몽 생성기 인터페이스
// 1단계: RuleBasedProvider (규칙 기반) / 2단계: LlmProvider (AI) 로 바꿔 끼운다.
// ⚠️ 번호 생성은 이 인터페이스의 책임이 아니다. 번호는 항상 lib/lotto.ts 가 만든다.

import type { DreamSymbol, SymbolReading } from "../types";

export interface InterpretationInput {
  /** 정규화된 꿈 문장 */
  dream: string;
  /** 매칭된 상징 (가중치 높은 순, 0~4개) */
  symbols: DreamSymbol[];
}

export interface Interpretation {
  /** 요약 1~2문장 */
  summary: string;
  /** 상징별 풀이 (운세 유형 포함) */
  symbols: SymbolReading[];
}

export interface InterpretationProvider {
  readonly name: string;
  /** AI 호출처럼 시간이 걸리는 구현을 위해 Promise 로 돌려준다. */
  interpret(input: InterpretationInput): Promise<Interpretation>;
}
