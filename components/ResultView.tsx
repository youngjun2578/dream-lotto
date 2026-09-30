// 해몽 결과 화면 (홈의 결과 영역과 공유 링크 페이지에서 함께 쓴다)

import Link from "next/link";
import type { ReactNode } from "react";
import { FILL_REASON, type LottoGame, type SituationReading, type SymbolReading } from "@/lib/types";
import { AdSlot } from "./AdSlot";
import { Disclaimer } from "./Disclaimer";
import { FortuneBadge } from "./FortuneBadge";
import { LottoBall } from "./LottoBall";

export interface ResultData {
  summary: string;
  symbols: SymbolReading[];
  situations: SituationReading[];
  games: LottoGame[];
  date: string;
  counter: number;
}

const GAME_LABELS = ["A", "B", "C", "D", "E"];

export function ResultView({
  result,
  numberActions,
  afterNumbers,
}: {
  result: ResultData;
  /** "추천 번호" 제목 옆 버튼 (예: 다시 뽑기) */
  numberActions?: ReactNode;
  /** 번호 목록 바로 아래 (예: 공유 버튼) */
  afterNumbers?: ReactNode;
}) {
  return (
    <div className="space-y-8">
      <section aria-labelledby="summary-heading">
        <h2 id="summary-heading" className="mb-3 text-xl font-bold">
          꿈해몽
        </h2>
        <p className="rounded-2xl border border-line bg-surface p-5 leading-8">{result.summary}</p>
      </section>

      {result.symbols.length > 0 && (
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
      )}

      <section aria-labelledby="numbers-heading">
        <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 id="numbers-heading" className="text-xl font-bold">
              추천 번호
            </h2>
            <p className="text-xs text-ink-faint">
              {result.date} 기준{result.counter > 0 ? ` · 다시 뽑기 ${result.counter}회` : ""}
            </p>
          </div>
          {numberActions}
        </div>
        <ol className="space-y-3">
          {result.games.map((game, i) => {
            const dreamPicks = game.numbers
              .map((n, j) => ({ n, reason: game.reasons[j] }))
              .filter((p) => p.reason !== FILL_REASON);
            return (
              <li key={i} className="rounded-2xl border border-line bg-surface p-4">
                <div className="flex items-center gap-2 sm:gap-3">
                  <span className="w-5 text-sm font-bold text-ink-faint" aria-label={`${GAME_LABELS[i]} 게임`}>
                    {GAME_LABELS[i]}
                  </span>
                  <div className="flex flex-wrap gap-1.5 sm:gap-2">
                    {game.numbers.map((n, j) => (
                      <LottoBall key={n} n={n} size="sm" highlight={game.reasons[j] !== FILL_REASON} />
                    ))}
                  </div>
                </div>
                <p className="mt-2 pl-7 text-xs leading-5 text-ink-soft">
                  {dreamPicks.length > 0
                    ? dreamPicks.map((p) => `${p.n}: ${p.reason}`).join(" · ") + ` · 나머지: ${FILL_REASON}`
                    : `모든 번호: ${FILL_REASON}`}
                </p>
              </li>
            );
          })}
        </ol>
        <p className="mt-2 text-xs text-ink-faint">달빛 테두리가 있는 공이 꿈 상징에서 나온 번호예요.</p>
        {afterNumbers}
      </section>

      <AdSlot name="result-bottom" />
      <Disclaimer />
    </div>
  );
}
