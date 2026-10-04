// 개인정보처리방침과 실제 코드가 서로 맞는지
// (2026-10-01 처리방침 개정, 2026-10-02 후속 수정, 2026-10-03 3차 후속 수정, 2026-10-04 12번 보완·애드센스 사이트 확인 준비)
// - 운영자 이름·문의 메일은 lib/site.ts 한 곳에서만 정하고, 정책 페이지가 가져다 쓴다.
// - 전화번호는 사이트 어디에도 넣지 않는다.
// - 처리방침에 적은 저장소 이름·보유 기간·광고 상태가 코드와 같다.
// 브라우저에서 실제로 나가는 요청·쿠키·저장소는 e2e/privacy.spec.ts 에서 확인한다.

import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { metadata as layoutMetadata } from "@/app/layout";
import {
  ADS_TXT_LINE,
  ADSENSE_ACCOUNT,
  CONTACT_EMAIL,
  INQUIRY_RETENTION,
  OPERATOR_NAME,
  PRIVACY_OFFICER_NAME,
} from "@/lib/site";
import { AD_SCRIPT_PATTERN, PHONE_PATTERN, renderPolicyPages } from "@/scripts/check-launch";

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
    // 광고 스크립트 표시는 광고 스크립트 주소와 광고 단위 코드 세 가지다. (scripts/check-launch.ts 가 빌드 결과에도 쓴다)
    expect(AD_SCRIPT_PATTERN.source).toBe("adsbygoogle|googlesyndication|pagead2");
    // 그 정규식을 정의한 파일은 뺀다. (PHONE_PATTERN 과 같은 방식)
    const definer = join("scripts", "check-launch.ts");
    const hasAdCode = filesContaining(new RegExp(AD_SCRIPT_PATTERN.source)).filter((f) => f !== definer).length > 0;
    expect(hasAdCode).toBe(false);
    expect(page("privacy")).toContain("현재 서비스는 광고를 게재하지 않으며, 광고 코드도 넣지 않았습니다");
  });

  it("애드센스 사이트 확인용 메타 태그와 ads.txt 는 광고 코드가 아니다 (있어도 8번 '광고 코드도 넣지 않았습니다'는 사실)", () => {
    // 둘 다 들어가 있다
    expect(layoutMetadata.other).toEqual({ "google-adsense-account": ADSENSE_ACCOUNT });
    expect(read("public/ads.txt")).toBe(`${ADS_TXT_LINE}\n`);
    // 메타 태그는 값만 적힌 태그, ads.txt 는 판매 권한을 밝히는 글 한 줄이다. 스크립트를 불러오지 않고 광고를 그리지 않는다.
    const tag = `<meta name="google-adsense-account" content="${ADSENSE_ACCOUNT}"/>`;
    expect(AD_SCRIPT_PATTERN.test(tag)).toBe(false);
    expect(AD_SCRIPT_PATTERN.test(read("public/ads.txt"))).toBe(false);
    expect(page("privacy")).toContain("광고 코드도 넣지 않았습니다");
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

describe("처리방침 후속 수정 (2026-10-02)", () => {
  const text = page("privacy");
  const section = (from: string, to: string) => text.slice(text.indexOf(from), text.indexOf(to));

  it("접속 기록 보관 기간은 1·5번 모두 1일이고, 본문에는 요금제 이름을 쓰지 않는다 (요금제 사실은 notes.md)", () => {
    expect(section("1. 처리하는 개인정보", "2. 꿈 내용은")).toContain("요금제 기준으로 1일이 지나면 자동으로 지워지며");
    expect(section("5. 개인정보의 국외 이전", "6. 개인정보의 제3자 제공")).toContain("관리 화면에서 볼 수 있는 기록은 1일");
    expect(text).not.toMatch(/Hobby|\bPro\b|1시간/);
  });

  it("8번: 결과·공유 페이지에도 광고가 게재될 수 있고, 그 주소가 Google에 전달될 수 있다 (꿈 원문 없음, 영문 이름 부호화)", () => {
    const ads = section("8. 광고와 행태정보", "9. EEA");
    expect(ads).toContain("결과 페이지(/result/…)와 공유 페이지(/r/…)에도 광고가 게재될 수 있으며");
    expect(ads).toContain("그 페이지의 주소가 Google에 전달될 수 있습니다");
    expect(ads).toContain("꿈 원문이 들어 있지 않고");
    expect(ads).toMatch(/상징·행동의 영문 이름.*부호화되어 들어 있습니다/);
  });

  it("문의 메일은 Cloudflare 이메일 전달을 거쳐 Gmail로 들어오고, 사이트 접속은 Cloudflare를 거치지 않는다", () => {
    expect(section("문의 메일 (보낸 경우)", "2. 꿈 내용은")).toContain("Cloudflare의 이메일 전달을 거쳐 운영자의 메일함(Gmail)으로");
    expect(section("4. 개인정보 처리 위탁", "5. 개인정보의 국외 이전")).toContain("사이트 접속(페이지 요청)은 Cloudflare를 거치지 않습니다");
    // 전달 기록이 Cloudflare 에도 남으므로 '메일 계정에만 보관'이라고 쓰지 않는다
    expect(text).not.toContain("메일 계정에만");
  });

  it("최종 개정일은 변경 이력의 가장 최근 날짜와 같다", () => {
    const revised = text.match(/최종 개정일 (\d{4}년 \d{1,2}월 \d{1,2}일)/)?.[1];
    const latest = text.slice(text.indexOf("변경 이력")).match(/(\d{4}년 \d{1,2}월 \d{1,2}일):/)?.[1];
    expect(revised).toBeDefined();
    expect(latest).toBe(revised);
  });
});

describe("처리방침 3차 후속 수정 (2026-10-03)", () => {
  const text = page("privacy");
  const section = (from: string, to: string) => text.slice(text.indexOf(from), text.indexOf(to));
  // 렌더링한 글에서는 링크(<a>2번</a>) 앞뒤에 띄어쓰기가 하나씩 들어간다: "( 2번 )"
  // 15번 본문에도 "변경 이력에 남깁니다"가 있어서, 끝은 소제목 "변경 이력 "(뒤에 날짜)으로 자른다
  const changes = section("15. 개인정보처리방침의 변경", "변경 이력 ");

  it("15번: 중요한 변경은 시행 7일 전부터, 그 밖의 수정은 시행일과 함께 알리고 변경 이력에 남긴다", () => {
    expect(changes).toContain("이용자의 권리나 의무, 개인정보 처리에 중요한 영향을 주는 변경은 시행 7일 전부터 이 페이지에");
    expect(changes).toMatch(
      /그 밖의 중요하지 않은 수정\(\s?8번\s?에서 미리 알린 광고 게재 시작, 오탈자 수정, 연락처나 사실관계를 바로잡는 보완 등\)은 시행일과 함께 이 페이지에 알리고 변경 이력에 남깁니다/,
    );
    // 예전처럼 모든 변경을 7일 전에 알린다고 쓰지 않는다
    expect(text).not.toContain("내용을 바꾸면 시행 7일 전부터");
  });

  it("8번의 '게재를 시작하기 전에 시작일을 알린다'와 15번이 같은 말을 한다", () => {
    expect(section("8. 광고와 행태정보", "9. EEA")).toContain("게재를 시작하기 전에 이 페이지에 시작일을 알립니다");
    expect(changes).toMatch(/광고 게재 시작일은\s?8번\s?에 적은 대로 게재를 시작하기 전에 알립니다/);
  });

  it("한눈에 보기: 꿈 내용은 서버로 전송되지만 저장하지 않는다 (2번 본문과 같은 말)", () => {
    expect(section("한눈에 보기", "목차")).toMatch(
      /입력한 꿈 내용은 해몽과 번호를 만들기 위해 서버로 전송되지만, 그 목적으로만 쓰고 저장하지 않습니다\(\s?2번\s?\)/,
    );
    const dream = section("2. 꿈 내용은", "3. 개인정보의 파기");
    expect(dream).toContain("꿈 내용이 암호화된 연결(HTTPS)로 서비스 서버(Vercel)에 전송됩니다");
    expect(dream).toContain("꿈 내용을 버립니다");
  });

  it("5번: Vercel 이전 국가는 Google 과 같은 결로 '미국(여러 나라의 서버에서 처리할 수 있음)'이다", () => {
    const transfer = section("5. 개인정보의 국외 이전", "6. 개인정보의 제3자 제공");
    expect(transfer).toContain("이전되는 국가 : 미국(Vercel은 여러 나라의 서버에서 요청을 처리할 수 있습니다)");
    expect(transfer).toContain("이전되는 국가 : 미국(Google은 여러 나라의 데이터 센터에서 정보를 처리할 수 있습니다)");
  });

  it("8번 '현재 상태'의 날짜는 최종 개정일을 따른다", () => {
    const revised = text.match(/최종 개정일 (\d{4}년 \d{1,2}월 \d{1,2}일)/)?.[1];
    expect(revised).toBeDefined();
    expect(text).toContain(`현재 상태 : ${revised} 현재 서비스는 광고를 게재하지 않으며`);
  });
});

describe("12번 보완과 애드센스 사이트 확인 준비 (2026-10-04)", () => {
  const text = page("privacy");
  const section = (from: string, to: string) => text.slice(text.indexOf(from), text.indexOf(to));
  const revised = text.match(/최종 개정일 (\d{4}년 \d{1,2}월 \d{1,2}일)/)?.[1];

  it("12번: 문의 메일을 보관하는 운영자의 Google 계정에는 2단계 인증을 사용한다", () => {
    expect(section("12. 개인정보의 안전성 확보 조치", "13. 개인정보 보호책임자")).toContain(
      "문의 메일을 보관하는 운영자의 Google 계정에는 2단계 인증을 사용합니다.",
    );
  });

  it("8번 본문은 그대로이고, '현재 상태' 날짜만 최종 개정일을 따른다", () => {
    expect(revised).toBeDefined();
    expect(section("8. 광고와 행태정보", "9. EEA")).toContain(
      `현재 상태 : ${revised} 현재 서비스는 광고를 게재하지 않으며, 광고 코드도 넣지 않았습니다. 앞으로 Google 애드센스 광고를 게재할 수 있으며, 게재하면 아래 내용이 적용됩니다. 게재를 시작하기 전에 이 페이지에 시작일을 알립니다.`,
    );
  });

  it("변경 이력: 2026년 10월 4일 사실관계 보완(12번, 사이트 확인용 메타 태그와 ads.txt)은 공개한 날부터 바로 적용한다", () => {
    const history = text.slice(text.indexOf("변경 이력 "));
    const entry = history.match(/2026년 10월 4일: (.*?)(?= \d{4}년 \d{1,2}월 \d{1,2}일:|$)/)?.[1] ?? "";
    expect(entry).toContain("사실관계를 보완했습니다");
    expect(entry).toContain("12번");
    expect(entry).toContain("2단계 인증");
    expect(entry).toContain("사이트 확인용 메타 태그와 ads.txt");
    expect(entry).toContain("광고 코드가 아니어서");
    expect(entry).toContain("공개한 날부터 바로 적용합니다");
  });
});
