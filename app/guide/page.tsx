// 가이드 칼럼 목록 /guide

import type { Metadata } from "next";
import Link from "next/link";
import { JsonLd } from "@/components/JsonLd";
import { getAllGuides, readingMinutes } from "@/lib/guides";
import { breadcrumbJsonLd, pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "꿈 가이드 – 꿈해몽을 더 잘 즐기는 법",
  description: "길몽과 흉몽 구분법, 태몽의 종류, 반복되는 꿈, 꿈을 잘 기억하는 법, 재물운 꿈 모음까지 꿈해몽 가이드를 모았어요.",
  path: "/guide",
});

export default function GuideIndexPage() {
  const guides = getAllGuides();
  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "홈", path: "/" },
          { name: "꿈 가이드", path: "/guide" },
        ])}
      />
      <h1 className="text-[1.75rem] font-bold sm:text-4xl">꿈 가이드</h1>
      <p className="mt-2 text-ink-soft">꿈해몽을 더 깊고 재미있게 즐길 수 있도록 알아 두면 좋은 이야기를 정리했어요.</p>
      <ul className="mt-8 space-y-3">
        {guides.map((g) => (
          <li key={g.slug}>
            <Link href={`/guide/${g.slug}`} className="block rounded-2xl border border-line bg-surface p-5 hover:border-link">
              <h2 className="text-lg font-bold text-ink">{g.title}</h2>
              <p className="mt-1.5 leading-7 text-ink-soft">{g.description}</p>
              <p className="mt-2 text-xs text-ink-faint">읽는 데 약 {readingMinutes(g)}분</p>
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}
