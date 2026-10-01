// 해몽 결과 본문: 요약 → 상징 풀이(상황 풀이 우선) → 추천 번호 5게임
// 본인 결과(/result/…)와 공유 페이지(/r/…)가 함께 쓴다. 버튼·광고·관련 링크는 components/ResultPage.tsx 에서 붙인다.

import Link from "next/link";
import type { ReactNode } from "react";
import type { LottoGame, SituationReading, SymbolReading } from "@/lib/types";
import { FortuneBadge } from "./FortuneBadge";
import { GameList } from "./GameList";

export interface ResultData {
  summary: string;
  symbols: SymbolReading[];
  situations: SituationReading[];
  games: LottoGame[];
  date: string;
  counter: number;
}

export function ResultView({
  result,
  emptySymbols,
}: {
  result: ResultData;
  /** 상징을 하나도 못 찾았을 때 상징 풀이 자리에 보여 줄 안내 */
  emptySymbols?: ReactNode;
}) {
  return (
    <div className="space-y-8">
      <section aria-labelledby="summary-heading">
        <h2 id="summary-heading" className="mb-3 text-xl font-bold">
          꿈해몽
        </h2>
        <p className="rounded-2xl border border-line bg-surface p-5 leading-8">{result.summary}</p>
      </section>

      {result.symbols.length > 0 ? (
        <section aria-labelledby="symbols-heading">
          <h3 id="symbols-heading" className="mb-3 font-bold">
            꿈속 상징 풀이
          </h3>
          <ul className="space-y-3">
            {result.symbols.map((s) => {
              const situation = result.situations.find((x) => x.slug === s.slug);
              return (
                <li key={s.slug} className="rounded-2xl border border-line bg-surface p-4">
                  <div className="mb-1 flex flex-wrap items-center gap-2">
                    <strong className="text-lg">{s.keyword}</strong>
                    <FortuneBadge type={s.fortune_type} />
                  </div>
                  {situation && <p className="mb-1 text-sm font-semibold text-accent">상황 풀이 · {situation.title}</p>}
                  <p className="leading-7 text-ink-soft">{s.meaning}</p>
                  <Link
                    href={situation ? `/dream/${s.slug}#situation-${situation.action}` : `/dream/${s.slug}`}
                    className="mt-2 inline-block text-sm font-semibold text-link hover:underline"
                  >
                    {s.keyword} 꿈 자세히 보기 →
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      ) : (
        emptySymbols
      )}

      <section aria-labelledby="numbers-heading" className="scroll-mt-4">
        <div className="mb-3">
          <h2 id="numbers-heading" className="scroll-mt-4 text-xl font-bold">
            추천 번호
          </h2>
          <p className="text-xs text-ink-faint">
            {result.date} 기준{result.counter > 0 ? ` · 다시 뽑기 ${result.counter}회` : ""}
          </p>
        </div>
        {/* 다시 뽑기마다 새로 그려서 공 애니메이션이 처음부터 다시 나오게 한다. */}
        <GameList key={`${result.date}-${result.counter}`} games={result.games} />
        <p className="mt-2 text-xs text-ink-faint">달빛 테두리가 있는 공이 꿈 상징에서 나온 번호이고, 태그는 그 이유예요.</p>
      </section>
    </div>
  );
}
