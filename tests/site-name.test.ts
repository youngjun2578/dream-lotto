// 사이트 이름: "해몽루"는 lib/site.ts 의 SITE_NAME 한 곳에서만 정의하고, 옛 이름은 코드·데이터에 남기지 않는다.

import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { metadata as layoutMetadata } from "@/app/layout";
import { articleJsonLd, websiteJsonLd } from "@/lib/seo";
import { SITE_NAME } from "@/lib/site";

const NEW_NAME = "해몽루";
// 옛 이름. 이 파일이 스스로 걸리지 않게 조각으로 만든다.
// "꿈해몽 로또번호 추첨기"처럼 서비스를 설명하는 말(…로또번호)은 브랜드가 아니라서 허용한다.
const OLD_NAME = new RegExp(["해몽", "\\s?", "로또", "(?!번호)"].join(""));
const OLD_NAME_EN = /haemong[\s_-]?lotto/i;

/** 코드·데이터 파일 목록 (node_modules, .next 등 빌드 결과는 제외) */
function files(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return files(path);
    return /\.(ts|tsx|js|mjs|css|json|svg)$/.test(name) ? [path] : [];
  });
}
const CODE_AND_DATA = [
  ...["app", "components", "lib", "data", "scripts", "e2e", "tests"].flatMap(files),
  "next.config.ts",
  "playwright.config.ts",
  "package.json",
];

function linesMatching(paths: string[], re: RegExp): string[] {
  return paths.flatMap((file) =>
    readFileSync(file, "utf8")
      .split("\n")
      .map((line, i) => ({ where: `${file}:${i + 1}`, line }))
      .filter(({ line }) => re.test(line))
      .map(({ where }) => where),
  );
}

describe("사이트 이름", () => {
  it("SITE_NAME 은 해몽루", () => {
    expect(SITE_NAME).toBe(NEW_NAME);
  });

  it("'해몽루'라는 글자는 lib/site.ts 한 곳에서만 정의한다 (다른 코드·데이터는 SITE_NAME 을 쓴다)", () => {
    const checked = CODE_AND_DATA.filter((file) => !file.startsWith("tests"));
    expect(linesMatching(checked, new RegExp(NEW_NAME))).toEqual([join("lib", "site.ts") + ":4"]);
  });

  it("코드와 데이터에 옛 이름이 남아 있지 않다", () => {
    expect(linesMatching(CODE_AND_DATA, OLD_NAME)).toEqual([]);
    expect(linesMatching(CODE_AND_DATA, OLD_NAME_EN)).toEqual([]);
    // 서비스 설명 문구는 그대로 둔다
    expect(OLD_NAME.test("꿈해몽 로또번호 추첨기")).toBe(false);
    expect(OLD_NAME.test(["해몽", " 로또"].join(""))).toBe(true);
  });

  it("메타 태그·구조화 데이터가 새 이름을 쓴다", () => {
    expect(layoutMetadata.title).toMatchObject({ default: `${NEW_NAME} – 꿈해몽과 행운 번호 추천`, template: `%s | ${NEW_NAME}` });
    expect(layoutMetadata.openGraph).toMatchObject({ siteName: NEW_NAME });
    expect(websiteJsonLd().name).toBe(NEW_NAME);
    expect(articleJsonLd({ title: "t", description: "d", path: "/x" })).toMatchObject({
      author: { name: NEW_NAME },
      publisher: { name: NEW_NAME },
    });
  });
});
