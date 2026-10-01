// 자동 화면 테스트 (Playwright)
//   npm run test:e2e             휴대폰·PC 크기에서 입력 → 결과 → 다시 뽑기 → 공유 링크 흐름 검사
//   npm run review:screenshots   검토용 화면 캡처 → review/screenshots/
// 처음 한 번은 브라우저를 설치해야 해요: npx playwright install chromium

import { defineConfig, devices } from "@playwright/test";
import { DEFAULT_SITE_URL } from "./lib/site";

const PORT = Number(process.env.E2E_PORT ?? 3100);
const BASE_URL = `http://localhost:${PORT}`;

export default defineConfig({
  testDir: "e2e",
  timeout: 45_000,
  expect: { timeout: 10_000 },
  reporter: [["list"]],
  use: {
    baseURL: BASE_URL,
    locale: "ko-KR",
    trace: "retain-on-failure",
  },
  projects: [
    { name: "mobile", testIgnore: /screenshots\.spec\.ts/, use: { ...devices["Pixel 7"] } },
    {
      name: "desktop",
      testIgnore: /screenshots\.spec\.ts/,
      use: { ...devices["Desktop Chrome"], viewport: { width: 1280, height: 800 } },
    },
    { name: "review", testMatch: /screenshots\.spec\.ts/, use: { ...devices["Desktop Chrome"] } },
  ],
  // 실제 배포와 같은 빌드 결과로 검사한다. 이미 켜 둔 서버가 있으면 그대로 쓴다.
  webServer: {
    command: `npm run build && npm run start -- -p ${PORT}`,
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 300_000,
    // .env.local 에 다른 주소가 있어도 실제 배포와 같은 대표 주소로 빌드한다.
    env: { NEXT_PUBLIC_SITE_URL: DEFAULT_SITE_URL },
  },
});
