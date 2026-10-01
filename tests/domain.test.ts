// 도메인 정리: 사이트 주소는 lib/site.ts 한 곳에서만 정하고, 모든 절대 주소가 대표 도메인을 가리킨다.

import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import nextConfig from "@/next.config";
import { DEFAULT_SITE_URL, normalizeSiteUrl, wwwRedirects } from "@/lib/site";

const APEX = "https://haemongru.com";

/** 환경변수를 비운 상태(= 실제 배포 기본값)로 모듈을 새로 불러온다. */
async function loadWithDefaultEnv() {
  vi.stubEnv("NEXT_PUBLIC_SITE_URL", "");
  vi.resetModules();
  const [site, seo, robots, sitemap] = await Promise.all([
    import("@/lib/site"),
    import("@/lib/seo"),
    import("@/app/robots"),
    import("@/app/sitemap"),
  ]);
  return { site, seo, robots: robots.default, sitemap: sitemap.default };
}

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe("사이트 주소 (lib/site.ts)", () => {
  it("대표 도메인은 www 없는 https://haemongru.com", () => {
    expect(DEFAULT_SITE_URL).toBe(APEX);
    expect(normalizeSiteUrl(undefined)).toBe(APEX);
    expect(normalizeSiteUrl("   ")).toBe(APEX);
  });

  it("환경변수 값은 https://도메인 형태로 다듬는다", () => {
    expect(normalizeSiteUrl("https://haemongru.com/")).toBe(APEX);
    expect(normalizeSiteUrl("haemongru.com")).toBe(APEX);
    expect(normalizeSiteUrl("https://HaemongRu.com/dream?x=1")).toBe(APEX);
    expect(normalizeSiteUrl("http://localhost:3000")).toBe("http://localhost:3000");
  });

  it("환경변수가 없으면 canonical·OG·sitemap·robots·JSON-LD 가 모두 대표 도메인을 쓴다", async () => {
    const { site, seo, robots, sitemap } = await loadWithDefaultEnv();
    expect(site.SITE_URL).toBe(APEX);

    const meta = seo.pageMetadata({ title: "t", description: "d", path: "/dream/pig" });
    expect(meta.alternates?.canonical).toBe(`${APEX}/dream/pig`);
    expect(meta.openGraph).toMatchObject({ url: `${APEX}/dream/pig`, images: [{ url: `${APEX}/opengraph-image` }] });
    expect(meta.twitter).toMatchObject({ images: [`${APEX}/opengraph-image`] });

    expect(robots().sitemap).toBe(`${APEX}/sitemap.xml`);
    const urls = sitemap().map((e) => e.url);
    expect(urls.length).toBeGreaterThan(30);
    for (const url of urls) expect(url.startsWith(`${APEX}/`)).toBe(true);

    expect(seo.websiteJsonLd().url).toBe(`${APEX}/`);
    expect(seo.articleJsonLd({ title: "t", description: "d", path: "/guide/x" })).toMatchObject({
      url: `${APEX}/guide/x`,
      mainEntityOfPage: `${APEX}/guide/x`,
      image: `${APEX}/guide/x/opengraph-image`,
    });
  });

  it("NEXT_PUBLIC_SITE_URL 로 덮어쓸 수 있다", async () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://preview.example.org/");
    vi.resetModules();
    const site = await import("@/lib/site");
    expect(site.SITE_URL).toBe("https://preview.example.org");
    expect(site.absoluteUrl("/r/abc")).toBe("https://preview.example.org/r/abc");
  });
});

describe("www → 대표 도메인 리디렉션 (next.config.ts)", () => {
  it("www.haemongru.com 의 모든 경로를 같은 경로로 308 이동", () => {
    expect(wwwRedirects(APEX)).toEqual([
      {
        source: "/:path*",
        has: [{ type: "host", value: "www\\.haemongru\\.com" }],
        destination: `${APEX}/:path*`,
        permanent: true,
      },
    ]);
  });

  it("next.config.ts 가 이 규칙을 그대로 쓴다", async () => {
    expect(await nextConfig.redirects!()).toEqual(wwwRedirects());
  });

  it("루프가 생기지 않는다: 대표 도메인 요청은 규칙에 걸리지 않는다", () => {
    const [rule] = wwwRedirects(APEX);
    // Next.js 는 host 조건을 ^값$ 정규식으로 비교한다 (포트는 떼고 소문자로).
    const matches = (host: string) => new RegExp(`^${rule.has[0].value}$`).test(host);
    expect(matches("www.haemongru.com")).toBe(true);
    expect(matches("haemongru.com")).toBe(false);
    expect(matches(new URL(rule.destination.replace("/:path*", "/")).hostname)).toBe(false);
    expect(matches("wwwxhaemongruxcom")).toBe(false);
  });

  it("대표 주소가 www 이거나 로컬 주소면 규칙을 만들지 않는다", () => {
    expect(wwwRedirects("https://www.example.org")).toEqual([]);
    expect(wwwRedirects("http://localhost:3000")).toEqual([]);
  });
});

describe("하드코딩된 도메인", () => {
  /** 화면·설정 코드에서 사이트 주소를 직접 적은 곳이 있는지 찾는다. (lib/site.ts 만 허용) */
  function sourceFiles(dir: string): string[] {
    return readdirSync(dir).flatMap((name) => {
      const path = join(dir, name);
      if (statSync(path).isDirectory()) return sourceFiles(path);
      return /\.(ts|tsx|js|mjs|css|json)$/.test(name) ? [path] : [];
    });
  }

  it("haemongru·vercel.app·localhost 주소는 lib/site.ts 에만 있다", () => {
    const files = [...["app", "components", "lib", "data"].flatMap(sourceFiles), "next.config.ts"];
    const found = files
      .filter((file) => file !== join("lib", "site.ts"))
      .flatMap((file) =>
        readFileSync(file, "utf8")
          .split("\n")
          .map((line, i) => ({ where: `${file}:${i + 1}`, line }))
          .filter(({ line }) => /haemongru|vercel\.app|localhost|127\.0\.0\.1/i.test(line)),
      )
      .map(({ where }) => where);
    expect(found).toEqual([]);
  });
});
