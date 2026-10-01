import type { Metadata } from "next";
import { StaticPage } from "@/components/StaticPage";
import { pageMetadata } from "@/lib/seo";
import { DISCLAIMER, SITE_NAME } from "@/lib/site";

export const metadata: Metadata = pageMetadata({
  title: "이용약관",
  description: `${SITE_NAME} 이용약관`,
  path: "/terms",
});

// 초안: 실제 운영 전 검토가 필요합니다.
export default function TermsPage() {
  return (
    <StaticPage title="이용약관" updated="2026-09-30">
      <h2>1. 목적</h2>
      <p>이 약관은 {SITE_NAME}(이하 &lsquo;서비스&rsquo;)를 이용하는 조건과 절차를 정합니다.</p>

      <h2>2. 서비스의 성격</h2>
      <p>
        서비스가 제공하는 꿈해몽과 추천 번호는 오락을 위한 콘텐츠입니다. {DISCLAIMER} 서비스는 복권 구매를 권유하지
        않으며, 특정 번호의 당첨을 보장하지 않습니다.
      </p>

      <h2>3. 이용자의 책임</h2>
      <ul>
        <li>이용자는 서비스의 결과를 참고용으로만 활용해야 합니다.</li>
        <li>복권 구매 여부와 금액은 전적으로 이용자 본인의 판단과 책임입니다. 복권은 만 19세 이상만 구매할 수 있습니다.</li>
        <li>다른 사람의 개인정보나 불쾌감을 주는 내용을 입력하지 말아 주세요.</li>
        <li>자동화된 방법으로 서비스에 과도한 요청을 보내 운영을 방해해서는 안 됩니다.</li>
      </ul>

      <h2>4. 책임의 제한</h2>
      <p>
        서비스는 해몽 내용이나 추천 번호를 믿고 한 결정으로 생긴 손해에 대해 책임지지 않습니다. 서비스는 사전 안내 없이
        내용이나 기능을 바꾸거나 중단할 수 있습니다.
      </p>

      <h2>5. 저작권</h2>
      <p>서비스에 게시된 꿈해몽 사전 등 콘텐츠의 저작권은 서비스에 있으며, 허락 없이 복제·배포할 수 없습니다.</p>

      <h2>6. 약관의 변경</h2>
      <p>약관이 바뀌는 경우 이 페이지를 통해 알려 드립니다.</p>
    </StaticPage>
  );
}
