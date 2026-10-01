import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "페이지를 찾을 수 없어요" };

export default function NotFound() {
  return (
    <div className="py-16 text-center">
      <h1 className="text-2xl font-bold">페이지를 찾을 수 없어요</h1>
      <p className="mt-2 text-ink-soft">주소가 바뀌었거나 아직 사전에 없는 꿈이에요.</p>
      <div className="mt-6 flex justify-center gap-4 font-semibold text-link">
        <Link href="/" className="hover:underline">
          홈으로
        </Link>
        <Link href="/dream" className="hover:underline">
          꿈해몽 사전
        </Link>
      </div>
    </div>
  );
}
