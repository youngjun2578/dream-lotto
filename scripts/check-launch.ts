// 출시 전 점검: npm run check:launch
// 아래 항목을 검사해서 하나라도 걸리면 목록을 보여 주고 실패(종료 코드 1)한다.
//   1) 문의 메일이 자리표시자(contact@example.com 등)인지
//   2) 정책 페이지(소개·개인정보처리방침·이용약관·문의)가 비었거나 자리표시자가 남았는지, 꼭 필요한 내용이 있는지
//   3) 사이트 주소(SITE_URL)가 대표 도메인과 다른지 (vercel.app·localhost·http 포함)
//   4) robots.txt·sitemap.xml 이 이상한지 (주소, 빠진 페이지, 중복, /api·공유 링크 포함 등)
//   5) 빌드 결과(.next)가 있으면, 그 안의 robots·sitemap·canonical 주소가 지금 설정과 같은지,
//      홈 HTML 의 <head> 에 네이버 소유 확인 태그가 정확히 한 번 있는지
// 빌드 없이도 돌아간다. (빌드 결과 검사는 .next 가 있을 때만)

import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import type { MetadataRoute } from "next";
import { createElement, type ComponentType } from "react";
import { renderToStaticMarkup } from "react-dom/server";

export interface PolicyPage {
  name: string;
  path: string;
  text: string;
}

/** 화면에 보이면 안 되는 자리표시자 */
export const PLACEHOLDER_PATTERN = /TODO|TBD|FIXME|lorem ipsum|OOO|○○|XXX|example\.(com|org|net)|\[(회사|운영자|이름|주소|이메일)[^\]]*\]/i;

/** 1) 문의 메일 */
export function checkContactEmail(email: string): string[] {
  const value = email.trim();
  if (!value) return ["문의 메일(CONTACT_EMAIL)이 비어 있어요. lib/site.ts 에 실제 주소를 넣어 주세요."];
  const problems: string[] = [];
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) problems.push(`문의 메일 형식이 이상해요: ${value}`);
  if (/@(example\.(com|org|net)|test\.|localhost)|^(your|test|placeholder|todo|admin@admin)/i.test(value)) {
    problems.push(`문의 메일이 자리표시자예요: ${value} → lib/site.ts 의 CONTACT_EMAIL 을 실제 주소로 바꿔 주세요.`);
  }
  return problems;
}

/** 2) 정책 페이지 문구: [페이지 이름, 최소 글자 수, 꼭 들어갈 말(정규식)] */
export const POLICY_RULES: Record<string, { minLength: number; required: [string, RegExp][] }> = {
  privacy: {
    minLength: 1200,
    required: [
      ["애드센스 고지", /애드센스/],
      ["쿠키 고지", /쿠키/],
      ["맞춤 광고 고지", /맞춤 광고/],
      ["맞춤 광고 끄는 방법", /Google 광고 설정/],
      ["꿈 내용 미저장", /저장하지 않/],
      ["호스팅 접속 기록", /접속 기록/],
      ["문의처", /문의/],
    ],
  },
  terms: { minLength: 400, required: [["당첨 보장 없음", /보장하지 않/], ["구매 연령", /만 19세/]] },
  about: { minLength: 300, required: [["재미용 고지", /재미/]] },
  contact: { minLength: 80, required: [["문의 메일", /@/]] },
};

export function checkPolicyPages(pages: PolicyPage[], contactEmail: string): string[] {
  const problems: string[] = [];
  for (const [name, rule] of Object.entries(POLICY_RULES)) {
    const page = pages.find((p) => p.name === name);
    if (!page) {
      problems.push(`정책 페이지가 없어요: /${name}`);
      continue;
    }
    if (page.text.length < rule.minLength) {
      problems.push(`${page.path} 문구가 너무 짧아요 (${page.text.length}자, 최소 ${rule.minLength}자).`);
    }
    const placeholder = page.text.match(PLACEHOLDER_PATTERN);
    if (placeholder) problems.push(`${page.path} 에 자리표시자가 남아 있어요: "${placeholder[0]}"`);
    for (const [label, re] of rule.required) {
      if (!re.test(page.text)) problems.push(`${page.path} 에 꼭 필요한 내용이 없어요: ${label}`);
    }
  }
  const privacy = pages.find((p) => p.name === "privacy");
  if (privacy && contactEmail && !privacy.text.includes(contactEmail)) {
    problems.push("/privacy 에 문의 메일이 보이지 않아요.");
  }
  return problems;
}

/** 3) 사이트 주소 */
export function checkSiteUrl(siteUrl: string, expected: string, envValue?: string): string[] {
  const problems: string[] = [];
  if (siteUrl !== expected) {
    problems.push(
      `사이트 주소가 대표 도메인과 달라요: ${siteUrl} (대표: ${expected})` +
        (envValue ? ` — 환경변수 NEXT_PUBLIC_SITE_URL="${envValue}" 를 지우거나 고쳐 주세요.` : ""),
    );
  }
  if (!siteUrl.startsWith("https://")) problems.push(`사이트 주소가 https 가 아니에요: ${siteUrl}`);
  if (/localhost|127\.0\.0\.1|vercel\.app/i.test(siteUrl)) problems.push(`사이트 주소가 임시 주소예요: ${siteUrl}`);
  if (siteUrl.endsWith("/")) problems.push(`사이트 주소 끝에 슬래시가 있어요: ${siteUrl}`);
  return problems;
}

/** 4-1) robots.txt */
export function checkRobots(robots: MetadataRoute.Robots, siteUrl: string): string[] {
  const problems: string[] = [];
  const sitemaps = [robots.sitemap ?? []].flat();
  if (!sitemaps.includes(`${siteUrl}/sitemap.xml`)) {
    problems.push(`robots.txt 의 Sitemap 주소가 ${siteUrl}/sitemap.xml 이 아니에요: ${sitemaps.join(", ") || "(없음)"}`);
  }
  const rules = [robots.rules].flat();
  const forAll = rules.filter((r) => [r.userAgent ?? []].flat().includes("*"));
  if (forAll.length === 0) problems.push("robots.txt 에 모든 검색엔진(User-Agent: *) 규칙이 없어요.");
  for (const rule of forAll) {
    if ([rule.disallow ?? []].flat().includes("/")) problems.push("robots.txt 가 사이트 전체를 막고 있어요 (Disallow: /).");
  }
  return problems;
}

/** 4-2) sitemap.xml */
export function checkSitemap(entries: MetadataRoute.Sitemap, siteUrl: string, requiredPaths: string[]): string[] {
  const problems: string[] = [];
  if (entries.length === 0) return ["sitemap.xml 이 비어 있어요."];
  const urls = entries.map((e) => e.url);
  for (const url of urls) {
    if (url !== siteUrl && !url.startsWith(`${siteUrl}/`)) problems.push(`sitemap 에 다른 주소가 섞여 있어요: ${url}`);
    if (/\/(api|r)\//.test(new URL(url).pathname + "/")) problems.push(`sitemap 에 넣으면 안 되는 주소가 있어요: ${url}`);
  }
  const dups = urls.filter((u, i) => urls.indexOf(u) !== i);
  if (dups.length) problems.push(`sitemap 에 같은 주소가 두 번 있어요: ${[...new Set(dups)].join(", ")}`);
  // 다른 도메인 주소는 그 페이지가 있는 것으로 치지 않는다.
  const paths = new Set(urls.filter((u) => u === siteUrl || u.startsWith(`${siteUrl}/`)).map((u) => new URL(u).pathname));
  const missing = requiredPaths.filter((p) => !paths.has(p));
  if (missing.length) problems.push(`sitemap 에 빠진 페이지가 있어요: ${missing.join(", ")}`);
  for (const e of entries) {
    const date = e.lastModified ? new Date(e.lastModified) : null;
    if (!date || Number.isNaN(date.getTime())) problems.push(`sitemap lastmod 가 이상해요: ${e.url}`);
    else if (date.getTime() > Date.now() + 24 * 3600 * 1000) problems.push(`sitemap lastmod 가 미래 날짜예요: ${e.url}`);
  }
  return problems;
}

/**
 * 빌드된 HTML 에서 네이버 소유 확인 태그 검사: <head> 안에 정확히 한 번, 값이 맞는지.
 * (RSC 데이터 안의 JSON 이 아니라 실제 <meta> 태그만 센다)
 */
export function checkNaverVerificationTag(html: string, expected: string): string[] {
  const tags = [...html.matchAll(/<meta\b[^>]*\bname="naver-site-verification"[^>]*>/g)];
  if (tags.length !== 1) return [`네이버 소유 확인 태그가 ${tags.length}개 있어요. 홈 <head> 에 정확히 1개여야 해요.`];
  const problems: string[] = [];
  const content = tags[0][0].match(/\bcontent="([^"]*)"/)?.[1];
  if (content !== expected) problems.push(`네이버 소유 확인 값이 달라요: ${content ?? "(없음)"} (기대: ${expected})`);
  const headEnd = html.indexOf("</head>");
  if (headEnd === -1 || (tags[0].index ?? 0) > headEnd) problems.push("네이버 소유 확인 태그가 <head> 밖에 있어요.");
  return problems;
}

/** 5) 빌드 결과가 지금 설정과 맞는지 (.next 가 있을 때만) */
export function checkBuildOutput(nextDir: string, siteUrl: string, naverVerification?: string): string[] {
  const app = join(nextDir, "server", "app");
  if (!existsSync(join(nextDir, "BUILD_ID")) || !existsSync(app)) return [];
  const problems: string[] = [];
  const read = (file: string) => (existsSync(join(app, file)) ? readFileSync(join(app, file), "utf8") : null);
  const robots = read("robots.txt.body");
  if (robots !== null && !robots.includes(`Sitemap: ${siteUrl}/sitemap.xml`)) {
    problems.push("빌드된 robots.txt 의 주소가 지금 설정과 달라요. 다시 빌드해 주세요 (npm run build).");
  }
  const sitemap = read("sitemap.xml.body");
  if (sitemap !== null) {
    const foreign = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]).filter((u) => !u.startsWith(siteUrl));
    if (foreign.length) problems.push(`빌드된 sitemap.xml 에 다른 주소가 있어요 (예: ${foreign[0]}). 다시 빌드해 주세요.`);
  }
  for (const [file, path] of [["index.html", ""], ["privacy.html", "/privacy"], ["dream/pig.html", "/dream/pig"]]) {
    const html = read(file);
    if (html === null) continue;
    const canonical = html.match(/<link rel="canonical" href="([^"]+)"/)?.[1];
    if (canonical !== `${siteUrl}${path}`) {
      problems.push(`빌드된 ${file} 의 canonical 이 ${canonical ?? "(없음)"} 이에요 (기대: ${siteUrl}${path}). 다시 빌드해 주세요.`);
    }
  }
  const home = read("index.html");
  if (naverVerification && home !== null) {
    problems.push(...checkNaverVerificationTag(home, naverVerification).map((p) => `빌드된 index.html: ${p}`));
  }
  return problems;
}

/** 정책 페이지를 실제로 그려서(서버 렌더링) 화면에 보이는 글만 뽑는다. */
export async function renderPolicyPages(): Promise<PolicyPage[]> {
  const pages: PolicyPage[] = [];
  for (const name of Object.keys(POLICY_RULES)) {
    const mod = (await import(/* @vite-ignore */ `../app/${name}/page`)) as { default: ComponentType };
    const html = renderToStaticMarkup(createElement(mod.default));
    const text = html
      .replace(/<[^>]+>/g, " ")
      .replace(/&lsquo;|&rsquo;/g, "'")
      .replace(/&[a-z]+;|&#\d+;/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    pages.push({ name, path: `/${name}`, text });
  }
  return pages;
}

/** 전체 점검: [분야, 문제] 목록 */
export async function runLaunchChecks(): Promise<[string, string][]> {
  const { CONTACT_EMAIL, DEFAULT_SITE_URL, NAVER_SITE_VERIFICATION, SITE_URL } = await import("../lib/site");
  const { default: robots } = await import("../app/robots");
  const { default: sitemap } = await import("../app/sitemap");
  const { getAllSymbols } = await import("../lib/symbols");
  const { getAllGuides } = await import("../lib/guides");
  const { CATEGORY_INFO, categoryPath } = await import("../lib/categories");

  const requiredPaths = [
    "/",
    "/dream",
    ...CATEGORY_INFO.map((c) => categoryPath(c.name)),
    ...getAllSymbols().map((s) => `/dream/${s.slug}`),
    "/guide",
    ...getAllGuides().map((g) => `/guide/${g.slug}`),
    "/about",
    "/privacy",
    "/terms",
    "/contact",
  ];
  const tag = (area: string, list: string[]) => list.map((p): [string, string] => [area, p]);
  return [
    ...tag("문의 메일", checkContactEmail(CONTACT_EMAIL)),
    ...tag("정책 문구", checkPolicyPages(await renderPolicyPages(), CONTACT_EMAIL)),
    ...tag("사이트 주소", checkSiteUrl(SITE_URL, DEFAULT_SITE_URL, process.env.NEXT_PUBLIC_SITE_URL)),
    ...tag("robots.txt", checkRobots(robots(), SITE_URL)),
    ...tag("sitemap.xml", checkSitemap(sitemap(), SITE_URL, requiredPaths)),
    ...tag("빌드 결과", checkBuildOutput(".next", SITE_URL, NAVER_SITE_VERIFICATION)),
  ];
}

async function main() {
  const problems = await runLaunchChecks();
  if (problems.length === 0) {
    console.log("✅ 출시 점검 통과: 문의 메일, 정책 문구, 사이트 주소, robots.txt, sitemap.xml 모두 이상 없어요.");
    return;
  }
  console.error(`❌ 출시 전에 고칠 것 ${problems.length}개:`);
  for (const [area, message] of problems) console.error(`  - [${area}] ${message}`);
  process.exitCode = 1;
}

// npm run check:launch 로 직접 실행했을 때만 점검한다. (테스트에서 import 할 때는 실행하지 않음)
if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
