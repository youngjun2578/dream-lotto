// 사이트 기본 공유 이미지 (다른 이미지가 없는 페이지에 쓰인다)

import { OG_CONTENT_TYPE, OG_SIZE, renderOgImage } from "@/lib/og";
import { SITE_NAME } from "@/lib/site";

export const alt = `${SITE_NAME} – 꿈해몽과 행운 번호 추천`;
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default function Image() {
  return renderOgImage({
    eyebrow: "꿈해몽 · 행운 번호",
    title: "꿈으로 뽑는 행운 번호",
    description: "꿈 이야기를 적으면 꿈해몽을 풀어 주고, 꿈속 상징으로 로또 번호를 재미로 뽑아 드려요.",
    numbers: [3, 12, 20, 27, 34, 42],
  });
}
