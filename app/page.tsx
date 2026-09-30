import Link from "next/link";
import { DreamForm } from "@/components/DreamForm";
import { getPopularSymbols } from "@/lib/symbols";

export default function HomePage() {
  const popular = getPopularSymbols();

  return (
    <>
      <section className="mb-6 text-center">
        <h1 className="text-2xl font-bold sm:text-3xl">꿈해몽 로또번호 추첨기</h1>
        <p className="mt-2 text-slate-600">꿈 이야기를 적으면 해몽을 풀어 주고, 꿈속 상징으로 행운 번호를 뽑아 드려요.</p>
      </section>

      <DreamForm />

      <section className="mt-12">
        <h2 className="mb-3 text-lg font-bold">인기 꿈 키워드</h2>
        <ul className="flex flex-wrap gap-2">
          {popular.map((s) => (
            <li key={s.slug}>
              <Link
                href={`/dream/${s.slug}`}
                className="inline-block rounded-full bg-white px-3.5 py-1.5 text-sm ring-1 ring-slate-200 hover:bg-violet-50 hover:text-violet-700"
              >
                #{s.keyword} 꿈
              </Link>
            </li>
          ))}
        </ul>
        <Link href="/dream" className="mt-4 inline-block text-sm text-violet-700 hover:underline">
          꿈해몽 사전 전체 보기 →
        </Link>
      </section>
    </>
  );
}
