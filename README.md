# 해몽 로또번호 추첨기 (dream-lotto)

꿈 내용을 입력하면 **꿈해몽**을 보여 주고, 꿈에 나온 상징을 바탕으로 **로또 번호(1~45 중 6개) 5게임**을 추천하는 재미용 웹사이트입니다.

> 재미로 보는 서비스이며, 추천 번호는 당첨 확률과 무관합니다.

- 기술: Next.js 16 (App Router) · TypeScript · Tailwind CSS 4 · Vitest
- 1단계(MVP): AI API, 외부 DB, 광고 코드 없이 로컬에서 완전히 동작

---

## 1. 실행 방법

Node.js 20 이상이 필요합니다.

```bash
npm install        # 처음 한 번: 필요한 패키지 설치
npm run dev        # 개발 서버 실행 → http://localhost:3000
```

| 명령어 | 하는 일 |
| --- | --- |
| `npm run dev` | 개발 서버 (코드를 고치면 바로 반영) |
| `npm test` | 테스트 실행 (Vitest) |
| `npm run build` | 배포용 빌드 (사전 페이지 30개를 미리 생성) |
| `npm start` | 빌드한 결과 실행 |
| `npm run typecheck` | 타입 검사만 |
| `npm run keywords` | 꿈 관련 검색 키워드 수집 (네이버 검색광고 API 키 필요, 12장) |
| `npm run check:launch` | 출시 전 점검: 문의 메일·정책 문구·사이트 주소·robots/sitemap. 문제가 있으면 목록을 보여 주고 실패 (13장) |
| `npm run test:e2e` | 자동 화면 테스트 (휴대폰·PC 크기, Playwright, 13장) |
| `npm run review:screenshots` | 검토용 화면 캡처 → `review/screenshots/` (13장) |

### 확인해 볼 화면

| 주소 | 내용 |
| --- | --- |
| http://localhost:3000/ | 꿈 입력 → 해몽 + 번호 5게임, 다시 뽑기, 인기 키워드 |
| http://localhost:3000/dream | 카테고리별 꿈해몽 사전 목록 |
| http://localhost:3000/dream/pig | 사전 상세 페이지 예시 (돼지 꿈) + 상황별 풀이 |
| http://localhost:3000/guide | 꿈 가이드 칼럼 5편 |
| http://localhost:3000/about · /privacy · /terms · /contact | 애드센스 심사용 기본 페이지 (문구는 초안) |
| http://localhost:3000/sitemap.xml · /robots.txt | 검색엔진용 파일 |

개발 모드(`npm run dev`)에서는 광고가 들어갈 자리가 **점선 상자**로 보입니다. 빌드 결과에서는 빈 칸입니다.

---

## 2. 폴더 구조

```
app/                        화면(페이지)과 API
  page.tsx                  /  홈
  api/interpret/route.ts    POST /api/interpret
  dream/page.tsx            /dream  사전 목록
  dream/[slug]/page.tsx     /dream/돼지 등 사전 상세 (SSG + 메타 태그)
  r/[payload]/page.tsx      공유 링크 결과 페이지 (+ 공유 미리보기 이미지)
  guide/, guide/[slug]/     꿈 가이드 목록과 칼럼 (SSG + 공유 이미지)
  about, privacy, terms, contact/
  opengraph-image.tsx       기본 공유 미리보기 이미지 (사전 상세는 dream/[slug]/opengraph-image.tsx)
  sitemap.ts, robots.ts, icon.svg, not-found.tsx
assets/fonts/               공유 이미지용 한글 글꼴 (Pretendard 서브셋, SIL OFL 1.1)
components/                 화면 조각 (DreamForm, ResultView, AdSlot, LottoBall, ThemeToggle …)
data/
  symbols/*.json            꿈 상징 사전 30개 (카테고리별 파일: animal·person·nature·behavior·object)
  actions.json              꿈속 행동 사전 (들어오다, 쫓기다, 먹다 … 63개, 활용형 포함)
  guides.json               꿈 가이드 칼럼 5편
lib/                        핵심 로직 — 화면과 분리되어 있어 테스트하기 쉬움
  normalize.ts              전처리 (정규화, 500자 제한, 빈 입력 거부)
  matcher.ts                꿈 문장에서 상징 + 행동 찾기 → 상황 풀이 선택
  lotto.ts                  번호 생성 (순수 함수)
  symbolNumbers.ts          상징 → 행운 숫자 후보 규칙
  interpret/                해몽 생성기 (Provider)
  service.ts                전체 흐름 조립
  symbols.ts, actions.ts    사전 데이터 불러오기 + 유효성 검사
  seo.ts                    페이지 메타데이터 + 구조화 데이터(JSON-LD)
  og.tsx                    공유 미리보기 이미지(1200×630) 공통 틀
  share.ts                  공유 링크 값 인코딩/디코딩/검사
  suggest.ts                입력 도우미 (추천 단어)
  date.ts, site.ts, types.ts
public/fonts/pretendard/    사이트 글꼴 (Pretendard 한글 2,350자 서브셋, 굵기 400·600·700)
scripts/collect-keywords.ts 네이버 검색광고 키워드 수집 (npm run keywords)
scripts/check-launch.ts     출시 전 점검 (npm run check:launch)
tests/                      Vitest 테스트 (로직 단위)
e2e/                        Playwright 화면 테스트 + 검토용 화면 캡처
playwright.config.ts        화면 테스트 설정 (휴대폰·PC)
review/                     검토 자료: screenshots/(화면 캡처 24장), lighthouse.md(점수)
```

---

## 3. 처리 흐름 (`POST /api/interpret`)

요청: `{ "dream": "꿈 내용", "counter": 0 }` (`counter`는 다시 뽑기 횟수, 생략하면 0)

1. **전처리** `lib/normalize.ts`: 특수문자·이모지 제거, 공백 정리, 영문 소문자화. 빈 입력과 500자 초과는 **400 오류**로 거부합니다(잘라내지 않음).
2. **상징 + 행동 매칭** `lib/matcher.ts`
   - 먼저 문장 부호(. ! ? 줄바꿈)로 문장을 나눕니다.
   - **상징**: keyword와 synonyms로 찾습니다. 가중치가 높은 순, 같으면 먼저 나온 순으로 **최대 4개**까지 고릅니다.
     - 겹치면 긴 표현이 우선입니다: "물고기"는 `물고기`로만 잡히고 `물`로는 잡히지 않습니다. "산불"은 `불`로 잡힙니다.
     - **한 글자 상징**(소·용·물·불·돈·금·집·산·달·뱀·똥)은 앞이 띄어쓰기이고 뒤가 조사나 '꿈'일 때만 인정합니다. 예) "용이", "돈을", "용꿈"은 매칭되고, "내용", "돈가스", "불안"은 매칭되지 않습니다.
   - **행동**: `data/actions.json`의 활용형(예: 들어오·들어와·들어왔)으로 찾습니다. 2글자 활용형("먹는", "타는")은 단어 첫머리에서만 인정해서 "도와**주는**", "불**타는**" 같은 오인식을 막습니다.
   - **상황 풀이 고르기** (상징마다, **같은 문장 안**에서만)
     1. 상징 **뒤** 30자 안의 행동을 순서대로 보면서, 그 상징의 `situations`에 있는 행동 중 **마지막(결말)** 것을 고릅니다.
        예) "도둑이 들어와서 지갑을 훔쳐 갔다" → *훔쳐 가는 꿈*, "물고기를 잡았다가 놓쳤다" → *놓치는 꿈*
     2. 그 상징에 풀이가 **없는** 행동을 만나면 거기서 멈춥니다. 예) "금반지를 잃어버려서 한참 찾았다" → 금에는 '잃어버리다' 풀이가 없으니 일반 풀이
     3. 같은 상징이 다시 나오면 거기까지만 봅니다. 예) "아기를 낳았는데 아기가 웃었다" → *아기를 낳는 꿈*
     4. 뒤에서 못 찾으면 상징 **앞** 12자 안의 가장 가까운 행동 하나를 봅니다. 예) "들어온 돼지"
     5. "안 다쳤다", "잡지 못했다"처럼 **부정된 행동은 무시**합니다. 존댓말 "주셨다"는 **받다**로 봅니다(할머니가 돈을 주셨다 = 내가 받음).
   - 상황 풀이를 찾으면 그 풀이가 일반 풀이(meaning)보다 **우선** 쓰입니다. 행동·상황 풀이는 **번호에는 영향을 주지 않습니다.**
3. **해몽 생성** `lib/interpret/`: `InterpretationProvider` 인터페이스를 쓰고, 지금은 `RuleBasedProvider`로 구현돼 있습니다.
   - 요약은 첫 상징 풀이(상황 풀이가 있으면 그것)의 첫 문장 + "함께 나온 상징 + 전체 운세 흐름" 문장, 이렇게 2문장입니다.
   - 상징이 0개면 기본 템플릿(무난한 길몽)을 씁니다.
4. **번호 생성** `lib/lotto.ts`: 아래 규칙대로 만듭니다. **Provider(AI)는 번호에 관여하지 않습니다.**
5. **응답**
   ```json
   {
     "summary": "…",
     "symbols": [{ "slug": "pig", "keyword": "돼지", "meaning": "…", "fortune_type": "재물" }],
     "situations": [{ "slug": "pig", "action": "enter", "title": "돼지가 집으로 들어오는 꿈" }],
     "games": [{ "numbers": [3, 9, 17, 20, 33, 41], "reasons": ["행운 보충", "돼지 꿈 → 재물", "…"] }],
     "date": "2026-09-30",
     "counter": 0
   }
   ```
   `reasons[i]`는 `numbers[i]`를 뽑은 이유입니다. `slug`(사전 링크용)와 `date`, `counter`는 화면 표시용으로 추가한 필드입니다.
   `situations`에는 상황 풀이가 적용된 상징만 들어 있고, 그 상징의 `symbols[].meaning`은 상황 풀이 문장입니다.

---

## 4. 번호 생성 규칙 (`lib/lotto.ts`)

- **seed** = `SHA-256("정규화된 꿈|YYYY-MM-DD")`의 앞 4바이트 (날짜는 Asia/Seoul 기준)
- **PRNG** = mulberry32 (`Math.random`은 쓰지 않음, 테스트로 확인)
- **다시 뽑기**: seed에 counter를 더합니다 (`seed + counter`)
- 한 번에 **5게임**을 만들고, 5게임 모두 같은 PRNG를 이어서 씁니다.
- 게임 1개를 만드는 순서:
  1. 매칭된 상징들의 `numbers`에 `weight`를 더해 점수표를 만듭니다. 여러 상징이 같은 숫자를 가지면 점수를 합칩니다.
  2. 점수표에서 가중 랜덤으로 **2~3개**를 뽑아 "꿈 번호"로 정합니다. 개수도 PRNG로 정하고, 이유는 `돼지 꿈 → 재물`처럼 붙습니다.
  3. 나머지는 아직 안 뽑힌 1~45에서 균등 랜덤으로 채우고, 이유는 `행운 보충`입니다.
  4. 중복 없는 6개를 오름차순으로 정렬합니다.
- 상징이 0개면 6개 모두 균등 랜덤입니다.
- **같은 날 같은 꿈이면 항상 같은 결과**가 나옵니다. "돼지 꿈!!"과 "돼지   꿈"처럼 표기만 다른 입력도 같은 결과입니다.

---

## 5. 숫자 후보 규칙 (`data/symbols/*.json`의 `numbers`)

모든 상징의 `numbers`는 아래 규칙 하나로 계산합니다. 코드는 `lib/symbolNumbers.ts`에 있습니다.

1. 카테고리마다 숫자 구간이 정해져 있습니다.

   | 동물 | 사람 | 자연 | 행동 | 물건 |
   | --- | --- | --- | --- | --- |
   | 1–9 | 10–18 | 19–27 | 28–36 | 37–45 |

2. **대표 숫자** = 구간 시작 + (키워드 글자들의 유니코드 값 합 ÷ 9의 나머지). 띄어쓰기는 빼고 계산합니다.
3. 대표 숫자에서 시작해 **17씩 더해** 가며 숫자를 만듭니다. 45를 넘으면 45를 빼서 1~45 안으로 돌립니다. 17은 45와 서로소라서 5개까지 절대 겹치지 않습니다.
4. 개수 = **weight + 2** (weight 1 → 3개, 2 → 4개, 3 → 5개). 저장할 때는 오름차순으로 정렬합니다.

**예) 돼지 (동물, weight 3)**
'돼'(46076) + '지'(51648) = 97724이고, 97724 ÷ 9의 나머지는 2입니다. 대표 숫자는 1 + 2 = **3**이고, 17씩 더하면 3 → 20 → 37 → 54−45 = 9 → 26입니다. 정렬하면 **[3, 9, 20, 26, 37]**입니다.

`tests/symbols.test.ts`가 모든 상징이 이 규칙을 지키는지 검사합니다.

### 상징을 새로 추가하려면

1. 카테고리에 맞는 파일(`data/symbols/animal.json` 등)에 항목을 추가합니다. `numbers`는 일단 `[]`로 둡니다.
2. `npm test`를 실행하면 실패 메시지에 `○○ 의 numbers 는 [..] 이어야 합니다`라고 정답 숫자가 나옵니다. 그 숫자를 그대로 복사해 넣으세요.
3. 다시 `npm test` → 통과하면 끝입니다. `npm run build` 때 사전 페이지가 자동으로 생깁니다.

필드 규칙: `slug`(영문 소문자·숫자·-, 중복 불가), `keyword`, `synonyms[]`, `category`(동물/사람/자연/행동/물건, 파일과 일치), `meaning`(2~3문장), `fortune_type`(재물/연애/건강/직장/주의), `numbers[]`(3~5개, 1~45), `weight`(1~3), `body`(300자 이상, 문단은 빈 줄로 구분), `situations[]`(3~5개).

| 파일 | 카테고리 |
| --- | --- |
| `animal.json` | 동물 |
| `person.json` | 사람 |
| `nature.json` | 자연 |
| `behavior.json` | 행동 |
| `object.json` | 물건 |

### 상황별 풀이 (`situations`)

```json
{ "action": "enter", "title": "돼지가 집으로 들어오는 꿈", "meaning": "2~3문장 풀이" }
```

- `action`은 `data/actions.json`의 `slug`여야 합니다. 한 상징 안에서 같은 행동은 한 번만 씁니다.
- `title`은 "~꿈"으로 끝나야 합니다. 사전 페이지의 소제목과 결과 화면 라벨로 쓰입니다.
- 사전 페이지에서는 `#situation-행동slug` 주소로 바로 이동할 수 있습니다. 예) `/dream/pig#situation-enter`

### 행동을 새로 추가하려면 (`data/actions.json`)

```json
{ "slug": "enter", "verb": "들어오다", "synonyms": ["들어오", "들어와", "들어왔", "들어온"] }
```

- `synonyms`에는 문장에 실제로 나오는 **활용형 앞부분**을 넣습니다. 들어오**는**, 들어오**고**는 "들어오" 하나로 잡히고, "들어왔다"는 모양이 달라서 "들어왔"을 따로 넣어야 해요.
- 1글자 활용형은 넣을 수 없어요. 2글자는 단어 첫머리에서만 인정됩니다.

---

## 6. 입력 도우미 (홈 화면)

- **예시 꿈 버튼 5개**: 누르면 입력창에 예시 문장이 채워집니다. (입력창이 비었거나 예시가 들어 있을 때만 보여요)
- **글자 수**: `0/500` 형식, 450자를 넘으면 경고 색으로 바뀝니다.
- **인식된 꿈 상징 미리보기**: 입력하는 동안 사전에서 찾은 상징을 바로 보여 줍니다. (서버와 같은 `matchSymbols`)
- **추천 칩**: 지금 치고 있는 단어로 시작하는 사전 단어를 최대 6개 보여 주고, 누르면 그 단어로 바꿔 줍니다. 한글을 치는 도중의 초성(ㄷ → 돼지, 돈)도 찾아요. 동사 조각("떨어지", "불타")처럼 어색한 단어는 추천하지 않습니다. (`lib/suggest.ts`)
- **상징 0개 안내**: 결과에 상징이 없으면 "이런 단어를 넣어 보세요" 상자와 인기 키워드 칩을 보여 주고, 누르면 입력창에 단어를 더해 줍니다.

## 7. 공유 링크 (`/r/[payload]`, DB 없음)

- 결과 화면의 **링크 복사**(모든 기기)와 **공유하기**(휴대폰 등 Web Share API를 지원하는 브라우저) 버튼으로 공유합니다.
- 링크에는 **꿈 원문을 넣지 않습니다.** 결과를 다시 만드는 데 필요한 값만 JSON 배열로 만들어 base64url로 인코딩해요.
  ```
  [1, 시드, "2026-10-01", 다시뽑기횟수, ["pig","enter"], ["fire"]]   → /r/WzEsMTQx…
  ```
  - 시드는 `SHA-256(정규화된 꿈|날짜)`의 앞 4바이트라 원문을 되돌릴 수 없어요. 번호는 `lib/lotto.ts`의 `generateGamesFromSeed()`로 같은 규칙대로 다시 계산합니다.
- 링크로 들어오면 **같은 해몽과 번호**가 보이고, **나도 해몽 받기** 버튼으로 메인에 갈 수 있어요. 사람마다 다른 결과라 검색 노출은 막았습니다(`noindex`, sitemap 제외).
- 주소는 누구나 고칠 수 있으므로 모든 값을 검사합니다(버전, 시드 범위, 실제 날짜, 횟수 0~999, 사전에 있는 상징·상황, 최대 4개, 길이 400자). **잘못된 링크는 메인으로 이동(307)**합니다.
- 공유 미리보기 이미지는 `next/og`로 요청이 올 때 만듭니다(해몽 요약 + A게임 번호).
- 테스트: `tests/share.test.ts` (인코딩/디코딩, 잘못된 값 21가지, 원문 미포함, **공유 결과 = 원래 결과**)

## 8. 꿈 가이드 칼럼 (`/guide`)

- 5편: 길몽과 흉몽 구분법 · 태몽의 종류 · 반복되는 꿈 · 꿈을 잘 기억하는 법 · 재물운 꿈 모음 (`data/guides.json`)
- 본문의 `[돼지 꿈](/dream/pig)` 표시는 사이트 안 링크로 바뀝니다(`components/RichText.tsx`). 사전 상세 페이지에는 그 상징을 다루는 가이드가 "함께 읽으면 좋은 글"로 자동으로 붙어요.
- `tests/guides.test.ts`가 **본문 1,500자 이상**(소제목 제외, 띄어쓰기 포함), 사전 링크 3개 이상, **없는 페이지로 가는 링크 없음**을 검사합니다. 새 글을 추가할 때도 같은 기준이 적용돼요.
- 광고 자리는 사전 본문과 같은 방식으로 본문 중간과 끝에 있습니다.

## 9. SEO (검색·공유)

- **페이지별 메타 태그**: `lib/seo.ts`의 `pageMetadata()`로 제목·설명·대표 주소(canonical)·공유 미리보기(OG, 트위터 카드)를 한 번에 채웁니다.
- **공유 미리보기 이미지**: `next/og`로 **빌드할 때 PNG를 미리 만듭니다**. 사전 상세 30개는 제목·대표 풀이·행운 숫자가 들어간 각자의 이미지를, 나머지 페이지는 사이트 기본 이미지를 씁니다.
  - 한글이 나오도록 `assets/fonts`의 Pretendard 서브셋(자주 쓰는 한글 2,350자)을 씁니다. 새 글을 추가했을 때 서브셋에 없는 글자가 있으면 `tests/seo.test.ts`가 알려 줍니다.
- **구조화 데이터(JSON-LD)**: 홈 `WebSite`, 사전 목록 `CollectionPage`+`ItemList`, 사전 상세·가이드 `Article`+`BreadcrumbList`. [리치 결과 테스트](https://search.google.com/test/rich-results)로 확인할 수 있어요.
- **비슷한 꿈 링크**: 사전 상세 아래에 "같은 카테고리 꿈"과 "같은 운세(다른 카테고리) 꿈"을 보여 줘 사이트 안에서 이어 읽게 합니다.
- **sitemap.xml**: 홈·사전 목록·사전 상세·가이드·기본 페이지를 `lastmod`(= `lib/site.ts`의 `CONTENT_UPDATED_AT`)와 함께 알립니다. 사전 내용을 크게 고치면 이 날짜를 바꿔 주세요.

## 10. 디자인

- **분위기**: 밤하늘(짙은 남색) + 달빛(금색) 포인트. 헤더와 첫 화면은 두 테마 모두 남색 띠이고, 본문은 글 읽기 편한 밝은/어두운 면을 씁니다.
- **색은 모두 토큰으로**: `app/globals.css`의 `--page`, `--surface`, `--ink` 등. Tailwind에서는 `bg-surface`, `text-ink-soft`, `border-line`처럼 씁니다. 색을 바꿀 땐 이 파일만 고치면 돼요.
- **라이트/다크**: 기본은 기기 설정을 따릅니다. 헤더의 달/해 버튼으로 바꾸면 그 선택을 기억합니다(`<html data-theme>` + localStorage).
- **명도 대비 (WCAG AA 4.5:1 이상)**: 글자-배경 조합을 모두 계산해 확인했습니다. 가장 낮은 값은 라이트 4.94(달빛색 강조 글자), 다크 5.78(흐린 글자 on 카드)입니다.
- **글꼴**: Pretendard(SIL OFL 1.1)를 사이트 안에 포함했습니다(`public/fonts/pretendard`). 제작자가 배포하는 **KS X 1001 한글 2,350자 서브셋**을 굵기 400·600·700 세 파일(합계 약 790KB)만 씁니다.
  - 첫 화면은 기기 글꼴로 바로 보여 주고, 페이지를 다 불러온 뒤 글꼴 세 개를 받아 **한 번에** 바꿉니다(`app/layout.tsx`). 글꼴을 기다리느라 화면이 늦게 뜨지 않아요.
  - 글자 범위별로 잘게 쪼갠 파일(92개 중 페이지마다 15개 안팎)을 쓰던 방식은 휴대폰에서 글꼴을 처음 적용할 때 화면이 멈칫해서 바꿨습니다. 자세한 측정은 `review/lighthouse.md`.
  - 글꼴 파일은 1년 동안 브라우저에 저장(캐시)되어 두 번째 페이지부터는 다시 받지 않습니다. 그래서 **글꼴 파일을 바꿀 땐 파일 이름도 바꿔 주세요.**
  - 서브셋에 없는 드문 한글(예: 똠, 햏)과 한자는 기기 글꼴로 보입니다. 사전·가이드 글이 서브셋 안에 있는지는 테스트가 확인합니다.
- **로또 공 색**: 1~10 노랑, 11~20 파랑, 21~30 빨강, 31~40 회색, 41~45 초록 (`lib/ballColors.ts`, 화면과 공유 이미지가 같이 씀). 꿈에서 나온 번호는 달빛색 테두리로 구분합니다.
- **공식 사이트처럼 보이지 않게**: 실제 복권 사업자의 이름·로고·디자인은 쓰지 않고, 로고는 자체 초승달 그림입니다. 푸터에 "비공식 재미 서비스" 문구가 있습니다.
- **결과 연출**: 공이 하나씩 굴러 나옵니다. i번째 공은 i×0.2초 뒤에 0.55초 동안 움직여 **게임 하나가 약 1.55초**(5게임 전부 약 1.9초)에 끝나요. CSS 애니메이션만 써서 공유 페이지에서도 똑같이 동작하고, 기기에서 **움직임 줄이기**(`prefers-reduced-motion`)를 켜면 애니메이션 없이 바로 보여 줍니다.
- **이유 태그**: 꿈 번호에는 `돼지 → 재물`처럼 운세 색 태그가 붙습니다. (`lib/reasonTag.ts`가 `lotto.ts`의 이유 문장을 화면용으로만 다듬고, 번호 규칙은 건드리지 않아요)
- **광고 자리 규칙은 그대로**: 결과 번호 아래, 사전 본문 중간/끝 (입력창 옆 X).

## 11. 환경변수

`.env.example`을 복사해 `.env.local`을 만듭니다. 1단계에서는 **아무것도 넣지 않아도 동작**합니다.

- `NEXT_PUBLIC_SITE_URL`: 사이트 대표 주소. **비워 두면 `https://www.haemongru.com`** 입니다(`lib/site.ts`의 `DEFAULT_SITE_URL`, 끝 슬래시 없이 다듬음). 주소는 이 한 곳에서만 정하고, metadataBase·canonical·공유 미리보기(OG/Twitter)·sitemap·robots·구조화 데이터(url, @id)·공유 링크가 모두 이 값을 씁니다. vercel.app 주소로 열어도 canonical은 이 주소를 가리킵니다. 로컬에서 복사한 공유 링크를 그대로 열어 보려면 `.env.local`에 `NEXT_PUBLIC_SITE_URL=http://localhost:3000`을 넣으세요.
- `NAVER_AD_*`: 키워드 수집 스크립트용 (아래 12장). 사이트 실행에는 필요 없습니다.
- 나머지(`LLM_API_KEY`, Supabase, AdSense)는 2단계용 자리입니다. 실제 값은 `.env.local`이나 Vercel 환경변수에만 넣고, **git에는 절대 올리지 마세요.** (`.env.local`은 `.gitignore`에 들어 있어 git에 올라가지 않습니다.)

## 12. 키워드 수집 스크립트 (`scripts/collect-keywords.ts`)

네이버 검색광고 API의 **키워드 도구**로 "꿈" 관련 연관 키워드와 **월간 검색량(PC/모바일)**을 모읍니다. 어떤 꿈을 사전에 먼저 추가할지 고를 때 씁니다.

### API 키 발급 (처음 한 번)

1. [네이버 검색광고](https://searchad.naver.com)에 가입하고 로그인합니다. 광고를 집행하지 않아도 가입할 수 있어요.
2. 광고시스템 → **도구** → **API 사용 관리**로 갑니다. (메뉴 이름은 바뀔 수 있어요.)
3. "네이버 검색광고 API 서비스 신청" 후 **액세스라이선스**와 **비밀키**를 발급받고, 같은 화면의 **CUSTOMER_ID**를 확인합니다.
4. `.env.local`에 넣습니다. (없으면 `cp .env.example .env.local`로 만든 뒤 채우기)
   ```
   NAVER_AD_API_KEY=발급받은_액세스라이선스
   NAVER_AD_SECRET_KEY=발급받은_비밀키
   NAVER_AD_CUSTOMER_ID=숫자로된_CUSTOMER_ID
   ```

### 실행

```bash
npm run keywords                  # 기본 씨앗 단어: 꿈해몽·꿈풀이·로또꿈·태몽·길몽 + 사전 상징마다 "○○꿈"
npm run keywords -- 고양이꿈 시험꿈   # 씨앗 단어를 직접 지정
```

결과는 `data/keywords.csv`에 저장됩니다.

| 열 | 뜻 |
| --- | --- |
| `keyword` | 연관 키워드 ("꿈"이 들어간 것만) |
| `pc`, `mobile` | 월간 검색량. 네이버가 `< 10`으로 주는 값은 `<10`으로 적고 합계에는 0으로 셉니다 |
| `total` | pc + mobile (이 값이 큰 순서로 정렬) |
| `in_dictionary` | 이미 사전에 있는 상징이면 `Y` |
| `symbols` | 해당 상징 slug (예: `pig`) |
| `seeds` | 이 키워드를 돌려준 씨앗 단어 |

- 씨앗 단어는 **5개씩 묶어** 요청하고(API 제한), 요청 사이에 **1초** 쉽니다. `NAVER_AD_INTERVAL_MS`로 바꿀 수 있어요.
- 너무 잦은 요청(429)이나 서버 오류(5xx), 네트워크 오류는 1초 → 2초 → 4초 기다리며 최대 3번 다시 시도합니다. 키가 틀리면(401/403) 바로 멈추고 알려 줍니다.
- 띄어쓰기만 다른 키워드("돼지꿈", "돼지 꿈")는 하나로 합칩니다.
- 실제 API 없이 가짜 응답으로 동작을 검사하는 테스트가 `tests/collect-keywords.test.ts`에 있습니다.

## 13. 화면 테스트와 품질 점검

### 자동 화면 테스트 (Playwright)

```bash
npx playwright install chromium   # 처음 한 번: 테스트용 브라우저 설치
npm run test:e2e                  # 휴대폰(Pixel 7)·PC(1280×800) 크기에서 사용자 흐름 검사
npm run review:screenshots        # 검토용 화면 캡처 → review/screenshots/
```

- `e2e/flow.spec.ts`: 입력 → 결과 → 다시 뽑기 → 링크 복사 → 공유 페이지에서 같은 결과 → "나도 해몽 받기", 잘못된 공유 링크, 빈 입력, 입력 도우미, 움직임 줄이기, 테마 기억, 사전·가이드·404를 검사합니다.
- 테스트가 알아서 `npm run build` 후 3100번 포트로 서버를 켭니다. 이미 켜 둔 서버가 있으면 그대로 씁니다. 포트를 바꾸려면 `E2E_PORT=3200 npm run test:e2e`.
- 화면 캡처는 6개 화면 × 휴대폰/PC × 라이트/다크 = 24장(JPEG)입니다. 공 애니메이션이 끝난 모습을 찍으려고 '움직임 줄이기' 설정으로, Pretendard가 적용된 뒤에 찍습니다.
- 실패하면 `test-results/`에 기록이 남습니다(git에는 올라가지 않음).

### 출시 전 점검 (`npm run check:launch`)

배포 직전에 실행하세요. 빌드 없이 몇 초면 끝나고, 하나라도 걸리면 고칠 목록을 보여 주며 실패합니다.

- **문의 메일**: `lib/site.ts`의 `CONTACT_EMAIL`이 `contact@example.com` 같은 자리표시자인지
- **정책 문구**: 소개·개인정보처리방침·이용약관·문의 페이지를 실제로 그려 보고, 너무 짧거나 자리표시자(TODO, example.com 등)가 남았는지, 꼭 필요한 내용(애드센스·쿠키·맞춤 광고·꿈 내용 미저장·접속 기록·문의처, 당첨 보장 없음, 만 19세)이 있는지
- **사이트 주소**: `SITE_URL`이 대표 도메인(`https://www.haemongru.com`)과 같은지, vercel.app·localhost·http 주소가 아닌지
- **robots.txt·sitemap.xml**: sitemap 주소, 전체 차단 여부, 다른 도메인·공유 링크·중복·빠진 페이지·이상한 날짜
- **빌드 결과**: `.next`가 있으면 그 안의 robots·sitemap·canonical이 지금 설정과 같은지 (다르면 다시 빌드)

> 지금은 문의 메일이 자리표시자라서 **실패하는 게 정상**입니다. 실제 주소를 넣으면 통과합니다.

### Lighthouse (성능·접근성·SEO 점수)

점수와 개선 내역은 `review/lighthouse.md`에 있습니다. 직접 재 보려면 크롬이 설치된 컴퓨터에서:

```bash
npm run build && npm start                                             # 터미널 1
npx lighthouse http://localhost:3000/dream/pig --view                  # 터미널 2: 휴대폰 기준
npx lighthouse http://localhost:3000/dream/pig --preset=desktop --view # PC 기준
```

점수는 잴 때마다 조금씩 달라지니 3번쯤 재서 가운데 값을 보세요.

## 14. Vercel 배포 (참고)

1. GitHub 저장소를 Vercel에서 Import합니다. Framework는 Next.js로 자동 인식됩니다.
2. 환경변수는 넣지 않아도 됩니다. 사이트 주소 기본값이 `https://www.haemongru.com`입니다(`lib/site.ts`). 다른 주소로 띄울 때만 `NEXT_PUBLIC_SITE_URL`을 넣으세요. (바꾸면 다시 배포해야 반영돼요)
3. Deploy. 별도 설정 파일(`vercel.json`)은 필요 없습니다.
4. **Domains**: 대표(Primary)는 `www.haemongru.com`입니다. 루트 도메인 → www 이동(308)은 **Vercel 대시보드에서만** 설정합니다.
   - 코드(`next.config.ts`의 redirects, middleware/proxy)에는 리디렉션을 넣지 않습니다. 양쪽에서 걸면 서로 보내는 무한 이동(루프)이 생길 수 있어요. `tests/domain.test.ts`가 코드에 리디렉션이 없는지 확인합니다.
   - 대시보드에서 www → 루트 방향으로 바꾸지 마세요. canonical·sitemap이 www를 가리키므로 루프가 됩니다.
5. 배포 후 확인: 루트 도메인으로 열면 `https://www.haemongru.com`으로 바뀌는지, vercel.app 주소로 열어도 페이지 소스의 canonical이 `https://www.haemongru.com/...`인지, `/sitemap.xml`과 `/robots.txt`의 주소가 `https://www.haemongru.com`인지 봅니다.

---

## 15. 2단계에서 손댈 파일

| 기능 | 손댈 파일 |
| --- | --- |
| **AI 해몽** | `lib/interpret/llm.ts` 새로 만들기 (`InterpretationProvider` 구현), `lib/interpret/index.ts`에서 `LLM_API_KEY`가 있으면 LlmProvider를 돌려주도록 변경. 실패하면 RuleBasedProvider로 대체. **번호는 계속 `lib/lotto.ts`가 생성**. 꿈 원문이 외부 AI 업체로 전송되므로 **켜기 전에 개인정보처리방침에 처리 위탁·국외 이전 고지를 추가하고 입력창 근처에 안내**를 넣어야 합니다(`app/privacy/page.tsx` 위쪽 주석) |
| **Supabase** | `lib/symbols.ts`의 함수 내용만 DB 조회로 교체 (함수 이름 유지). 저장이 생기면 `app/privacy/page.tsx` 수정 |
| **공유 링크** | 1단계에서 DB 없이 구현 완료(`/r/[payload]`). AI 해몽 문장까지 그대로 공유하려면 Supabase에 결과를 저장하고 `app/r/[payload]/page.tsx`가 저장된 결과를 읽도록 바꾸기 |
| **애드센스** | `components/AdSlot.tsx`에만 광고 코드 넣기, `app/layout.tsx`에 AdSense 스크립트, `public/ads.txt` 추가, `lib/site.ts`의 `CONTACT_EMAIL` 실제 주소로 변경 |
