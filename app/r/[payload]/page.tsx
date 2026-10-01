// 공유 링크 페이지 /r/[payload] — DB 없이 주소에 담긴 값으로 같은 해몽과 번호를 다시 보여 준다.
// 잘못된 주소는 메인으로 보낸다. 사람마다 다른 결과라 검색에는 노출하지 않는다(noindex).

import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ResultView } from "@/components/ResultView";
import { ShareButtons } from "@/components/ShareButtons";
import { pageMetadata } from "@/lib/seo";
import { buildSharedResult } from "@/lib/service";

type Props = { params: Promise<{ payload: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { payload } = await params;
  const result = await buildSharedResult(payload);
  if (!result) return { title: "꿈해몽 결과", robots: { index: false, follow: true } };
  const summary = result.summary.length > 110 ? `${result.summary.slice(0, 109)}…` : result.summary;
  return pageMetadata({
    title: "공유받은 꿈해몽 결과",
    description: summary,
    path: `/r/${payload}`,
    noindex: true,
    ownImage: true,
  });
}

export default async function SharedResultPage({ params }: Props) {
  const { payload } = await params;
  const result = await buildSharedResult(payload);
  if (!result) redirect("/");

  const cta = (
    <Link
      href="/"
      className="inline-block rounded-2xl bg-moon px-6 py-3 font-bold text-[#1a1640] hover:brightness-105"
    >
      나도 해몽 받기
    </Link>
  );

  return (
    <>
      <section className="night-sky -mx-4 -mt-8 mb-8 px-4 pb-8 pt-7 text-center sm:mx-0 sm:mt-0 sm:rounded-3xl sm:px-8">
        <p className="text-sm font-semibold text-moon">공유된 꿈해몽</p>
        <h1 className="mt-2 text-[1.6rem] font-bold leading-snug sm:text-3xl">공유받은 꿈해몽 결과예요</h1>
        <p className="mx-auto mt-2 max-w-md text-sm text-night-soft">
          꿈 내용은 공유되지 않아요. 해몽과 {result.date} 기준 추천 번호만 볼 수 있어요.
        </p>
        <div className="mt-5">{cta}</div>
      </section>

      <ResultView
        result={result}
        afterNumbers={
          <>
            <div className="night-panel mt-5 rounded-2xl p-5 text-center">
              <p className="font-bold">내 꿈은 어떤 뜻일까요?</p>
              <p className="mt-1 text-sm text-night-soft">꿈 이야기를 적으면 해몽과 행운 번호를 바로 뽑아 드려요.</p>
              <div className="mt-4">{cta}</div>
            </div>
            <ShareButtons share={result.share} />
          </>
        }
      />
    </>
  );
}
