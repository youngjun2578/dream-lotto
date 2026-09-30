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
    <footer className="mt-16 border-t border-slate-200 bg-white">
      <div className="mx-auto max-w-3xl space-y-3 px-4 py-8 text-sm text-slate-500">
        <nav className="flex flex-wrap gap-x-4 gap-y-1">
          {LINKS.map((l) => (
            <Link key={l.href} href={l.href} className="hover:text-violet-700">
              {l.label}
            </Link>
          ))}
        </nav>
        <p>{DISCLAIMER}</p>
        <p>
          © {new Date().getFullYear()} {SITE_NAME}
        </p>
      </div>
    </footer>
  );
}
