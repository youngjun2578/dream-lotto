// 구조화 데이터(JSON-LD) 출력. 검색엔진이 페이지 내용을 이해하도록 돕는다.

import { serializeJsonLd } from "@/lib/seo";

export function JsonLd({ data }: { data: Record<string, unknown> | Record<string, unknown>[] }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(data) }} />;
}
