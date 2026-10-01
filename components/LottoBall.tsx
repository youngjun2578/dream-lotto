// 로또 공: 번호 구간별 색 (1~10 노랑, 11~20 파랑, 21~30 빨강, 31~40 회색, 41~45 초록)
// 꿈 상징에서 나온 번호는 달빛색 테두리로 표시한다.

import type { CSSProperties } from "react";
import { ballColor } from "@/lib/ballColors";

const SIZE = {
  sm: "h-9 w-9 text-sm",
  md: "h-11 w-11 text-base",
} as const;

export function LottoBall({
  n,
  highlight = false,
  size = "md",
  className = "",
  style,
}: {
  n: number;
  highlight?: boolean;
  size?: keyof typeof SIZE;
  className?: string;
  style?: CSSProperties;
}) {
  const c = ballColor(n);
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-full font-bold tabular-nums shadow-sm ${SIZE[size]} ${
        highlight ? "ring-[3px] ring-[color:var(--highlight-ring)] ring-offset-2 ring-offset-[color:var(--surface)]" : ""
      } ${className}`}
      style={{
        backgroundColor: c.bg,
        color: c.fg,
        backgroundImage: "radial-gradient(circle at 32% 28%, rgb(255 255 255 / 0.5), transparent 45%)",
        ...style,
      }}
    >
      {n}
    </span>
  );
}
