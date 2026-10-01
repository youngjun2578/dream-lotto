"use client";

// 결과 페이지에 들어오면 항상 맨 위에서 시작한다.
// 다만 '다시 뽑기'로 바뀐 결과는 새 번호가 바로 보이도록 번호 제목 위치로 옮긴다.

import { useEffect } from "react";

let scrollToNumbers = false;

/** 다시 뽑기 직전에 부른다: 다음 결과는 번호 위치에서 보여 준다. */
export function keepNumbersInView() {
  scrollToNumbers = true;
}

export function ScrollToTop({ resultKey }: { resultKey: string }) {
  useEffect(() => {
    if (scrollToNumbers) {
      scrollToNumbers = false;
      document.getElementById("numbers-heading")?.scrollIntoView({ block: "start" });
      return;
    }
    window.scrollTo(0, 0);
  }, [resultKey]);
  return null;
}
