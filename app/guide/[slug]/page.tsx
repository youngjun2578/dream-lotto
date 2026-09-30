// 가이드 칼럼 /guide/[slug] — 빌드할 때 미리 만든다(SSG). 본문 안 링크로 사전 페이지와 이어진다.

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AdSlot } from "@/components/AdSlot";
import { JsonLd } from "@/components/JsonLd";
import { RichText } from "@/components/RichText";
import { getAllGuides, getGuideBySlug, readingMinutes } from "@/lib/guides";
import { articleJsonLd, breadcrumbJsonLd, pageMetadata } from "@/lib/seo";

type Props = { params: Promise<{ slug: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return getAllGuides().map((g) => ({ slug: g.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const guide = getGuideBySlug((await params).slug);
  if (!guide) return {};
  return pageMetadata({
    title: guide.title,
    description: guide.description,
    path: `/guide/${guide.slug}`,
    type: "article",
    ownImage: true,
  });
}

export default async function GuidePage({ params }: Props) {
  const guide = getGuideBySlug((await params).slug);
  if (!guide) notFound();

  const middle = Math.ceil(guide.sections.length / 2);
  const others = getAllGuides().filter((g) => g.slug !== guide.slug);

  const renderSections = (sections: typeof guide.sections) =>
    sections.map((section) => (
      <section key={section.heading}>
        <h2>{section.heading}</h2>
        {section.blocks.map((block, i) =>
          Array.isArray(block) ? (
            <ul key={i}>
              {block.map((item, j) => (
                <li key={j}>
                  <RichText text={item} />
                </li>
              ))}
            </ul>
          ) : (
            <p key={i}>
              <RichText text={block} />
            </p>
          ),
        )}
      </section>
    ));

  return (
    <article>
      <JsonLd
        data={[
          articleJsonLd({
            title: guide.title,
            description: guide.description,
            path: `/guide/${guide.slug}`,
            section: "꿈 가이드",
          }),
          breadcrumbJsonLd([
            { name: "홈", path: "/" },
            { name: "꿈 가이드", path: "/guide" },
            { name: guide.title, path: `/guide/${guide.slug}` },
          ]),
        ]}
      />
      <nav aria-label="이동 경로" className="mb-4 text-sm text-ink-faint">
        <Link href="/guide" className="hover:text-link hover:underline">
          꿈 가이드
        </Link>
      </nav>
      <h1 className="text-[1.75rem] font-bold leading-tight sm:text-4xl">{guide.title}</h1>
      <p className="mt-3 text-sm text-ink-faint">읽는 데 약 {readingMinutes(guide)}분</p>
      <p className="night-panel mt-6 rounded-2xl p-5 font-medium leading-8">{guide.description}</p>

      <div className="prose-dream mt-2 text-[17px] text-ink">{renderSections(guide.sections.slice(0, middle))}</div>
      <AdSlot name="guide-middle" />
      <div className="prose-dream text-[17px] text-ink">{renderSections(guide.sections.slice(middle))}</div>

      <Link
        href="/"
        className="mt-10 block rounded-2xl bg-btn p-4 text-center font-bold text-btn-ink hover:bg-btn-hover"
      >
        내 꿈 해몽하고 행운 번호 뽑기 →
      </Link>

      <section className="mt-12" aria-labelledby="more-guides">
        <h2 id="more-guides" className="mb-3 text-xl font-bold">
          다른 가이드
        </h2>
        <ul className="space-y-2">
          {others.map((g) => (
            <li key={g.slug}>
              <Link href={`/guide/${g.slug}`} className="font-semibold text-link hover:underline">
                {g.title}
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <AdSlot name="guide-bottom" />
    </article>
  );
}
