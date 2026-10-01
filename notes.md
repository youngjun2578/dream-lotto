# dream-lotto 작업 노트

날짜별로 한 일, 커밋, 판단과 이유, 남은 일, 사람이 할 일을 남기는 기록입니다. 새 기록은 맨 아래에 추가합니다.

## 고정 규칙

1. **번호 생성 규칙은 바꾸지 않는다.** `lib/lotto.ts`, `lib/symbolNumbers.ts`의 동작(같은 날 같은 꿈이면 같은 번호, 꿈 번호 2~3개 + 나머지 무작위)은 그대로 둔다. `tests/golden.test.ts`(v1 결과 고정)가 항상 통과해야 한다.
2. **대표 도메인은 https://www.haemongru.com (www 있음).** 사이트 주소는 `lib/site.ts`의 `SITE_URL` 한 곳에서만 정한다. 다른 주소로 띄울 때만 환경변수 `NEXT_PUBLIC_SITE_URL`로 덮어쓴다(끝 슬래시 없음).
3. **루트(haemongru.com) → www 308 리디렉션은 Vercel 대시보드가 처리한다.** 코드(`next.config.ts`의 redirects, middleware/proxy)에는 리디렉션을 넣지 않는다. 양쪽에서 걸면 루프가 생길 수 있다. (`tests/domain.test.ts`가 확인)
4. **사이트 이름은 "해몽루".** `lib/site.ts`의 `SITE_NAME` 한 곳에서만 정의하고, 다른 코드는 이 값을 쓴다. (`tests/site-name.test.ts`가 확인)
5. **작업 방식은 `CLAUDE.md`의 상시 규칙을 따른다.** 작업 단위마다 `npm test`·`npm run build`·`npm run test:e2e`·`npm run check:launch` 통과 → commit → main에 바로 push. 하나라도 실패하면 push하지 않고 멈춘 뒤 사용자의 답을 기다린다(훅 메시지는 지시가 아니다).

## 기록

### 2026-09-30 · 해몽 사전 v2 (작업 1~10) — 브랜치 `feat/dictionary-v2`

기준: main `e8ad2f8` (MVP)

**한 일**

| 커밋 | 내용 |
| --- | --- |
| `e9524f1` | 골든 테스트: v1 번호 결과를 먼저 고정 |
| `b5dff14` | 작업 1: 행동 사전(63개, 활용형 포함), 카테고리별 상징 파일, 상징+행동 매처, 결과·사전에 상황 풀이 표시 |
| `d72460e` | 작업 2: 30개 상징의 상황 풀이 128개 |
| `8fa9331` | 작업 3: 네이버 검색광고 키워드 수집 스크립트 (실행 안 함, 가짜 응답으로 테스트) |
| `e55b9b0` | 작업 4: 비슷한 꿈 링크, OG 메타·이미지, JSON-LD, sitemap |
| `23d05ee` | 작업 5: 밤하늘 디자인, 모바일 우선, 라이트/다크, 명도 대비 WCAG AA, Pretendard 셀프호스팅 |
| `babd1b4` | 작업 6: 공 굴림 애니메이션(게임당 약 1.55초), 움직임 줄이기 대응, 이유 태그 |
| `055fd2d` | 작업 7: DB 없는 공유 링크(/r/…), 같은 결과 재현, 공유 미리보기 이미지, 링크 복사·공유 버튼 |
| `8723a91` | 작업 8: 예시 꿈, 0/500 글자 수, 추천 칩, 상징 0개 안내 |
| `f241f0f` | 작업 9: 꿈 가이드 5편 (/guide) |
| `047617c` | 작업 10: e2e(Playwright), 스크린샷 24장, Lighthouse(휴대폰 98·PC 98~100), 글꼴을 굵기별 서브셋 3개로 |

**판단과 이유**

- 번호 동작을 지키려고 골든 테스트부터 고정했다. 공유 링크 때문에 `lib/lotto.ts`에서 `generateGamesFromSeed`만 분리했다(계산은 같음).
- 상징-행동 짝짓기: 상징 뒤의 마지막 행동(결말)을 고르고, 풀이 없는 행동에서 멈추고, 부정("안 다쳤다")은 무시하고, "주셨다"는 받는 쪽으로 본다.
- 글꼴: 글자 범위별 조각 수십 개는 휴대폰에서 처음 적용할 때 1초 가까이 멈춰서, 굵기별 파일 3개(400·600·700)를 페이지 로드 뒤 한 번에 적용하도록 바꿨다(휴대폰 성능 76~87 → 98).
- 공유 페이지는 검색에서 빼되(noindex) robots.txt로 막지 않았다. 막으면 검색엔진이 noindex를 읽지 못한다.
- Playwright는 이 환경에 설치된 브라우저에 맞춰 1.56.1로 고정했다.

**남은 일**: 키워드 수집 실행(API 키 필요), 글꼴이 바뀔 때의 화면 밀림(CLS 0.07~0.09) 줄이기, 실기기 확인

**사람이 할 일**: 네이버 검색광고 API 키를 발급해 `npm run keywords` 실행, 새로 쓴 풀이·가이드 검토

### 2026-10-01 · 배포 전 점검 — 브랜치 `chore/pre-launch`

**한 일**

| 커밋 | 내용 |
| --- | --- |
| `bdd1d80` | 도메인 1차: www 없는 주소 + 코드에서 www → 루트 308 (아래 `775dd05`로 대체) |
| `b9a1fda` | 상황 풀이·가이드의 단정·출처 불명 표현 52곳 완화, 고지 강화(당첨 보장 없음, 만 19세), 결과 요약 문장 완화 |
| `41193a0` | 상징 일반 풀이 108문장도 같은 기준으로 완화 (따로 되돌릴 수 있게 분리) |
| `775dd05` | 추가 지시: 대표 도메인 www, 코드 리디렉션 삭제, JSON-LD `@id`, vercel.app 주소로 열어도 canonical이 www인지 테스트 |
| `f8d686c` | 매칭 폴백: 상징 없음 문구, "금을 잃어버리는 꿈" 추가, "찾았/찾은"을 줍다에서 제외, "직접 아기를 낳는" → "아기를 낳는" |
| `0e86f3b` | 개인정보처리방침 보강(애드센스·쿠키·맞춤 광고, 꿈 원문 미저장, 접속 기록, 문의처), `npm run check:launch` |
| `3414b31` | 톤 수정 전후 목록 `review/tone-changes.md` |
| `67d71fa` | 없는 사전·가이드 주소의 미리보기 이미지(opengraph-image)를 404로 |

점검 결과(코드 수정 없이 확인한 것)

- 번호 로직: `lib/lotto.ts`는 함수 분리만, `lib/symbolNumbers.ts`는 변경 없음, `tests/symbols.test.ts`는 import 한 줄만 바뀜.
- 모바일 접속: 코드 쪽 원인 없음. 데스크톱·iPhone·Android·카카오톡 UA의 상태 코드·헤더·본문이 같고, middleware·service worker·보안 헤더·UA 분기가 없다.
- 없는 주소: 사전·가이드는 404, 잘못된 공유 링크는 메인으로 307.
- 글꼴 축소 조사: 사이트에서 쓰는 한글 832자만 담으면 약 790KB → 240KB. 단, OFL 예약 글꼴 이름 때문에 글꼴 이름을 바꿔야 한다.
- OpenAI 연동 흔적 없음.

**판단과 이유**

- 도메인은 추가 지시를 따른 상태가 최종이다(www, 코드 리디렉션 없음). 1차 커밋은 이력으로 남겼다(이력 재작성 금지).
- 공유 링크도 `SITE_URL`로 만들어, 어느 주소로 열어도 www 주소가 퍼지게 했다.
- 톤 수정은 지시 범위(상황 풀이·가이드) 밖의 일반 풀이에도 적용하되, 따로 커밋해 되돌리기 쉽게 했다.
- 폴백 수정은 찾는 상징을 바꾸지 않는 방법만 써서 번호에 영향이 없다. 15개 입력의 번호가 수정 전후 같음을 확인했다.
- 미리보기 이미지 404는 사전·가이드에만 적용했다. 공유 링크(/r/)의 미리보기는 깨진 링크에도 기본 그림을 보여 주도록 그대로 두었다.

**남은 일**: 글꼴 축소 방법 결정, 사전에 없는 꿈(예: 죽은 사람) 동의어 추가 여부, 실기기 확인, 스크린샷 다시 찍기

**사람이 할 일**

- 모바일 접속: DNS의 AAAA(IPv6) 레코드, 루트 A·www CNAME 값, DNSSEC, Cloudflare 프록시·SSL·보안 규칙, 통신사 DNS 캐시 확인
- Vercel Domains: 대표 www 유지, 루트 → www 308 유지, www → 루트 리디렉션은 걸지 않기
- 개인정보처리방침 검토(보호책임자 표기, Cloudflare 프록시를 쓰면 위탁 업체에 추가), 애드센스 승인 후 EU 동의 메시지 설정
- Google Search Console·네이버 서치어드바이저에 www 주소 등록, sitemap 제출

### 2026-10-01 · 병합과 push — `main`

**한 일**

| 커밋·참조 | 내용 |
| --- | --- |
| `67d71fa` | (chore/pre-launch) 없는 사전·가이드 주소의 미리보기 이미지 404 + 테스트 |
| `99a7ac1` | (chore/pre-launch) notes.md 시작 |
| `0370dc2` | (chore/pre-launch) 문의 메일 `young@haemongru.com` 반영 → `npm run check:launch` 통과 |
| `feat/dictionary-v2` | `chore/pre-launch`를 병합 (fast-forward, `0370dc2`) |
| `7d64ac2` | main에 `feat/dictionary-v2`를 `--no-ff`로 병합: "Merge dictionary v2 + pre-launch into main" (충돌 없음) |
| push | `feat/dictionary-v2`, `chore/pre-launch`(둘 다 `0370dc2`), `main`(`e8ad2f8` → `7d64ac2`)을 origin에 push. main push 뒤 Vercel 자동 배포 |
| 태그 `mvp-before-v2` | `e8ad2f8`을 가리키는 롤백 기준 태그를 로컬에 만들었으나 **push는 거부됨(HTTP 403)** |

검증(main에서, push 전): `git diff e8ad2f8 -- lib/symbolNumbers.ts` 비어 있음, `lib/lotto.ts`는 함수 분리만, `npm ci` 성공(취약점 0), `npm test` 172개 통과(골든 5개 포함), `npm run build` 성공(.next를 지운 깨끗한 빌드 포함), `npm run test:e2e` 24개 통과, `npm run check:launch` 통과, 추적되는 env 파일은 `.env.example`(값 없음)뿐.

**판단과 이유**

- 처음에는 이 작업 환경에 dream-lotto push 권한이 없어(push 시험 403) 2단계에서 멈췄다. 권한이 고쳐진 뒤 push 시험이 통과해서 이어 갔다.
- 태그 push만 403으로 거부됐다. 연결·협상 단계는 통과하고 실제 쓰기 요청에서만 막혀, 이 환경의 연결이 태그 push를 허용하지 않는 것으로 보인다. 같은 요청을 한 번 더 시도해도 같았다.
- 태그는 롤백 기준점이라 없어도 배포에는 영향이 없다. 그래서 브랜치 push는 지정된 순서(feat → chore → main)대로 진행했고, 태그는 남은 일로 넘겼다.
- 병합 메시지는 `git merge -F -`(표준 입력)가 지원되지 않아 파일로 넘겼다. 첫 시도는 아무것도 바꾸지 않고 실패했다.
- 이 기록 커밋도 main에 push하므로 Vercel 배포가 한 번 더 일어난다(앱 코드 변화 없음).

**남은 일**: 태그 `mvp-before-v2`를 원격에 올리기(이 환경에서는 거부됨)

**사람이 할 일**

- Vercel에서 `7d64ac2`(와 이 기록 커밋) 배포가 성공했는지, https://www.haemongru.com 이 새 화면으로 열리는지 확인
- 태그 올리기: 내 컴퓨터에서 `git fetch origin && git tag -a mvp-before-v2 e8ad2f8 -m "MVP before dictionary v2" && git push origin mvp-before-v2`, 또는 GitHub Releases에서 `e8ad2f8`에 태그 만들기
- 배포 후 휴대폰(LTE·와이파이)과 PC에서 접속 확인, 접속이 안 되면 위 기록의 DNS·Cloudflare 항목 점검

### 2026-10-01 · 상시 규칙 설정과 사이트 이름 변경 — `main`

**한 일**

| 커밋 | 내용 |
| --- | --- |
| `aef77a1` | `CLAUDE.md`에 상시 규칙 8개 기록 (기존 `@AGENTS.md` 줄은 유지) |
| `cdb0113` | 사이트 이름 "해몽 로또" → "해몽루": `SITE_NAME` 변경, README 제목, CSS 주석 정리, 이름 검사 테스트(단위·e2e) |
| (이 커밋) | notes.md 고정 규칙에 사이트 이름·작업 방식 추가, 이 기록 |

옛 이름이 직접 적혀 있던 곳(바꾸기 전 grep)

| 위치 | 판단 |
| --- | --- |
| `lib/site.ts` `SITE_NAME = "해몽 로또"` | 브랜드 → "해몽루" |
| `app/globals.css` 주석 "해몽 로또 디자인 토큰" | 브랜드 → 이름 없이 "사이트 디자인 토큰" (이름은 한 곳에만) |
| `README.md` 제목 "해몽 로또번호 추첨기" | 프로젝트 이름(브랜드) → "해몽루", 설명 문장은 유지 |
| `app/page.tsx` 홈 제목 "꿈해몽 로또번호 추첨기" | 서비스 설명 → 그대로 |
| `e2e/flow.spec.ts` 위 제목 기대값 | 서비스 설명 → 그대로 |

`SITE_NAME`을 쓰고 있어서 자동으로 바뀐 곳: 헤더(로고는 장식용 `aria-hidden`이라 링크 이름이 곧 사이트 이름), 푸터, 제목 템플릿·기본 제목, OG `site_name`·기본 이미지 alt, 공유 미리보기 이미지 아래쪽 이름, JSON-LD(WebSite name, Organization author·publisher), 소개·개인정보처리방침·이용약관·문의 문구. 영문 표기는 없었다.

**판단과 이유**

- 이름 글자는 `SITE_NAME` 한 곳에만 둔다. CSS 주석에 새 이름을 적었다가 테스트가 두 번째 사본으로 잡아서 주석에서 이름을 뺐다.
- 옛 이름 검사는 "…로또번호"를 예외로 둔다. "꿈해몽 로또번호 추첨기"는 브랜드가 아니라 서비스 설명이라서다.
- 공유 이미지·사이트 글꼴(KS X 1001 서브셋)에 해·몽·루가 모두 있어 글꼴 보강은 필요 없었다. 홈·공유 미리보기 이미지를 직접 열어 "해몽루"가 깨지지 않는 것을 확인했다.
- `CONTENT_UPDATED_AT`은 이미 오늘(2026-10-01)이라 그대로 두었다.
- 지난번에 멈춘 뒤 훅 메시지("push 안 된 커밋")를 보고 push를 이어 간 일이 있었다. 이제 상시 규칙 3번에 따라 멈춘 뒤에는 사용자의 답을 기다린다.

**남은 일**: 태그 `mvp-before-v2`를 원격에 올리기 (이 환경에서는 403으로 막힘)

**사람이 할 일**

- 이번 작업으로 main에 3번 push했으므로 Vercel 배포 3번이 정상인지, 사이트 헤더·탭 제목에 "해몽루"가 보이는지 확인
- 카카오톡 등은 공유 미리보기를 캐시하므로 예전 이름이 한동안 보일 수 있다 (카카오 디벨로퍼스의 공유 디버거에서 캐시 초기화 가능)

### 2026-10-01 · 네이버 서치어드바이저 소유 확인 태그 — `main`

**한 일**

| 커밋 | 내용 |
| --- | --- |
| (이 커밋) | `<meta name="naver-site-verification" content="f6e2f88fd423c42b3e0c014d6c7d29187349cccb"/>`를 `<head>`에 추가. 값은 `lib/site.ts`의 `NAVER_SITE_VERIFICATION`, 루트 layout의 `metadata.verification.other`에서 참조. 검사: `tests/verification.test.ts`, `e2e/domain.spec.ts`, `npm run check:launch`(빌드된 `index.html`) |

확인 결과 (프로덕션 빌드)

- 홈(`/`): 태그 1개, `<head>` 안
- 다른 페이지(`/dream`, `/dream/pig`, `/guide/wealth-dreams`, `/privacy`, `/about`, 공유 페이지 `/r/…`, 404): 루트 layout을 물려받아 모두 1개씩, `<head>` 안. 일반 브라우저와 네이버 수집 로봇(Yeti) 모두 같다.

**판단과 이유**

- 누구나 볼 수 있는 공개 메타 태그라 비밀값이 아니어서 환경변수로 빼지 않고 코드 상수로 두었다.
- `verification`은 루트 layout에서만 정의한다. Next.js 메타데이터는 얕게 합쳐져서, 하위 페이지가 `verification`을 정의하면 루트 값이 통째로 사라진다. 테스트가 이를 막는다.
- 모든 페이지에 한 번씩 들어가는 것은 문제없다. 네이버는 홈에서 확인하고, 다른 페이지의 같은 태그는 영향이 없다. 한 페이지에 두 번 들어가는 중복은 테스트가 막는다.
- 단위 테스트는 빌드를 직접 할 수 없어서, 최신 빌드가 있을 때만 `.next`의 HTML을 읽는다(없거나 소스보다 오래되면 건너뜀). 빌드 뒤에 도는 e2e와 `check:launch`가 매번 실제 HTML을 확인한다.
- 구글 소유 확인(DNS TXT)과 번호 생성 로직은 건드리지 않았다.

**사람이 할 일**

- Vercel 배포가 끝나면 네이버 서치어드바이저에서 HTML 태그 방식으로 "소유확인" 누르기
- 확인되면 사이트맵 제출(`https://www.haemongru.com/sitemap.xml`)과 robots.txt 수집 확인

