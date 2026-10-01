import type { Metadata, Viewport } from "next";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { THEME_INIT_SCRIPT } from "@/components/ThemeToggle";
import { absoluteUrl, SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/lib/site";
import "./globals.css";

/**
 * 한글 글꼴 Pretendard(SIL OFL 1.1)는 사이트 안(public/fonts/pretendard)에 포함해서 쓴다.
 * 제작자가 배포하는 'KS X 1001 한글 2,350자' 서브셋을 굵기 3개(400·600·700)만, 굵기마다 파일 1개로 쓴다.
 * 1) 첫 화면은 기기의 한글 글꼴로 바로 그린다. (글꼴을 기다리느라 늦어지지 않게)
 * 2) 페이지를 다 불러온 뒤 글꼴 파일 3개를 받는다.
 * 3) 모두 도착하면 <html class="fonts-ready"> 로 한 번에 바꾼다. 하나라도 실패하면 기기 글꼴을 그대로 쓴다.
 * (글자 범위별로 잘게 쪼갠 파일 수십 개는 처음 적용할 때 파일마다 준비 시간이 들어 휴대폰에서 화면이 멈칫했다)
 */
const FONT_FACES = [
  ["400", "/fonts/pretendard/Pretendard-Regular.subset.woff2"],
  ["600", "/fonts/pretendard/Pretendard-SemiBold.subset.woff2"],
  ["700", "/fonts/pretendard/Pretendard-Bold.subset.woff2"],
] as const;
const FONT_LOADER_SCRIPT = `(function(){var d=document,F=window.FontFace;if(!F||!d.fonts)return;function load(){Promise.all(${JSON.stringify(FONT_FACES)}.map(function(f){var face=new F("Pretendard","url("+f[1]+")",{weight:f[0],display:"swap"});d.fonts.add(face);return face.load()})).then(function(){d.documentElement.classList.add("fonts-ready")},function(){})}if(d.readyState==="complete")load();else window.addEventListener("load",load)})();`;
// 자바스크립트를 끈 브라우저: 처음부터 Pretendard 를 쓴다.
const NOSCRIPT_FONT_CSS =
  FONT_FACES.map(([weight, url]) => `@font-face{font-family:Pretendard;font-weight:${weight};font-display:swap;src:url(${url})}`).join("") +
  ":root{--app-font:Pretendard,var(--system-font)}";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} – 꿈해몽과 행운 번호 추천`,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  openGraph: {
    title: `${SITE_NAME} – 꿈해몽과 행운 번호 추천`,
    description: SITE_DESCRIPTION,
    url: absoluteUrl("/"),
    siteName: SITE_NAME,
    locale: "ko_KR",
    type: "website",
  },
  twitter: { card: "summary_large_image" },
};

export const viewport: Viewport = {
  themeColor: "#10173a",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // data-theme 은 저장된 테마에 따라 브라우저에서 바뀌므로 경고를 끈다.
    <html lang="ko" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
        <script dangerouslySetInnerHTML={{ __html: FONT_LOADER_SCRIPT }} />
        <noscript>
          <style>{NOSCRIPT_FONT_CSS}</style>
        </noscript>
      </head>
      <body className="flex min-h-screen flex-col antialiased">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-3 focus:z-50 focus:rounded-lg focus:bg-surface focus:px-4 focus:py-2 focus:text-ink"
        >
          본문으로 건너뛰기
        </a>
        <SiteHeader />
        <main id="main" className="mx-auto w-full max-w-3xl flex-1 px-4 py-8">
          {children}
        </main>
        <SiteFooter />
      </body>
    </html>
  );
}
