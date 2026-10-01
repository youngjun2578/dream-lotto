// 본인 결과 페이지 /result/[payload] — 해몽하기를 누르면 이 주소로 온다.
// 주소에는 꿈 원문이 없고 공유 링크와 같은 값만 있어서, 서버가 그 값으로 같은 해몽과 번호를 다시 만든다.
// 그래서 새로고침·뒤로 가기·북마크해도 같은 결과가 나온다. 잘못된 주소는 메인으로 보낸다.
// 사람마다 다른 결과라 검색에는 노출하지 않는다(noindex, sitemap 제외, robots.txt 로는 막지 않음).

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

export default async function OwnResultPage({ params }: Props) {
  const { payload } = await params;
  const result = await buildSharedResult(payload);
  if (!result) redirect("/");
  return <ResultPage result={result} mode="own" />;
}
