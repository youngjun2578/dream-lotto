import { FORTUNE_LABEL, type FortuneType } from "@/lib/types";

// 색은 app/globals.css 의 --f-* 토큰 (라이트/다크 모두 명도 대비 AA 이상)
const STYLE: Record<FortuneType, string> = {
  재물: "bg-[var(--f-money-bg)] text-[var(--f-money-fg)]",
  연애: "bg-[var(--f-love-bg)] text-[var(--f-love-fg)]",
  건강: "bg-[var(--f-health-bg)] text-[var(--f-health-fg)]",
  직장: "bg-[var(--f-work-bg)] text-[var(--f-work-fg)]",
  주의: "bg-[var(--f-warn-bg)] text-[var(--f-warn-fg)]",
  변화: "bg-[var(--f-change-bg)] text-[var(--f-change-fg)]",
  마음: "bg-[var(--f-mind-bg)] text-[var(--f-mind-fg)]",
};

export function FortuneBadge({ type }: { type: FortuneType }) {
  return <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${STYLE[type]}`}>{FORTUNE_LABEL[type]}</span>;
}
