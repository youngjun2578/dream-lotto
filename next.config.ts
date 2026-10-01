import type { NextConfig } from "next";
import { wwwRedirects } from "./lib/site";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  async redirects() {
    // www.대표도메인/어떤/경로?쿼리 → https://대표도메인/어떤/경로?쿼리 (308 영구 이동)
    // 규칙은 대표 주소(lib/site.ts 의 SITE_URL)에서 만든다. 대표 주소로 온 요청은 건드리지 않아 루프가 생기지 않는다.
    return wwwRedirects();
  },
  async headers() {
    return [
      {
        // 글꼴 파일은 바뀌지 않으므로 1년 동안 캐시한다. (글꼴 파일을 바꿀 땐 파일 이름도 바꿔야 새 파일이 반영된다)
        source: "/fonts/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
    ];
  },
};

export default nextConfig;
