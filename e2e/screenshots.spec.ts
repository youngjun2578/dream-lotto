// 검토용 화면 캡처: 주요 화면 × (휴대폰, PC) × (라이트, 다크) → review/screenshots/
// 실행: npm run review:screenshots
// 애니메이션이 끝난 모습을 찍기 위해 '움직임 줄이기'로 캡처한다.
// 테마는 기기 설정이 아니라 헤더 버튼으로 고른 값(localStorage "theme")으로 정한다. (기본은 다크, lib/theme.ts)

import { mkdirSync } from "node:fs";
import { expect, test, type Browser, type Page } from "@playwright/test";

const OUT = "review/screenshots";
const DREAM = "돌아가신 할머니가 환하게 웃으면서 돈을 주셨고, 돼지가 집으로 들어왔어요.";

const DEVICES = {
  mobile: { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true },
  desktop: { viewport: { width: 1280, height: 800 } },
} as const;

async function shot(page: Page, name: string) {
  // Pretendard 는 페이지를 다 불러온 뒤 받아서 <html class="fonts-ready"> 로 바꾼다(app/layout.tsx). 바뀐 뒤에 찍는다.
  await page.waitForFunction(() => document.documentElement.classList.contains("fonts-ready"));
  await page.screenshot({ path: `${OUT}/${name}.jpg`, fullPage: true, type: "jpeg", quality: 82 });
}

async function capture(browser: Browser, device: keyof typeof DEVICES, theme: "light" | "dark") {
  const context = await browser.newContext({ ...DEVICES[device], reducedMotion: "reduce", locale: "ko-KR" });
  await context.addInitScript((t) => localStorage.setItem("theme", t), theme);
  const page = await context.newPage();
  const suffix = `${device}-${theme}`;

  await page.goto("/");
  await shot(page, `1-main-${suffix}`);

  await page.getByLabel("어젯밤 어떤 꿈을 꾸셨나요?").fill(DREAM);
  await page.getByRole("button", { name: "해몽하고 번호 뽑기" }).click();
  await expect(page.getByRole("heading", { name: "추천 번호" })).toBeVisible();
  await shot(page, `2-result-${suffix}`);

  const res = await page.request.post("/api/interpret", { data: { dream: DREAM } });
  const { share } = (await res.json()) as { share: string };
  await page.goto(`/r/${share}`);
  await expect(page.getByRole("heading", { name: "공유받은 꿈해몽 결과예요" })).toBeVisible();
  await shot(page, `3-share-${suffix}`);

  await page.goto("/dream");
  await shot(page, `4-dictionary-list-${suffix}`);

  await page.goto("/dream/pig");
  await shot(page, `5-dictionary-pig-${suffix}`);

  await page.goto("/guide/wealth-dreams");
  await shot(page, `6-guide-wealth-${suffix}`);

  await context.close();
}

test.beforeAll(() => mkdirSync(OUT, { recursive: true }));

for (const device of Object.keys(DEVICES) as (keyof typeof DEVICES)[]) {
  for (const theme of ["light", "dark"] as const) {
    test(`화면 캡처: ${device} ${theme}`, async ({ browser }) => {
      test.setTimeout(120_000);
      await capture(browser, device, theme);
    });
  }
}
