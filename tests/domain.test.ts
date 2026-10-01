// 도메인: 대표 주소는 https://www.haemongru.com 이고 lib/site.ts 한 곳에서만 정한다.
// 루트 도메인 → www 리디렉션은 Vercel 대시보드가 처리하므로, 코드에는 리디렉션이 없어야 한다.

import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import nextConfig from "@/next.config";
import { DEFAULT_SITE_URL, normalizeSiteUrl } from "@/lib/site";

const SITE = "https://www.haemongru.com";

/** 객체 안의 모든 주소 문자열 (schema.org 의 @context 는 빼고) */
function urlsIn(value: unknown): string[] {
  if (typeof value === "string") return /^https?:\/\//.test(value) && !value.startsWith("https://schema.org") ? [value] : [];
  if (Array.isArray(value)) return value.flatMap(urlsIn);
  if (value instanceof URL) return [value.href];
  if (value && typeof value === "object") return Object.values(value).flatMap(urlsIn);
  return [];
}

/** 모든 주소가 대표 도메인으로 시작하고, 루트 도메인·vercel.app 주소가 섞이지 않았는지 */
function expectOnSiteDomain(urls: string[]) {
  expect(urls.length).toBeGreaterThan(0);
  for (const url of urls) {
    expect(url === SITE || url.startsWith(`${SITE}/`), url).toBe(true);
    expect(url, url).not.toMatch(/:\/\/haemongru\.com|vercel\.app|localhost/);
  }
}

/** 환경변수를 바꾼 상태로 사이트 관련 모듈을 새로 불러온다. */
async function loadWith(env: Record<string, string>) {
  for (const [key, value] of Object.entries(env)) vi.stubEnv(key, value);
  vi.resetModules();
  const [site, seo, robots, sitemap, layout] = await Promise.all([
    import("@/lib/site"),
    import("@/lib/seo"),
    import("@/app/robots"),
    import("@/app/sitemap"),
    import("@/app/layout"),
  ]);
  return { site, seo, robots: robots.default, sitemap: sitemap.default, layoutMetadata: layout.metadata };
}

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe("사이트 주소 (lib/site.ts)", () => {
  it("대표 도메인은 www 가 붙은 https://www.haemongru.com", () => {
    expect(DEFAULT_SITE_URL).toBe(SITE);
    expect(normalizeSiteUrl(undefined)).toBe(SITE);
    expect(normalizeSiteUrl("   ")).toBe(SITE);
  });

  it("환경변수 값은 끝 슬래시 없이 https://도메인 형태로 다듬는다", () => {
    expect(normalizeSiteUrl("https://www.haemongru.com/")).toBe(SITE);
    expect(normalizeSiteUrl("https://www.haemongru.com///")).toBe(SITE);
    expect(normalizeSiteUrl("www.haemongru.com")).toBe(SITE);
    expect(normalizeSiteUrl("https://WWW.HaemongRu.com/dream?x=1")).toBe(SITE);
    expect(normalizeSiteUrl("http://localhost:3000/")).toBe("http://localhost:3000");
  });

  it("metadataBase·canonical·OG·Twitter·sitemap·robots·JSON-LD(url, @id)가 모두 대표 도메인", async () => {
    const { site, seo, robots, sitemap, layoutMetadata } = await loadWith({ NEXT_PUBLIC_SITE_URL: "" });
    expect(site.SITE_URL).toBe(SITE);
    expect(String(layoutMetadata.metadataBase)).toBe(`${SITE}/`);

    const meta = seo.pageMetadata({ title: "t", description: "d", path: "/dream/pig" });
    expect(meta.alternates?.canonical).toBe(`${SITE}/dream/pig`);
    expect(meta.openGraph).toMatchObject({ url: `${SITE}/dream/pig` });
    expectOnSiteDomain([...urlsIn(layoutMetadata), ...urlsIn(meta), ...urlsIn(seo.pageMetadata({ title: "t", description: "d", path: "/r/x", ownImage: true }))]);

    expect(robots().sitemap).toBe(`${SITE}/sitemap.xml`);
    expectOnSiteDomain(urlsIn(robots()));
    expectOnSiteDomain(sitemap().map((e) => e.url));

    const jsonLd = [
      seo.websiteJsonLd(),
      seo.articleJsonLd({ title: "t", description: "d", path: "/guide/x" }),
      seo.breadcrumbJsonLd([{ name: "홈", path: "/" }, { name: "돼지", path: "/dream/pig" }]),
      seo.dreamListJsonLd([]),
    ];
    expect(jsonLd.map((d) => d["@id"])).toEqual([
      `${SITE}/#website`,
      `${SITE}/guide/x#article`,
      `${SITE}/dream/pig#breadcrumb`,
      `${SITE}/dream#collection`,
    ]);
    expectOnSiteDomain(urlsIn(jsonLd));
  });

  it("vercel.app 주소로 배포·접속해도 사이트 주소는 바뀌지 않는다 (Vercel 이 넣는 환경변수 무시)", async () => {
    const { site, seo } = await loadWith({
      NEXT_PUBLIC_SITE_URL: "",
      VERCEL_URL: "dream-lotto-nine.vercel.app",
      VERCEL_BRANCH_URL: "dream-lotto-git-main.vercel.app",
      VERCEL_PROJECT_PRODUCTION_URL: "dream-lotto-nine.vercel.app",
      NEXT_PUBLIC_VERCEL_URL: "dream-lotto-nine.vercel.app",
    });
    expect(site.SITE_URL).toBe(SITE);
    expect(seo.pageMetadata({ title: "t", description: "d", path: "/dream/pig" }).alternates?.canonical).toBe(
      `${SITE}/dream/pig`,
    );
  });

  it("NEXT_PUBLIC_SITE_URL 로 덮어쓸 수 있다 (끝 슬래시 제거)", async () => {
    const { site } = await loadWith({ NEXT_PUBLIC_SITE_URL: "https://preview.example.org/" });
    expect(site.SITE_URL).toBe("https://preview.example.org");
    expect(site.absoluteUrl("/r/abc")).toBe("https://preview.example.org/r/abc");
  });
});

describe("리디렉션은 코드에 두지 않는다 (Vercel 대시보드와 겹치면 루프 위험)", () => {
  it("next.config.ts 에 redirects 가 없다", async () => {
    const redirects = nextConfig.redirects ? await nextConfig.redirects() : [];
    expect(redirects).toEqual([]);
  });

  it("middleware / proxy 파일이 없다", () => {
    const candidates = ["middleware", "proxy"].flatMap((name) =>
      ["", "src/"].flatMap((dir) => ["ts", "tsx", "js", "mjs"].map((ext) => `${dir}${name}.${ext}`)),
    );
    expect(candidates.filter((file) => existsSync(file))).toEqual([]);
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

  // lib/site.ts: 대표 주소를 정하는 곳 / scripts/check-launch.ts: 잘못된 주소를 '찾아내는' 검사 패턴
  const ALLOWED = [join("lib", "site.ts"), join("scripts", "check-launch.ts")];

  it("haemongru·vercel.app·localhost 주소는 lib/site.ts 에만 있다", () => {
    const files = [...["app", "components", "lib", "data", "scripts"].flatMap(sourceFiles), "next.config.ts"];
    const found = files
      .filter((file) => !ALLOWED.includes(file))
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
