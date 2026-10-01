// 가이드 칼럼 (data/guides.json) 불러오기 + 검사
// 본문의 [글자](/dream/pig) 는 사이트 안 링크로 바뀐다. (components/RichText.tsx)

import raw from "@/data/guides.json";

/** 문단(문자열) 또는 목록(문자열 배열) */
export type GuideBlock = string | string[];

export interface GuideSection {
  heading: string;
  blocks: GuideBlock[];
}

export interface Guide {
  slug: string;
  title: string;
  description: string;
  sections: GuideSection[];
}

export const rawGuideData: unknown = raw;
const GUIDES = raw as Guide[];

export const MIN_GUIDE_LENGTH = 1500;
const LINK = /\[([^\]]+)\]\((\/[^)\s]*)\)/g;

export function getAllGuides(): Guide[] {
  return GUIDES;
}

export function getGuideBySlug(slug: string): Guide | undefined {
  return GUIDES.find((g) => g.slug === slug);
}

/** 링크 표시를 뺀 본문 글자 (소제목 제외) */
export function guideBodyText(guide: Guide): string {
  return guide.sections
    .flatMap((s) => s.blocks.flatMap((b) => (Array.isArray(b) ? b : [b])))
    .map((t) => t.replace(LINK, "$1"))
    .join("\n");
}

/** 본문에 들어 있는 사이트 안 링크 주소 */
export function guideLinks(guide: Guide): string[] {
  const text = guide.sections.flatMap((s) => s.blocks.flatMap((b) => (Array.isArray(b) ? b : [b]))).join("\n");
  return [...text.matchAll(LINK)].map((m) => m[2]);
}

/** 읽는 데 걸리는 대략의 시간 (분당 500자) */
export function readingMinutes(guide: Guide): number {
  return Math.max(1, Math.round(guideBodyText(guide).length / 500));
}

/** 이 상징(/dream/slug)을 다루는 가이드 */
export function getGuidesForSymbol(slug: string): Guide[] {
  return GUIDES.filter((g) => guideLinks(g).includes(`/dream/${slug}`));
}

/** 검사: 필수 필드, slug 중복, 본문 1,500자 이상, 사전 링크 3개 이상, 모든 링크가 실제 페이지 */
export function validateGuides(data: unknown, pagePaths: Set<string>): string[] {
  const errors: string[] = [];
  if (!Array.isArray(data)) return ["guides.json 은 배열이어야 합니다."];
  const slugs = new Set<string>();
  for (const [i, item] of data.entries()) {
    const g = item as Partial<Guide>;
    const where = `#${i} (${g?.slug ?? "slug 없음"})`;
    if (typeof g.slug !== "string" || !/^[a-z0-9-]+$/.test(g.slug)) errors.push(`${where}: slug 형식이 올바르지 않습니다.`);
    else if (slugs.has(g.slug)) errors.push(`${where}: slug 가 중복됩니다.`);
    else slugs.add(g.slug);
    if (typeof g.title !== "string" || !g.title.trim()) errors.push(`${where}: title 이 비어 있습니다.`);
    if (typeof g.description !== "string" || g.description.length < 40 || g.description.length > 160) {
      errors.push(`${where}: description 은 40~160자여야 합니다.`);
    }
    if (!Array.isArray(g.sections) || g.sections.length < 3) {
      errors.push(`${where}: 소제목(section)이 3개 이상이어야 합니다.`);
      continue;
    }
    const guide = g as Guide;
    const length = guideBodyText(guide).length;
    if (length < MIN_GUIDE_LENGTH) errors.push(`${where}: 본문은 ${MIN_GUIDE_LENGTH}자 이상이어야 합니다. (현재 ${length}자)`);
    const links = guideLinks(guide);
    if (links.filter((l) => l.startsWith("/dream/")).length < 3) errors.push(`${where}: 사전 페이지 링크가 3개 이상 필요합니다.`);
    for (const link of links) {
      if (!pagePaths.has(link)) errors.push(`${where}: 없는 페이지로 가는 링크가 있습니다. (${link})`);
    }
  }
  return errors;
}
