// "[돼지 꿈](/dream/pig)" 표시를 사이트 안 링크로 바꿔 보여 준다. (가이드 본문, 사전 본문)

import Link from "next/link";
import { Fragment } from "react";

const LINK = /\[([^\]]+)\]\((\/[^)\s]*)\)/g;

export function RichText({ text }: { text: string }) {
  const parts: React.ReactNode[] = [];
  let last = 0;
  for (const m of text.matchAll(LINK)) {
    const index = m.index ?? 0;
    if (index > last) parts.push(text.slice(last, index));
    parts.push(
      <Link key={index} href={m[2]}>
        {m[1]}
      </Link>,
    );
    last = index + m[0].length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return (
    <>
      {parts.map((p, i) => (
        <Fragment key={i}>{p}</Fragment>
      ))}
    </>
  );
}
