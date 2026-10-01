// 사용자 흐름 테스트: 휴대폰(mobile)과 PC(desktop) 크기에서 각각 실행된다.

import { expect, test, type Page } from "@playwright/test";
import { DEFAULT_SITE_URL } from "../lib/site";

const DREAM = "돼지가 집으로 들어오고 뱀에게 물렸어요";

/** 화면의 5게임 번호를 ["3,9,20,…", …] 형태로 읽는다. */
async function readGames(page: Page): Promise<string[]> {
  return page
    .locator("ol > li")
    .filter({ has: page.locator(".ball-roll") })
    .evaluateAll((items) =>
      items.map((li) => [...li.querySelectorAll(".ball-roll")].map((ball) => ball.textContent?.trim()).join(",")),
    );
}

async function submitDream(page: Page, dream: string) {
  await page.getByLabel("어젯밤 어떤 꿈을 꾸셨나요?").fill(dream);
  await page.getByRole("button", { name: "해몽하고 번호 뽑기" }).click();
  await expect(page.getByRole("heading", { name: "추천 번호" })).toBeVisible();
}

test("입력 → 결과 → 다시 뽑기 → 공유 링크 → 같은 결과", async ({ page, context }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.goto("/");
  await submitDream(page, DREAM);

  // 결과: 상황 풀이와 5게임 (1~45, 중복 없는 6개, 오름차순)
  await expect(page.getByText("상황 풀이 · 돼지가 집으로 들어오는 꿈")).toBeVisible();
  await expect(page.getByText("상황 풀이 · 뱀에게 물리는 꿈")).toBeVisible();
  const first = await readGames(page);
  expect(first).toHaveLength(5);
  for (const game of first) {
    const numbers = game.split(",").map(Number);
    expect(numbers).toHaveLength(6);
    expect(new Set(numbers).size).toBe(6);
    expect(numbers).toEqual([...numbers].sort((a, b) => a - b));
    for (const n of numbers) expect(n >= 1 && n <= 45).toBe(true);
  }
  await expect(page.getByText("재미로 보는 서비스이며, 추천 번호는 당첨 확률과 무관합니다.").first()).toBeVisible();

  // 다시 뽑기
  await page.getByRole("button", { name: "다시 뽑기" }).click();
  await expect(page.getByText("다시 뽑기 1회")).toBeVisible();
  const second = await readGames(page);
  expect(second).not.toEqual(first);
  const summary = await page.locator("#summary-heading + p").textContent();

  // 링크 복사 → 꿈 원문이 없는 공유 주소
  await page.getByRole("button", { name: "링크 복사" }).click();
  await expect(page.getByRole("status")).toContainText("링크를 복사했어요");
  const url = await page.evaluate(() => navigator.clipboard.readText());
  // 공유 주소는 항상 대표 도메인으로 만든다 (lib/site.ts)
  expect(url).toMatch(new RegExp(`^${DEFAULT_SITE_URL}/r/[A-Za-z0-9_-]+$`));
  const payload = Buffer.from(url.split("/r/")[1], "base64url").toString("utf8");
  expect(payload).not.toMatch(/[가-힣]/);

  // 공유 페이지: 같은 해몽과 번호, "나도 해몽 받기" (테스트 서버에서 같은 경로로 연다)
  await page.goto(new URL(url).pathname);
  await expect(page.getByRole("heading", { name: "공유받은 꿈해몽 결과예요" })).toBeVisible();
  await expect(page.locator("#summary-heading + p")).toHaveText(summary ?? "");
  expect(await readGames(page)).toEqual(second);
  await page.getByRole("link", { name: "나도 해몽 받기" }).first().click();
  await expect(page).toHaveURL(/\/$/);
});

test("잘못된 공유 링크는 메인으로 이동", async ({ page }) => {
  await page.goto("/r/not-a-real-link");
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole("heading", { name: "꿈해몽 로또번호 추첨기" })).toBeVisible();
});

test("빈 입력은 안내 문구를 보여 준다", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "해몽하고 번호 뽑기" }).click();
  // Next.js 가 페이지 이동 안내용 role="alert" 요소를 따로 두므로 입력 폼 안에서 찾는다.
  await expect(page.locator("form").getByRole("alert")).toHaveText("꿈 내용을 입력해 주세요.");
});

test("입력 도우미: 예시 꿈, 추천 칩, 상징 0개 안내", async ({ page }) => {
  await page.goto("/");
  const textarea = page.getByLabel("어젯밤 어떤 꿈을 꾸셨나요?");
  await expect(page.getByText("0/500")).toBeVisible();

  await page.getByRole("button", { name: "할머니가 돈을 주신 꿈" }).click();
  await expect(textarea).toHaveValue(/돌아가신 할머니/);
  await expect(page.locator("#dream-recognized")).toContainText("조상 · 돈");

  await textarea.fill("");
  await textarea.pressSequentially("어젯밤에 멧");
  await page.getByRole("group", { name: "추천 키워드" }).getByRole("button", { name: "멧돼지" }).click();
  await expect(textarea).toHaveValue("어젯밤에 멧돼지 ");

  await submitDream(page, "오늘은 평범한 하루였어요");
  await expect(page.getByText("꿈속 상징을 찾지 못했어요. 이런 단어를 넣어 보세요")).toBeVisible();
  await page.getByRole("button", { name: "+ 돼지" }).click();
  await expect(textarea).toHaveValue("오늘은 평범한 하루였어요 돼지 ");
});

test.describe("움직임 줄이기 설정", () => {
  test.use({ contextOptions: { reducedMotion: "reduce" } });

  test("애니메이션 없이 번호를 바로 보여 준다", async ({ page }) => {
    await page.goto("/");
    await submitDream(page, DREAM);
    expect(await page.evaluate(() => document.getAnimations().length)).toBe(0);
    await expect(page.locator(".ball-roll").first()).toHaveCSS("opacity", "1");
  });
});

test("테마 전환 버튼: 바꾼 테마를 기억한다", async ({ page }) => {
  await page.goto("/");
  const html = page.locator("html");
  await page.getByRole("button", { name: /화면으로 바꾸기/ }).click();
  const chosen = await html.getAttribute("data-theme");
  expect(chosen === "dark" || chosen === "light").toBe(true);
  await page.reload();
  await expect(html).toHaveAttribute("data-theme", chosen!);
});

test("사전·가이드 페이지와 404", async ({ page }) => {
  await page.goto("/dream/pig");
  await expect(page.getByRole("heading", { level: 1, name: "돼지 꿈 해몽" })).toBeVisible();
  await expect(page.locator("#situation-enter")).toContainText("돼지가 집으로 들어오는 꿈");
  await expect(page.getByRole("heading", { name: "비슷한 꿈", exact: true })).toBeVisible();

  await page.goto("/guide/wealth-dreams");
  await expect(page.getByRole("heading", { level: 1, name: "재물운이 트이는 꿈 모음" })).toBeVisible();
  await page.getByRole("link", { name: "돼지 꿈" }).first().click();
  await expect(page).toHaveURL(/\/dream\/pig$/);

  const res = await page.goto("/dream/unicorn");
  expect(res?.status()).toBe(404);
  await expect(page.getByRole("heading", { name: "페이지를 찾을 수 없어요" })).toBeVisible();
});
