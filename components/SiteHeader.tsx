import Link from "next/link";
import { SITE_NAME } from "@/lib/site";
import { MoonLogo } from "./MoonLogo";
import { ThemeToggle } from "./ThemeToggle";

const NAV = [
  { href: "/dream", label: "꿈해몽 사전" },
  { href: "/about", label: "소개" },
];

export function SiteHeader() {
  return (
    <header className="night-sky border-b border-white/10">
      <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-2.5">
        <Link href="/" className="flex items-center gap-2 text-lg font-bold text-night-ink">
          <MoonLogo />
          {SITE_NAME}
        </Link>
        <nav aria-label="주요 메뉴" className="flex items-center gap-1 text-sm">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-full px-3 py-2 text-night-soft hover:bg-white/10 hover:text-night-ink"
            >
              {item.label}
            </Link>
          ))}
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}
