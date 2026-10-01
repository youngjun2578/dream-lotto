// 카테고리별 꿈해몽 모음 페이지 (/dream/category/animal …) — 빌드할 때 미리 만들어 둔다(SSG)

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { FortuneBadge } from "@/components/FortuneBadge";
import { JsonLd } from "@/components/JsonLd";
import { CATEGORY_INFO, categoryPath, getCategoryBySlug } from "@/lib/categories";
import { breadcrumbJsonLd, dreamListJsonLd, pageMetadata } from "@/lib/seo";
import { getSymbolsByCategory } from "@/lib/symbols";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return CATEGORY_INFO.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const category = getCategoryBySlug((await params).slug);
  if (!category) return {};
  return pageMetadata({
    title: `${category.name} 꿈해몽 – 꿈해몽 사전`,
    description: category.intro,
    path: categoryPath(category.name),
  });
}

export default async function DreamCategoryPage({ params }: Props) {
  const category = getCategoryBySlug((await params).slug);
  if (!category) notFound();

  const symbols = getSymbolsByCategory(category.name);
  const path = categoryPath(category.name);

  return (
    <>
      <JsonLd
        data={[
          dreamListJsonLd(symbols, { name: `${category.name} 꿈해몽`, path }),
          breadcrumbJsonLd([
            { name: "홈", path: "/" },
            { name: "꿈해몽 사전", path: "/dream" },
            { name: `${category.name} 꿈해몽`, path },
          ]),
        ]}
      />
      <nav aria-label="이동 경로" className="mb-4 text-sm text-ink-faint">
        <Link href="/dream" className="hover:text-link hover:underline">
          꿈해몽 사전
        </Link>{" "}
        › {category.name}
      </nav>

      <h1 className="text-[1.75rem] font-bold sm:text-4xl">{category.name} 꿈해몽</h1>
      <p className="mt-2 leading-7 text-ink-soft">{category.intro}</p>

      <ul className="mt-6 grid gap-3 sm:grid-cols-2" aria-label={`${category.name} 꿈 ${symbols.length}개`}>
        {symbols.map((s) => (
          <li key={s.slug}>
            <Link href={`/dream/${s.slug}`} className="block h-full rounded-2xl border border-line bg-surface p-4 hover:border-link">
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

      <section className="mt-12" aria-labelledby="other-categories-heading">
        <h2 id="other-categories-heading" className="mb-3 text-lg font-bold">
          다른 카테고리
        </h2>
        <ul className="flex flex-wrap gap-2">
          {CATEGORY_INFO.filter((c) => c.slug !== category.slug).map((c) => (
            <li key={c.slug}>
              <Link
                href={categoryPath(c.name)}
                className="inline-block rounded-full border border-line bg-surface px-3.5 py-1.5 text-sm font-semibold text-ink-soft hover:border-link hover:text-link"
              >
                {c.name} 꿈
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
