// 도메인 검사: 실제 빌드 결과에서 대표 주소(https://haemongru.com)와 www 리디렉션을 확인한다.

import { request as httpRequest } from "node:http";
import { expect, test } from "@playwright/test";
import { DEFAULT_SITE_URL } from "../lib/site";

const APEX = DEFAULT_SITE_URL; // https://haemongru.com
const APEX_HOST = new URL(APEX).hostname; // haemongru.com
const WWW_HOST = `www.${APEX_HOST}`;

/** Host 헤더를 바꿔서(www.haemongru.com 인 척) 테스트 서버에 요청한다. 리디렉션은 따라가지 않는다. */
function requestWithHost(baseURL: string, host: string, path: string) {
  const { hostname, port } = new URL(baseURL);
  return new Promise<{ status: number; location?: string }>((resolve, reject) => {
    const req = httpRequest({ hostname, port, path, method: "GET", headers: { host } }, (res) => {
      res.resume();
      resolve({ status: res.statusCode ?? 0, location: res.headers.location });
    });
    req.on("error", reject);
    req.end();
  });
}

test("canonical·OG·트위터 주소가 대표 도메인", async ({ page }) => {
  await page.goto("/dream/pig");
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", `${APEX}/dream/pig`);
  await expect(page.locator('meta[property="og:url"]')).toHaveAttribute("content", `${APEX}/dream/pig`);
  await expect(page.locator('meta[property="og:image"]').first()).toHaveAttribute("content", new RegExp(`^${APEX}/dream/pig/opengraph-image`));
  await expect(page.locator('meta[name="twitter:image"]').first()).toHaveAttribute("content", new RegExp(`^${APEX}/`));

  await page.goto("/");
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", APEX);
  await expect(page.locator('meta[property="og:url"]')).toHaveAttribute("content", APEX);
});

test("sitemap.xml 과 robots.txt 가 대표 도메인을 가리킨다", async ({ request }) => {
  const sitemap = await (await request.get("/sitemap.xml")).text();
  const locs = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  expect(locs.length).toBeGreaterThan(30);
  for (const loc of locs) expect(loc.startsWith(`${APEX}/`)).toBe(true);

  const robots = await (await request.get("/robots.txt")).text();
  expect(robots).toContain(`Sitemap: ${APEX}/sitemap.xml`);
});

test("www 로 들어오면 대표 도메인의 같은 경로로 308, 대표 도메인은 그대로 200", async ({ baseURL }) => {
  const www = await requestWithHost(baseURL!, WWW_HOST, "/dream/pig?from=www");
  expect(www.status).toBe(308);
  expect(www.location).toBe(`${APEX}/dream/pig?from=www`);

  const root = await requestWithHost(baseURL!, WWW_HOST, "/");
  expect(root.status).toBe(308);
  // 첫 화면은 "https://haemongru.com" 으로 오며, 브라우저는 이를 "https://haemongru.com/" 과 같게 본다.
  expect(new URL(root.location!).href).toBe(`${APEX}/`);

  // 리디렉션된 주소(대표 도메인)로 다시 요청하면 더 이상 이동하지 않는다 → 루프 없음
  const apex = await requestWithHost(baseURL!, APEX_HOST, "/dream/pig?from=www");
  expect(apex.status).toBe(200);
  expect(apex.location).toBeUndefined();
});
