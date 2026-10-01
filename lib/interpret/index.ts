// 어떤 해몽 생성기를 쓸지 고르는 곳.
// 2단계: LlmProvider 를 만든 뒤 여기서 환경변수(API 키 유무)에 따라 바꿔 돌려주면 된다.
// ⚠ AI 를 붙이면 꿈 원문이 외부 AI 업체로 전송된다. 켜기 전에 개인정보처리방침(app/privacy/page.tsx)에
//   처리 위탁·국외 이전 고지를 추가하고, 입력창 근처에도 전송 안내를 넣어야 한다. (그 파일 위쪽 주석 참고)

import type { InterpretationProvider } from "./provider";
import { RuleBasedProvider } from "./ruleBased";

export type { Interpretation, InterpretationInput, InterpretationProvider } from "./provider";

export function getInterpretationProvider(): InterpretationProvider {
  return new RuleBasedProvider();
}
