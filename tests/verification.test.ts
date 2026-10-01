// 네이버 서치어드바이저 소유 확인 메타 태그
// - 값은 lib/site.ts 의 NAVER_SITE_VERIFICATION, 루트 layout 의 metadata.verification 에서만 쓴다.
// - 프로덕션 빌드의 홈 HTML <head> 에 정확히 한 번 들어간다.

import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { metadata as layoutMetadata } from "@/app/layout";
import { pageMetadata } from "@/lib/seo";
import { NAVER_SITE_VERIFICATION } from "@/lib/site";
import { checkNaverVerificationTag } from "@/scripts/check-launch";

const VALUE = "f6e2f88fd423c42b3e0c014d6c7d29187349cccb";
/** Next.js(React)가 실제로 쓰는 모양 */
const TAG = `<meta name="naver-site-verification" content="${VALUE}"/>`;
const count = (html: string) => html.split(TAG).length - 1;

function appFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return appFiles(path);
    return /\.(ts|tsx)$/.test(name) ? [path] : [];
  });
}

describe("네이버 소유 확인 값", () => {
  it("lib/site.ts 의 NAVER_SITE_VERIFICATION 에 둔다", () => {
    expect(NAVER_SITE_VERIFICATION).toBe(VALUE);
  });

  it("루트 layout 의 metadata.verification.other 가 이 상수를 참조한다", () => {
    expect(layoutMetadata.verification).toEqual({ other: { "naver-site-verification": NAVER_SITE_VERIFICATION } });
  });

  it("다른 페이지·레이아웃은 verification 을 정의하지 않는다 (얕은 병합이라 정의하면 루트 값을 덮어씀)", () => {
    const others = appFiles("app")
      .filter((file) => file !== join("app", "layout.tsx"))
      .filter((file) => /\bverification\s*:/.test(readFileSync(file, "utf8")));
    expect(others).toEqual([]);
    expect(pageMetadata({ title: "t", description: "d", path: "/dream/pig" })).not.toHaveProperty("verification");
  });
});

describe("빌드된 HTML 검사 (scripts/check-launch.ts)", () => {
  const page = (head: string, body = "") => `<html><head><title>t</title>${head}</head><body>${body}</body></html>`;

  it("<head> 안에 정확히 한 번이면 통과", () => {
    expect(checkNaverVerificationTag(page(TAG), VALUE)).toEqual([]);
  });

  it("없거나, 두 번이거나, 값이 다르거나, <head> 밖이면 실패", () => {
    expect(checkNaverVerificationTag(page(""), VALUE)).toHaveLength(1);
    expect(checkNaverVerificationTag(page(TAG + TAG), VALUE)).toHaveLength(1);
    expect(checkNaverVerificationTag(page(TAG.replace(VALUE, "wrong")), VALUE)).toHaveLength(1);
    expect(checkNaverVerificationTag(page("", TAG), VALUE)).toHaveLength(1);
  });

  it("RSC 데이터(JSON) 안의 값은 태그로 세지 않는다", () => {
    const rsc = `<script>self.__next_f.push([1,"[\\"$\\",\\"meta\\",\\"0\\",{\\"name\\":\\"naver-site-verification\\",\\"content\\":\\"${VALUE}\\"}]"])</script>`;
    expect(checkNaverVerificationTag(page(TAG, rsc), VALUE)).toEqual([]);
  });
});

describe("프로덕션 빌드 결과 (.next)", () => {
  const app = join(".next", "server", "app");
  const home = join(app, "index.html");
  // 빌드가 없거나, 빌드 뒤에 관련 소스를 고쳤다면(오래된 빌드) 건너뛴다. → npm run build 후 다시 실행
  const fresh =
    existsSync(home) &&
    ["app/layout.tsx", "lib/site.ts"].every((src) => statSync(home).mtimeMs >= statSync(src).mtimeMs);

  it.skipIf(!fresh)("홈 HTML 의 <head> 에 태그가 정확히 한 번 들어 있다", () => {
    const html = readFileSync(home, "utf8");
    expect(count(html)).toBe(1);
    expect(checkNaverVerificationTag(html, VALUE)).toEqual([]);
  });

  it.skipIf(!fresh)("다른 페이지도 루트 layout 을 물려받아 한 번씩만 들어 있다 (중복 없음)", () => {
    for (const file of ["dream.html", "dream/pig.html", "guide/wealth-dreams.html", "privacy.html", "about.html"]) {
      expect(count(readFileSync(join(app, file), "utf8")), file).toBe(1);
    }
  });
});
