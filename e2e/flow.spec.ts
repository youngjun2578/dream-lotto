// 사용자 흐름 테스트: 휴대폰(mobile)과 PC(desktop) 크기에서 각각 실행된다.

import { readFileSync } from "node:fs";
import { expect, test, type Page } from "@playwright/test";
import { AGE_NOTICE, DEFAULT_SITE_URL, DISCLAIMER, SITE_NAME } from "../lib/site";

/** 사전 데이터 (카테고리 순서대로). 화면에 모든 상징이 나오는지 비교할 때 쓴다. (파일 이름 = 카테고리 페이지 주소) */
const DICTIONARY = [
  ["동물", "animal"],
  ["사람", "person"],
  ["자연", "nature"],
  ["행동", "behavior"],
  ["물건", "object"],
  ["연애·결혼", "love"],
].map(([category, file]) => ({
  category,
  file,
  slugs: (JSON.parse(readFileSync(`data/symbols/${file}.json`, "utf8")) as { slug: string }[]).map((s) => s.slug),
}));

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

/** 본인 결과 페이지 주소 (/result/ + 공유 값) */
const RESULT_URL = /\/result\/[A-Za-z0-9_-]+$/;

/** 꿈을 적고 해몽하기를 누른 뒤 결과 페이지가 열릴 때까지 기다린다. */
async function submitDream(page: Page, dream: string) {
  await page.getByLabel("어젯밤 어떤 꿈을 꾸셨나요?").fill(dream);
  await page.getByRole("button", { name: "해몽하고 번호 뽑기" }).click();
  await expect(page).toHaveURL(RESULT_URL);
  await expect(page.getByRole("heading", { name: "추천 번호" })).toBeVisible();
}

test("입력 → 결과 페이지 → 새로고침 → 뒤로 가기 → 다시 뽑기 → 링크 복사 → 공유 페이지", async ({ page, context }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.goto("/");
  await submitDream(page, DREAM);

  // 결과 페이지: 꿈 원문이 없는 주소, 맨 위에서 시작, 검색 노출 안 함, 찾은 상징 태그
  const resultUrl = page.url();
  expect(decodeURIComponent(resultUrl)).not.toMatch(/[가-힣]/);
  expect(await page.evaluate(() => window.scrollY)).toBe(0);
  await expect(page).toHaveTitle(`돼지·집 꿈 해몽 결과 | ${SITE_NAME}`);
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
  await expect(page.getByRole("heading", { level: 1, name: "돼지·집 꿈 해몽 결과" })).toBeVisible();
  await expect(page.getByRole("list", { name: "찾은 꿈 상징" })).toContainText("#돼지 · 들어오다");

  // 상징 풀이(상황 풀이 우선)와 사전 링크, 5게임 (1~45, 중복 없는 6개, 오름차순)
  await expect(page.getByText("상황 풀이 · 돼지가 집으로 들어오는 꿈")).toBeVisible();
  await expect(page.getByText("상황 풀이 · 뱀에게 물리는 꿈")).toBeVisible();
  await expect(page.getByRole("link", { name: "돼지 꿈 자세히 보기 →" })).toHaveAttribute("href", "/dream/pig#situation-enter");
  const first = await readGames(page);
  expect(first).toHaveLength(5);
  for (const game of first) {
    const numbers = game.split(",").map(Number);
    expect(numbers).toHaveLength(6);
    expect(new Set(numbers).size).toBe(6);
    expect(numbers).toEqual([...numbers].sort((a, b) => a - b));
    for (const n of numbers) expect(n >= 1 && n <= 45).toBe(true);
  }
  // 결과 아래 고지: 재미용·당첨 보장 없음 + 구매 연령
  const note = page.getByRole("note").filter({ hasText: DISCLAIMER });
  await expect(note).toBeVisible();
  await expect(note).toContainText(AGE_NOTICE);

  // 새로고침해도 같은 번호
  await page.reload();
  expect(await readGames(page)).toEqual(first);

  // 뒤로 가기 → 입력창 (입력하던 꿈이 다시 채워져 있다) → 앞으로 가기 → 같은 결과
  await page.goBack();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByLabel("어젯밤 어떤 꿈을 꾸셨나요?")).toHaveValue(DREAM);
  await page.goForward();
  await expect(page).toHaveURL(resultUrl);
  expect(await readGames(page)).toEqual(first);

  // 다시 뽑기: 다시 뽑기 횟수를 올린 새 결과 주소로 바뀌고 번호가 달라진다.
  await page.getByRole("button", { name: "다시 뽑기" }).click();
  await expect(page.getByText("다시 뽑기 1회")).toBeVisible();
  await expect(page).toHaveURL(RESULT_URL);
  const redrawUrl = page.url();
  expect(redrawUrl).not.toBe(resultUrl);
  const second = await readGames(page);
  expect(second).not.toEqual(first);
  const summary = await page.locator("#summary-heading + p").textContent();

  // 주소를 바꿔 끼우므로(replace) 방문 기록이 쌓이지 않는다: 뒤로 가기 한 번이면 입력창
  await page.goBack();
  await expect(page).toHaveURL(/\/$/);
  await page.goForward();
  await expect(page).toHaveURL(redrawUrl);
  expect(await readGames(page)).toEqual(second);

  // 링크 복사 → 대표 도메인의 공유 주소(/r/), 지금 결과와 같은 값, 꿈 원문 없음
  await page.getByRole("button", { name: "링크 복사" }).click();
  await expect(page.getByRole("status")).toContainText("링크를 복사했어요");
  const url = await page.evaluate(() => navigator.clipboard.readText());
  expect(url).toBe(`${DEFAULT_SITE_URL}/r/${redrawUrl.split("/result/")[1]}`);
  const payload = Buffer.from(url.split("/r/")[1], "base64url").toString("utf8");
  expect(payload).not.toMatch(/[가-힣]/);

  // 공유 페이지: 같은 해몽과 번호, 버튼은 '나도 해몽 받기'만 (테스트 서버에서 같은 경로로 연다)
  await page.goto(new URL(url).pathname);
  await expect(page.getByRole("heading", { name: "공유받은 꿈해몽 결과예요" })).toBeVisible();
  await expect(page.locator("#summary-heading + p")).toHaveText(summary ?? "");
  expect(await readGames(page)).toEqual(second);
  await expect(page.getByRole("button", { name: "다시 뽑기" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "링크 복사" })).toHaveCount(0);
  await page.getByRole("link", { name: "나도 해몽 받기" }).first().click();
  await expect(page).toHaveURL(/\/$/);
});

test("해몽하기: '해몽 중이에요' 표시, 두 번 눌러도 요청은 한 번", async ({ page }) => {
  let calls = 0;
  await page.route("**/api/interpret", async (route) => {
    calls += 1;
    await new Promise((resolve) => setTimeout(resolve, 700));
    await route.continue();
  });
  await page.goto("/");
  await page.getByLabel("어젯밤 어떤 꿈을 꾸셨나요?").fill(DREAM);
  await page.getByRole("button", { name: "해몽하고 번호 뽑기" }).click();
  const busy = page.getByRole("button", { name: "해몽 중이에요…" });
  await expect(busy).toBeDisabled();
  // 버튼이 잠겨 있어도 폼 제출을 한 번 더 일으켜 본다.
  await page.locator("form").evaluate((form) => (form as HTMLFormElement).requestSubmit());
  await expect(page).toHaveURL(RESULT_URL);
  expect(calls).toBe(1);
});

test("해몽 실패: 입력창 아래에 안내하고 입력 내용은 그대로 둔다", async ({ page }) => {
  await page.route("**/api/interpret", (route) =>
    route.fulfill({
      status: 500,
      contentType: "application/json",
      body: JSON.stringify({ error: "해몽 중 문제가 생겼어요. 잠시 후 다시 시도해 주세요." }),
    }),
  );
  await page.goto("/");
  const textarea = page.getByLabel("어젯밤 어떤 꿈을 꾸셨나요?");
  await textarea.fill(DREAM);
  await page.getByRole("button", { name: "해몽하고 번호 뽑기" }).click();
  await expect(page.locator("form").getByRole("alert")).toHaveText("해몽 중 문제가 생겼어요. 잠시 후 다시 시도해 주세요.");
  await expect(textarea).toHaveValue(DREAM);
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole("button", { name: "해몽하고 번호 뽑기" })).toBeEnabled();
});

test("사이트 이름: 헤더와 페이지 제목", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle(`${SITE_NAME} – 꿈해몽과 행운 번호 추천`);
  await expect(page.getByRole("banner").getByRole("link", { name: SITE_NAME, exact: true })).toBeVisible();
  await page.goto("/dream/pig");
  await expect(page).toHaveTitle(new RegExp(`\\| ${SITE_NAME}$`));
});

test("잘못된 결과·공유 링크는 메인으로 이동", async ({ page }) => {
  for (const path of ["/result/not-a-real-link", "/r/not-a-real-link", "/result/WzEsMSwiMjAyNi0xMC0wMSIsMCxbInVuaWNvcm4iXV0"]) {
    await page.goto(path);
    await expect(page, path).toHaveURL(/\/$/);
    await expect(page.getByRole("heading", { name: "꿈해몽 로또번호 추첨기" })).toBeVisible();
  }
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

  await page.getByRole("button", { name: "할머니가 용돈을 주신 꿈" }).click();
  await expect(textarea).toHaveValue(/할머니가 용돈을/);
  await expect(page.locator("#dream-recognized")).toContainText("돈 · 할머니·할아버지");

  await textarea.fill("");
  await textarea.pressSequentially("어젯밤에 멧");
  await page.getByRole("group", { name: "추천 키워드" }).getByRole("button", { name: "멧돼지" }).click();
  await expect(textarea).toHaveValue("어젯밤에 멧돼지 ");

  // 상징을 못 찾아도 결과 페이지에 안내와 번호를 보여 주고, 단어 칩을 누르면 입력창으로 돌아가 꿈 끝에 더한다.
  await submitDream(page, "오늘은 평범한 하루였어요");
  await expect(page).toHaveTitle(`꿈 해몽 결과 | ${SITE_NAME}`);
  await expect(page.getByText("꿈속 상징을 찾지 못했어요. 이런 단어를 넣어 보세요")).toBeVisible();
  expect(await readGames(page)).toHaveLength(5);
  await expect(page.getByRole("link", { name: "← 꿈 다시 적으러 가기" })).toHaveAttribute("href", "/");
  await page.getByRole("button", { name: "+ 돼지" }).click();
  await expect(page).toHaveURL(/\/$/);
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

test("사전·가이드 페이지와 404", async ({ page }) => {
  await page.goto("/dream/pig");
  await expect(page.getByRole("heading", { level: 1, name: "돼지 꿈 해몽" })).toBeVisible();
  await expect(page.locator("#situation-enter")).toContainText("돼지가 집으로 들어오는 꿈");
  await expect(page.getByRole("heading", { name: "비슷한 꿈", exact: true })).toBeVisible();

  await expect(page.getByRole("note").filter({ hasText: DISCLAIMER })).toContainText(AGE_NOTICE);
  // 이동 경로의 카테고리는 카테고리 페이지로 간다.
  await expect(page.getByRole("navigation", { name: "이동 경로" }).getByRole("link", { name: "동물" })).toHaveAttribute(
    "href",
    "/dream/category/animal",
  );

  // 사전 본문의 링크 (자녀 꿈 → 태몽 가이드)
  await page.goto("/dream/children");
  await expect(page.getByRole("link", { name: "태몽 가이드" })).toHaveAttribute("href", "/guide/taemong");

  await page.goto("/guide/wealth-dreams");
  await expect(page.getByRole("heading", { level: 1, name: "재물운이 트이는 꿈 모음" })).toBeVisible();
  await expect(page.getByRole("note").filter({ hasText: DISCLAIMER })).toContainText(AGE_NOTICE);
  await page.getByRole("link", { name: "돼지 꿈" }).first().click();
  await expect(page).toHaveURL(/\/dream\/pig$/);

  const res = await page.goto("/dream/unicorn");
  expect(res?.status()).toBe(404);
  await expect(page.getByRole("heading", { name: "페이지를 찾을 수 없어요" })).toBeVisible();
});

test("미리보기 이미지: 있는 주소는 그림, 없는 주소는 404", async ({ request }) => {
  const { share } = (await (await request.post("/api/interpret", { data: { dream: DREAM } })).json()) as { share: string };
  for (const path of ["/dream/pig/opengraph-image", "/guide/wealth-dreams/opengraph-image", `/result/${share}/opengraph-image`, `/r/${share}/opengraph-image`]) {
    const res = await request.get(path);
    expect(res.status(), path).toBe(200);
    expect(res.headers()["content-type"], path).toContain("image/png");
  }
  for (const path of ["/dream/unicorn/opengraph-image", "/dream/%EC%97%86%EB%8A%94%EA%B2%83/opengraph-image", "/guide/nope/opengraph-image"]) {
    expect((await request.get(path)).status(), path).toBe(404);
  }
});

test("사전 목록·카테고리·sitemap·비슷한 꿈·미리보기 이미지에 모든 상징이 나온다", async ({ page, request }) => {
  // 사전 목록: 카테고리마다 그 카테고리 상징이 데이터 순서대로 모두 있고, 카테고리 페이지로 가는 링크가 있다.
  await page.goto("/dream");
  for (const { category, file, slugs } of DICTIONARY) {
    const section = page.locator(`#category-${category}`);
    const hrefs = await section.locator("ul a").evaluateAll((links) => links.map((a) => a.getAttribute("href")));
    expect(hrefs, category).toEqual(slugs.map((slug) => `/dream/${slug}`));
    await expect(section.getByRole("link", { name: `${category} 꿈 모아 보기 →` })).toHaveAttribute("href", `/dream/category/${file}`);
  }

  // 카테고리 페이지: 그 카테고리 상징이 데이터 순서대로 모두 있다.
  for (const { category, file, slugs } of DICTIONARY) {
    await page.goto(`/dream/category/${file}`);
    await expect(page.getByRole("heading", { level: 1, name: `${category} 꿈해몽` })).toBeVisible();
    const hrefs = await page.getByRole("list", { name: new RegExp(`^${category} 꿈 \\d+개$`) }).locator("a").evaluateAll((links) => links.map((a) => a.getAttribute("href")));
    expect(hrefs, category).toEqual(slugs.map((slug) => `/dream/${slug}`));
  }
  expect((await request.get("/dream/category/no-such")).status()).toBe(404);

  const sitemap = await (await request.get("/sitemap.xml")).text();
  for (const { file } of DICTIONARY) expect(sitemap, file).toContain(`/dream/category/${file}</loc>`);
  const allSlugs = DICTIONARY.flatMap((d) => d.slugs);
  for (const slug of allSlugs) expect(sitemap, slug).toContain(`/dream/${slug}</loc>`);

  // 비슷한 꿈: 카테고리의 마지막 상징 페이지에 같은 카테고리의 다른 상징이 모두 링크된다.
  for (const { category, slugs } of DICTIONARY) {
    await page.goto(`/dream/${slugs[slugs.length - 1]}`);
    const related = page.locator("section", { has: page.getByRole("heading", { name: "비슷한 꿈", exact: true }) });
    const hrefs = await related.locator("a").evaluateAll((links) => links.map((a) => a.getAttribute("href")));
    for (const slug of slugs.slice(0, -1)) expect(hrefs, `${category}: ${slug}`).toContain(`/dream/${slug}`);
  }

  // 모든 상징의 미리보기 이미지 (빌드할 때 미리 만든 PNG)
  for (const slug of allSlugs) {
    const res = await request.get(`/dream/${slug}/opengraph-image`);
    expect(res.status(), slug).toBe(200);
    expect(res.headers()["content-type"], slug).toContain("image/png");
  }
});

test("민감한 소재의 운세 라벨(변화운·마음 풀이)과, 라벨을 바꾸기 전에 만든 공유 링크 (사전 후속 E-1)", async ({ page }) => {
  // 라벨을 바꾸기 전(2026-10-03)에 만든 공유 링크: 죽음, 장례식, 돌아가신 가족(받는 꿈), 병원. 주소에는 slug 만 있어 그대로 열린다.
  const shared = "WzEsMTQxMjc5NjkyMSwiMjAyNi0xMC0wMyIsMCxbImRlYXRoIl0sWyJmdW5lcmFsIl0sWyJkZWNlYXNlZC1mYW1pbHkiLCJyZWNlaXZlIl0sWyJob3NwaXRhbCJdXQ";
  await page.goto(`/r/${shared}`);
  await expect(page).toHaveURL(new RegExp(`/r/${shared}$`));
  await expect(page.getByText("변화운", { exact: true })).toHaveCount(2);
  await expect(page.getByText("마음 풀이", { exact: true })).toHaveCount(2);
  await expect(page.getByText(/^(건강운|재물운|주의운)$/)).toHaveCount(0);
  await expect(page.getByText("죽는 꿈 → 변화").first()).toBeVisible();
  await expect(page.getByText("돌아가신 가족 → 마음").first()).toBeVisible();

  // 사전 페이지의 배지와 '같은 ○○ 꿈' 목록
  await page.goto("/dream/death");
  await expect(page.getByText("변화운", { exact: true }).first()).toBeVisible();
  await page.goto("/dream/hospital");
  await expect(page.getByText("마음 풀이", { exact: true }).first()).toBeVisible();
  await expect(page.getByRole("heading", { name: "같은 마음 풀이 꿈" })).toBeVisible();
  await expect(page.getByRole("link", { name: "조상 꿈" })).toBeVisible();

  // 카테고리 페이지에도 같은 배지가 보인다
  await page.goto("/dream/category/person");
  await expect(page.getByText("마음 풀이", { exact: true }).first()).toBeVisible();
});
