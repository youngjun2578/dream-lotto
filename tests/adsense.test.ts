// 애드센스 사이트 확인 준비 (2026-10-04)
// - 게시자 ID 는 lib/site.ts 의 ADSENSE_PUBLISHER_ID 한 곳에서 정한다.
// - 사이트 확인용 메타 태그 <meta name="google-adsense-account" content="ca-pub-…"> 는 루트 layout 의 metadata.other 에서만 넣는다.
// - public/ads.txt 는 한 줄(lib/site.ts 의 ADS_TXT_LINE)이고 https://www.haemongru.com/ads.txt 로 열린다.
// - 메타 태그와 ads.txt 는 광고 코드가 아니다. 광고 스크립트는 넣지 않았고, 처리방침 8번 "광고 코드도 넣지 않았습니다"는 사실이다.
// 실제 서버 응답(ads.txt 200, 리디렉션 없음)과 브라우저의 외부 요청은 e2e/domain.spec.ts·e2e/privacy.spec.ts 에서 확인한다.

import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { metadata as layoutMetadata } from "@/app/layout";
import { pageMetadata } from "@/lib/seo";
import { ADS_TXT_LINE, ADSENSE_ACCOUNT, ADSENSE_PUBLISHER_ID, NAVER_SITE_VERIFICATION, SITE_URL } from "@/lib/site";
import {
  AD_SCRIPT_PATTERN,
  checkAdsenseAccountTag,
  checkAdsTxt,
  checkBuildOutput,
  checkNoAdScript,
} from "@/scripts/check-launch";

const ID = "pub-8613982831743426";
const LINE = `google.com, ${ID}, DIRECT, f08c47fec0942fa0`;
/** Next.js(React)가 실제로 쓰는 모양 */
const TAG = `<meta name="google-adsense-account" content="ca-${ID}"/>`;
const count = (html: string) => html.split(TAG).length - 1;
/** 진짜 광고 코드의 예 (애드센스가 주는 광고 스크립트와 광고 단위) */
const AD_SCRIPT = `<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-${ID}" crossorigin="anonymous"></script>`;
const AD_UNIT = "<script>(adsbygoogle = window.adsbygoogle || []).push({});</script>";

function appFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return appFiles(path);
    return /\.(ts|tsx)$/.test(name) ? [path] : [];
  });
}

describe("게시자 ID 와 값 (lib/site.ts)", () => {
  it("게시자 ID, 메타 태그 값(ca-…), ads.txt 한 줄을 한 곳에 둔다", () => {
    expect(ADSENSE_PUBLISHER_ID).toBe(ID);
    expect(ADSENSE_ACCOUNT).toBe(`ca-${ID}`);
    expect(ADS_TXT_LINE).toBe(LINE);
  });

  it("public/ads.txt 는 그 한 줄뿐이다", () => {
    const text = readFileSync("public/ads.txt", "utf8");
    expect(text).toBe(`${LINE}\n`);
    expect(checkAdsTxt(text, ADS_TXT_LINE)).toEqual([]);
  });
});

describe("메타 태그 (루트 layout)", () => {
  it("metadata.other 가 이 상수를 참조하고, 네이버 소유 확인(verification)은 그대로다", () => {
    expect(layoutMetadata.other).toEqual({ "google-adsense-account": ADSENSE_ACCOUNT });
    expect(layoutMetadata.verification).toEqual({ other: { "naver-site-verification": NAVER_SITE_VERIFICATION } });
  });

  it("다른 페이지·레이아웃은 other 를 정의하지 않는다 (얕은 병합이라 정의하면 루트 값을 덮어씀)", () => {
    const others = appFiles("app")
      .filter((file) => file !== join("app", "layout.tsx"))
      .filter((file) => /\bother\s*:/.test(readFileSync(file, "utf8")));
    expect(others).toEqual([]);
    expect(pageMetadata({ title: "t", description: "d", path: "/dream/pig" })).not.toHaveProperty("other");
  });
});

describe("광고 코드가 아니다", () => {
  it("광고 스크립트 표시(AD_SCRIPT_PATTERN)는 진짜 광고 코드를 잡고, 메타 태그와 ads.txt 는 잡지 않는다", () => {
    expect(AD_SCRIPT_PATTERN.test(AD_SCRIPT)).toBe(true);
    expect(AD_SCRIPT_PATTERN.test(AD_UNIT)).toBe(true);
    expect(AD_SCRIPT_PATTERN.test(TAG)).toBe(false);
    expect(AD_SCRIPT_PATTERN.test(readFileSync("public/ads.txt", "utf8"))).toBe(false);
  });

  it("루트 layout 은 광고 스크립트를 불러오지 않는다 (next/script, 외부 src 없음)", () => {
    const layout = readFileSync("app/layout.tsx", "utf8");
    expect(layout).not.toMatch(/next\/script|<script[^>]*\bsrc=/);
    expect(AD_SCRIPT_PATTERN.test(layout)).toBe(false);
  });
});

describe("check-launch 검사 (scripts/check-launch.ts)", () => {
  const page = (head: string, body = "") => `<html><head><title>t</title>${head}</head><body>${body}</body></html>`;

  it("메타 태그: <head> 안에 정확히 한 번이면 통과, 없거나 두 번이거나 값이 다르거나 <head> 밖이면 실패", () => {
    expect(checkAdsenseAccountTag(page(TAG), ADSENSE_ACCOUNT)).toEqual([]);
    expect(checkAdsenseAccountTag(page(""), ADSENSE_ACCOUNT)).toEqual([
      "애드센스 사이트 확인 태그가 0개 있어요. 홈 <head> 에 정확히 1개여야 해요.",
    ]);
    expect(checkAdsenseAccountTag(page(TAG + TAG), ADSENSE_ACCOUNT)).toHaveLength(1);
    expect(checkAdsenseAccountTag(page(TAG.replace(ID, "pub-0000000000000000")), ADSENSE_ACCOUNT)).toHaveLength(1);
    expect(checkAdsenseAccountTag(page("", TAG), ADSENSE_ACCOUNT)).toHaveLength(1);
  });

  it("ads.txt: 없거나, 줄이 더 있거나, 값이 다르면 실패 (끝 줄바꿈과 빈 줄은 괜찮다)", () => {
    expect(checkAdsTxt(LINE, ADS_TXT_LINE)).toEqual([]);
    expect(checkAdsTxt(`${LINE}\r\n\n`, ADS_TXT_LINE)).toEqual([]);
    expect(checkAdsTxt(null, ADS_TXT_LINE)).toEqual(["public/ads.txt 가 없어요. 애드센스 사이트 확인에 필요해요."]);
    expect(checkAdsTxt(`${LINE}\n${LINE}\n`, ADS_TXT_LINE)).toHaveLength(1);
    expect(checkAdsTxt(LINE.replace("DIRECT", "RESELLER"), ADS_TXT_LINE)).toHaveLength(1);
    expect(checkAdsTxt("", ADS_TXT_LINE)).toHaveLength(1);
  });

  it("광고 스크립트 없음: 빌드된 페이지에 광고 코드가 있으면 실패, 메타 태그만 있으면 통과", () => {
    // 가짜 빌드 결과(.next 와 같은 모양)를 임시 폴더에 만든다
    const dir = mkdtempSync(join(tmpdir(), "adsense-"));
    try {
      const app = join(dir, "server", "app");
      mkdirSync(join(app, "dream"), { recursive: true });
      writeFileSync(join(dir, "BUILD_ID"), "test");
      writeFileSync(join(app, "index.html"), page(TAG));
      writeFileSync(join(app, "dream", "pig.html"), page(TAG));
      expect(checkNoAdScript(dir)).toEqual([]);
      expect(checkBuildOutput(dir, SITE_URL, { adsenseAccount: ADSENSE_ACCOUNT, noAdScript: true }).join()).not.toMatch(
        /애드센스|광고 스크립트/,
      );

      writeFileSync(join(app, "dream", "pig.html"), page(TAG + AD_SCRIPT, AD_UNIT));
      expect(checkNoAdScript(dir)).toEqual([
        `처리방침 8번은 광고 코드를 넣지 않았다고 하는데, 빌드된 페이지 1개에 광고 스크립트가 있어요 (예: ${join("dream", "pig.html")}). 광고를 넣으려면 8번부터 고치세요.`,
      ]);
      expect(checkBuildOutput(dir, SITE_URL, { noAdScript: true }).join()).toMatch(/광고 스크립트가 있어요/);
      // 처리방침이 광고 코드를 넣지 않았다고 하지 않으면(noAdScript 없음) 이 검사는 하지 않는다
      expect(checkBuildOutput(dir, SITE_URL).join()).not.toMatch(/광고 스크립트/);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("빌드 결과가 없으면 광고 스크립트 검사도 건너뛴다", () => {
    expect(checkNoAdScript("no-such-dir")).toEqual([]);
  });
});

describe("프로덕션 빌드 결과 (.next)", () => {
  const app = join(".next", "server", "app");
  const home = join(app, "index.html");
  // 빌드가 없거나, 빌드 뒤에 관련 소스를 고쳤다면(오래된 빌드) 건너뛴다. → npm run build 후 다시 실행
  const fresh =
    existsSync(home) &&
    ["app/layout.tsx", "lib/site.ts"].every((src) => statSync(home).mtimeMs >= statSync(src).mtimeMs);

  it.skipIf(!fresh)("홈 HTML 의 <head> 에 메타 태그가 정확히 한 번 들어 있다", () => {
    const html = readFileSync(home, "utf8");
    expect(count(html)).toBe(1);
    expect(checkAdsenseAccountTag(html, ADSENSE_ACCOUNT)).toEqual([]);
  });

  it.skipIf(!fresh)("다른 페이지도 루트 layout 을 물려받아 한 번씩만 들어 있다 (중복 없음)", () => {
    for (const file of ["dream.html", "dream/pig.html", "guide/wealth-dreams.html", "privacy.html", "about.html"]) {
      expect(count(readFileSync(join(app, file), "utf8")), file).toBe(1);
    }
  });

  it.skipIf(!fresh)("빌드된 모든 페이지에 광고 스크립트가 없다 (처리방침 8번 '광고 코드도 넣지 않았습니다')", () => {
    expect(checkNoAdScript(".next")).toEqual([]);
  });
});
