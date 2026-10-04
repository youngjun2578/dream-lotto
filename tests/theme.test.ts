// 화면 테마: 다크가 기본값이고, 두 테마 모두 글자-배경 명도 대비가 WCAG AA(4.5:1) 이상인지
// - 색 토큰은 app/globals.css 에서 직접 읽는다. (기본 :root = 다크, :root[data-theme="light"] = 라이트)
// - 저장값에 따른 <head> 의 THEME_INIT_SCRIPT 동작 (lib/theme.ts)
// 브라우저에서 실제로 보이는 모습(새로고침·다른 페이지·자바스크립트 전 HTML)은 e2e/theme.spec.ts

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { ballColor } from "@/lib/ballColors";
import { THEME_INIT_SCRIPT, THEME_META, type Theme } from "@/lib/theme";

const CSS = readFileSync(join(__dirname, "..", "app", "globals.css"), "utf8");

/** 선택자 바로 뒤 { … } 안의 토큰 */
function tokens(selector: string): Record<string, string> {
  const start = CSS.indexOf(`${selector} {`);
  if (start < 0) throw new Error(`globals.css 에 ${selector} 블록이 없어요`);
  const body = CSS.slice(start, CSS.indexOf("}", start));
  return Object.fromEntries([...body.matchAll(/(--[\w-]+|color-scheme):\s*([^;]+);/g)].map((m) => [m[1], m[2].trim()]));
}

const DARK = tokens(":root");
const THEMES: Record<Theme, Record<string, string>> = {
  dark: DARK,
  light: { ...DARK, ...tokens(':root[data-theme="light"]') },
};

function rgb(hex: string): [number, number, number] {
  const m = /^#([0-9a-f]{6})$/i.exec(hex);
  if (!m) throw new Error(`색 형식이 이상해요: ${hex}`);
  return [0, 2, 4].map((i) => parseInt(m[1].slice(i, i + 2), 16)) as [number, number, number];
}

/** 배경 위에 반투명 흰색(bg-white/10 등)을 겹친 색 */
function overlayWhite(hex: string, alpha: number): string {
  return `#${rgb(hex)
    .map((c) => Math.round(c + (255 - c) * alpha).toString(16).padStart(2, "0"))
    .join("")}`;
}

function luminance(hex: string): number {
  const [r, g, b] = rgb(hex).map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

/** 화면에서 실제로 쓰는 글자-배경 조합: [글자, 배경, 쓰는 곳]. 토큰 이름(--빼고) 또는 #색 */
const PAIRS: [string, string, string][] = [
  ["ink", "page", "본문 글자"],
  ["ink-soft", "page", "입력 도우미 칩"],
  ["ink-faint", "page", "입력창 안내 글자(placeholder), 광고 자리 표시"],
  ["link", "page", "본문 링크, 고른 칩"],
  ["ink", "surface", "카드·입력 상자·입력한 글자"],
  ["ink-soft", "surface", "카드 설명, 푸터"],
  ["ink-faint", "surface", "흐린 글자(글자 수, 게임 이름, 안내)"],
  ["link", "surface", "카드 링크, 링크 복사·공유 버튼"],
  ["accent", "surface", "상황 풀이 제목(달빛색 강조 글자)"],
  ["f-warn-fg", "surface", "입력 오류 안내, 글자 수 경고"],
  ["ink", "surface-2", "상징 없음 안내 제목"],
  ["ink-soft", "surface-2", "고지(면책) 상자, 기본 이유 태그"],
  ["link", "surface-2", "상징 없음 안내 링크"],
  ["btn-ink", "btn", "주 버튼(해몽하기, 다시 뽑기)"],
  ["btn-ink", "btn-hover", "주 버튼(마우스를 올렸을 때)"],
  ["f-money-fg", "f-money-bg", "재물운 태그"],
  ["f-love-fg", "f-love-bg", "애정운 태그"],
  ["f-health-fg", "f-health-bg", "건강운 태그"],
  ["f-work-fg", "f-work-bg", "직장운 태그"],
  ["f-warn-fg", "f-warn-bg", "주의 태그"],
  ["f-change-fg", "f-change-bg", "변화운 태그"],
  ["f-mind-fg", "f-mind-bg", "마음 풀이 태그"],
  ["night-ink", "night", "밤하늘 띠 제목"],
  ["night-ink", "night-2", "밤하늘 띠 제목(그라데이션 끝)"],
  ["night-soft", "night", "밤하늘 띠 설명, 메뉴"],
  ["night-soft", "night-2", "밤하늘 띠 설명(그라데이션 끝)"],
  ["moon", "night", "밤하늘 띠 달빛색 글자"],
  ["moon", "night-2", "밤하늘 띠 달빛색 글자(그라데이션 끝)"],
  ["night-ink", "night-2+white/10", "찾은 상징 태그, 메뉴에 마우스를 올렸을 때"],
  ["#1a1640", "moon", "'나도 해몽 받기' 버튼"],
];

function color(theme: Record<string, string>, name: string): string {
  if (name.startsWith("#")) return name;
  const [token, overlay] = name.split("+white/");
  const hex = theme[`--${token}`];
  if (!hex) throw new Error(`globals.css 에 --${token} 이 없어요`);
  return overlay ? overlayWhite(hex, Number(overlay) / 100) : hex;
}

/** 이전까지 지켜 온 가장 낮은 대비 (README 10장). 이보다 낮아지면 안 된다. */
const MIN_RATIO = 4.94;

describe("다크가 기본 테마", () => {
  it("기본 :root 는 다크, 라이트는 data-theme=\"light\" 일 때만", () => {
    expect(DARK["color-scheme"]).toBe("dark");
    expect(THEMES.light["color-scheme"]).toBe("light");
  });

  it("기기의 라이트/다크 설정(prefers-color-scheme)을 기본값에 쓰지 않는다", () => {
    expect(CSS).not.toMatch(/prefers-color-scheme/);
  });

  it("주소창 색(theme-color)은 테마마다 헤더 밤하늘 띠 색과 같다", () => {
    for (const theme of ["dark", "light"] as const) {
      expect(THEME_META[theme].themeColor).toBe(THEMES[theme]["--night"]);
      expect(THEME_META[theme].colorScheme).toBe(THEMES[theme]["color-scheme"]);
    }
  });
});

describe("명도 대비 (WCAG AA 4.5:1 이상, 최소 4.94 유지)", () => {
  for (const theme of ["dark", "light"] as const) {
    it(`${theme === "dark" ? "다크" : "라이트"}: 글자-배경 조합`, () => {
      const low = PAIRS.map(([fg, bg, where]) => ({
        where: `${fg} on ${bg} (${where})`,
        ratio: Math.round(contrast(color(THEMES[theme], fg), color(THEMES[theme], bg)) * 100) / 100,
      })).filter((p) => p.ratio < MIN_RATIO);
      expect(low).toEqual([]);
    });
  }

  it("앞으로 새로 쓸 조합까지: 글자 토큰 × 바탕 토큰 전부 4.5:1 이상 (두 테마)", () => {
    const fgs = ["ink", "ink-soft", "ink-faint", "link", "accent", "f-warn-fg"];
    const bgs = ["page", "surface", "surface-2"];
    for (const theme of ["dark", "light"] as const) {
      for (const fg of fgs) {
        for (const bg of bgs) {
          const ratio = contrast(color(THEMES[theme], fg), color(THEMES[theme], bg));
          expect(ratio, `${theme}: ${fg} on ${bg}`).toBeGreaterThanOrEqual(4.5);
        }
      }
    }
  });

  it("로또 공 번호 글자 (두 테마 같은 색)", () => {
    for (let n = 1; n <= 45; n++) {
      const { fg, bg } = ballColor(n);
      expect(contrast(fg, bg), `${n}번 공`).toBeGreaterThanOrEqual(MIN_RATIO);
    }
  });
});

describe("THEME_INIT_SCRIPT (화면을 그리기 전에 <head> 에서 실행)", () => {
  /** 가짜 document·localStorage 로 스크립트를 돌려 본다. */
  function run(stored: string | null | Error) {
    const root = { dataset: { theme: "dark" } as Record<string, string> };
    const head: { name: string; content: string; attrs: Record<string, string> }[] = [];
    const document = {
      documentElement: root,
      head: { prepend: (el: (typeof head)[number]) => head.unshift(el) },
      createElement: () => ({
        name: "",
        content: "",
        attrs: {} as Record<string, string>,
        setAttribute(key: string, value: string) {
          this.attrs[key] = value;
        },
      }),
    };
    const localStorage = {
      getItem: () => {
        if (stored instanceof Error) throw stored;
        return stored;
      },
    };
    new Function("document", "localStorage", THEME_INIT_SCRIPT)(document, localStorage);
    return { theme: root.dataset.theme, metas: head.map(({ name, content }) => [name, content]) };
  }

  it("라이트를 골라 둔 경우: data-theme 과 라이트 메타(주소창 색, color-scheme)를 맨 앞에 넣는다", () => {
    const { theme, metas } = run("light");
    expect(theme).toBe("light");
    expect(Object.fromEntries(metas)).toEqual({
      "theme-color": THEME_META.light.themeColor,
      "color-scheme": "light",
    });
  });

  it("저장값이 없거나, 다크이거나, 알 수 없는 값이거나, 저장소가 막혀 있으면 서버 HTML 의 다크 그대로", () => {
    for (const stored of [null, "dark", "", "blue", "LIGHT", new Error("SecurityError")]) {
      expect(run(stored)).toEqual({ theme: "dark", metas: [] });
    }
  });
});
