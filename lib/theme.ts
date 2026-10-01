// 화면 테마(라이트/다크) 규칙
// - 기본은 다크. 기기의 라이트/다크 설정(prefers-color-scheme)은 기본값에 쓰지 않는다.
// - 헤더 버튼으로 고른 값을 localStorage "theme" 에 기억한다. 저장값이 "light" 일 때만 라이트,
//   저장값이 없거나 알 수 없는 값이면 다크.
// - 서버 HTML 은 다크로 나간다: <html data-theme="dark">, 다크용 theme-color·color-scheme 메타(app/layout.tsx 의 viewport).
//   라이트를 고른 사용자는 <head> 의 THEME_INIT_SCRIPT 가 화면을 그리기 전에 라이트로 바꾼다. (깜빡임 없음)
// - 색 토큰은 app/globals.css (기본 :root = 다크, :root[data-theme="light"] = 라이트)

export type Theme = "light" | "dark";

const THEME_STORAGE_KEY = "theme";

/** 브라우저 UI 에 알려 줄 값: theme-color(휴대폰 주소창 색 = 헤더 밤하늘 띠 색), color-scheme(기본 배경·스크롤바) */
export const THEME_META: Record<Theme, { themeColor: string; colorScheme: Theme }> = {
  dark: { themeColor: "#0b1026", colorScheme: "dark" },
  light: { themeColor: "#10173a", colorScheme: "light" },
};

/** 라이트를 고르면 <head> 맨 앞에 넣는 메타 태그 (이 표시가 붙은 것만 넣고 지운다) */
const LIGHT_META_ATTR = "data-light-meta";
const LIGHT_METAS: [name: string, content: string][] = [
  ["theme-color", THEME_META.light.themeColor],
  ["color-scheme", THEME_META.light.colorScheme],
];

/**
 * <head> 에 넣는 짧은 스크립트: 저장된 라이트 선택을 화면이 그려지기 전에 적용한다.
 * 같은 이름의 메타가 여럿이면 브라우저는 앞의 것을 쓰므로, 라이트 메타를 <head> 맨 앞에 끼워 넣는다.
 * Next 가 만든 다크 메타는 건드리지 않는다. (React 가 관리하는 태그라 값을 바꾸면 하이드레이션 때 같은 태그를 하나 더 만든다)
 */
export const THEME_INIT_SCRIPT = `try{if(localStorage.getItem(${JSON.stringify(THEME_STORAGE_KEY)})==="light"){var d=document;d.documentElement.dataset.theme="light";${JSON.stringify(LIGHT_METAS)}.forEach(function(m){var e=d.createElement("meta");e.name=m[0];e.content=m[1];e.setAttribute("${LIGHT_META_ATTR}","");d.head.prepend(e)})}}catch(e){}`;

/** 지금 화면에 적용된 테마 (브라우저에서만) */
export function currentTheme(): Theme {
  return document.documentElement.dataset.theme === "light" ? "light" : "dark";
}

/** 헤더 버튼으로 테마를 바꿀 때: 화면·메타를 바꾸고 선택을 기억한다. (브라우저에서만) */
export function applyTheme(theme: Theme) {
  const d = document;
  d.documentElement.dataset.theme = theme;
  d.head.querySelectorAll(`meta[${LIGHT_META_ATTR}]`).forEach((m) => m.remove());
  if (theme === "light") {
    for (const [name, content] of LIGHT_METAS) {
      const meta = d.createElement("meta");
      meta.name = name;
      meta.content = content;
      meta.setAttribute(LIGHT_META_ATTR, "");
      d.head.prepend(meta);
    }
  }
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // 저장이 막혀 있어도 이번 화면에서는 바뀐 테마가 유지된다.
  }
}
