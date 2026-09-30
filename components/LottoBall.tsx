// 로또 공 (실제 로또처럼 번호대별 색상)

function ballColor(n: number): string {
  if (n <= 10) return "bg-yellow-400 text-yellow-950";
  if (n <= 20) return "bg-sky-400 text-sky-950";
  if (n <= 30) return "bg-rose-400 text-rose-950";
  if (n <= 40) return "bg-slate-400 text-slate-950";
  return "bg-lime-400 text-lime-950";
}

export function LottoBall({ n, highlight = false, small = false }: { n: number; highlight?: boolean; small?: boolean }) {
  const size = small ? "h-9 w-9 text-sm" : "h-11 w-11 text-base";
  const ring = highlight ? "ring-4 ring-violet-500/60 ring-offset-2" : "";
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-full font-bold shadow-sm ${size} ${ballColor(n)} ${ring}`}
    >
      {n}
    </span>
  );
}
