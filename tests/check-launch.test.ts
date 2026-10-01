// 출시 점검 스크립트(scripts/check-launch.ts)가 문제를 제대로 잡는지 검사한다.

import { describe, expect, it } from "vitest";
import robots from "@/app/robots";
import sitemap from "@/app/sitemap";
import { getAllGuides } from "@/lib/guides";
import { CONTACT_EMAIL, DEFAULT_SITE_URL, SITE_URL } from "@/lib/site";
import { getAllSymbols } from "@/lib/symbols";
import {
  checkBuildOutput,
  checkContactEmail,
  checkPolicyPages,
  checkRobots,
  checkSitemap,
  checkSiteUrl,
  renderPolicyPages,
  runLaunchChecks,
} from "@/scripts/check-launch";

const REAL_EMAIL = "dream@mail.kr"; // 테스트용 가짜 '실제 주소'
const REQUIRED = [
  "/",
  "/dream",
  ...getAllSymbols().map((s) => `/dream/${s.slug}`),
  "/guide",
  ...getAllGuides().map((g) => `/guide/${g.slug}`),
  "/about",
  "/privacy",
  "/terms",
  "/contact",
];

describe("문의 메일", () => {
  it("자리표시자·빈 값·형식 오류를 잡는다", () => {
    expect(checkContactEmail("contact@example.com")).toHaveLength(1);
    expect(checkContactEmail("")).toHaveLength(1);
    expect(checkContactEmail("메일주소")).toHaveLength(1);
    expect(checkContactEmail(REAL_EMAIL)).toEqual([]);
  });
});

describe("정책 문구", () => {
  it("지금 정책 페이지는 문의 메일만 바꾸면 통과한다 (애드센스·쿠키·맞춤 광고·미저장·접속 기록·문의처)", async () => {
    const pages = (await renderPolicyPages()).map((p) => ({ ...p, text: p.text.replaceAll(CONTACT_EMAIL, REAL_EMAIL) }));
    expect(checkPolicyPages(pages, REAL_EMAIL)).toEqual([]);
  });

  it("빈 문구·자리표시자·빠진 고지를 잡는다", () => {
    const problems = checkPolicyPages(
      [
        { name: "privacy", path: "/privacy", text: "TODO" },
        { name: "terms", path: "/terms", text: "" },
        { name: "about", path: "/about", text: "소개 ".repeat(100) },
      ],
      REAL_EMAIL,
    );
    expect(problems.join("\n")).toMatch(/\/privacy 문구가 너무 짧아요/);
    expect(problems.join("\n")).toMatch(/\/privacy 에 자리표시자가 남아 있어요: "TODO"/);
    expect(problems.join("\n")).toMatch(/애드센스 고지/);
    expect(problems.join("\n")).toMatch(/\/terms 에 꼭 필요한 내용이 없어요: 구매 연령/);
    expect(problems.join("\n")).toMatch(/\/about 에 꼭 필요한 내용이 없어요: 재미용 고지/);
    expect(problems.join("\n")).toMatch(/정책 페이지가 없어요: \/contact/);
  });
});

describe("사이트 주소", () => {
  it("대표 도메인이면 통과, 다르거나 임시 주소면 실패", () => {
    expect(checkSiteUrl(DEFAULT_SITE_URL, DEFAULT_SITE_URL)).toEqual([]);
    expect(checkSiteUrl("https://dream-lotto-nine.vercel.app", DEFAULT_SITE_URL, "https://dream-lotto-nine.vercel.app")).toHaveLength(2);
    expect(checkSiteUrl("http://localhost:3000", DEFAULT_SITE_URL)).toHaveLength(3);
  });
});

describe("robots.txt · sitemap.xml", () => {
  it("지금 설정은 통과한다", () => {
    expect(checkRobots(robots(), SITE_URL)).toEqual([]);
    expect(checkSitemap(sitemap(), SITE_URL, REQUIRED)).toEqual([]);
  });

  it("전체 차단, 다른 sitemap 주소를 잡는다", () => {
    expect(checkRobots({ rules: { userAgent: "*", disallow: "/" }, sitemap: "https://other.example.org/sitemap.xml" }, SITE_URL)).toHaveLength(2);
  });

  it("다른 도메인, 공유 링크, 중복, 빠진 페이지, 이상한 날짜를 잡는다", () => {
    const entries = [
      { url: `${SITE_URL}/`, lastModified: "2026-10-01" },
      { url: `${SITE_URL}/`, lastModified: "2026-10-01" },
      { url: "https://dream-lotto-nine.vercel.app/dream", lastModified: "2026-10-01" },
      { url: `${SITE_URL}/r/abc`, lastModified: "2026-10-01" },
      { url: `${SITE_URL}/guide`, lastModified: "not-a-date" },
    ];
    const text = checkSitemap(entries, SITE_URL, ["/", "/dream", "/privacy"]).join("\n");
    expect(text).toMatch(/다른 주소가 섞여 있어요: https:\/\/dream-lotto-nine\.vercel\.app\/dream/);
    expect(text).toMatch(/넣으면 안 되는 주소가 있어요: .*\/r\/abc/);
    expect(text).toMatch(/같은 주소가 두 번/);
    expect(text).toMatch(/빠진 페이지가 있어요: \/dream, \/privacy/);
    expect(text).toMatch(/lastmod 가 이상해요/);
  });

  it("빌드 결과가 없으면 빌드 검사는 건너뛴다", () => {
    expect(checkBuildOutput("no-such-dir", SITE_URL)).toEqual([]);
  });
});

describe("전체 점검 (npm run check:launch)", () => {
  it("지금 설정은 모두 통과한다 (빌드 결과 검사는 .next 상태에 따라 달라서 제외)", async () => {
    const problems = await runLaunchChecks();
    expect(problems.filter(([area]) => area !== "빌드 결과")).toEqual([]);
  });
});
