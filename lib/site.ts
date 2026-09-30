// 사이트 공통 설정 (이름, 주소, 고지 문구)

export const SITE_NAME = "해몽 로또";
export const SITE_DESCRIPTION =
  "꿈 내용을 입력하면 꿈해몽을 풀어 주고, 꿈에 나온 상징을 바탕으로 로또 번호 6개를 재미로 추천해 드려요.";

/** 배포 주소. Vercel 에서는 환경변수 NEXT_PUBLIC_SITE_URL 에 실제 도메인을 넣는다. */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "");

/** 문의 메일 (초안 — 실제 주소로 바꿔 주세요) */
export const CONTACT_EMAIL = "contact@example.com";

export const DISCLAIMER = "재미로 보는 서비스이며, 추천 번호는 당첨 확률과 무관합니다.";
