import type { Metadata } from "next";
import Link from "next/link";
import { DreamForm } from "@/components/DreamForm";
import { JsonLd } from "@/components/JsonLd";
import { getAllActions } from "@/lib/actions";
import { websiteJsonLd } from "@/lib/seo";
import { buildVocabulary } from "@/lib/suggest";
import { getAllSymbols, getPopularSymbols } from "@/lib/symbols";

// 제목·설명·공유 설정은 app/layout.tsx 의 기본값을 쓰고, 대표 주소만 지정한다.
export const metadata: Metadata = { alternates: { canonical: "/" } };

export default function HomePage() {
  const popular = getPopularSymbols();
  const symbols = getAllSymbols();
  // 입력 도우미에 필요한 만큼만 화면으로 넘긴다. (본문 같은 긴 글은 빼고)
  const dictionary = symbols.map(({ slug, keyword, synonyms, weight }) => ({ slug, keyword, synonyms, weight }));
  const vocabulary = buildVocabulary(symbols, getAllActions());

  return (
    <>
      <JsonLd data={websiteJsonLd()} />
      <section className="night-sky -mx-4 -mt-8 mb-8 px-4 pb-10 pt-8 text-center sm:mx-0 sm:mt-0 sm:rounded-3xl sm:px-8">
        <p className="text-sm font-semibold text-moon">오늘 밤 꿈, 행운으로 풀어 볼까요?</p>
        <h1 className="mt-2 text-[1.7rem] font-bold leading-snug sm:text-4xl">꿈해몽 로또번호 추첨기</h1>
        <p className="mx-auto mt-3 max-w-md text-night-soft">
          꿈 이야기를 적으면 해몽을 풀어 주고, 꿈속 상징으로 행운 번호를 재미로 뽑아 드려요.
        </p>
      </section>

      <DreamForm dictionary={dictionary} vocabulary={vocabulary} hintKeywords={popular.map((s) => s.keyword)} />

      <section className="mt-12" aria-labelledby="popular-heading">
        <h2 id="popular-heading" className="mb-3 text-lg font-bold">
          인기 꿈 키워드
        </h2>
        <ul className="flex flex-wrap gap-2">
          {popular.map((s) => (
            <li key={s.slug}>
              <Link
                href={`/dream/${s.slug}`}
                className="inline-block rounded-full border border-line bg-surface px-3.5 py-1.5 text-sm text-ink-soft hover:border-link hover:text-link"
              >
                #{s.keyword} 꿈
              </Link>
            </li>
          ))}
        </ul>
        <Link href="/dream" className="mt-4 inline-block text-sm font-semibold text-link hover:underline">
          꿈해몽 사전 전체 보기 →
        </Link>
      </section>
    </>
  );
}
