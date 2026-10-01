// SEO: 메타데이터, 구조화 데이터(JSON-LD), 비슷한 꿈, 사이트맵, 공유 이미지 글꼴

import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import sitemap from "@/app/sitemap";
import { getAllGuides } from "@/lib/guides";
import { FORTUNE_PHRASE_TEXT, NO_SYMBOL_SUMMARY } from "@/lib/interpret/ruleBased";
import {
  breadcrumbJsonLd,
  dreamArticleJsonLd,
  dreamListJsonLd,
  pageMetadata,
  serializeJsonLd,
  websiteJsonLd,
} from "@/lib/seo";
import { absoluteUrl, SITE_NAME, SITE_URL } from "@/lib/site";
import { getAllSymbols, getRelatedSymbols, getSymbolBySlug } from "@/lib/symbols";

const SYMBOLS = getAllSymbols();
const pig = getSymbolBySlug("pig")!;

describe("pageMetadata", () => {
  it("대표 주소, 공유 미리보기(OG), 트위터 카드를 모두 채운다", () => {
    const meta = pageMetadata({ title: "돼지 꿈 해몽", description: "설명", path: "/dream/pig", type: "article" });
    expect(meta.alternates).toEqual({ canonical: `${SITE_URL}/dream/pig` });
    expect(meta.openGraph).toMatchObject({
      title: "돼지 꿈 해몽",
      description: "설명",
      url: `${SITE_URL}/dream/pig`,
      siteName: SITE_NAME,
      locale: "ko_KR",
      type: "article",
    });
    expect(meta.twitter).toMatchObject({ card: "summary_large_image" });
    expect(meta.robots).toBeUndefined();
  });

  it("기본 공유 이미지를 넣되, 자기 이미지 파일이 있는 경로는 비워 둔다", () => {
    const withDefault = pageMetadata({ title: "t", description: "d", path: "/dream" });
    expect(withDefault.openGraph).toMatchObject({
      images: [{ url: `${SITE_URL}/opengraph-image`, width: 1200, height: 630 }],
    });
    expect(withDefault.twitter).toMatchObject({ images: [`${SITE_URL}/opengraph-image`] });
    const own = pageMetadata({ title: "t", description: "d", path: "/dream/pig", ownImage: true });
    expect(own.openGraph).not.toHaveProperty("images");
    expect(own.twitter).not.toHaveProperty("images");
  });

  it("noindex 페이지는 검색에서 빼고 링크는 따라가게 한다", () => {
    expect(pageMetadata({ title: "t", description: "d", path: "/r/x", noindex: true }).robots).toEqual({
      index: false,
      follow: true,
    });
  });
});

describe("JSON-LD", () => {
  it("모든 주소가 절대 주소다", () => {
    expect(absoluteUrl("/dream/pig")).toBe(`${SITE_URL}/dream/pig`);
    expect(websiteJsonLd()).toMatchObject({ "@type": "WebSite", url: `${SITE_URL}/`, inLanguage: "ko-KR" });
  });

  it("사전 상세: Article (제목·설명·섹션·키워드·이미지)", () => {
    const ld = dreamArticleJsonLd(pig);
    expect(ld).toMatchObject({
      "@context": "https://schema.org",
      "@type": "Article",
      headline: "돼지 꿈 해몽",
      description: pig.meaning,
      mainEntityOfPage: `${SITE_URL}/dream/pig`,
      image: `${SITE_URL}/dream/pig/opengraph-image`,
      articleSection: "꿈해몽 사전 · 동물",
    });
    expect(String(ld.keywords)).toContain("돼지 꿈");
  });

  it("이동 경로는 1부터 순서대로", () => {
    const ld = breadcrumbJsonLd([
      { name: "홈", path: "/" },
      { name: "꿈해몽 사전", path: "/dream" },
    ]) as { itemListElement: { position: number; item: string }[] };
    expect(ld.itemListElement.map((x) => x.position)).toEqual([1, 2]);
    expect(ld.itemListElement[1].item).toBe(`${SITE_URL}/dream`);
  });

  it("사전 목록: 모든 상징이 ItemList 에 들어간다", () => {
    const ld = dreamListJsonLd(SYMBOLS) as { mainEntity: { numberOfItems: number; itemListElement: unknown[] } };
    expect(ld.mainEntity.numberOfItems).toBe(SYMBOLS.length);
    expect(ld.mainEntity.itemListElement).toHaveLength(SYMBOLS.length);
  });

  it("'<' 를 이스케이프해 스크립트 주입을 막는다", () => {
    expect(serializeJsonLd({ name: "</script><script>alert(1)</script>" })).not.toContain("<");
  });
});

describe("비슷한 꿈 링크", () => {
  it("같은 카테고리 / 같은 운세(다른 카테고리) — 자기 자신과 중복 없이", () => {
    for (const s of SYMBOLS) {
      const { sameCategory, sameFortune } = getRelatedSymbols(s);
      expect(sameCategory.every((x) => x.category === s.category && x.slug !== s.slug)).toBe(true);
      expect(sameFortune.every((x) => x.fortune_type === s.fortune_type && x.category !== s.category)).toBe(true);
      expect(sameCategory.length + sameFortune.length).toBeGreaterThan(0);
    }
    expect(getRelatedSymbols(pig).sameFortune.map((s) => s.slug)).toContain("money");
  });
});

describe("sitemap", () => {
  it("홈, 사전 목록, 사전 상세 30개, 기본 페이지를 절대 주소로 담는다 (중복 없음)", () => {
    const urls = sitemap().map((e) => e.url);
    expect(urls).toContain(`${SITE_URL}/`);
    expect(urls).toContain(`${SITE_URL}/dream`);
    for (const s of SYMBOLS) expect(urls).toContain(`${SITE_URL}/dream/${s.slug}`);
    expect(urls.every((u) => u.startsWith(SITE_URL))).toBe(true);
    expect(new Set(urls).size).toBe(urls.length);
    expect(sitemap().every((e) => e.lastModified)).toBe(true);
  });
});

describe("공유 이미지(OG) 글꼴", () => {
  it("이미지에 들어갈 수 있는 글자는 모두 Pretendard 서브셋 글꼴에 있다", () => {
    const glyphs = new Set(readFileSync("assets/fonts/pretendard-subset-glyphs.txt", "utf8"));
    const texts = [
      SITE_NAME,
      NO_SYMBOL_SUMMARY,
      ...FORTUNE_PHRASE_TEXT,
      "꿈해몽 사전 · 행운 숫자 후보 재미로 보는 꿈해몽 · 당첨과 무관해요 꿈으로 뽑는 행운 번호",
      "공유된 꿈해몽 · 2026-10-01 나의 꿈해몽 결과 추천 번호 (A게임)",
      ...getAllGuides().flatMap((g) => [g.title, g.description, "꿈 가이드"]),
      ...SYMBOLS.flatMap((s) => [
        s.keyword,
        s.category,
        s.fortune_type,
        s.meaning,
        ...s.situations.flatMap((sit) => [sit.title, sit.meaning]),
      ]),
    ];
    const missing = [...new Set(texts.join("").replace(/\s/g, ""))].filter((c) => !glyphs.has(c));
    expect(missing).toEqual([]);
  });
});

describe("사이트 글꼴", () => {
  it("사전과 가이드 글자는 모두 사이트 글꼴(Pretendard KS X 1001 서브셋)에 있다", () => {
    // 웹 글꼴도 공유 이미지와 같은 글자 목록(한글 2,350자 + 영문·기호)의 서브셋이다.
    const glyphs = new Set(readFileSync("assets/fonts/pretendard-subset-glyphs.txt", "utf8"));
    const texts = [
      ...SYMBOLS.flatMap((s) => [s.keyword, ...s.synonyms, s.meaning, s.body]),
      ...getAllGuides().flatMap((g) => [
        g.title,
        g.description,
        ...g.sections.flatMap((s) => [s.heading, ...s.blocks.flat()]),
      ]),
    ];
    // 한자(예: 돈(豚))는 서브셋에 없어 기기 글꼴로 보이는 게 정상이라 검사에서 뺀다.
    const plain = texts.join("").replace(/\]\([^)]*\)/g, "").replace(/\s|\p{Script=Han}/gu, "");
    const missing = [...new Set(plain)].filter((c) => !glyphs.has(c));
    expect(missing).toEqual([]);
  });
});
