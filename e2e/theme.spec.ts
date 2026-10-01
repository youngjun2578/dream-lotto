// 다크 모드 기본값: 휴대폰(mobile)과 PC(desktop) 크기에서 각각 실행된다.
// - 저장된 선택이 없으면 기기 설정(라이트)과 상관없이 다크
// - 라이트를 고르면 새로고침·다른 페이지에서도 라이트, 다시 다크로 바꾸면 다크가 유지된다
// - 저장값이 잘못되면 다크, 자바스크립트가 돌기 전의 HTML 도 다크
// - 주소창 색(theme-color)과 기본 배경(color-scheme) 메타도 테마에 맞춘다 (규칙은 lib/theme.ts)

import { expect, test, type Page } from "@playwright/test";
import { THEME_META, type Theme } from "../lib/theme";

/** 테마별 페이지 바탕색 (app/globals.css 의 --page) */
const PAGE_BG: Record<Theme, string> = { dark: "rgb(11, 16, 38)", light: "rgb(244, 245, 251)" };
const TOGGLE: Record<Theme, string> = { dark: "밝은 화면으로 바꾸기", light: "어두운 화면으로 바꾸기" };

// 기기 설정은 라이트로 둔다. (기본값이 기기 설정을 따르지 않는지 보려고)
test.use({ colorScheme: "light" });

/** 화면·메타·버튼이 모두 그 테마인지 */
async function expectTheme(page: Page, theme: Theme) {
  const html = page.locator("html");
  await expect(html).toHaveAttribute("data-theme", theme);
  await expect(html).toHaveCSS("color-scheme", theme);
  await expect(page.locator("body")).toHaveCSS("background-color", PAGE_BG[theme]);
  // 같은 이름의 메타가 여럿이면 브라우저는 앞의 것을 쓴다.
  const metas = await page.evaluate(() => ({
    themeColor: document.querySelector('meta[name="theme-color"]')?.getAttribute("content"),
    colorScheme: document.querySelector('meta[name="color-scheme"]')?.getAttribute("content"),
  }));
  expect(metas).toEqual(THEME_META[theme]);
  await expect(page.getByRole("button", { name: TOGGLE[theme] })).toBeVisible();
}

const stored = (page: Page) => page.evaluate(() => localStorage.getItem("theme"));

/** 콘솔 오류와 화면 오류(하이드레이션 오류 포함)를 모은다. */
function collectErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(msg.text());
  });
  page.on("pageerror", (err) => errors.push(err.message));
  return errors;
}

test("처음 방문(저장된 선택 없음): 기기가 라이트여도 다크로 보인다", async ({ page }) => {
  await page.goto("/");
  expect(await page.evaluate(() => matchMedia("(prefers-color-scheme: light)").matches)).toBe(true);
  await expectTheme(page, "dark");
  expect(await stored(page)).toBeNull();

  await page.goto("/dream/pig");
  await expectTheme(page, "dark");
});

test("라이트를 고르면 새로고침·다른 페이지에서도 라이트, 다시 다크로 바꾸면 다크가 유지된다", async ({ page }) => {
  const errors = collectErrors(page);
  await page.goto("/");
  await page.getByRole("button", { name: TOGGLE.dark }).click();
  await expectTheme(page, "light");
  expect(await stored(page)).toBe("light");

  await page.reload();
  await expectTheme(page, "light");

  // 화면 안에서 이동(링크)해도, 주소로 새로 열어도 라이트
  await page.getByRole("link", { name: "꿈해몽 사전 전체 보기 →" }).click();
  await expect(page).toHaveURL(/\/dream$/);
  await expectTheme(page, "light");
  await page.goto("/guide/wealth-dreams");
  await expectTheme(page, "light");

  // 다시 다크로
  await page.getByRole("button", { name: TOGGLE.light }).click();
  await expectTheme(page, "dark");
  expect(await stored(page)).toBe("dark");
  await expect(page.locator("meta[data-light-meta]")).toHaveCount(0);

  await page.reload();
  await expectTheme(page, "dark");
  await page.goto("/dream/pig");
  await expectTheme(page, "dark");

  expect(errors).toEqual([]);
});

test("저장된 라이트는 화면을 처음 그리기 전에 적용된다 (깜빡임 없음)", async ({ page }) => {
  const errors = collectErrors(page);
  await page.addInitScript(() => {
    localStorage.setItem("theme", "light");
    // 첫 화면을 그리기 직전의 테마를 적어 둔다.
    requestAnimationFrame(() => {
      const root = document.documentElement;
      (window as unknown as { firstFrame: unknown }).firstFrame = {
        theme: root.dataset.theme,
        page: getComputedStyle(root).getPropertyValue("--page").trim(),
      };
    });
  });
  for (const path of ["/", "/dream/pig"]) {
    await page.goto(path);
    expect(await page.evaluate(() => (window as unknown as { firstFrame: unknown }).firstFrame)).toEqual({
      theme: "light",
      page: "#f4f5fb",
    });
    await expectTheme(page, "light");
  }
  // 하이드레이션 경고·오류가 없다. (React 가 data-theme 이나 메타를 되돌리지도 않는다)
  expect(errors).toEqual([]);
});

test("화면 스크립트(React)를 받지 못해도 저장된 라이트는 적용된다 (<head> 의 짧은 스크립트가 처리)", async ({ page }) => {
  await page.route("**/_next/static/**/*.js", (route) => route.abort());
  await page.addInitScript(() => localStorage.setItem("theme", "light"));
  await page.goto("/");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await expect(page.locator("body")).toHaveCSS("background-color", PAGE_BG.light);
});

test("저장값이 잘못되었으면 다크", async ({ page }) => {
  for (const value of ["", "blue", "Light", "system"]) {
    await page.addInitScript((v) => localStorage.setItem("theme", v), value);
    await page.goto("/");
    await expectTheme(page, "dark");
  }
});

test("서버가 보내는 HTML 자체가 다크다 (data-theme, theme-color, color-scheme)", async ({ request }) => {
  const res = await request.post("/api/interpret", { data: { dream: "돼지가 집으로 들어왔어요" } });
  const { share } = (await res.json()) as { share: string };
  for (const path of ["/", "/dream/pig", `/result/${share}`, `/r/${share}`]) {
    const html = await (await request.get(path)).text();
    expect(html, path).toMatch(/<html[^>]* data-theme="dark"/);
    expect(html, path).toContain(`<meta name="theme-color" content="${THEME_META.dark.themeColor}"/>`);
    expect(html, path).toContain('<meta name="color-scheme" content="dark"/>');
  }
});

test.describe("자바스크립트를 끈 브라우저", () => {
  test.use({ javaScriptEnabled: false });

  test("자바스크립트 없이도 다크로 보인다", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
    await expect(page.locator("body")).toHaveCSS("background-color", PAGE_BG.dark);
  });
});
