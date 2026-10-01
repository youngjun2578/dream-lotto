// 공유 미리보기 이미지(opengraph-image): 없는 사전·가이드 주소는 페이지처럼 404 를 낸다.
// (있는 주소의 이미지는 빌드 결과로 e2e/flow.spec.ts 에서 확인)

import { describe, expect, it } from "vitest";
import DreamImage from "@/app/dream/[slug]/opengraph-image";
import GuideImage from "@/app/guide/[slug]/opengraph-image";

/** Next.js 의 notFound() 가 던지는 오류인지 (digest 가 "…;404") */
async function expectNotFound(run: () => Promise<unknown>) {
  const error = (await run().then(
    () => null,
    (e: unknown) => e,
  )) as { digest?: string } | null;
  expect(error?.digest ?? "").toMatch(/;404$/);
}

describe("미리보기 이미지: 없는 주소는 404", () => {
  it("사전에 없는 상징", async () => {
    await expectNotFound(() => DreamImage({ params: Promise.resolve({ slug: "unicorn" }) }));
    await expectNotFound(() => DreamImage({ params: Promise.resolve({ slug: "PIG" }) }));
  });

  it("없는 가이드 글", async () => {
    await expectNotFound(() => GuideImage({ params: Promise.resolve({ slug: "nope" }) }));
  });
});
