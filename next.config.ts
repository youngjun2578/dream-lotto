import type { NextConfig } from "next";

// 리디렉션은 여기서 걸지 않는다. 루트 도메인 → www 308 은 Vercel 대시보드(Domains)가 처리한다.
// (코드에도 걸면 대시보드 설정과 서로 보내는 루프가 생길 수 있다. tests/domain.test.ts 가 확인)
const nextConfig: NextConfig = {
  reactStrictMode: true,
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
