// 도메인 검사: 실제 빌드 결과에서 모든 절대 주소가 대표 주소(lib/site.ts 의 SITE_URL)를 가리키는지 확인한다.
// 루트 도메인 → www 리디렉션은 Vercel 대시보드가 맡으므로, 코드는 어떤 주소로 들어와도 리디렉션하지 않는다.
// 소유 확인 파일·태그(네이버 메타 태그, 애드센스 메타 태그, /ads.txt)도 이 빌드 결과로 확인한다.

import { request as httpRequest } from "node:http";
import { expect, test, type Page } from "@playwright/test";
import { ADS_TXT_LINE, ADSENSE_ACCOUNT, DEFAULT_SITE_URL, NAVER_SITE_VERIFICATION } from "../lib/site";

const SITE = DEFAULT_SITE_URL; // https://www.haemongru.com
const SITE_HOST = new URL(SITE).hostname; // www.haemongru.com
const ROOT_HOST = SITE_HOST.replace(/^www\./, ""); // 루트 도메인
const VERCEL_HOST = "dream-lotto-nine.vercel.app"; // Vercel 이 주는 기본 주소 예시

/** 대표 도메인이 아닌 주소가 섞였는지 */
const FOREIGN = new RegExp(`://${ROOT_HOST.replace(/\./g, "\\.")}|vercel\\.app|localhost`);

/** Host 헤더를 바꿔서(다른 주소로 들어온 것처럼) 테스트 서버에 요청한다. 리디렉션은 따라가지 않는다. */
function requestWithHost(baseURL: string, host: string, path: string) {
  const { hostname, port } = new URL(baseURL);
  return new Promise<{ status: number; location?: string; type?: string; body: string }>((resolve, reject) => {
    const req = httpRequest({ hostname, port, path, method: "GET", headers: { host } }, (res) => {
      let body = "";
      res.setEncoding("utf8");
      res.on("data", (chunk) => (body += chunk));
      res.on("end", () =>
        resolve({ status: res.statusCode ?? 0, location: res.headers.location, type: res.headers["content-type"], body }),
      );
    });
    req.on("error", reject);
    req.end();
  });
}

/** 페이지의 canonical·OG·트위터·JSON-LD 주소를 모두 모은다. */
async function pageUrls(page: Page): Promise<string[]> {
  return page.evaluate(() => {
    const attrs = [
      ...[...document.querySelectorAll('link[rel="canonical"]')].map((el) => el.getAttribute("href")),
      ...[...document.querySelectorAll('meta[property^="og:"], meta[name^="twitter:"]')].map((el) => el.getAttribute("content")),
    ];
    const jsonLd = [...document.querySelectorAll('script[type="application/ld+json"]')].flatMap((el) => {
      const urls: string[] = [];
      JSON.stringify(JSON.parse(el.textContent ?? "null"), (key, value) => {
        if (typeof value === "string" && /^https?:\/\//.test(value) && key !== "@context") urls.push(value);
        return value;
      });
      return urls;
    });
    return [...attrs, ...jsonLd].filter((v): v is string => !!v && /^https?:\/\//.test(v));
  });
}

function expectOnSite(urls: string[]) {
  expect(urls.length).toBeGreaterThan(0);
  for (const url of urls) {
    expect(url === SITE || url.startsWith(`${SITE}/`), url).toBe(true);
    expect(url).not.toMatch(FOREIGN);
  }
}

test("canonical·OG·트위터·JSON-LD 주소가 모두 대표 도메인", async ({ page }) => {
  for (const path of ["/", "/dream", "/dream/pig", "/guide/wealth-dreams"]) {
    await page.goto(path);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", path === "/" ? SITE : `${SITE}${path}`);
    expectOnSite(await pageUrls(page));
  }
});

test("결과·공유 페이지의 대표 주소와 미리보기 이미지 주소도 대표 도메인", async ({ page, request }) => {
  const { share } = (await (await request.post("/api/interpret", { data: { dream: "돼지가 집으로 들어왔어요" } })).json()) as {
    share: string;
  };
  for (const route of ["r", "result"]) {
    await page.goto(`/${route}/${share}`);
    // 두 페이지 모두 대표 주소는 공유 주소(/r/…)
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", `${SITE}/r/${share}`);
    await expect(page.locator('meta[property="og:image"]').first()).toHaveAttribute(
      "content",
      new RegExp(`^${SITE.replace(/\./g, "\\.")}/${route}/${share}/opengraph-image`),
    );
    expectOnSite(await pageUrls(page));
  }
});

test("sitemap.xml 과 robots.txt 가 대표 도메인을 가리킨다", async ({ request }) => {
  const sitemap = await (await request.get("/sitemap.xml")).text();
  const locs = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  expect(locs.length).toBeGreaterThan(30);
  expectOnSite(locs);
  expect(sitemap).not.toMatch(FOREIGN);

  const robots = await (await request.get("/robots.txt")).text();
  expect(robots).toContain(`Sitemap: ${SITE}/sitemap.xml`);
  expect(robots).not.toMatch(FOREIGN);
});

test("vercel.app·루트·www 어느 주소로 들어와도 리디렉션 없이 canonical 은 대표 도메인", async ({ baseURL }) => {
  for (const host of [VERCEL_HOST, ROOT_HOST, SITE_HOST]) {
    const res = await requestWithHost(baseURL!, host, "/dream/pig?from=test");
    expect(res.status, host).toBe(200);
    expect(res.location, host).toBeUndefined();
    expect(res.body, host).toContain(`<link rel="canonical" href="${SITE}/dream/pig"/>`);
    expect(res.body, host).toContain(`<meta property="og:url" content="${SITE}/dream/pig"/>`);
    expect(res.body, host).not.toMatch(FOREIGN);
  }
});

test("네이버 소유 확인 태그: 홈 <head>에 정확히 한 번, 다른 페이지도 중복 없음", async ({ request }) => {
  const tag = `<meta name="naver-site-verification" content="${NAVER_SITE_VERIFICATION}"/>`;
  const count = (html: string) => html.split(tag).length - 1;

  const home = await (await request.get("/")).text();
  expect(count(home)).toBe(1);
  expect(home.indexOf(tag)).toBeLessThan(home.indexOf("</head>"));

  for (const path of ["/dream", "/dream/pig", "/guide/wealth-dreams", "/privacy"]) {
    const html = await (await request.get(path)).text();
    expect(count(html), path).toBe(1);
  }
});

test("애드센스 사이트 확인 태그: 홈 <head>에 정확히 한 번, 다른 페이지도 중복 없음", async ({ request }) => {
  const tag = `<meta name="google-adsense-account" content="${ADSENSE_ACCOUNT}"/>`;
  const count = (html: string) => html.split(tag).length - 1;

  const home = await (await request.get("/")).text();
  expect(count(home)).toBe(1);
  expect(home.indexOf(tag)).toBeLessThan(home.indexOf("</head>"));

  for (const path of ["/dream", "/dream/pig", "/guide/wealth-dreams", "/privacy"]) {
    const html = await (await request.get(path)).text();
    expect(count(html), path).toBe(1);
  }
});

test("/ads.txt: 대표 주소(www)에서 리디렉션 없이 200 과 한 줄. 루트·vercel.app 으로 들어와도 코드는 리디렉션하지 않는다", async ({
  baseURL,
}) => {
  // 실제 배포에서 루트 도메인 요청은 Vercel 이 www 로 308 리디렉션하고, 리디렉션된 www 요청을 이 응답이 받는다.
  for (const host of [SITE_HOST, ROOT_HOST, VERCEL_HOST]) {
    const res = await requestWithHost(baseURL!, host, "/ads.txt");
    expect(res.status, host).toBe(200);
    expect(res.location, host).toBeUndefined();
    expect(res.type, host).toMatch(/^text\/plain/);
    expect(res.body.split(/\r?\n/).filter(Boolean), host).toEqual([ADS_TXT_LINE]);
  }
});
