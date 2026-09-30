// 상징별 꿈해몽 사전 페이지 — 빌드할 때 symbols.json 으로 미리 만들어 둔다(SSG)

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AdSlot } from "@/components/AdSlot";
import { Disclaimer } from "@/components/Disclaimer";
import { FortuneBadge } from "@/components/FortuneBadge";
import { LottoBall } from "@/components/LottoBall";
import { getAllSymbols, getSymbolBySlug, getSymbolsByCategory } from "@/lib/symbols";

type Props = { params: Promise<{ slug: string }> };

// symbols.json 에 없는 주소는 404
export const dynamicParams = false;

export function generateStaticParams() {
  return getAllSymbols().map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const symbol = getSymbolBySlug((await params).slug);
  if (!symbol) return {};
  const title = `${symbol.keyword} 꿈 해몽 – 의미와 행운 숫자`;
  return {
    title,
    description: symbol.meaning,
    alternates: { canonical: `/dream/${symbol.slug}` },
    openGraph: { title, description: symbol.meaning, type: "article" },
  };
}

export default async function DreamSymbolPage({ params }: Props) {
  const symbol = getSymbolBySlug((await params).slug);
  if (!symbol) notFound();

  const paragraphs = symbol.body.split(/\n{2,}/);
  const middle = Math.ceil(paragraphs.length / 2);
  const related = getSymbolsByCategory(symbol.category).filter((s) => s.slug !== symbol.slug);

  return (
    <article>
      <nav className="mb-4 text-sm text-slate-500">
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

      {related.length > 0 && (
        <section className="mt-10">
          <h2 className="mb-3 font-bold">다른 {symbol.category} 꿈</h2>
          <ul className="flex flex-wrap gap-2">
            {related.map((s) => (
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
      )}

      <AdSlot name="dictionary-bottom" />
      <Disclaimer />
    </article>
  );
}
