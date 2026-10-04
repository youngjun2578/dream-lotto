import type { Metadata } from "next";
import { StaticPage } from "@/components/StaticPage";
import { pageMetadata } from "@/lib/seo";
import { CONTACT_EMAIL, INQUIRY_RETENTION, OPERATOR_NAME, PRIVACY_OFFICER_NAME, SITE_NAME } from "@/lib/site";

export const metadata: Metadata = pageMetadata({
  title: "개인정보처리방침",
  description: `${SITE_NAME}가 처리하는 개인정보와 목적, 꿈 내용 처리 방식, 위탁·국외 이전, 쿠키와 광고, 이용자의 권리와 개인정보 보호책임자를 안내합니다.`,
  path: "/privacy",
});

/** 이 방침이 적용되는 날과 마지막으로 고친 날. 내용을 바꾸면 둘 다 고치고 HISTORY 에 한 줄 더한다. */
const EFFECTIVE_DATE = "2026-10-04";
const REVISED_DATE = "2026-10-04";
const HISTORY = [
  {
    date: "2026-10-04",
    text: "사실관계를 보완했습니다. 문의 메일을 보관하는 운영자의 Google 계정에 2단계 인증을 사용한다는 점을 더했습니다(12번). 또 Google 애드센스 사이트 확인용 메타 태그와 ads.txt 파일을 사이트에 더했습니다. 둘은 광고 코드가 아니어서 광고를 불러오거나 표시하지 않으며, 8번의 현재 상태는 그대로입니다. 사실관계를 보완한 개정이라 공개한 날부터 바로 적용합니다.",
  },
  {
    date: "2026-10-03",
    text: "변경 공지 방식을 구체화했습니다(15번). 이용자의 권리나 의무, 개인정보 처리에 중요한 영향을 주는 변경은 시행 7일 전부터 알리고, 그 밖의 중요하지 않은 수정은 시행일과 함께 알리며 변경 이력에 남깁니다. 한눈에 보기의 꿈 내용 안내에 해몽과 번호를 만들기 위해 서버로 전송된다는 점을 더했고, Vercel의 이전되는 국가에 여러 나라의 서버에서 요청을 처리할 수 있다는 설명을 더했습니다(5번). 사실관계와 문구를 보완한 개정이라 공개한 날부터 바로 적용합니다.",
  },
  {
    date: "2026-10-02",
    text: "호스팅 요금제 변경에 따라 접속 기록 보관 기간을 1일로 고쳤습니다(1·5번). 결과 페이지와 공유 페이지에도 광고가 게재될 수 있고, 그때 페이지 주소가 Google에 전달될 수 있다는 안내를 더했습니다(8번). 문의 메일이 Cloudflare의 이메일 전달을 거쳐 운영자의 Gmail로 들어오는 흐름을 바로잡아 적었습니다(1·4·12번). 사실관계를 바로잡고 보완한 개정이라 공개한 날부터 바로 적용합니다.",
  },
  {
    date: "2026-10-01",
    text: "실제 처리 내용에 맞게 전면 개정했습니다. 개인정보 보호책임자 성명, 문의 메일의 전달·보관 업체와 국외 이전 항목, 광고·행태정보 안내, EEA·영국·스위스 방문자 안내, 만 14세 미만 아동 안내를 더했습니다. 같은 날 처음 공개한 방침의 빠진 내용을 보완한 것이라 공개한 날부터 적용합니다.",
  },
];

// 처리방침은 코드로 확인한 실제 동작만 적는다. 동작이 바뀌면 이 페이지를 먼저 고친다. (확인 근거와 출처: notes.md)
// - 애드센스 광고 코드를 넣을 때: 8번 '현재 상태'와 제3자 광고 사업자 범위, 9번 동의 메시지 → notes.md '승인 후 해야 할 일'(2026-10-04)
//   사이트 확인용 메타 태그(google-adsense-account)와 public/ads.txt 는 광고 코드가 아니라서 8번 '현재 상태'를 바꾸지 않는다.
// - Cloudflare 프록시(주황 구름)를 켜면: 접속이 Cloudflare 를 거치므로 1·4·5번에 Cloudflare 의 접속 기록 처리를 더한다.
// - Vercel 요금제나 함수 지역(기본 미국 iad1)을 바꾸거나 로그 보관을 늘리면(Observability Plus, Log Drains):
//   1·5번의 접속 기록 보관 기간(지금 1일)과 이전 국가를 고친다. 요금제와 보관 기간 근거는 notes.md 에만 적는다.
// - 문의 메일을 받는 메일함(지금 Gmail)을 바꾸면: 4·5번의 Google LLC 를 고친다.
// - 분석 도구·외부 글꼴·외부 스크립트를 넣으면: 4·5·7번을 고치고 e2e/privacy.spec.ts 의 '외부 요청 없음' 검사도 손본다.
// - ⚠ AI 해몽(lib/interpret/index.ts 의 LLM 연결)을 붙이면 꿈 원문이 외부 AI 업체로 전송된다. 그 전에
//   ① 2번 "외부에 보내지 않습니다" 문장을 고치고 ② 4·5번에 AI 업체(업체명·국가·항목=꿈 내용·목적·보유 기간)를 더하고
//   ③ 꿈 입력창 근처에 "입력한 꿈이 AI 업체로 전송돼요" 안내를 넣어야 한다.

/** "2026-10-01" → "2026년 10월 1일" */
function koreanDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  return `${y}년 ${m}월 ${d}일`;
}

function Out({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer">
      {children}
    </a>
  );
}

const SECTIONS = [
  ["items", "처리하는 개인정보와 목적, 보유 기간"],
  ["dream", "꿈 내용은 이렇게 처리합니다"],
  ["destroy", "개인정보의 파기 절차와 방법"],
  ["outsourcing", "개인정보 처리 위탁"],
  ["transfer", "개인정보의 국외 이전"],
  ["third-party", "개인정보의 제3자 제공"],
  ["cookies", "쿠키와 웹 스토리지(자동 수집 장치)"],
  ["ads", "광고와 행태정보(Google 애드센스)"],
  ["eea", "EEA·영국·스위스 방문자 안내"],
  ["children", "만 14세 미만 아동의 개인정보"],
  ["rights", "이용자의 권리와 행사 방법"],
  ["security", "개인정보의 안전성 확보 조치"],
  ["officer", "개인정보 보호책임자"],
  ["remedy", "권익침해 구제 방법"],
  ["changes", "개인정보처리방침의 변경"],
] as const;

type SectionId = (typeof SECTIONS)[number][0];

/** 본문 제목 "1. 처리하는 개인정보와 …" (번호와 제목은 SECTIONS 한 곳에서 정한다) */
function Heading({ id }: { id: SectionId }) {
  const index = SECTIONS.findIndex(([key]) => key === id);
  return (
    <h2 id={id} className="scroll-mt-6">
      {index + 1}. {SECTIONS[index][1]}
    </h2>
  );
}

/** 본문 안에서 다른 항목을 가리키는 링크 "(8번)" */
function See({ id }: { id: SectionId }) {
  const index = SECTIONS.findIndex(([key]) => key === id);
  return <a href={`#${id}`}>{index + 1}번</a>;
}

export default function PrivacyPage() {
  return (
    <StaticPage title="개인정보처리방침">
      <p className="!mt-2 text-sm text-ink-faint">
        시행일 {koreanDate(EFFECTIVE_DATE)} · 최종 개정일 {koreanDate(REVISED_DATE)}
      </p>
      <p>
        {SITE_NAME}(이하 &lsquo;서비스&rsquo;)는 「개인정보 보호법」을 지키며, 이용자의 정보를 꼭 필요한 만큼만
        다룹니다. 이 방침은 서비스가 어떤 개인정보를 무엇에 쓰고 얼마 동안 보관하는지, 어느 업체에 맡기고 어느 나라로
        보내는지, 이용자가 어떤 권리를 어떻게 행사할 수 있는지 설명합니다. 서비스의 운영자이자 개인정보 보호책임자는{" "}
        {OPERATOR_NAME}입니다.
      </p>

      <div className="mt-5 rounded-2xl border border-line bg-surface-2 p-4 sm:p-5">
        <p className="!mt-0 font-semibold text-ink">한눈에 보기</p>
        <ul>
          <li>회원가입이 없고, 이름이나 전화번호 같은 정보를 입력받지 않습니다.</li>
          <li>
            입력한 꿈 내용은 해몽과 번호를 만들기 위해 서버로 전송되지만, 그 목적으로만 쓰고 저장하지 않습니다(<See id="dream" />
            ).
          </li>
          <li>
            서비스는 쿠키를 쓰지 않습니다. 광고를 게재하면 Google 등 광고 사업자가 쿠키를 쓸 수 있습니다(<See id="ads" />
            ).
          </li>
          <li>운영자가 보관하는 개인정보는 이용자가 보낸 문의 메일뿐입니다.</li>
        </ul>
      </div>

      <nav aria-label="목차" className="mt-6">
        <p className="!mt-0 font-semibold text-ink">목차</p>
        <ol className="mt-2 list-decimal pl-6">
          {SECTIONS.map(([id, title]) => (
            <li key={id}>
              <a href={`#${id}`}>{title}</a>
            </li>
          ))}
        </ol>
      </nav>

      <Heading id="items" />
      <p>
        서비스는 회원가입 없이 이용할 수 있습니다. 서비스가 처리하는 개인정보는 아래 세 가지이며, 모두 이용자가 요청한
        일(사이트 이용, 해몽, 문의 답변)을 처리하는 데 필요한 범위에서만 다룹니다. 따로 동의를 받아 처리하는 개인정보는
        없습니다.
      </p>
      <h3>접속 기록</h3>
      <ul>
        <li>
          <strong>항목</strong>: IP 주소, 브라우저·기기 정보, 접속 일시, 요청한 페이지 주소, 처리 결과(응답 코드)
        </li>
        <li>
          <strong>수집 방법</strong>: 사이트에 접속하면 호스팅 업체(Vercel)의 서버에 자동으로 기록됩니다.
        </li>
        <li>
          <strong>목적</strong>: 사이트 제공, 오류 원인 확인, 비정상적인 접속과 악용 방지
        </li>
        <li>
          <strong>보유 기간</strong>: Vercel이 정한 기간 동안 보관됩니다. 운영자가 관리 화면에서 볼 수 있는 기록은
          지금 쓰는 요금제 기준으로 1일이 지나면 자동으로 지워지며, 운영자는 이 기록을 따로 내려받거나 보관하지
          않습니다.
        </li>
      </ul>
      <h3>꿈 내용 (입력한 경우)</h3>
      <ul>
        <li>
          <strong>항목</strong>: 입력창에 적은 꿈 내용
        </li>
        <li>
          <strong>목적</strong>: 꿈해몽과 추천 번호 만들기
        </li>
        <li>
          <strong>보유 기간</strong>: 저장하지 않습니다. 결과를 만든 뒤 바로 버립니다(<See id="dream" />
          ).
        </li>
      </ul>
      <h3>문의 메일 (보낸 경우)</h3>
      <ul>
        <li>
          <strong>항목</strong>: 보낸 사람의 메일 주소와 메일에 표시되는 이름, 메일 제목·내용·첨부 파일, 보낸 일시, 그
          밖에 이용자가 메일에 직접 적은 정보(회사명, 연락처 등)
        </li>
        <li>
          <strong>수집 방법</strong>: 이용자가 {CONTACT_EMAIL} 주소로 메일을 보내면 Cloudflare의 이메일 전달을 거쳐
          운영자의 메일함(Gmail)으로 들어옵니다.
        </li>
        <li>
          <strong>목적</strong>: 문의 확인과 답변, 오류 수정, 분쟁이 생겼을 때의 사실 확인
        </li>
        <li>
          <strong>보유 기간</strong>: {INQUIRY_RETENTION}. 그 전에 지워 달라고 요청하면 바로 지웁니다. 다만 분쟁이 진행
          중이면 해결될 때까지 보관합니다. 메일을 전달하는 Cloudflare에 남는 전달 기록은 <See id="transfer" />에
          적었습니다.
        </li>
      </ul>
      <p>
        화면 설정과 입력 중인 꿈 내용은 이용자의 기기에만 저장되고 서버로 보내지 않습니다(<See id="cookies" />
        ).
      </p>

      <Heading id="dream" />
      <ul>
        <li>
          꿈을 입력하는 동안 입력창 아래에 보이는 &lsquo;인식된 꿈 상징&rsquo;과 추천 단어는 이용자의 브라우저 안에서
          계산하며, 이때는 꿈 내용을 서버로 보내지 않습니다.
        </li>
        <li>
          &lsquo;해몽하고 번호 뽑기&rsquo;를 누르면 꿈 내용이 암호화된 연결(HTTPS)로 서비스 서버(Vercel)에 전송됩니다.
          서버는 메모리에서 꿈에 나온 상징을 찾아 해몽과 번호를 만들어 돌려준 뒤 꿈 내용을 버립니다. 돌려주는 결과에도
          꿈 원문은 들어 있지 않습니다.
        </li>
        <li>
          서비스는 데이터베이스를 쓰지 않으며, 꿈 내용을 파일이나 서버 로그에 남기지 않습니다. 오류가 나면 원인을 찾기
          위해 오류 종류와 발생 위치를 서버 로그에 남기지만, 꿈 내용은 남기지 않습니다.
        </li>
        <li>
          결과 페이지 주소(/result/…)와 &lsquo;링크 복사&rsquo;로 만드는 공유 주소(/r/…)에는 꿈 원문이 들어가지
          않습니다. 대신 결과를 다시 만드는 데 필요한 값(꿈 내용과 날짜로 계산한 숫자, 꿈에서 찾은 상징·행동의 영문
          이름, 날짜, 다시 뽑기 횟수)이 들어 있습니다. 이 숫자로 꿈 원문을 되살릴 수는 없습니다.
        </li>
        <li>
          결과 페이지 주소는 접속 기록에 남으므로, 주소 안에 부호화되어 들어 있는 상징·행동의 영문 이름(예: 돼지는
          pig)도 접속 기록에 남습니다. 주소를 다른 사람에게 보내면 받은 사람도 같은 해몽과 번호를 볼 수 있습니다.
        </li>
        <li>꿈 내용을 광고 사업자나 AI 서비스 같은 외부 업체에 보내지 않습니다.</li>
      </ul>

      <Heading id="destroy" />
      <ul>
        <li>보유 기간이 끝났거나 처리 목적을 이룬 개인정보는 지체 없이 지웁니다.</li>
        <li>꿈 내용: 저장하지 않으므로 따로 파기할 정보가 없습니다. 서버 메모리의 내용은 처리가 끝나면 사라집니다.</li>
        <li>접속 기록: Vercel의 보관 기간이 지나면 자동으로 삭제됩니다.</li>
        <li>문의 메일: 보유 기간이 지나면 메일함에서 삭제하고 휴지통에서도 지워 되살릴 수 없게 합니다.</li>
        <li>
          이용자의 기기에 저장된 값은 이용자가 직접 지울 수 있습니다(<See id="cookies" />
          ).
        </li>
        <li>다른 법령에 따라 따로 보존하는 개인정보는 없습니다.</li>
      </ul>

      <Heading id="outsourcing" />
      <p>서비스는 운영을 위해 아래 업체에 개인정보 처리 업무를 맡기고 있습니다.</p>
      <ul>
        <li>
          <strong>Vercel Inc.</strong>: 웹사이트 호스팅(페이지 제공, 해몽 요청 처리, 접속 기록 보관)
        </li>
        <li>
          <strong>Cloudflare, Inc.</strong>: 문의 메일 전달({CONTACT_EMAIL} 주소로 온 메일을 운영자의 메일함으로 전달).
          Cloudflare는 이 사이트의 도메인 주소 관리(DNS)도 맡고 있지만, 사이트 접속(페이지 요청)은 Cloudflare를
          거치지 않습니다.
        </li>
        <li>
          <strong>Google LLC</strong>: 문의 메일 수신·보관과 답장(운영자의 메일함, Gmail)
        </li>
      </ul>
      <p>
        세 업체 모두 외국 업체라 개인정보가 국외로 이전됩니다. 이전 내용은 <See id="transfer" />에 적었습니다.
      </p>

      <Heading id="transfer" />
      <p>서비스는 위 업체의 서버를 이용하므로 개인정보가 국외로 이전됩니다. 「개인정보 보호법」에 따라 알려 드립니다.</p>
      <h3>Vercel Inc.</h3>
      <ul>
        <li>
          <strong>이전받는 자와 연락처</strong>: Vercel Inc., privacy@vercel.com
        </li>
        <li>
          <strong>이전되는 국가</strong>: 미국(Vercel은 여러 나라의 서버에서 요청을 처리할 수 있습니다)
        </li>
        <li>
          <strong>이전 시기와 방법</strong>: 사이트에 접속하거나 해몽을 요청할 때마다 네트워크로 전송
        </li>
        <li>
          <strong>이전 항목</strong>: 접속 기록(IP 주소, 브라우저·기기 정보, 접속 일시, 요청한 페이지 주소, 응답
          코드), 해몽을 요청한 경우 꿈 내용
        </li>
        <li>
          <strong>이용 목적</strong>: 웹사이트 호스팅, 해몽 요청 처리
        </li>
        <li>
          <strong>보유·이용 기간</strong>: 꿈 내용은 저장하지 않고 처리 직후 버립니다. 접속 기록은 Vercel이 정한 기간
          동안 보관된 뒤 삭제됩니다(운영자가 관리 화면에서 볼 수 있는 기록은 1일). 자세한 내용은{" "}
          <Out href="https://vercel.com/legal/privacy-notice">Vercel 개인정보 안내</Out>에 있습니다.
        </li>
      </ul>
      <h3>Cloudflare, Inc.</h3>
      <ul>
        <li>
          <strong>이전받는 자와 연락처</strong>: Cloudflare, Inc., privacyquestions@cloudflare.com
        </li>
        <li>
          <strong>이전되는 국가</strong>: 미국
        </li>
        <li>
          <strong>이전 시기와 방법</strong>: 이용자가 문의 메일을 보낼 때 네트워크로 전송
        </li>
        <li>
          <strong>이전 항목</strong>: 보낸 사람의 메일 주소와 이름, 메일 제목·내용·첨부 파일
        </li>
        <li>
          <strong>이용 목적</strong>: 문의 메일을 운영자의 메일함으로 전달
        </li>
        <li>
          <strong>보유·이용 기간</strong>: Cloudflare는 메일 내용을 저장하지 않고 전달만 한다고 안내하고 있습니다. 전달
          기록(보낸 사람 주소, 받는 주소, 제목, 시각, 전달 결과)은 Cloudflare 관리 화면에서 최근 30일까지 조회할 수
          있습니다.
        </li>
      </ul>
      <h3>Google LLC</h3>
      <ul>
        <li>
          <strong>이전받는 자와 연락처</strong>: Google LLC, googlekrsupport@google.com
        </li>
        <li>
          <strong>이전되는 국가</strong>: 미국(Google은 여러 나라의 데이터 센터에서 정보를 처리할 수 있습니다)
        </li>
        <li>
          <strong>이전 시기와 방법</strong>: 문의 메일이 운영자의 메일함으로 전달될 때 네트워크로 전송
        </li>
        <li>
          <strong>이전 항목</strong>: 문의 메일과 그에 대한 답장(보낸 사람의 메일 주소와 이름, 메일 제목·내용·첨부
          파일)
        </li>
        <li>
          <strong>이용 목적</strong>: 문의 메일 수신·보관과 답장
        </li>
        <li>
          <strong>보유·이용 기간</strong>: {INQUIRY_RETENTION}
        </li>
      </ul>
      <h3>이전을 원하지 않는 경우</h3>
      <ul>
        <li>
          접속 기록과 꿈 내용의 이전은 사이트를 제공하는 데 꼭 필요해서, 원하지 않으면 서비스 이용을 멈추는 방법밖에
          없습니다. 꿈 내용은 &lsquo;해몽하고 번호 뽑기&rsquo;를 누르지 않으면 전송되지 않으며, 꿈해몽 사전과 가이드는
          꿈을 입력하지 않고도 볼 수 있습니다.
        </li>
        <li>
          문의 메일은 보내지 않으면 이전되지 않습니다. 다만 서비스는 메일로만 문의를 받고 있어, 메일을 보내지 않으면
          문의를 할 수 없습니다.
        </li>
        <li>
          광고를 게재하면 Google이 이용자의 브라우저에서 직접 정보를 수집합니다. 이 내용은 <See id="ads" />에
          적었습니다.
        </li>
      </ul>

      <Heading id="third-party" />
      <p>
        서비스는 이용자의 개인정보를 제3자에게 제공하지 않습니다. 다만 법률에 특별한 규정이 있거나 수사기관이 법령에
        정해진 절차와 방법에 따라 요청하는 경우에는 법이 허용하는 범위에서 제공할 수 있습니다.
      </p>

      <Heading id="cookies" />
      <ul>
        <li>서비스는 쿠키를 만들거나 읽지 않습니다.</li>
        <li>
          이용 편의를 위해 브라우저의 저장 공간(웹 스토리지)에 아래 두 가지를 저장합니다. 이 값은 이용자의 기기에만
          있고 서버로 보내지 않습니다.
          <ul>
            <li>
              <strong>화면 설정</strong>(localStorage, 이름 theme): 화면 위쪽 버튼으로 밝은 화면이나 어두운 화면을
              고르면 그 선택을 저장합니다. 지우기 전까지 남습니다.
            </li>
            <li>
              <strong>입력 중인 꿈</strong>(sessionStorage, 이름 dream-draft): 결과 페이지에서 입력창으로 돌아왔을 때
              입력하던 꿈을 다시 채워 넣기 위한 것입니다. 입력창을 비우면 바로 지워지고, 브라우저 탭을 닫으면
              지워집니다.
            </li>
          </ul>
        </li>
        <li>
          브라우저 설정의 개인정보·보안 메뉴에서 이 사이트의 데이터를 지우거나 저장을 막을 수 있습니다. 저장을 막아도
          해몽과 번호 추천은 그대로 이용할 수 있으며, 화면 설정이 기억되지 않고 입력하던 꿈이 다시 채워지지 않을
          뿐입니다.
        </li>
        <li>
          접속 기록(<See id="items" />
          )은 이용자의 기기가 아니라 서버에 자동으로 남는 기록입니다.
        </li>
        <li>
          광고 쿠키는 <See id="ads" />에 적었습니다.
        </li>
      </ul>

      <Heading id="ads" />
      <p>
        <strong>현재 상태</strong>: {koreanDate(REVISED_DATE)} 현재 서비스는 광고를 게재하지 않으며, 광고 코드도 넣지
        않았습니다. 앞으로 Google 애드센스 광고를 게재할 수 있으며, 게재하면 아래 내용이 적용됩니다. 게재를 시작하기
        전에 이 페이지에 시작일을 알립니다.
      </p>
      <ul>
        <li>
          광고가 게재되면 Google을 포함한 제3자 광고 사업자가 쿠키와 웹 비콘(광고가 표시됐는지 확인하는 작은 이미지나
          코드)을 사용해, 이용자가 이 사이트와 다른 사이트를 방문한 기록을 바탕으로 광고를 보여 줄 수 있습니다.
        </li>
        <li>
          Google은 광고 쿠키를 사용해, 이용자가 이 사이트나 인터넷의 다른 사이트를 방문한 기록을 바탕으로 Google과
          파트너가 맞춤 광고를 제공할 수 있게 합니다.
        </li>
        <li>
          결과 페이지(/result/…)와 공유 페이지(/r/…)에도 광고가 게재될 수 있으며, 이 경우 그 페이지의 주소가 Google에
          전달될 수 있습니다. 이 주소에는 꿈 원문이 들어 있지 않고, 꿈에서 찾은 상징·행동의 영문 이름(예: 돼지는
          pig)이 부호화되어 들어 있습니다(<See id="dream" />
          ).
        </li>
      </ul>
      <h3>광고 목적의 행태정보 처리</h3>
      <ul>
        <li>
          <strong>수집하는 행태정보</strong>: 방문한 페이지 주소, 광고를 보거나 누른 기록, 쿠키 등에 담긴 광고 식별값,
          IP 주소, 브라우저·기기 정보
        </li>
        <li>
          <strong>수집 방법</strong>: 광고가 있는 페이지를 열면 Google의 광고 코드가 자동으로 수집합니다.
        </li>
        <li>
          <strong>수집 목적</strong>: 광고 게재(맞춤 광고와 일반 광고), 광고 효과 측정, 부정 클릭 같은 악용 방지
        </li>
        <li>
          <strong>보유·이용 기간</strong>: Google의 정책을 따릅니다(
          <Out href="https://policies.google.com/technologies/retention?hl=ko">Google 데이터 보관 안내</Out>). 운영자는
          이 정보를 따로 받아 보관하지 않습니다.
        </li>
        <li>
          <strong>제3자의 행태정보 수집 허용</strong>: 광고를 게재하면 Google LLC(미국)가 이 사이트에서 행태정보를
          수집하도록 허용합니다. 애드센스 설정에 따라 Google이 인증한 다른 광고 사업자가 광고를 게재할 수도 있으며,
          광고를 시작할 때 그 범위를 이 페이지에 알립니다.
        </li>
        <li>
          <strong>이용자가 막는 방법</strong>:{" "}
          <Out href="https://www.google.com/settings/ads">Google 광고 설정</Out>에서 맞춤 광고를 끌 수 있고,{" "}
          <Out href="https://www.aboutads.info">www.aboutads.info</Out>에서 다른 광고 사업자의 맞춤 광고용 쿠키를 거부할
          수 있습니다. 브라우저 설정에서 쿠키를 막거나 지워도 됩니다. 이 경우에도 해몽과 번호 추천은 그대로 이용할 수
          있습니다.
        </li>
        <li>
          <strong>문의와 피해 구제</strong>: 행태정보와 관련한 문의나 불만은 개인정보 보호책임자(<See id="officer" />
          )에게 메일로 보내 주시기 바랍니다.
        </li>
      </ul>
      <p>
        Google이 광고에 쿠키를 어떻게 쓰는지는{" "}
        <Out href="https://policies.google.com/technologies/ads?hl=ko">Google의 광고 안내</Out>에서, Google 서비스를 쓰는
        사이트에서 Google이 정보를 어떻게 사용하는지는{" "}
        <Out href="https://policies.google.com/technologies/partner-sites?hl=ko">
          Google이 Google 서비스를 사용하는 웹사이트 또는 앱의 정보를 사용하는 방법
        </Out>
        에서 볼 수 있습니다.
      </p>

      <Heading id="eea" />
      <ul>
        <li>
          광고를 게재하면 유럽경제지역(EEA)·영국·스위스에서 접속한 이용자에게는 Google이 인증한 동의 관리
          플랫폼(CMP)인 Google의 동의 메시지를 보여 주고, 쿠키 사용과 맞춤 광고에 대한 동의를 받습니다. 동의하지
          않아도 서비스는 그대로 이용할 수 있습니다.
        </li>
        <li>
          동의를 철회하거나 바꾸려면 이 지역에서 접속했을 때 화면 아래쪽에 표시되는 동의 설정 링크(&lsquo;Privacy and
          cookie settings&rsquo;)를 누르면 됩니다. 동의 메시지가 다시 열리고 &lsquo;동의&rsquo;, &lsquo;동의하지
          않음&rsquo;, &lsquo;옵션 관리&rsquo; 중에서 다시 고를 수 있습니다.
        </li>
        <li>현재는 광고를 게재하지 않으므로 동의 메시지도 표시하지 않습니다.</li>
      </ul>

      <Heading id="children" />
      <ul>
        <li>
          서비스는 회원가입이 없고 나이를 묻지 않으며, 만 14세 미만 아동의 개인정보를 따로 수집하지 않습니다. 동의를
          받아 처리하는 개인정보가 없으므로 법정대리인의 동의를 받는 절차도 두지 않았습니다.
        </li>
        <li>
          만 14세 미만 아동이 문의 메일을 보낸 경우에는 답변에 필요한 범위에서만 다루며, 법정대리인이 요청하면 지체
          없이 지웁니다.
        </li>
        <li>
          꿈해몽과 사전은 나이와 관계없이 볼 수 있습니다. 사이트 곳곳의 &lsquo;만 19세 이상&rsquo; 안내는 복권을 살 수
          있는 나이에 관한 것이며, 서비스를 이용할 수 있는 나이를 정한 것은 아닙니다.
        </li>
      </ul>

      <Heading id="rights" />
      <ul>
        <li>
          이용자는 언제든지 서비스가 처리하는 자신의 개인정보를 열람하거나 정정·삭제, 처리정지를 요구할 수 있습니다.
        </li>
        <li>
          요구는 개인정보 보호책임자의 메일(<See id="officer" />
          )로 보내 주시면 됩니다. 법정대리인이나 위임을 받은 사람을 통해서도 할 수 있으며, 이때는 위임장 등 위임 사실을
          확인할 수 있는 자료를 함께 보내 주셔야 합니다.
        </li>
        <li>
          요구를 받으면 본인이나 정당한 대리인인지 확인한 뒤 지체 없이 처리하고, 결과를 메일로 알려 드립니다. 법령에
          정한 사유로 요구를 들어드릴 수 없는 경우에는 그 이유를 알려 드립니다.
        </li>
        <li>
          서비스는 회원 정보를 갖고 있지 않아, 접속 기록처럼 이름이나 메일 주소와 연결되지 않은 정보는 요구한 사람의
          정보인지 확인하기 어려울 수 있습니다. 접속 기록은 짧은 기간이 지나면 자동으로 지워집니다.
        </li>
        <li>
          브라우저에 저장된 값(<See id="cookies" />
          )은 이용자가 직접 지울 수 있습니다.
        </li>
      </ul>

      <Heading id="security" />
      <ul>
        <li>꼭 필요한 정보만 처리합니다. 회원가입이 없고, 꿈 내용을 저장하지 않으며, 데이터베이스를 쓰지 않습니다.</li>
        <li>사이트와 주고받는 모든 통신은 암호화된 연결(HTTPS)로 이루어집니다.</li>
        <li>문의 메일은 운영자의 메일 계정(Gmail)에 보관하고, 보유 기간이 지나면 지웁니다.</li>
        <li>문의 메일을 보관하는 운영자의 Google 계정에는 2단계 인증을 사용합니다.</li>
      </ul>

      <Heading id="officer" />
      <p>
        개인정보 처리에 관한 업무를 총괄하고, 개인정보와 관련한 문의·불만 처리와 피해 구제를 맡는 개인정보
        보호책임자는 다음과 같습니다. 문의는 메일로만 받습니다.
      </p>
      <ul>
        <li>개인정보 보호책임자: {PRIVACY_OFFICER_NAME} (운영자)</li>
        <li>
          연락처: <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
        </li>
      </ul>

      <Heading id="remedy" />
      <p>개인정보 침해에 대한 신고나 상담, 분쟁 해결이 필요하면 아래 기관에 문의할 수 있습니다.</p>
      <ul>
        <li>
          개인정보분쟁조정위원회: (국번 없이) 1833-6972, <Out href="https://www.kopico.go.kr">www.kopico.go.kr</Out>
        </li>
        <li>
          개인정보침해 신고센터(한국인터넷진흥원): (국번 없이) 118,{" "}
          <Out href="https://privacy.kisa.or.kr">privacy.kisa.or.kr</Out>
        </li>
        <li>
          대검찰청: (국번 없이) 1301, <Out href="https://www.spo.go.kr">www.spo.go.kr</Out>
        </li>
        <li>
          경찰청: (국번 없이) 182, <Out href="https://ecrm.police.go.kr">ecrm.police.go.kr</Out>
        </li>
      </ul>

      <Heading id="changes" />
      <ul>
        <li>이 개인정보처리방침은 {koreanDate(EFFECTIVE_DATE)}부터 적용됩니다.</li>
        <li>
          이용자의 권리나 의무, 개인정보 처리에 중요한 영향을 주는 변경은 시행 7일 전부터 이 페이지에 바뀌는 내용과
          시행일을 알립니다.
        </li>
        <li>
          그 밖의 중요하지 않은 수정(<See id="ads" />
          에서 미리 알린 광고 게재 시작, 오탈자 수정, 연락처나 사실관계를 바로잡는 보완 등)은 시행일과 함께 이 페이지에
          알리고 변경 이력에 남깁니다. 광고 게재 시작일은 <See id="ads" />에 적은 대로 게재를 시작하기 전에 알립니다.
        </li>
      </ul>
      <h3>변경 이력</h3>
      <ul>
        {HISTORY.map((h) => (
          <li key={h.date}>
            {koreanDate(h.date)}: {h.text}
          </li>
        ))}
      </ul>
    </StaticPage>
  );
}
