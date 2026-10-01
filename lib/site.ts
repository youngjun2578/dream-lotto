// 사이트 공통 설정 (이름, 주소, 고지 문구)

export const SITE_NAME = "해몽 로또";
export const SITE_DESCRIPTION =
  "꿈 내용을 입력하면 꿈해몽을 풀어 주고, 꿈에 나온 상징을 바탕으로 로또 번호 6개를 재미로 추천해 드려요.";

/**
 * 대표 도메인 (www 있음).
 * 루트 도메인 → www 308 리디렉션은 Vercel 대시보드(Domains)가 처리한다.
 * 코드(next.config 의 redirects, middleware/proxy)에서는 리디렉션을 걸지 않는다. 양쪽에서 걸면 루프가 생길 수 있다.
 */
export const DEFAULT_SITE_URL = "https://www.haemongru.com";

/**
 * 환경변수 값을 "https://도메인" 형태로 다듬는다. 비어 있으면 대표 도메인.
 * 끝의 "/"나 경로는 떼고(끝 슬래시 없음), https:// 를 빼먹은 값은 붙여 준다.
 */
export function normalizeSiteUrl(value?: string): string {
  const raw = value?.trim() || DEFAULT_SITE_URL;
  return new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`).origin;
}

/**
 * 사이트 주소는 여기 한 곳에서만 정한다.
 * metadataBase, canonical, 공유 미리보기(OG/Twitter) 주소와 이미지, sitemap, robots,
 * 구조화 데이터(JSON-LD)의 url·@id, 공유 링크(/r/...)가 모두 이 값을 쓴다.
 * 요청이 어느 주소(vercel.app 미리보기, 루트 도메인 등)로 들어왔는지는 보지 않는다.
 * 다른 주소로 띄울 때만 환경변수 NEXT_PUBLIC_SITE_URL 로 덮어쓴다. (빌드할 때 값이 고정된다)
 */
export const SITE_URL = normalizeSiteUrl(process.env.NEXT_PUBLIC_SITE_URL);

/** 사전·가이드 콘텐츠를 마지막으로 크게 고친 날 (sitemap, 구조화 데이터의 dateModified) */
export const CONTENT_UPDATED_AT = "2026-10-01";

/** 문의 메일 (자리표시자 — 실제 주소로 바꿔 주세요. 바꾸기 전에는 npm run check:launch 가 실패한다) */
export const CONTACT_EMAIL = "contact@example.com";

/** 결과·사전·가이드·푸터에 보이는 고지 (재미용, 당첨 보장 없음) */
export const DISCLAIMER = "재미로 보는 꿈해몽이며, 추천 번호는 당첨을 보장하지 않습니다.";

/** 복권 구매 연령 안내 (복권 및 복권기금법: 19세 미만에게는 복권을 팔 수 없다) */
export const AGE_NOTICE = "복권은 만 19세 이상만 구매할 수 있으며, 지나친 구매는 삼가시기 바랍니다.";

/** "/dream/pig" → "https://www.haemongru.com/dream/pig" */
export function absoluteUrl(path = "/"): string {
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}
