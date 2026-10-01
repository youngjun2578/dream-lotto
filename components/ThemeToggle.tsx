"use client";

// 라이트/다크 화면 전환 버튼. 처음에는 기기 설정과 상관없이 다크로 보이고, 누르면 그 선택을 기억한다. (규칙은 lib/theme.ts)

import { useEffect, useState } from "react";
import { applyTheme, currentTheme, type Theme } from "@/lib/theme";

export function ThemeToggle() {
  // 서버 HTML 은 다크(기본값)로 그린다. 라이트를 고른 사용자는 화면에 붙은 뒤에 아이콘을 바꾼다.
  const [theme, setTheme] = useState<Theme>("dark");
  useEffect(() => setTheme(currentTheme()), []);

  function toggle() {
    const next: Theme = currentTheme() === "dark" ? "light" : "dark";
    applyTheme(next);
    setTheme(next);
  }

  const label = theme === "dark" ? "밝은 화면으로 바꾸기" : "어두운 화면으로 바꾸기";
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={label}
      title={label}
      className="inline-flex h-9 w-9 items-center justify-center rounded-full text-night-soft hover:bg-white/10 hover:text-night-ink"
    >
      {theme === "dark" ? (
        <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <circle cx="12" cy="12" r="4.5" />
          <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
        </svg>
      ) : (
        <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5" fill="currentColor">
          <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
        </svg>
      )}
    </button>
  );
}
