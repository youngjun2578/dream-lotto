// /sitemap.xml — 검색엔진에 사이트의 페이지 목록을 알려 준다.
// 공유 결과 페이지(/r/…)는 사람마다 다른 결과라 넣지 않는다.

import type { MetadataRoute } from "next";
import { CATEGORY_INFO, categoryPath } from "@/lib/categories";
import { getAllGuides } from "@/lib/guides";
import { absoluteUrl, CONTENT_UPDATED_AT } from "@/lib/site";
import { getAllSymbols } from "@/lib/symbols";

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = CONTENT_UPDATED_AT;
  return [
    { url: absoluteUrl("/"), lastModified, changeFrequency: "weekly", priority: 1 },
    { url: absoluteUrl("/dream"), lastModified, changeFrequency: "weekly", priority: 0.9 },
    ...CATEGORY_INFO.map((c) => ({
      url: absoluteUrl(categoryPath(c.name)),
      lastModified,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
    ...getAllSymbols().map((s) => ({
      url: absoluteUrl(`/dream/${s.slug}`),
      lastModified,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
    { url: absoluteUrl("/guide"), lastModified, changeFrequency: "monthly", priority: 0.7 },
    ...getAllGuides().map((g) => ({
      url: absoluteUrl(`/guide/${g.slug}`),
      lastModified,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
    ...["/about", "/privacy", "/terms", "/contact"].map((path) => ({
      url: absoluteUrl(path),
      lastModified,
      changeFrequency: "yearly" as const,
      priority: 0.3,
    })),
  ];
}
