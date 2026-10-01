// 사전 카테고리 (사전 확장 2차: 연애·결혼 추가)
// - 카테고리 ↔ 데이터 파일 ↔ 카테고리 페이지 주소가 서로 맞는다
// - '연애·결혼'은 숫자 후보를 '사람' 구간으로 만든다 (lib/symbolNumbers.ts 는 그대로)
// - 연애·결혼으로 옮긴 상징(애인, 전 애인)은 slug 와 숫자 후보가 그대로다 (공유 링크가 slug 를 쓴다)
// - 사전 본문의 사이트 안 링크는 모두 있는 페이지다

import { describe, expect, it } from "vitest";
import { generateMetadata, generateStaticParams } from "@/app/dream/category/[slug]/page";
import sitemap from "@/app/sitemap";
import { CATEGORY_INFO, categoryPath, getCategoryBySlug, numberCategory } from "@/lib/categories";
import { getAllGuides } from "@/lib/guides";
import { SITE_URL } from "@/lib/site";
import { getAllSymbols, getSymbolBySlug, getSymbolsByCategory, SYMBOL_FILES } from "@/lib/symbols";
import { CATEGORIES, DICTIONARY_CATEGORIES } from "@/lib/types";

const params = (slug: string) => ({ params: Promise.resolve({ slug }) });

describe("사전 카테고리", () => {
  it("카테고리 6개: 이름 순서, 페이지 주소(slug), 데이터 파일 이름이 서로 맞는다", () => {
    expect(CATEGORY_INFO.map((c) => c.name)).toEqual([...DICTIONARY_CATEGORIES]);
    expect(CATEGORY_INFO.map((c) => c.slug)).toEqual(["animal", "person", "nature", "behavior", "object", "love"]);
    expect(SYMBOL_FILES.map((f) => [f.category, f.file])).toEqual(CATEGORY_INFO.map((c) => [c.name, `${c.slug}.json`]));
    expect(getCategoryBySlug("love")?.name).toBe("연애·결혼");
    expect(getCategoryBySlug("no-such")).toBeUndefined();
  });

  it("숫자 구간: 기존 5개는 자기 이름 그대로, 연애·결혼은 사람", () => {
    for (const name of CATEGORIES) expect(numberCategory(name)).toBe(name);
    expect(numberCategory("연애·결혼")).toBe("사람");
  });

  it("모든 카테고리에 상징이 있고, 모든 상징은 카테고리 하나에 속한다", () => {
    const total = DICTIONARY_CATEGORIES.reduce((n, c) => n + getSymbolsByCategory(c).length, 0);
    expect(total).toBe(getAllSymbols().length);
    for (const c of DICTIONARY_CATEGORIES) expect(getSymbolsByCategory(c).length, c).toBeGreaterThan(0);
  });

  it("연애·결혼으로 옮긴 애인·전 애인은 slug 와 숫자 후보가 그대로다", () => {
    expect(getSymbolBySlug("lover")).toMatchObject({ category: "연애·결혼", numbers: [10, 16, 27, 44] });
    expect(getSymbolBySlug("ex-lover")).toMatchObject({ category: "연애·결혼", numbers: [2, 13, 30] });
  });
});

describe("카테고리 페이지 (/dream/category/…)", () => {
  it("6개 페이지를 미리 만들고 sitemap 에도 넣는다", () => {
    expect(generateStaticParams()).toEqual(CATEGORY_INFO.map((c) => ({ slug: c.slug })));
    const urls = sitemap().map((e) => e.url);
    for (const c of CATEGORY_INFO) expect(urls).toContain(`${SITE_URL}${categoryPath(c.name)}`);
  });

  it("제목·설명·대표 주소", async () => {
    const meta = await generateMetadata(params("love"));
    expect(meta.title).toBe("연애·결혼 꿈해몽 – 꿈해몽 사전");
    expect(meta.description).toBe(getCategoryBySlug("love")!.intro);
    expect(meta.alternates?.canonical).toBe(`${SITE_URL}/dream/category/love`);
    expect(await generateMetadata(params("no-such"))).toEqual({});
  });
});

describe("사전 본문 링크", () => {
  it("본문의 [글자](/주소) 링크는 모두 있는 페이지를 가리킨다", () => {
    const pages = new Set([
      ...getAllSymbols().map((s) => `/dream/${s.slug}`),
      ...getAllGuides().map((g) => `/guide/${g.slug}`),
      ...CATEGORY_INFO.map((c) => categoryPath(c.name)),
    ]);
    const links = getAllSymbols().flatMap((s) => [...s.body.matchAll(/\]\((\/[^)\s]*)\)/g)].map((m) => `${s.slug} → ${m[1]}`));
    expect(links.length).toBeGreaterThan(0);
    expect(links.filter((l) => !pages.has(l.split(" → ")[1]))).toEqual([]);
  });
});
