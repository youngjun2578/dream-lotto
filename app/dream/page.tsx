import type { Metadata } from "next";
import Link from "next/link";
import { FortuneBadge } from "@/components/FortuneBadge";
import { getSymbolsByCategory } from "@/lib/symbols";
import { CATEGORIES } from "@/lib/types";

export const metadata: Metadata = {
  title: "꿈해몽 사전 – 카테고리별 꿈 상징 모음",
  description: "동물, 사람, 자연, 행동, 물건별로 자주 꾸는 꿈의 의미와 해몽을 정리한 꿈해몽 사전이에요.",
  alternates: { canonical: "/dream" },
};

export default function DreamIndexPage() {
  return (
    <>
      <h1 className="text-2xl font-bold">꿈해몽 사전</h1>
      <p className="mt-2 text-slate-600">자주 꾸는 꿈 상징을 카테고리별로 모았어요. 궁금한 꿈을 눌러 자세한 풀이를 확인해 보세요.</p>

      {CATEGORIES.map((category) => (
        <section key={category} className="mt-10">
          <h2 className="mb-3 text-lg font-bold">{category}</h2>
          <ul className="grid gap-3 sm:grid-cols-2">
            {getSymbolsByCategory(category).map((s) => (
              <li key={s.slug}>
                <Link
                  href={`/dream/${s.slug}`}
                  className="block h-full rounded-xl bg-white p-4 ring-1 ring-slate-200 hover:ring-violet-400"
                >
                  <div className="mb-1 flex items-center gap-2">
                    <strong>{s.keyword} 꿈</strong>
                    <FortuneBadge type={s.fortune_type} />
                  </div>
                  <p className="line-clamp-2 text-sm leading-6 text-slate-600">{s.meaning}</p>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </>
  );
}
