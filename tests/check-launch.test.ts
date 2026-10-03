// 출시 점검 스크립트(scripts/check-launch.ts)가 문제를 제대로 잡는지 검사한다.

import { describe, expect, it } from "vitest";
import robots from "@/app/robots";
import sitemap from "@/app/sitemap";
import { getAllGuides } from "@/lib/guides";
import { CONTACT_EMAIL, DEFAULT_SITE_URL, OPERATOR_NAME, PRIVACY_OFFICER_NAME, SITE_URL } from "@/lib/site";
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
/** 지금 운영자 정보에서 메일만 테스트용 주소로 바꾼 값 */
const CONTACT = { email: REAL_EMAIL, operator: OPERATOR_NAME, officer: PRIVACY_OFFICER_NAME };
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
  it("지금 정책 페이지는 문의 메일만 바꾸면 통과한다 (필수 고지, 운영자 이름, 보호책임자, 메일, 전화번호 없음)", async () => {
    const pages = (await renderPolicyPages()).map((p) => ({ ...p, text: p.text.replaceAll(CONTACT_EMAIL, REAL_EMAIL) }));
    expect(checkPolicyPages(pages, CONTACT)).toEqual([]);
  });

  it("빈 문구·자리표시자·빠진 고지를 잡는다", () => {
    const problems = checkPolicyPages(
      [
        { name: "privacy", path: "/privacy", text: "TODO" },
        { name: "terms", path: "/terms", text: "" },
        { name: "about", path: "/about", text: "소개 ".repeat(100) },
      ],
      CONTACT,
    );
    expect(problems.join("\n")).toMatch(/\/privacy 문구가 너무 짧아요/);
    expect(problems.join("\n")).toMatch(/\/privacy 에 자리표시자가 남아 있어요: "TODO"/);
    expect(problems.join("\n")).toMatch(/애드센스 고지/);
    expect(problems.join("\n")).toMatch(/\/terms 에 꼭 필요한 내용이 없어요: 구매 연령/);
    expect(problems.join("\n")).toMatch(/\/about 에 꼭 필요한 내용이 없어요: 재미용 고지/);
    expect(problems.join("\n")).toMatch(/정책 페이지가 없어요: \/contact/);
    expect(problems.join("\n")).toMatch(/\/privacy 에 꼭 필요한 내용이 없어요: 국외 이전/);
    // 2026-10-03: 한눈에 보기의 꿈 내용 전송 안내, 15번 변경 공지의 두 갈래(중요한 변경 7일 전 / 그 밖에는 시행일과 함께)
    expect(problems.join("\n")).toMatch(/\/privacy 에 꼭 필요한 내용이 없어요: 꿈 내용 서버 전송 안내/);
    expect(problems.join("\n")).toMatch(/\/privacy 에 꼭 필요한 내용이 없어요: 변경 공지: 중요한 변경은 시행 7일 전/);
    expect(problems.join("\n")).toMatch(/\/privacy 에 꼭 필요한 내용이 없어요: 변경 공지: 그 밖의 수정은 시행일과 함께/);
    expect(problems.join("\n")).toMatch(/\/privacy 에 개인정보 보호책임자 이름이 보이지 않아요/);
    expect(problems.join("\n")).toMatch(/\/terms 에 운영자 이름이 보이지 않아요/);
  });

  it("전화번호, 문의 메일과 다른 메일 주소를 잡는다 (공공기관 대표번호와 다른 업체의 개인정보 문의처는 괜찮다)", async () => {
    const pages = (await renderPolicyPages()).map((p) =>
      p.name === "contact" ? { ...p, text: `${p.text} 전화 010-1234-5678 / old@mail.kr` } : p,
    );
    const problems = checkPolicyPages(pages, { email: CONTACT_EMAIL, operator: OPERATOR_NAME, officer: PRIVACY_OFFICER_NAME });
    expect(problems).toEqual([
      '/contact 에 전화번호가 있어요: "010-1234-5678" (연락처는 메일만 공개해요)',
      "/contact 의 메일 주소가 문의 메일과 달라요: old@mail.kr (lib/site.ts 의 CONTACT_EMAIL 을 쓰세요)",
    ]);
    for (const phone of ["02-123-4567", "031 1234 5678", "+82 10 1234 5678", "(02)1234-5678"]) {
      expect(checkPolicyPages([{ name: "about", path: "/about", text: `재미 ${phone} ${OPERATOR_NAME}`.padEnd(300, "가") }], CONTACT).join(), phone).toMatch(/전화번호가 있어요/);
    }
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
