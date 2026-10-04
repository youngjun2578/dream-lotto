// 추천 번호 5게임: 공이 하나씩 굴러 나오고(움직임 줄이기 설정이면 바로 표시), 꿈 번호에는 이유 태그를 붙인다.
// CSS 애니메이션만 써서 서버에서 그린 공유 페이지에서도 똑같이 동작한다. (app/globals.css 의 .ball-roll)

import type { CSSProperties } from "react";
import { reasonTag } from "@/lib/reasonTag";
import { FILL_REASON, type FortuneType, type LottoGame } from "@/lib/types";
import { LottoBall } from "./LottoBall";

const GAME_LABELS = ["A", "B", "C", "D", "E"];

const TAG_STYLE: Record<FortuneType, string> = {
  재물: "bg-[var(--f-money-bg)] text-[var(--f-money-fg)]",
  연애: "bg-[var(--f-love-bg)] text-[var(--f-love-fg)]",
  건강: "bg-[var(--f-health-bg)] text-[var(--f-health-fg)]",
  직장: "bg-[var(--f-work-bg)] text-[var(--f-work-fg)]",
  주의: "bg-[var(--f-warn-bg)] text-[var(--f-warn-fg)]",
  변화: "bg-[var(--f-change-bg)] text-[var(--f-change-fg)]",
  마음: "bg-[var(--f-mind-bg)] text-[var(--f-mind-fg)]",
};

/** CSS 변수(--g, --i)로 애니메이션 순서를 넘긴다. */
function order(g: number, i: number): CSSProperties {
  return { "--g": g, "--i": i } as CSSProperties;
}

export function GameList({ games }: { games: LottoGame[] }) {
  return (
    <ol className="space-y-3">
      {games.map((game, g) => {
        const picks = game.numbers.map((n, j) => ({ n, reason: game.reasons[j] }));
        const dreamPicks = picks.filter((p) => p.reason !== FILL_REASON);
        const fillCount = picks.length - dreamPicks.length;
        return (
          <li key={g} className="rounded-2xl border border-line bg-surface p-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <span className="w-5 shrink-0 text-sm font-bold text-ink-faint">{GAME_LABELS[g]}</span>
              <p className="sr-only">
                {GAME_LABELS[g]} 게임: {game.numbers.join(", ")}
              </p>
              <div className="flex flex-wrap gap-1.5 sm:gap-2" aria-hidden="true">
                {picks.map((p, j) => (
                  <LottoBall
                    key={p.n}
                    n={p.n}
                    size="sm"
                    highlight={p.reason !== FILL_REASON}
                    className="ball-roll"
                    style={order(g, j)}
                  />
                ))}
              </div>
            </div>
            <ul className="mt-3 flex flex-wrap items-center gap-1.5 pl-7" aria-label={`${GAME_LABELS[g]} 게임 번호 이유`}>
              {dreamPicks.map((p) => {
                const tag = reasonTag(p.reason);
                return (
                  <li
                    key={p.n}
                    className={`tag-rise inline-flex items-center gap-1 rounded-full py-0.5 pl-1 pr-2.5 text-xs font-semibold ${
                      tag.fortune ? TAG_STYLE[tag.fortune] : "bg-surface-2 text-ink-soft"
                    }`}
                    style={order(g, 0)}
                  >
                    <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-surface px-1 text-[11px] font-bold text-ink">
                      {p.n}
                    </span>
                    {tag.label}
                  </li>
                );
              })}
              <li className="tag-rise text-xs text-ink-faint" style={order(g, 0)}>
                {dreamPicks.length > 0 ? `나머지 ${fillCount}개: ${FILL_REASON}` : `모든 번호: ${FILL_REASON}`}
              </li>
            </ul>
          </li>
        );
      })}
    </ol>
  );
}
