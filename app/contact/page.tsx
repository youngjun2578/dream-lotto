import type { Metadata } from "next";
import Link from "next/link";
import { StaticPage } from "@/components/StaticPage";
import { pageMetadata } from "@/lib/seo";
import { CONTACT_EMAIL, INQUIRY_RETENTION, OPERATOR_NAME, PRIVACY_OFFICER_NAME, SITE_NAME } from "@/lib/site";

export const metadata: Metadata = pageMetadata({
  title: "문의",
  description: `${SITE_NAME} 문의하기`,
  path: "/contact",
});

// 운영자 이름, 문의 메일, 메일 보유 기간은 lib/site.ts 에서 바꾼다. (개인정보처리방침과 같은 값을 쓴다)
export default function ContactPage() {
  return (
    <StaticPage title="문의">
      <p>서비스 이용 중 궁금한 점, 오류 제보, 꿈해몽 사전에 추가했으면 하는 꿈이 있다면 아래 메일로 알려 주세요.</p>
      <p className="text-lg font-semibold">
        <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
      </p>
      <ul>
        <li>운영자: {OPERATOR_NAME}</li>
        <li>개인정보 보호책임자: {PRIVACY_OFFICER_NAME}</li>
      </ul>
      <p>문의는 메일로만 받아요. 개인정보 열람·정정·삭제 요청도 이 메일로 보내 주세요.</p>
      <h2>보내 주시면 좋은 내용</h2>
      <ul>
        <li>오류 제보: 어떤 화면에서 어떤 입력을 했을 때 문제가 생겼는지</li>
        <li>사전 추가 요청: 꿈에 나온 상징과 상황</li>
        <li>제휴·광고 문의: 회사명과 연락처</li>
      </ul>
      <p>보통 영업일 기준 2~3일 안에 답변드려요.</p>
      <h2>보내 주신 메일은 이렇게 다뤄요</h2>
      <p>
        메일은 Cloudflare의 메일 전달 서비스를 거쳐 운영자의 메일함(Gmail)에 보관되고, 답변하는 데에만 써요.{" "}
        {INQUIRY_RETENTION}이 지나면 지워요. 자세한 내용은 <Link href="/privacy">개인정보처리방침</Link>에서 볼 수
        있어요.
      </p>
    </StaticPage>
  );
}
