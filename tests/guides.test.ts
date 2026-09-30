// 가이드 칼럼: 분량, 내부 링크, 사이트맵

import { describe, expect, it } from "vitest";
import sitemap from "@/app/sitemap";
import {
  getAllGuides,
  getGuidesForSymbol,
  guideBodyText,
  guideLinks,
  MIN_GUIDE_LENGTH,
  rawGuideData,
  validateGuides,
} from "@/lib/guides";
import { SITE_URL } from "@/lib/site";
import { getAllSymbols } from "@/lib/symbols";

const GUIDES = getAllGuides();
const PAGES = new Set([
  "/",
  "/dream",
  "/guide",
  "/about",
  ...getAllSymbols().map((s) => `/dream/${s.slug}`),
  ...GUIDES.map((g) => `/guide/${g.slug}`),
]);

describe("가이드 칼럼", () => {
  it("요청한 5개 주제가 모두 있다", () => {
    expect(GUIDES.map((g) => g.slug)).toEqual([
      "good-and-bad-dreams",
      "taemong",
      "recurring-dreams",
      "remember-dreams",
      "wealth-dreams",
    ]);
  });

  it(`검사 통과: 본문 ${MIN_GUIDE_LENGTH}자 이상(소제목 제외), 사전 링크 3개 이상, 없는 페이지 링크 없음`, () => {
    expect(validateGuides(rawGuideData, PAGES)).toEqual([]);
    for (const g of GUIDES) expect(guideBodyText(g).length, g.slug).toBeGreaterThanOrEqual(MIN_GUIDE_LENGTH);
  });

  it("없는 페이지 링크나 짧은 글은 잡아낸다", () => {
    const g = GUIDES[0];
    const broken = { ...g, sections: [...g.sections, { heading: "x", blocks: ["[없는 꿈](/dream/unicorn)"] }] };
    expect(validateGuides([broken], PAGES).join()).toMatch(/없는 페이지/);
    const short = { ...g, sections: g.sections.slice(0, 3).map((s) => ({ ...s, blocks: ["짧아요. [돼지](/dream/pig) [뱀](/dream/snake) [용](/dream/dragon)"] })) };
    expect(validateGuides([short], PAGES).join()).toMatch(/1500자 이상/);
  });

  it("사전 상세 페이지에서 그 상징을 다루는 가이드를 찾는다", () => {
    expect(getGuidesForSymbol("pig").map((g) => g.slug)).toEqual(expect.arrayContaining(["wealth-dreams", "taemong"]));
    for (const g of GUIDES) {
      for (const link of guideLinks(g).filter((l) => l.startsWith("/dream/"))) {
        expect(getGuidesForSymbol(link.replace("/dream/", "")).map((x) => x.slug)).toContain(g.slug);
      }
    }
  });

  it("사이트맵에 가이드 목록과 글 5개가 들어 있다", () => {
    const urls = sitemap().map((e) => e.url);
    expect(urls).toContain(`${SITE_URL}/guide`);
    for (const g of GUIDES) expect(urls).toContain(`${SITE_URL}/guide/${g.slug}`);
  });
});
