import type { FortuneType } from "@/lib/types";

const STYLE: Record<FortuneType, string> = {
  재물: "bg-amber-100 text-amber-800",
  연애: "bg-pink-100 text-pink-800",
  건강: "bg-emerald-100 text-emerald-800",
  직장: "bg-blue-100 text-blue-800",
  주의: "bg-red-100 text-red-800",
};

export function FortuneBadge({ type }: { type: FortuneType }) {
  return <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${STYLE[type]}`}>{type}운</span>;
}
