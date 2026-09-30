import type { Metadata } from "next";
import { StaticPage } from "@/components/StaticPage";
import { CONTACT_EMAIL, SITE_NAME } from "@/lib/site";

export const metadata: Metadata = {
  title: "문의",
  description: `${SITE_NAME} 문의하기`,
};

// 초안: lib/site.ts 의 CONTACT_EMAIL 을 실제 주소로 바꿔 주세요.
export default function ContactPage() {
  return (
    <StaticPage title="문의">
      <p>서비스 이용 중 궁금한 점, 오류 제보, 꿈해몽 사전에 추가했으면 하는 꿈이 있다면 아래 메일로 알려 주세요.</p>
      <p className="text-lg font-semibold">
        📮 <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
      </p>
      <h2>보내 주시면 좋은 내용</h2>
      <ul>
        <li>오류 제보: 어떤 화면에서 어떤 입력을 했을 때 문제가 생겼는지</li>
        <li>사전 추가 요청: 꿈에 나온 상징과 상황</li>
        <li>제휴·광고 문의: 회사명과 연락처</li>
      </ul>
      <p>보통 영업일 기준 2~3일 안에 답변드려요.</p>
    </StaticPage>
  );
}
