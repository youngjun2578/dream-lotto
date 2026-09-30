// 사전 상세 페이지 공유 이미지: 제목 + 대표 풀이 + 행운 숫자 후보 (빌드할 때 상징마다 미리 만든다)

import { OG_CONTENT_TYPE, OG_SIZE, renderOgImage } from "@/lib/og";
import { getAllSymbols, getSymbolBySlug } from "@/lib/symbols";

export const alt = "꿈해몽 사전 – 상징별 풀이와 행운 숫자 후보";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export function generateStaticParams() {
  return getAllSymbols().map((s) => ({ slug: s.slug }));
}

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const symbol = getSymbolBySlug((await params).slug);
  if (!symbol) {
    return renderOgImage({ eyebrow: "꿈해몽 사전", title: "꿈해몽 사전" });
  }
  return renderOgImage({
    eyebrow: `꿈해몽 사전 · ${symbol.category} · ${symbol.fortune_type}운`,
    title: `${symbol.keyword} 꿈 해몽`,
    description: symbol.meaning.split(/(?<=[.!?])\s+/)[0],
    numbers: symbol.numbers,
    numbersLabel: "행운 숫자 후보",
  });
}
