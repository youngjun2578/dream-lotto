import Link from "next/link";
import { SITE_NAME } from "@/lib/site";
import { MoonLogo } from "./MoonLogo";
import { ThemeToggle } from "./ThemeToggle";

// short: 좁은 휴대폰 화면(640px 미만)에서 쓰는 짧은 이름
const NAV = [
  { href: "/dream", label: "꿈해몽 사전", short: "사전" },
  { href: "/guide", label: "가이드", short: "가이드" },
  { href: "/about", label: "소개", short: "소개" },
];

export function SiteHeader() {
  return (
    <header className="night-sky border-b border-white/10">
      <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-2.5">
        <Link href="/" className="flex shrink-0 items-center gap-2 whitespace-nowrap text-lg font-bold text-night-ink">
          <MoonLogo />
          {SITE_NAME}
        </Link>
        <nav aria-label="주요 메뉴" className="flex items-center gap-0.5 whitespace-nowrap text-sm sm:gap-1">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-full px-2.5 py-2 text-night-soft hover:bg-white/10 hover:text-night-ink sm:px-3"
            >
              <span className="sm:hidden">{item.short}</span>
              <span className="hidden sm:inline">{item.label}</span>
            </Link>
          ))}
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}
