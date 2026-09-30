// 어떤 해몽 생성기를 쓸지 고르는 곳.
// 2단계: LlmProvider 를 만든 뒤 여기서 환경변수(API 키 유무)에 따라 바꿔 돌려주면 된다.

import type { InterpretationProvider } from "./provider";
import { RuleBasedProvider } from "./ruleBased";

export type { Interpretation, InterpretationInput, InterpretationProvider } from "./provider";

export function getInterpretationProvider(): InterpretationProvider {
  return new RuleBasedProvider();
}
