// /sitemap.xml — 검색엔진에 사전 페이지 목록을 알려 준다.

import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";
import { getAllSymbols } from "@/lib/symbols";

export default function sitemap(): MetadataRoute.Sitemap {
  const pages = ["", "/dream", "/about", "/privacy", "/terms", "/contact"].map((path) => ({
    url: `${SITE_URL}${path}`,
  }));
  const symbols = getAllSymbols().map((s) => ({ url: `${SITE_URL}/dream/${s.slug}` }));
  return [...pages, ...symbols];
}
