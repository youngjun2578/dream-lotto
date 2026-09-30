// 한국 시간(Asia/Seoul) 기준 날짜 문자열

const seoulDate = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Seoul",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

/** 예) 2026-09-30. 서버가 어느 나라에 있든 한국 날짜로 계산한다. */
export function getSeoulDate(now: Date = new Date()): string {
  return seoulDate.format(now);
}
