// 가이드 공유 이미지 (빌드할 때 글마다 미리 만든다)

import { getAllGuides, getGuideBySlug } from "@/lib/guides";
import { OG_CONTENT_TYPE, OG_SIZE, renderOgImage } from "@/lib/og";

export const alt = "꿈 가이드";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export function generateStaticParams() {
  return getAllGuides().map((g) => ({ slug: g.slug }));
}

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const guide = getGuideBySlug((await params).slug);
  return renderOgImage({
    eyebrow: "꿈 가이드",
    title: guide?.title ?? "꿈 가이드",
    description: guide?.description,
    titleMax: 24,
    descriptionMax: 80,
  });
}
