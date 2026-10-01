import type { Metadata } from "next";
import Link from "next/link";
import { StaticPage } from "@/components/StaticPage";
import { pageMetadata } from "@/lib/seo";
import { CONTACT_EMAIL, DISCLAIMER, OPERATOR_NAME, SITE_NAME } from "@/lib/site";

export const metadata: Metadata = pageMetadata({
  title: "소개",
  description: `${SITE_NAME}는 꿈해몽과 꿈 상징 기반 행운 번호를 재미로 즐기는 서비스예요.`,
  path: "/about",
});

// 초안: 실제 운영 정보에 맞게 다듬어 주세요.
export default function AboutPage() {
  return (
    <StaticPage title={`${SITE_NAME} 소개`}>
      <p>
        {SITE_NAME}는 간밤에 꾼 꿈을 가볍게 풀어 보고, 꿈에 나온 상징을 바탕으로 로또 번호를 재미로 뽑아 보는
        서비스예요. 돼지꿈, 용꿈, 조상꿈처럼 예로부터 전해 오는 꿈해몽을 누구나 쉽게 찾아볼 수 있도록 정리하고
        있어요.
      </p>

      <h2>이런 걸 할 수 있어요</h2>
      <ul>
        <li>꿈 내용을 입력하면 꿈속 상징을 찾아 해몽을 풀어 드려요.</li>
        <li>꿈 상징의 행운 숫자를 섞어 로또 번호 5게임을 추천해 드려요.</li>
        <li>
          <Link href="/dream">꿈해몽 사전</Link>에서 동물·사람·자연·행동·물건·연애·결혼별 꿈의 의미를 찾아볼 수 있어요.
        </li>
      </ul>

      <h2>번호는 어떻게 정해지나요?</h2>
      <p>
        꿈에서 찾은 상징마다 정해진 숫자 후보가 있고, 그중 2~3개를 골라 &lsquo;꿈 번호&rsquo;로 쓰고 나머지는 무작위로
        채워요. 같은 날 같은 꿈을 입력하면 항상 같은 번호가 나오도록 만들었어요.
      </p>

      <h2>꼭 알아 두세요</h2>
      <p>
        {DISCLAIMER} 꿈해몽은 전통적인 상징 풀이를 참고한 오락용 콘텐츠이며, 과학적 근거나 미래를 예측하는 능력이
        있지 않아요. 복권은 만 19세 이상만 구매할 수 있고, 여유 있는 범위에서 즐겨 주세요.
      </p>

      <h2>운영자와 문의</h2>
      <ul>
        <li>운영자: {OPERATOR_NAME}</li>
        <li>
          문의: <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
        </li>
      </ul>
      <p>
        입력한 꿈 내용은 해몽과 번호를 만드는 데에만 쓰고 저장하지 않아요. 자세한 내용은{" "}
        <Link href="/privacy">개인정보처리방침</Link>에서 볼 수 있어요.
      </p>
    </StaticPage>
  );
}
