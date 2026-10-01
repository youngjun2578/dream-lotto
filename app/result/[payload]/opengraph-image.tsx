// 결과 페이지 미리보기 이미지 (공유 링크와 같은 그림, lib/resultOg.tsx)

import { OG_CONTENT_TYPE, OG_SIZE, RESULT_OG_ALT, renderResultOgImage } from "@/lib/resultOg";

export const alt = RESULT_OG_ALT;
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default async function Image({ params }: { params: Promise<{ payload: string }> }) {
  return renderResultOgImage((await params).payload);
}
