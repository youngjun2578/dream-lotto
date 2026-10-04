// 개인정보처리방침에 적은 실제 동작을 브라우저에서 확인한다. (처리방침 2·7번)
// - 사이트 밖으로 나가는 요청이 없다 (분석 도구·외부 글꼴·광고 스크립트 없음)
// - 쿠키가 없고, 브라우저 저장소는 theme(localStorage)·dream-draft(sessionStorage)뿐이다
// - 꿈 원문은 /api/interpret 요청 본문에만 실리고, 결과 주소에는 들어가지 않는다
// - 모든 종류의 페이지 푸터에 개인정보처리방침 링크가 있다
// 분석 도구나 광고 코드를 넣으면 이 테스트가 실패한다. 그때는 처리방침을 먼저 고치고 이 테스트를 손본다.
// 애드센스 사이트 확인용 메타 태그(google-adsense-account)와 /ads.txt 는 광고 코드가 아니다. 둘이 있어도
// 아무것도 불러오지 않아 '외부 요청 없음'이 그대로 통과한다(아래 첫 테스트가 둘이 있는 상태에서 확인한다).

import { expect, test } from "@playwright/test";
import { ADS_TXT_LINE, ADSENSE_ACCOUNT, CONTACT_EMAIL, PRIVACY_OFFICER_NAME } from "../lib/site";

const DREAM = "개인정보확인용 돼지가 집으로 들어왔어요";

test("외부 요청·쿠키 없음, 저장소 두 가지, 꿈 원문은 해몽 요청에만", async ({ page, context, baseURL }) => {
  const origins = new Set<string>();
  const bodiesWithDream: string[] = [];
  page.on("request", (req) => {
    origins.add(new URL(req.url()).origin);
    if (req.postData()?.includes("개인정보확인용")) bodiesWithDream.push(new URL(req.url()).pathname);
  });

  await page.goto("/");
  // 사이트 확인용 메타 태그가 <head> 에 있다. 광고 코드가 아니라서 이 상태로도 외부 요청이 없어야 한다(아래 origins 검사).
  await expect(page.locator('head meta[name="google-adsense-account"]')).toHaveAttribute("content", ADSENSE_ACCOUNT);
  await page.getByLabel("어젯밤 어떤 꿈을 꾸셨나요?").fill(DREAM);
  await page.getByRole("button", { name: "해몽하고 번호 뽑기" }).click();
  await expect(page).toHaveURL(/\/result\/[A-Za-z0-9_-]+$/);
  await expect(page.getByRole("heading", { name: "추천 번호" })).toBeVisible();

  // 결과 주소(부호화된 값까지 풀어서)에 꿈 원문이 없다
  const payload = page.url().split("/result/")[1];
  expect(Buffer.from(payload, "base64url").toString("utf8")).not.toContain("개인정보확인용");

  await page.getByRole("button", { name: "밝은 화면으로 바꾸기" }).click();
  // ads.txt 도 사이트 안의 글 한 줄일 뿐 다른 곳으로 요청을 보내지 않는다
  const adsTxt = await page.goto("/ads.txt");
  expect(adsTxt?.status()).toBe(200);
  expect((await adsTxt!.text()).trim()).toBe(ADS_TXT_LINE);
  await page.goto("/dream/pig");
  await page.goto("/privacy");

  expect([...origins]).toEqual([new URL(baseURL!).origin]);
  expect(bodiesWithDream).toEqual(["/api/interpret"]);
  expect(await context.cookies()).toEqual([]);
  const storage = await page.evaluate(() => ({
    cookie: document.cookie,
    local: Object.keys(localStorage),
    session: Object.keys(sessionStorage),
  }));
  expect(storage).toEqual({ cookie: "", local: ["theme"], session: ["dream-draft"] });
});

test("모든 종류의 페이지 푸터에 개인정보처리방침 링크가 있다", async ({ page, request }) => {
  const res = await request.post("/api/interpret", { data: { dream: DREAM } });
  const { share } = (await res.json()) as { share: string };
  for (const path of [
    "/",
    "/dream",
    "/dream/category/love",
    "/dream/pig",
    "/guide",
    "/guide/wealth-dreams",
    `/result/${share}`,
    `/r/${share}`,
    "/about",
    "/terms",
    "/contact",
    "/privacy",
    "/no-such-page",
  ]) {
    await page.goto(path);
    await expect(page.locator('footer a[href="/privacy"]'), path).toHaveText("개인정보처리방침");
  }
});

test("처리방침: 시행일, 목차 이동, 보호책임자와 메일", async ({ page }) => {
  await page.goto("/privacy");
  await expect(page.getByRole("heading", { level: 1, name: "개인정보처리방침" })).toBeVisible();
  await expect(page.getByText(/시행일 \d{4}년 \d{1,2}월 \d{1,2}일 · 최종 개정일/)).toBeVisible();

  await page.getByRole("navigation", { name: "목차" }).getByRole("link", { name: "개인정보 보호책임자" }).click();
  await expect(page).toHaveURL(/#officer$/);
  await expect(page.getByRole("heading", { level: 2, name: "13. 개인정보 보호책임자" })).toBeInViewport();
  await expect(page.getByText(`개인정보 보호책임자: ${PRIVACY_OFFICER_NAME} (운영자)`)).toBeVisible();
  await expect(page.locator("#officer ~ ul").first().getByRole("link", { name: CONTACT_EMAIL })).toHaveAttribute(
    "href",
    `mailto:${CONTACT_EMAIL}`,
  );
});
