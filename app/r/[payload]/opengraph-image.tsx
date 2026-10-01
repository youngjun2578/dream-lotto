// 공유 링크 미리보기 이미지: 해몽 요약 + A게임 번호 (요청이 올 때 만든다)

import { OG_CONTENT_TYPE, OG_SIZE, renderOgImage } from "@/lib/og";
import { buildSharedResult } from "@/lib/service";

export const alt = "공유받은 꿈해몽 결과와 추천 번호";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default async function Image({ params }: { params: Promise<{ payload: string }> }) {
  const result = await buildSharedResult((await params).payload);
  if (!result) {
    // 잘못된 링크여도 깨진 이미지 대신 사이트 기본 그림을 보여 준다.
    return renderOgImage({ eyebrow: "꿈해몽 · 행운 번호", title: "꿈으로 뽑는 행운 번호" });
  }
  const names = result.symbols.slice(0, 2).map((s) => s.keyword);
  return renderOgImage({
    eyebrow: `공유된 꿈해몽 · ${result.date}`,
    title: names.length > 0 ? `${names.join(" · ")} 꿈` : "나의 꿈해몽 결과",
    description: result.summary,
    numbers: result.games[0].numbers,
    numbersLabel: "추천 번호 (A게임)",
    titleMax: 24,
    descriptionMax: 56,
  });
}
