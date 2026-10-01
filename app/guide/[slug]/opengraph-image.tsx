// 가이드 공유 이미지 (빌드할 때 글마다 미리 만든다)

import { notFound } from "next/navigation";
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
  // 없는 글 주소는 페이지처럼 404.
  if (!guide) notFound();
  return renderOgImage({
    eyebrow: "꿈 가이드",
    title: guide.title,
    description: guide.description,
    titleMax: 24,
    descriptionMax: 80,
  });
}
