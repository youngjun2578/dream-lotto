// 상징별 꿈해몽 사전 페이지 — 빌드할 때 data/symbols/*.json 으로 미리 만들어 둔다(SSG)

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AdSlot } from "@/components/AdSlot";
import { Disclaimer } from "@/components/Disclaimer";
import { FortuneBadge } from "@/components/FortuneBadge";
import { JsonLd } from "@/components/JsonLd";
import { LottoBall } from "@/components/LottoBall";
import { breadcrumbJsonLd, dreamArticleJsonLd, dreamPageTitle, pageMetadata } from "@/lib/seo";
import { getAllSymbols, getRelatedSymbols, getSymbolBySlug } from "@/lib/symbols";
import type { DreamSymbol } from "@/lib/types";

type Props = { params: Promise<{ slug: string }> };

// 사전에 없는 주소는 404
export const dynamicParams = false;

export function generateStaticParams() {
  return getAllSymbols().map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const symbol = getSymbolBySlug((await params).slug);
  if (!symbol) return {};
  return pageMetadata({
    title: dreamPageTitle(symbol),
    description: symbol.meaning,
    path: `/dream/${symbol.slug}`,
    type: "article",
    ownImage: true,
  });
}

/** "비슷한 꿈" 링크 목록 */
function RelatedList({ title, symbols }: { title: string; symbols: DreamSymbol[] }) {
  if (symbols.length === 0) return null;
  return (
    <section className="mt-8">
      <h3 className="mb-3 font-semibold">{title}</h3>
      <ul className="flex flex-wrap gap-2">
        {symbols.map((s) => (
          <li key={s.slug}>
            <Link
              href={`/dream/${s.slug}`}
              className="inline-block rounded-full bg-white px-3.5 py-1.5 text-sm ring-1 ring-slate-200 hover:text-violet-700"
            >
              {s.keyword} 꿈
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

export default async function DreamSymbolPage({ params }: Props) {
  const symbol = getSymbolBySlug((await params).slug);
  if (!symbol) notFound();

  const paragraphs = symbol.body.split(/\n{2,}/);
  const middle = Math.ceil(paragraphs.length / 2);
  const related = getRelatedSymbols(symbol);

  return (
    <article>
      <JsonLd
        data={[
          dreamArticleJsonLd(symbol),
          breadcrumbJsonLd([
            { name: "홈", path: "/" },
            { name: "꿈해몽 사전", path: "/dream" },
            { name: `${symbol.keyword} 꿈`, path: `/dream/${symbol.slug}` },
          ]),
        ]}
      />
      <nav aria-label="이동 경로" className="mb-4 text-sm text-slate-500">
        <Link href="/dream" className="hover:text-violet-700">
          꿈해몽 사전
        </Link>{" "}
        › {symbol.category}
      </nav>

      <h1 className="text-2xl font-bold sm:text-3xl">{symbol.keyword} 꿈 해몽</h1>
      <div className="mt-3 flex items-center gap-2 text-sm">
        <FortuneBadge type={symbol.fortune_type} />
        <span className="text-slate-500">
          {symbol.category} · 길몽 강도 {"★".repeat(symbol.weight)}
          {"☆".repeat(3 - symbol.weight)}
        </span>
      </div>

      <p className="mt-6 rounded-xl bg-violet-50 p-4 font-medium leading-7">{symbol.meaning}</p>

      <div className="mt-6 space-y-5 text-[17px] leading-8">
        {paragraphs.slice(0, middle).map((p, i) => (
          <p key={i}>{p}</p>
        ))}
      </div>
      <AdSlot name="dictionary-middle" />
      <div className="mt-5 space-y-5 text-[17px] leading-8">
        {paragraphs.slice(middle).map((p, i) => (
          <p key={i}>{p}</p>
        ))}
      </div>

      {symbol.situations.length > 0 && (
        <section className="mt-10" aria-labelledby="situations-heading">
          <h2 id="situations-heading" className="mb-4 text-xl font-bold">
            상황별 {symbol.keyword} 꿈 풀이
          </h2>
          <div className="space-y-4">
            {symbol.situations.map((sit) => (
              <section
                key={sit.action}
                id={`situation-${sit.action}`}
                className="scroll-mt-20 rounded-xl bg-white p-4 ring-1 ring-slate-200"
              >
                <h3 className="font-bold">{sit.title}</h3>
                <p className="mt-1 leading-7 text-slate-700">{sit.meaning}</p>
              </section>
            ))}
          </div>
        </section>
      )}

      <section className="mt-8">
        <h2 className="mb-2 font-bold">비슷한 꿈 표현</h2>
        <p className="text-sm text-slate-600">{symbol.synonyms.join(", ")}</p>
      </section>

      <section className="mt-8">
        <h2 className="mb-3 font-bold">{symbol.keyword} 꿈 행운 숫자 후보</h2>
        <div className="flex flex-wrap gap-2">
          {symbol.numbers.map((n) => (
            <LottoBall key={n} n={n} />
          ))}
        </div>
        <p className="mt-2 text-xs text-slate-500">
          사전 규칙으로 정한 숫자 후보예요. 실제 추천 번호는 꿈 전체 내용과 날짜에 따라 달라져요.
        </p>
      </section>

      <Link
        href="/"
        className="mt-8 block rounded-xl bg-violet-600 p-4 text-center font-semibold text-white hover:bg-violet-700"
      >
        내 꿈 전체로 해몽하고 번호 뽑기 →
      </Link>

      <section className="mt-10" aria-labelledby="related-heading">
        <h2 id="related-heading" className="text-xl font-bold">
          비슷한 꿈
        </h2>
        <RelatedList title={`같은 ${symbol.category} 꿈`} symbols={related.sameCategory} />
        <RelatedList title={`같은 ${symbol.fortune_type}운 꿈`} symbols={related.sameFortune} />
      </section>

      <AdSlot name="dictionary-bottom" />
      <Disclaimer />
    </article>
  );
}
