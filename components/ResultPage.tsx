// 결과 페이지 전체 (본인 결과 /result/… 와 공유 페이지 /r/… 가 함께 쓴다. 버튼만 다르다)
// 순서: 제목·찾은 상징 태그 → 해몽 요약 → 상징 풀이 → 번호 5게임 → 광고 자리 → 버튼 → 관련 사전 링크 → 고지
// 광고 규칙: 광고는 번호 바로 아래 한 곳. 버튼과 오클릭이 생기지 않게 광고와 버튼 사이를 넉넉히 띄운다.

import Link from "next/link";
import { getActionBySlug } from "@/lib/actions";
import { resultTitle } from "@/lib/resultMeta";
import { nextDrawShare, resultPath } from "@/lib/share";
import { getPopularSymbols, getRelatedSymbols, getSymbolBySlug } from "@/lib/symbols";
import type { DreamSymbol, InterpretResponse } from "@/lib/types";
import { AdSlot } from "./AdSlot";
import { Disclaimer } from "./Disclaimer";
import { HintWords } from "./HintWords";
import { ResultActions } from "./ResultActions";
import { ResultView } from "./ResultView";
import { ScrollToTop } from "./ScrollToTop";

/** "관련 꿈해몽 사전"에 더 보여 줄 상징 수 */
const RELATED_LIMIT = 6;

const CTA = "inline-block rounded-2xl bg-moon px-6 py-3 font-bold text-[#1a1640] hover:brightness-105";
const LINK_CHIP =
  "inline-flex items-center rounded-full border border-line bg-surface px-3.5 py-1.5 text-sm text-ink hover:border-link hover:text-link";

/** 찾은 상징과 같은 카테고리·운세의 다른 상징 (찾은 상징이 없으면 인기 상징) */
function relatedSymbols(matched: DreamSymbol[]): DreamSymbol[] {
  if (matched.length === 0) return getPopularSymbols().slice(0, RELATED_LIMIT);
  const slugs = new Set(matched.map((s) => s.slug));
  const related = matched.flatMap((s) => {
    const { sameFortune, sameCategory } = getRelatedSymbols(s);
    return [...sameFortune, ...sameCategory];
  });
  return [...new Map(related.filter((s) => !slugs.has(s.slug)).map((s) => [s.slug, s])).values()].slice(0, RELATED_LIMIT);
}

export function ResultPage({ result, mode }: { result: InterpretResponse; mode: "own" | "shared" }) {
  const matched = result.symbols.map((s) => getSymbolBySlug(s.slug)).filter((s): s is DreamSymbol => !!s);
  const tags = result.symbols.map((s) => {
    const situation = result.situations.find((x) => x.slug === s.slug);
    const verb = situation ? getActionBySlug(situation.action)?.verb : undefined;
    return { slug: s.slug, label: verb ? `${s.keyword} · ${verb}` : s.keyword };
  });
  const next = mode === "own" ? nextDrawShare(result.share) : null;

  return (
    <>
      <ScrollToTop resultKey={result.share} />

      <section className="night-sky -mx-4 -mt-8 mb-8 px-4 pb-8 pt-7 text-center sm:mx-0 sm:mt-0 sm:rounded-3xl sm:px-8">
        {mode === "own" ? (
          <>
            <p className="text-sm font-semibold text-moon">나의 꿈해몽 결과 · {result.date} 기준</p>
            <h1 className="mt-2 text-[1.6rem] font-bold leading-snug sm:text-3xl">{resultTitle(result)}</h1>
            <p className="mx-auto mt-2 max-w-md text-sm text-night-soft">
              꿈 내용은 주소에 남지 않아요. 찾은 상징으로 해몽과 번호를 만들었어요.
            </p>
          </>
        ) : (
          <>
            <p className="text-sm font-semibold text-moon">공유된 꿈해몽</p>
            <h1 className="mt-2 text-[1.6rem] font-bold leading-snug sm:text-3xl">공유받은 꿈해몽 결과예요</h1>
            <p className="mx-auto mt-2 max-w-md text-sm text-night-soft">
              꿈 내용은 공유되지 않아요. 해몽과 {result.date} 기준 추천 번호만 볼 수 있어요.
            </p>
          </>
        )}
        {tags.length > 0 && (
          <ul aria-label="찾은 꿈 상징" className="mt-4 flex flex-wrap justify-center gap-2">
            {tags.map((tag) => (
              <li key={tag.slug} className="rounded-full bg-white/10 px-3 py-1 text-sm font-semibold text-night-ink">
                #{tag.label}
              </li>
            ))}
          </ul>
        )}
        {mode === "shared" && (
          <div className="mt-5">
            <Link href="/" className={CTA}>
              나도 해몽 받기
            </Link>
          </div>
        )}
      </section>

      <ResultView
        result={result}
        emptySymbols={
          <div role="note" className="rounded-2xl border border-line bg-surface-2 p-5">
            <p className="font-bold">꿈속 상징을 찾지 못했어요. 이런 단어를 넣어 보세요</p>
            <p className="mt-1 text-sm text-ink-soft">
              꿈에 나온 동물·사람·물건이나 한 일을 적으면 더 자세히 풀이해요. 단어를 누르면 입력창으로 돌아가 꿈 끝에
              더해져요.
            </p>
            <HintWords words={getPopularSymbols().map((s) => s.keyword)} />
            <Link href="/" className="mt-4 inline-block text-sm font-semibold text-link hover:underline">
              ← 꿈 다시 적으러 가기
            </Link>
          </div>
        }
      />

      {/* 광고는 번호 바로 아래 한 곳. 아래 버튼과는 mt-14(56px) 이상 떨어뜨린다. */}
      <AdSlot name="result-below-numbers" />

      <div className="mt-14">
        {mode === "own" ? (
          <ResultActions share={result.share} nextPath={next ? resultPath(next) : null} />
        ) : (
          <section className="night-panel rounded-2xl p-5 text-center">
            <p className="font-bold">내 꿈은 어떤 뜻일까요?</p>
            <p className="mt-1 text-sm text-night-soft">꿈 이야기를 적으면 해몽과 행운 번호를 바로 뽑아 드려요.</p>
            <div className="mt-4">
              <Link href="/" className={CTA}>
                나도 해몽 받기
              </Link>
            </div>
          </section>
        )}
      </div>

      <section aria-labelledby="related-heading" className="mt-12">
        <h2 id="related-heading" className="text-xl font-bold">
          관련 꿈해몽 사전
        </h2>
        {matched.length > 0 && (
          <div className="mt-4">
            <h3 className="mb-2 font-semibold text-ink-soft">이번 꿈의 상징</h3>
            <ul className="flex flex-wrap gap-2">
              {matched.map((s) => (
                <li key={s.slug}>
                  <Link href={`/dream/${s.slug}`} className={LINK_CHIP}>
                    {s.keyword} 꿈 해몽
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
        <div className="mt-4">
          <h3 className="mb-2 font-semibold text-ink-soft">{matched.length > 0 ? "함께 보면 좋은 꿈" : "많이 찾는 꿈"}</h3>
          <ul className="flex flex-wrap gap-2">
            {relatedSymbols(matched).map((s) => (
              <li key={s.slug}>
                <Link href={`/dream/${s.slug}`} className={LINK_CHIP}>
                  {s.keyword} 꿈
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <Link href="/dream" className="mt-4 inline-block text-sm font-semibold text-link hover:underline">
          꿈해몽 사전 전체 보기 →
        </Link>
      </section>

      <Disclaimer />
    </>
  );
}
