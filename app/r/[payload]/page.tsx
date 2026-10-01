// 공유 링크 페이지 /r/[payload] — 본인 결과 페이지(/result/…)와 같은 화면에 '나도 해몽 받기'만 다르다.
// DB 없이 주소에 담긴 값으로 같은 해몽과 번호를 다시 보여 준다. 잘못된 주소는 메인으로 보낸다.
// 사람마다 다른 결과라 검색에는 노출하지 않는다(noindex).

import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ResultPage } from "@/components/ResultPage";
import { resultMetadata } from "@/lib/resultMeta";
import { buildSharedResult } from "@/lib/service";

type Props = { params: Promise<{ payload: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { payload } = await params;
  return resultMetadata(await buildSharedResult(payload), payload);
}

export default async function SharedResultPage({ params }: Props) {
  const { payload } = await params;
  const result = await buildSharedResult(payload);
  if (!result) redirect("/");
  return <ResultPage result={result} mode="shared" />;
}
