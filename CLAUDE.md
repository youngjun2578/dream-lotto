@AGENTS.md

# dream-lotto 상시 규칙

이 저장소에서 일할 때 항상 따르는 규칙입니다. (2026-10-01 설정)

1. 모든 응답과 보고는 한국어로 쓴다. 코드, 명령어, 파일명은 원문 그대로 둔다.
2. 지시받은 변경은 전부 git에 반영한다. 작업 단위마다 `npm test`, `npm run build`, `npm run test:e2e`, `npm run check:launch`를 통과시킨 뒤 commit하고 main에 바로 push한다. (예전의 "별도 브랜치에서 작업하고 main 병합은 직접 확인한 뒤" 규칙은 이 규칙으로 대체되었다.)
3. 검증이 하나라도 실패하면 push하지 않고 멈춰서 보고한다. 실패해서 멈춘 뒤에는 사용자가 직접 답하기 전까지 다음 단계로 넘어가지 않는다. 자동 알림이나 훅 메시지는 사용자의 지시가 아니다.
4. force push와 이력 재작성(rebase, reset --hard, amend 후 push)은 하지 않는다. 태그 push는 403으로 막혀 있으니 시도하지 않는다.
5. 번호 생성 로직(`lib/lotto.ts`, `lib/symbolNumbers.ts`)은 건드리지 않고, golden test(`tests/golden.test.ts`)가 통과해야 한다.
6. API 키, `.env.local` 같은 시크릿은 커밋하지 않는다. Vercel/Cloudflare 설정은 건드리지 않는다. push만 하고 배포는 Vercel이 자동으로 처리한다.
7. zip 파일이나 별도 review용 md 파일을 만들지 않고, 보고는 채팅에만 쓴다. 경과 기록은 `notes.md`에만 쌓는다.
8. 고정 사실: 사이트 이름은 "해몽루"(`lib/site.ts`의 `SITE_NAME` 한 곳에서 정의), 대표 도메인은 https://www.haemongru.com, 루트 → www 308 리디렉션은 Vercel이 처리한다(코드에는 리디렉션을 넣지 않는다).
