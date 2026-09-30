// 번호 이유("돼지 꿈 → 재물")를 화면용 태그로 바꾼다.
// lotto.ts 의 출력(reasons 문자열)은 그대로 두고, 보여줄 때만 다듬는다.

import { FORTUNE_TYPES, type FortuneType } from "./types";

export interface ReasonTag {
  /** 태그 글자 (예: "돼지 → 재물", "이빨 빠지는 꿈 → 주의") */
  label: string;
  fortune?: FortuneType;
}

export function reasonTag(reason: string): ReasonTag {
  const m = /^(.+?) 꿈 → (.+)$/.exec(reason);
  if (!m) return { label: reason };
  const [, keyword, fortuneText] = m;
  const fortune = FORTUNE_TYPES.find((f) => f === fortuneText);
  // "이빨 빠지는", "하늘을 나는" 처럼 꾸미는 말로 끝나면 "꿈"을 남겨야 자연스럽다.
  const subject = /는$/.test(keyword) ? `${keyword} 꿈` : keyword;
  return { label: `${subject} → ${fortuneText}`, fortune };
}
