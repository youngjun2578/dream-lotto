// 사이트 공통 설정 (이름, 주소, 고지 문구)

export const SITE_NAME = "해몽 로또";
export const SITE_DESCRIPTION =
  "꿈 내용을 입력하면 꿈해몽을 풀어 주고, 꿈에 나온 상징을 바탕으로 로또 번호 6개를 재미로 추천해 드려요.";

/** 대표 도메인 (www 없음). www.haemongru.com 으로 들어오면 next.config.ts 가 여기로 308 리디렉션한다. */
export const DEFAULT_SITE_URL = "https://haemongru.com";

/**
 * 환경변수 값을 "https://도메인" 형태로 다듬는다. 비어 있으면 대표 도메인.
 * 끝의 "/"나 경로는 떼고, "haemongru.com"처럼 https:// 를 빼먹은 값은 붙여 준다.
 */
export function normalizeSiteUrl(value?: string): string {
  const raw = value?.trim() || DEFAULT_SITE_URL;
  return new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`).origin;
}

/**
 * 사이트 주소는 여기 한 곳에서만 정한다.
 * metadataBase, canonical, 공유 미리보기(OG/Twitter), sitemap, robots, 구조화 데이터(JSON-LD),
 * 공유 링크, www 리디렉션(next.config.ts)이 모두 이 값을 쓴다.
 * 다른 주소로 띄울 때만 환경변수 NEXT_PUBLIC_SITE_URL 로 덮어쓴다. (빌드할 때 값이 고정된다)
 */
export const SITE_URL = normalizeSiteUrl(process.env.NEXT_PUBLIC_SITE_URL);

/** 사전·가이드 콘텐츠를 마지막으로 크게 고친 날 (sitemap, 구조화 데이터의 dateModified) */
export const CONTENT_UPDATED_AT = "2026-10-01";

/** 문의 메일 (초안 — 실제 주소로 바꿔 주세요) */
export const CONTACT_EMAIL = "contact@example.com";

/** 결과·사전·가이드·푸터에 보이는 고지 (재미용, 당첨 보장 없음) */
export const DISCLAIMER = "재미로 보는 꿈해몽이며, 추천 번호는 당첨을 보장하지 않습니다.";

/** 복권 구매 연령 안내 (복권 및 복권기금법: 19세 미만에게는 복권을 팔 수 없다) */
export const AGE_NOTICE = "복권은 만 19세 이상만 구매할 수 있으며, 지나친 구매는 삼가시기 바랍니다.";

/** "/dream/pig" → "https://haemongru.com/dream/pig" */
export function absoluteUrl(path = "/"): string {
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

/**
 * www 로 들어온 요청을 대표 주소의 같은 경로로 보내는 리디렉션 규칙 (next.config.ts 의 redirects).
 * permanent: true → 308. 경로와 ?쿼리는 그대로 넘어간다. 대표 주소가 www 로 시작하거나
 * 로컬 주소(localhost 등)면 규칙을 만들지 않는다. (www → www 처럼 자기 자신으로 보내는 루프 방지)
 */
export function wwwRedirects(siteUrl: string = SITE_URL) {
  const { hostname } = new URL(siteUrl);
  if (hostname.startsWith("www.") || !hostname.includes(".")) return [];
  return [
    {
      source: "/:path*",
      has: [{ type: "host" as const, value: `www.${hostname}`.replace(/\./g, "\\.") }],
      destination: `${siteUrl}/:path*`,
      permanent: true,
    },
  ];
}
