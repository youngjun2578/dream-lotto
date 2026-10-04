// 상징별 꿈해몽 사전 페이지 — 빌드할 때 data/symbols/*.json 으로 미리 만들어 둔다(SSG)

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AdSlot } from "@/components/AdSlot";
import { Disclaimer } from "@/components/Disclaimer";
import { FortuneBadge } from "@/components/FortuneBadge";
import { JsonLd } from "@/components/JsonLd";
import { LottoBall } from "@/components/LottoBall";
import { RichText } from "@/components/RichText";
import { categoryPath } from "@/lib/categories";
import { getGuidesForSymbol } from "@/lib/guides";
import { breadcrumbJsonLd, dreamArticleJsonLd, dreamPageTitle, pageMetadata } from "@/lib/seo";
import { getAllSymbols, getRelatedSymbols, getSymbolBySlug } from "@/lib/symbols";
import { FORTUNE_LABEL, type DreamSymbol } from "@/lib/types";

type Props = { params: Promise<{ slug: string }> };

// 사전에 없는 주소는 아래 notFound() 로 404 를 보여 준다.
// (dynamicParams = false 로 막으면 404 는 같지만 서버 로그에 NoFallbackError 가 찍혀 헷갈린다)

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
    <div className="mt-5">
      <h3 className="mb-3 font-semibold text-ink-soft">{title}</h3>
      <ul className="flex flex-wrap gap-2">
        {symbols.map((s) => (
          <li key={s.slug}>
            <Link
              href={`/dream/${s.slug}`}
              className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface px-3.5 py-1.5 text-sm text-ink hover:border-link hover:text-link"
            >
              {s.keyword} 꿈
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default async function DreamSymbolPage({ params }: Props) {
  const symbol = getSymbolBySlug((await params).slug);
  if (!symbol) notFound();

  const paragraphs = symbol.body.split(/\n{2,}/);
  const middle = Math.ceil(paragraphs.length / 2);
  const related = getRelatedSymbols(symbol);
  const guides = getGuidesForSymbol(symbol.slug);

  return (
    <article>
      <JsonLd
        data={[
          dreamArticleJsonLd(symbol),
          breadcrumbJsonLd([
            { name: "홈", path: "/" },
            { name: "꿈해몽 사전", path: "/dream" },
            { name: `${symbol.category} 꿈해몽`, path: categoryPath(symbol.category) },
            { name: `${symbol.keyword} 꿈`, path: `/dream/${symbol.slug}` },
          ]),
        ]}
      />
      <nav aria-label="이동 경로" className="mb-4 text-sm text-ink-faint">
        <Link href="/dream" className="hover:text-link hover:underline">
          꿈해몽 사전
        </Link>{" "}
        ›{" "}
        <Link href={categoryPath(symbol.category)} className="hover:text-link hover:underline">
          {symbol.category}
        </Link>
      </nav>

      <h1 className="text-[1.75rem] font-bold leading-tight sm:text-4xl">{symbol.keyword} 꿈 해몽</h1>
      <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
        <FortuneBadge type={symbol.fortune_type} />
        <span className="text-ink-soft">
          {symbol.category} · 길몽 강도{" "}
          <span aria-label={`3점 중 ${symbol.weight}점`}>
            {"★".repeat(symbol.weight)}
            {"☆".repeat(3 - symbol.weight)}
          </span>
        </span>
      </div>

      <p className="night-panel mt-6 rounded-2xl p-5 leading-8">{symbol.meaning}</p>

      <div className="prose-dream mt-4 text-[17px]">
        {paragraphs.slice(0, middle).map((p, i) => (
          <p key={i}>
            <RichText text={p} />
          </p>
        ))}
      </div>
      <AdSlot name="dictionary-middle" />
      <div className="prose-dream text-[17px]">
        {paragraphs.slice(middle).map((p, i) => (
          <p key={i}>
            <RichText text={p} />
          </p>
        ))}
      </div>

      {symbol.situations.length > 0 && (
        <section className="mt-12" aria-labelledby="situations-heading">
          <h2 id="situations-heading" className="mb-4 text-xl font-bold">
            상황별 {symbol.keyword} 꿈 풀이
          </h2>
          <div className="space-y-3">
            {symbol.situations.map((sit) => (
              <section
                key={sit.action}
                id={`situation-${sit.action}`}
                className="scroll-mt-6 rounded-2xl border border-line bg-surface p-5 target:border-[color:var(--highlight-ring)]"
              >
                <h3 className="font-bold">{sit.title}</h3>
                <p className="mt-1.5 leading-7 text-ink-soft">{sit.meaning}</p>
              </section>
            ))}
          </div>
        </section>
      )}

      <section className="mt-10">
        <h2 className="mb-2 font-bold">비슷한 꿈 표현</h2>
        <p className="text-sm leading-6 text-ink-soft">{symbol.synonyms.join(", ")}</p>
      </section>

      <section className="mt-10 rounded-2xl border border-line bg-surface p-5">
        <h2 className="mb-3 font-bold">{symbol.keyword} 꿈 행운 숫자 후보</h2>
        <div className="flex flex-wrap gap-2">
          {symbol.numbers.map((n) => (
            <LottoBall key={n} n={n} />
          ))}
        </div>
        <p className="mt-3 text-sm text-ink-soft">
          사전 규칙으로 정한 숫자 후보예요. 실제 추천 번호는 꿈 전체 내용과 날짜에 따라 달라져요.
        </p>
      </section>

      <Link
        href="/"
        className="mt-8 block rounded-2xl bg-btn p-4 text-center font-bold text-btn-ink hover:bg-btn-hover"
      >
        내 꿈 전체로 해몽하고 번호 뽑기 →
      </Link>

      <section className="mt-12" aria-labelledby="related-heading">
        <h2 id="related-heading" className="text-xl font-bold">
          비슷한 꿈
        </h2>
        <RelatedList title={`같은 ${symbol.category} 꿈`} symbols={related.sameCategory} />
        <RelatedList title={`같은 ${FORTUNE_LABEL[symbol.fortune_type]} 꿈`} symbols={related.sameFortune} />
      </section>

      {guides.length > 0 && (
        <section className="mt-10" aria-labelledby="guides-heading">
          <h2 id="guides-heading" className="mb-3 text-xl font-bold">
            함께 읽으면 좋은 글
          </h2>
          <ul className="space-y-2">
            {guides.map((g) => (
              <li key={g.slug}>
                <Link href={`/guide/${g.slug}`} className="font-semibold text-link hover:underline">
                  {g.title}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <AdSlot name="dictionary-bottom" />
      <Disclaimer />
    </article>
  );
}
