// 결과 페이지(/result/…, /r/…)의 제목과 메타데이터
// 사람마다 다른 결과라 검색에는 노출하지 않는다(noindex). sitemap 에도 넣지 않고, robots.txt 로 막지도 않는다.

import type { Metadata } from "next";
import { pageMetadata } from "./seo";
import { sharedPath } from "./share";
import type { InterpretResponse } from "./types";

/** 제목에 넣을 상징 수 (공유 이미지와 같이 앞의 2개) */
const TITLE_SYMBOLS = 2;

/** "돼지·불 꿈 해몽 결과" (상징이 없으면 "꿈 해몽 결과"). 사이트 이름은 layout 의 제목 틀이 붙인다. */
export function resultTitle(result: Pick<InterpretResponse, "symbols"> | null): string {
  const names = (result?.symbols ?? []).slice(0, TITLE_SYMBOLS).map((s) => s.keyword);
  return names.length > 0 ? `${names.join("·")} 꿈 해몽 결과` : "꿈 해몽 결과";
}

/**
 * 결과 페이지 메타데이터. 대표 주소(canonical)와 공유 주소(og:url)는 두 페이지 모두 공유 주소(/r/…)로 맞춘다.
 * 잘못된 값이면 제목만 두고 noindex.
 */
export function resultMetadata(result: InterpretResponse | null, payload: string): Metadata {
  if (!result) return { title: resultTitle(null), robots: { index: false, follow: true } };
  const summary = result.summary.length > 110 ? `${result.summary.slice(0, 109)}…` : result.summary;
  return pageMetadata({
    title: resultTitle(result),
    description: summary,
    path: sharedPath(payload),
    noindex: true,
    ownImage: true,
  });
}
