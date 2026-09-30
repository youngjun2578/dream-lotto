import Link from "next/link";
import { DISCLAIMER, SITE_NAME } from "@/lib/site";

const LINKS = [
  { href: "/about", label: "소개" },
  { href: "/privacy", label: "개인정보처리방침" },
  { href: "/terms", label: "이용약관" },
  { href: "/contact", label: "문의" },
];

export function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-line bg-surface">
      <div className="mx-auto max-w-3xl space-y-3 px-4 py-8 text-sm text-ink-soft">
        <nav aria-label="사이트 정보" className="flex flex-wrap gap-x-4 gap-y-2">
          {LINKS.map((l) => (
            <Link key={l.href} href={l.href} className="hover:text-link hover:underline">
              {l.label}
            </Link>
          ))}
        </nav>
        <p>{DISCLAIMER}</p>
        <p>{SITE_NAME}는 복권 판매·발행 사업자와 관련 없는 비공식 재미 서비스입니다.</p>
        <p className="text-ink-faint">
          © {new Date().getFullYear()} {SITE_NAME} · 글꼴 Pretendard (SIL Open Font License 1.1)
        </p>
      </div>
    </footer>
  );
}
