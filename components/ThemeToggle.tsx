"use client";

// 라이트/다크 화면 전환 버튼. 처음에는 시스템 설정을 따르고, 누르면 그 선택을 기억한다.

import { useEffect, useState } from "react";

type Theme = "light" | "dark";

function effectiveTheme(): Theme {
  const chosen = document.documentElement.dataset.theme;
  if (chosen === "light" || chosen === "dark") return chosen;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function ThemeToggle() {
  // 서버에서는 테마를 알 수 없으므로, 화면에 붙은 뒤에 아이콘을 정한다.
  const [theme, setTheme] = useState<Theme | null>(null);
  useEffect(() => setTheme(effectiveTheme()), []);

  function toggle() {
    const next: Theme = effectiveTheme() === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem("theme", next);
    } catch {
      // 저장이 막혀 있어도 이번 방문에서는 바뀐 테마가 유지된다.
    }
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

/** <head> 에 넣는 짧은 스크립트: 저장된 테마를 화면이 그려지기 전에 적용해 깜빡임을 막는다. */
export const THEME_INIT_SCRIPT =
  'try{var t=localStorage.getItem("theme");if(t==="light"||t==="dark")document.documentElement.dataset.theme=t}catch(e){}';
