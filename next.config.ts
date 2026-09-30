import type { NextConfig } from "next";

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
