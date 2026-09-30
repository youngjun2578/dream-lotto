// 꿈 입력 전처리: 정규화 + 길이 제한 + 빈 입력 거부

export const MAX_DREAM_LENGTH = 500;

/** 사용자에게 그대로 보여줄 수 있는 입력 오류 */
export class InputError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InputError";
  }
}

/**
 * 꿈 문장을 비교하기 쉬운 형태로 바꾼다.
 * - 유니코드 정규화(NFKC), 영문 소문자화
 * - 한글/영문/숫자 외 문자(특수문자, 이모지 등)는 공백으로
 * - 연속 공백은 하나로, 앞뒤 공백 제거
 * 예) "돼지가!!  나왔어요 🐷" → "돼지가 나왔어요"
 */
export function normalizeDream(raw: string): string {
  return raw
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[^0-9a-zㄱ-ㆎ가-힣]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * 입력을 검사하고 정규화된 문장을 돌려준다.
 * 빈 입력이거나 500자를 넘으면 InputError 를 던진다. (잘라내지 않는다)
 */
export function prepareDream(raw: unknown): string {
  if (typeof raw !== "string") {
    throw new InputError("꿈 내용을 글자로 입력해 주세요.");
  }
  if (raw.trim().length > MAX_DREAM_LENGTH) {
    throw new InputError(`꿈 내용은 ${MAX_DREAM_LENGTH}자 이내로 입력해 주세요.`);
  }
  const normalized = normalizeDream(raw);
  if (normalized.length === 0) {
    throw new InputError("꿈 내용을 입력해 주세요.");
  }
  return normalized;
}
