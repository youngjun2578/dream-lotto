// 검색엔진·공유 미리보기용 메타데이터와 구조화 데이터(JSON-LD) 만들기

import type { Metadata } from "next";
import { absoluteUrl, CONTENT_UPDATED_AT, SITE_DESCRIPTION, SITE_NAME } from "./site";
import type { DreamSymbol } from "./types";

export interface PageMetaInput {
  title: string;
  description: string;
  /** "/dream/pig" 처럼 사이트 안의 경로 */
  path: string;
  type?: "website" | "article";
  /** 검색 결과에 노출하지 않을 페이지 (예: 공유 링크) */
  noindex?: boolean;
  /**
   * 경로에 자기 opengraph-image 파일이 있으면 true.
   * (메타데이터에 이미지를 적으면 그 파일보다 우선하므로, 이때는 기본 이미지를 넣지 않는다)
   */
  ownImage?: boolean;
}

/** 사이트 기본 공유 이미지 (app/opengraph-image.tsx) */
export const DEFAULT_OG_IMAGE = {
  url: absoluteUrl("/opengraph-image"),
  width: 1200,
  height: 630,
  alt: `${SITE_NAME} – 꿈해몽과 행운 번호 추천`,
};

/**
 * 페이지별 메타데이터 (title/description + 대표 주소 + 공유 미리보기).
 * Next.js 는 openGraph 를 얕게 합치므로(부모 값이 통째로 덮어써짐) 페이지마다 전부 채워 준다.
 * 이미지는 사이트 기본 이미지를 넣고, 자기 이미지 파일이 있는 경로(ownImage)는 그 파일을 쓴다.
 * 주소는 모두 lib/site.ts 의 SITE_URL 로 만든 절대 주소다. (파일 이미지는 metadataBase = SITE_URL 로 절대 주소가 된다)
 */
export function pageMetadata({
  title,
  description,
  path,
  type = "website",
  noindex = false,
  ownImage = false,
}: PageMetaInput): Metadata {
  const images = ownImage ? {} : { images: [DEFAULT_OG_IMAGE] };
  return {
    title,
    description,
    alternates: { canonical: absoluteUrl(path) },
    openGraph: {
      title,
      description,
      url: absoluteUrl(path),
      siteName: SITE_NAME,
      locale: "ko_KR",
      type,
      ...images,
    },
    twitter: { card: "summary_large_image", title, description, ...(ownImage ? {} : { images: [DEFAULT_OG_IMAGE.url] }) },
    ...(noindex ? { robots: { index: false, follow: true } } : {}),
  };
}

type JsonLd = Record<string, unknown>;

// 구조화 데이터의 url 과 @id 도 모두 SITE_URL(absoluteUrl)로 만든다.
const publisher = { "@type": "Organization", "@id": absoluteUrl("/#organization"), name: SITE_NAME, url: absoluteUrl("/") };

export function websiteJsonLd(): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": absoluteUrl("/#website"),
    name: SITE_NAME,
    url: absoluteUrl("/"),
    description: SITE_DESCRIPTION,
    inLanguage: "ko-KR",
  };
}

/** 이동 경로(홈 › 꿈해몽 사전 › 돼지 꿈) */
export function breadcrumbJsonLd(items: { name: string; path: string }[]): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "@id": `${absoluteUrl(items[items.length - 1]?.path ?? "/")}#breadcrumb`,
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

export interface ArticleInput {
  title: string;
  description: string;
  path: string;
  section?: string;
  keywords?: string[];
}

export function articleJsonLd({ title, description, path, section, keywords }: ArticleInput): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    "@id": `${absoluteUrl(path)}#article`,
    headline: title,
    description,
    inLanguage: "ko-KR",
    mainEntityOfPage: absoluteUrl(path),
    url: absoluteUrl(path),
    image: absoluteUrl(`${path}/opengraph-image`),
    datePublished: CONTENT_UPDATED_AT,
    dateModified: CONTENT_UPDATED_AT,
    author: publisher,
    publisher,
    ...(section ? { articleSection: section } : {}),
    ...(keywords?.length ? { keywords: keywords.join(", ") } : {}),
  };
}

/** 사전 상세 페이지의 제목·설명 (메타 태그, 구조화 데이터, 공유 이미지에서 함께 쓴다) */
export function dreamPageTitle(symbol: DreamSymbol): string {
  return `${symbol.keyword} 꿈 해몽 – 의미와 행운 숫자`;
}

export function dreamArticleJsonLd(symbol: DreamSymbol): JsonLd {
  return articleJsonLd({
    title: `${symbol.keyword} 꿈 해몽`,
    description: symbol.meaning,
    path: `/dream/${symbol.slug}`,
    section: `꿈해몽 사전 · ${symbol.category}`,
    keywords: [...new Set([`${symbol.keyword} 꿈`, ...symbol.synonyms.map((w) => `${w} 꿈`)])],
  });
}

/** 사전 목록·카테고리 페이지: 모음 페이지 + 항목 목록 */
export function dreamListJsonLd(symbols: DreamSymbol[], { name = "꿈해몽 사전", path = "/dream" } = {}): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "@id": `${absoluteUrl(path)}#collection`,
    name,
    url: absoluteUrl(path),
    inLanguage: "ko-KR",
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: symbols.length,
      itemListElement: symbols.map((s, i) => ({
        "@type": "ListItem",
        position: i + 1,
        name: `${s.keyword} 꿈`,
        url: absoluteUrl(`/dream/${s.slug}`),
      })),
    },
  };
}

/** <script type="application/ld+json"> 안에 넣을 문자열. "<" 를 이스케이프해 스크립트 주입을 막는다. */
export function serializeJsonLd(data: JsonLd | JsonLd[]): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
