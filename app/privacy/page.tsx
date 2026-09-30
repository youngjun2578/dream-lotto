import type { Metadata } from "next";
import { StaticPage } from "@/components/StaticPage";
import { pageMetadata } from "@/lib/seo";
import { CONTACT_EMAIL, SITE_NAME } from "@/lib/site";

export const metadata: Metadata = pageMetadata({
  title: "개인정보처리방침",
  description: `${SITE_NAME} 개인정보처리방침`,
  path: "/privacy",
});

// 초안: 실제 서비스 운영 방식(DB 저장, 광고, 분석 도구 등)이 바뀌면 반드시 함께 수정해 주세요.
export default function PrivacyPage() {
  return (
    <StaticPage title="개인정보처리방침" updated="2026-09-30">
      <p>
        {SITE_NAME}(이하 &lsquo;서비스&rsquo;)는 이용자의 개인정보를 소중히 여기며, 관련 법령을 지키기 위해 노력합니다.
        이 방침은 서비스가 어떤 정보를 어떻게 다루는지 설명합니다.
      </p>

      <h2>1. 수집하는 정보</h2>
      <p>
        서비스는 회원가입 없이 이용할 수 있으며, 이름·연락처 같은 개인정보를 직접 수집하지 않습니다. 이용자가 입력한
        꿈 내용은 해몽과 번호 추천 결과를 만들기 위해서만 서버에서 처리되며, 현재 별도로 저장하지 않습니다.
      </p>
      <p>
        서비스 운영 과정에서 접속 기록(IP 주소, 브라우저 종류, 방문 일시 등)이 호스팅 업체의 서버 로그에 자동으로
        남을 수 있습니다.
      </p>

      <h2>2. 쿠키와 광고</h2>
      <p>
        서비스는 Google AdSense 등 제3자 광고를 게재할 수 있습니다. Google을 포함한 제3자 공급업체는 쿠키를 사용하여
        이용자가 이 사이트나 다른 사이트를 방문한 기록을 바탕으로 광고를 제공할 수 있습니다.
      </p>
      <ul>
        <li>
          Google은 광고 쿠키를 사용하여 이용자의 방문 기록에 기반한 맞춤 광고를 제공할 수 있습니다.
        </li>
        <li>
          이용자는{" "}
          <a href="https://adssettings.google.com" target="_blank" rel="noopener noreferrer">
            Google 광고 설정
          </a>
          에서 맞춤 광고를 해제할 수 있습니다.
        </li>
        <li>브라우저 설정에서 쿠키 저장을 거부할 수도 있으나, 일부 기능 이용이 제한될 수 있습니다.</li>
      </ul>

      <h2>3. 정보의 보관과 파기</h2>
      <p>
        서비스는 꿈 입력 내용을 저장하지 않으므로 별도로 보관하거나 파기할 정보가 없습니다. 앞으로 저장 기능(예: 결과
        공유 링크)이 추가되면 보관 기간과 파기 방법을 이 방침에 먼저 알리겠습니다.
      </p>

      <h2>4. 문의</h2>
      <p>
        개인정보 관련 문의는 <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a> 로 보내 주세요.
      </p>

      <h2>5. 방침의 변경</h2>
      <p>이 방침이 바뀌는 경우 이 페이지를 통해 알려 드립니다.</p>
    </StaticPage>
  );
}
