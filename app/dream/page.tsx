import type { Metadata } from "next";
import Link from "next/link";
import { FortuneBadge } from "@/components/FortuneBadge";
import { JsonLd } from "@/components/JsonLd";
import { categoryPath } from "@/lib/categories";
import { breadcrumbJsonLd, dreamListJsonLd, pageMetadata } from "@/lib/seo";
import { getAllSymbols, getSymbolsByCategory } from "@/lib/symbols";
import { DICTIONARY_CATEGORIES } from "@/lib/types";

export const metadata: Metadata = pageMetadata({
  title: "꿈해몽 사전 – 카테고리별 꿈 상징 모음",
  description: "동물, 사람, 자연, 행동, 물건, 연애·결혼별로 자주 꾸는 꿈의 의미와 상황별 해몽을 정리한 꿈해몽 사전이에요.",
  path: "/dream",
});

export default function DreamIndexPage() {
  return (
    <>
      <JsonLd
        data={[
          dreamListJsonLd(getAllSymbols()),
          breadcrumbJsonLd([
            { name: "홈", path: "/" },
            { name: "꿈해몽 사전", path: "/dream" },
          ]),
        ]}
      />
      <h1 className="text-[1.75rem] font-bold sm:text-4xl">꿈해몽 사전</h1>
      <p className="mt-2 text-ink-soft">
        자주 꾸는 꿈 상징을 카테고리별로 모았어요. 궁금한 꿈을 눌러 상황별 풀이까지 확인해 보세요.
      </p>
      <nav aria-label="카테고리 바로가기" className="mt-5 flex flex-wrap gap-2">
        {DICTIONARY_CATEGORIES.map((category) => (
          <a
            key={category}
            href={`#category-${category}`}
            className="rounded-full border border-line bg-surface px-3.5 py-1.5 text-sm font-semibold text-ink-soft hover:border-link hover:text-link"
          >
            {category}
          </a>
        ))}
      </nav>

      {DICTIONARY_CATEGORIES.map((category) => (
        <section key={category} id={`category-${category}`} className="mt-10 scroll-mt-6">
          <div className="mb-3 flex items-baseline justify-between gap-3">
            <h2 className="text-lg font-bold">{category}</h2>
            <Link href={categoryPath(category)} className="shrink-0 text-sm font-semibold text-link hover:underline">
              {category} 꿈 모아 보기 →
            </Link>
          </div>
          <ul className="grid gap-3 sm:grid-cols-2">
            {getSymbolsByCategory(category).map((s) => (
              <li key={s.slug}>
                <Link
                  href={`/dream/${s.slug}`}
                  className="block h-full rounded-2xl border border-line bg-surface p-4 hover:border-link"
                >
                  <div className="mb-1 flex flex-wrap items-center gap-2">
                    <strong className="text-ink">{s.keyword} 꿈</strong>
                    <FortuneBadge type={s.fortune_type} />
                  </div>
                  <p className="line-clamp-2 text-sm leading-6 text-ink-soft">{s.meaning}</p>
                  <p className="mt-2 text-xs text-ink-faint">상황별 풀이 {s.situations.length}개</p>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </>
  );
}
