import Link from "next/link";
import { SITE_NAME } from "@/lib/site";

export function SiteHeader() {
  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
        <Link href="/" className="text-lg font-bold text-violet-700">
          🌙 {SITE_NAME}
        </Link>
        <nav className="flex gap-4 text-sm text-slate-600">
          <Link href="/dream" className="hover:text-violet-700">
            꿈해몽 사전
          </Link>
          <Link href="/about" className="hover:text-violet-700">
            소개
          </Link>
        </nav>
      </div>
    </header>
  );
}
