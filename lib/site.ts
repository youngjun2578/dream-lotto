// 사이트 공통 설정 (이름, 주소, 고지 문구)

/** 사이트 이름(브랜드). 화면·메타 태그·공유 이미지·구조화 데이터가 모두 이 값을 쓴다. 다른 곳에 직접 적지 않는다. */
export const SITE_NAME = "해몽루";
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

/**
 * 네이버 서치어드바이저 소유 확인 값 → <meta name="naver-site-verification" content="…">.
 * 누구나 볼 수 있는 공개 메타 태그라 비밀값이 아니어서 환경변수로 빼지 않는다.
 * 루트 layout 의 metadata.verification 에서만 쓴다. (구글 소유 확인은 DNS TXT 로 끝나서 여기 없다)
 */
export const NAVER_SITE_VERIFICATION = "f6e2f88fd423c42b3e0c014d6c7d29187349cccb";

/**
 * 운영자 정보. 개인정보처리방침·이용약관·문의·소개 페이지가 모두 여기서 가져다 쓴다. 페이지에 직접 적지 않는다.
 * 연락처는 메일만 공개한다. 전화번호는 사이트 어디에도 넣지 않는다. (tests/privacy.test.ts, npm run check:launch 가 확인)
 */
export const OPERATOR_NAME = "서영준";
/** 개인정보 보호책임자 (운영자가 겸한다) */
export const PRIVACY_OFFICER_NAME = OPERATOR_NAME;
/** 문의 메일 = 개인정보 보호책임자 연락처. 자리표시자로 바뀌면 npm run check:launch 가 실패한다. */
export const CONTACT_EMAIL = "young@haemongru.com";
/** 문의 메일 보유 기간 (개인정보처리방침·문의 페이지가 같은 값을 쓴다. 바꾸면 실제 메일함 정리도 이 기간에 맞춘다) */
export const INQUIRY_RETENTION = "답변을 마친 날부터 1년";

/** 결과·사전·가이드·푸터에 보이는 고지 (재미용, 당첨 보장 없음) */
export const DISCLAIMER = "재미로 보는 꿈해몽이며, 추천 번호는 당첨을 보장하지 않습니다.";

/** 복권 구매 연령 안내 (복권 및 복권기금법: 19세 미만에게는 복권을 팔 수 없다) */
export const AGE_NOTICE = "복권은 만 19세 이상만 구매할 수 있으며, 지나친 구매는 삼가시기 바랍니다.";

/** "/dream/pig" → "https://www.haemongru.com/dream/pig" */
export function absoluteUrl(path = "/"): string {
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}
