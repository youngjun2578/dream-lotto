// 개인정보처리방침과 실제 코드가 서로 맞는지 (2026-10-01 처리방침 개정)
// - 운영자 이름·문의 메일은 lib/site.ts 한 곳에서만 정하고, 정책 페이지가 가져다 쓴다.
// - 전화번호는 사이트 어디에도 넣지 않는다.
// - 처리방침에 적은 저장소 이름·보유 기간·광고 상태가 코드와 같다.
// 브라우저에서 실제로 나가는 요청·쿠키·저장소는 e2e/privacy.spec.ts 에서 확인한다.

import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { CONTACT_EMAIL, INQUIRY_RETENTION, OPERATOR_NAME, PRIVACY_OFFICER_NAME } from "@/lib/site";
import { PHONE_PATTERN, renderPolicyPages } from "@/scripts/check-launch";

function files(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return files(path);
    return /\.(ts|tsx|js|mjs|css|json)$/.test(name) ? [path] : [];
  });
}
/** 사이트를 이루는 코드·데이터 (테스트 제외) */
const SITE_FILES = ["app", "components", "lib", "data", "scripts", "e2e"].flatMap(files);
const read = (file: string) => readFileSync(file, "utf8");
const filesContaining = (needle: string | RegExp) =>
  SITE_FILES.filter((file) => (typeof needle === "string" ? read(file).includes(needle) : needle.test(read(file))));

const pages = await renderPolicyPages();
const page = (name: string) => pages.find((p) => p.name === name)!.text;

describe("운영자 정보", () => {
  it("운영자 겸 개인정보 보호책임자는 서영준, 연락처는 메일만", () => {
    expect(OPERATOR_NAME).toBe("서영준");
    expect(PRIVACY_OFFICER_NAME).toBe(OPERATOR_NAME);
    expect(CONTACT_EMAIL).toBe("young@haemongru.com");
  });

  it("이름과 메일 주소 글자는 lib/site.ts 에만 있다 (페이지는 상수를 가져다 쓴다)", () => {
    expect(filesContaining(OPERATOR_NAME)).toEqual([join("lib", "site.ts")]);
    expect(filesContaining(CONTACT_EMAIL)).toEqual([join("lib", "site.ts")]);
  });

  it("개인정보처리방침·이용약관·문의·소개가 같은 이름과 메일을 보여 준다", () => {
    expect(page("privacy")).toContain(`개인정보 보호책임자: ${PRIVACY_OFFICER_NAME}`);
    expect(page("contact")).toContain(`개인정보 보호책임자: ${PRIVACY_OFFICER_NAME}`);
    for (const name of ["privacy", "terms", "contact", "about"]) {
      expect(page(name), name).toContain(OPERATOR_NAME);
      expect(page(name), name).toContain(CONTACT_EMAIL);
    }
  });

  it("사이트 코드·데이터와 정책 페이지에 전화번호가 없다", () => {
    // 검사 규칙을 정의한 파일(정규식 안의 "+82")은 뺀다.
    const definer = join("scripts", "check-launch.ts");
    expect(filesContaining(new RegExp(PHONE_PATTERN.source)).filter((f) => f !== definer)).toEqual([]);
    for (const p of pages) expect(p.text, p.path).not.toMatch(PHONE_PATTERN);
  });
});

describe("처리방침이 코드와 맞는지", () => {
  it("브라우저 저장소 이름(theme, dream-draft)이 코드와 처리방침에 같이 있다", () => {
    expect(read("lib/theme.ts")).toContain('const THEME_STORAGE_KEY = "theme"');
    expect(read("components/dreamDraft.ts")).toContain('const KEY = "dream-draft"');
    expect(page("privacy")).toContain("localStorage, 이름 theme");
    expect(page("privacy")).toContain("sessionStorage, 이름 dream-draft");
  });

  it("사이트 코드는 쿠키를 만들거나 읽지 않는다 (처리방침 7번)", () => {
    // 브라우저·서버에서 실제로 돌아가는 코드만 본다. (e2e 는 쿠키가 없는지 확인하느라 document.cookie 를 읽는다)
    const runtime = SITE_FILES.filter((f) => /^(app|components|lib)\//.test(f));
    const cookieCode = /document\.cookie|from "next\/headers"|\bcookies\(\)|Set-Cookie/i;
    expect(runtime.filter((f) => cookieCode.test(read(f)))).toEqual([]);
    expect(page("privacy")).toContain("서비스는 쿠키를 만들거나 읽지 않습니다");
  });

  it("분석·추적 도구 패키지가 없다 (넣으면 처리방침 4·5·7번을 먼저 고친다)", () => {
    const pkg = JSON.parse(read("package.json")) as Record<string, Record<string, string>>;
    const names = Object.keys({ ...pkg.dependencies, ...pkg.devDependencies });
    expect(names.filter((n) => /analytics|gtag|tagmanager|segment|mixpanel|amplitude|hotjar|clarity|sentry|posthog|datadog|speed-insights|adsense/i.test(n))).toEqual([]);
  });

  it("광고 코드가 없으면 '광고를 게재하지 않으며', 들어가면 그 문장을 지워야 한다 (처리방침 8번)", () => {
    // 사이트 확인용 메타 태그(google-adsense-account)나 ads.txt 는 스크립트를 불러오지 않아 여기서 보지 않는다.
    const hasAdCode = filesContaining(/adsbygoogle|googlesyndication|pagead2/).length > 0;
    expect(hasAdCode).toBe(false);
    expect(page("privacy")).toContain("현재 서비스는 광고를 게재하지 않으며, 광고 코드도 넣지 않았습니다");
  });

  it("문의 메일 보유 기간은 처리방침과 문의 페이지가 같은 값을 쓴다", () => {
    // 렌더링한 글에서는 굵은 글씨(<strong>보유 기간</strong>) 뒤에 띄어쓰기가 하나 들어간다.
    expect(page("privacy")).toMatch(new RegExp(`문의 메일 \\(보낸 경우\\).*보유 기간 : ${INQUIRY_RETENTION}\\.`));
    expect(page("privacy")).toContain(`보유·이용 기간 : ${INQUIRY_RETENTION}`);
    expect(page("contact")).toContain(`${INQUIRY_RETENTION}이 지나면 지워요`);
  });

  it("국외 이전: 실제로 쓰는 세 업체를 법정 항목(이전받는 자·국가·시기와 방법·항목·목적·기간)과 함께 적는다", () => {
    const text = page("privacy");
    const transfer = text.slice(text.indexOf("5. 개인정보의 국외 이전"), text.indexOf("6. 개인정보의 제3자 제공"));
    for (const company of ["Vercel Inc.", "Cloudflare, Inc.", "Google LLC"]) expect(transfer).toContain(company);
    for (const item of ["이전받는 자와 연락처", "이전되는 국가", "이전 시기와 방법", "이전 항목", "이용 목적", "보유·이용 기간"]) {
      expect(transfer.split(item).length - 1, item).toBe(3);
    }
    expect(transfer).toContain("이전을 원하지 않는 경우");
  });

  it("처리방침 글자는 모두 사이트 글꼴(Pretendard KS X 1001 서브셋)에 있다", () => {
    const glyphs = new Set(read("assets/fonts/pretendard-subset-glyphs.txt"));
    const missing = [...new Set(pages.map((p) => p.text).join("").replace(/\s/g, ""))].filter((c) => !glyphs.has(c));
    expect(missing).toEqual([]);
  });
});
