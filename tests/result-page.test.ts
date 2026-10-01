// 결과 페이지 분리: /result/[payload] (본인 결과) 와 /r/[payload] (공유 페이지)
// - 같은 payload 는 언제 열어도 같은 결과·번호 (새로고침·북마크)
// - 다시 뽑기는 횟수만 올린 payload
// - 주소에 꿈 원문이 없다
// - 검색 노출: noindex, sitemap 제외, robots.txt 로는 막지 않음

import { describe, expect, it } from "vitest";
import robots from "@/app/robots";
import sitemap from "@/app/sitemap";
import { generateMetadata as ownMetadata } from "@/app/result/[payload]/page";
import { generateMetadata as sharedMetadata } from "@/app/r/[payload]/page";
import { resultTitle } from "@/lib/resultMeta";
import { buildSharedResult, interpretDream } from "@/lib/service";
import { decodeShare, encodeShare, nextDrawShare, resultPath, sharedPath } from "@/lib/share";
import { SITE_URL } from "@/lib/site";

const NOW = new Date("2026-10-01T03:00:00Z");
const DREAM = "돼지가 집으로 들어오고 마당에 불이 활활 타는 꿈을 꿨어요";
const params = (payload: string) => ({ params: Promise.resolve({ payload }) });

describe("결과 주소", () => {
  it("본인 결과는 /result/, 공유는 /r/ 이고 같은 값을 쓴다", async () => {
    const res = await interpretDream(DREAM, { now: NOW });
    expect(resultPath(res.share)).toBe(`/result/${res.share}`);
    expect(sharedPath(res.share)).toBe(`/r/${res.share}`);
  });

  it("주소에는 꿈 원문이 없다 (한글도, 꿈의 단어도 들어가지 않는다)", async () => {
    const res = await interpretDream(DREAM, { now: NOW });
    const path = resultPath(res.share);
    const decoded = Buffer.from(res.share, "base64url").toString("utf8");
    for (const text of [path, decoded]) {
      expect(text).not.toMatch(/[가-힣]/);
      for (const word of DREAM.split(" ")) expect(text).not.toContain(word);
    }
  });

  it("같은 payload 로 몇 번을 다시 만들어도 같은 결과·번호 (새로고침·북마크)", async () => {
    const res = await interpretDream(DREAM, { now: NOW });
    const a = await buildSharedResult(res.share);
    const b = await buildSharedResult(res.share);
    expect(a).toEqual(b);
    expect(a?.games).toEqual(res.games);
  });
});

describe("다시 뽑기 (nextDrawShare)", () => {
  it("다시 뽑기 횟수만 하나 올리고, 나머지(시드·날짜·상징·행동)는 그대로", async () => {
    const res = await interpretDream(DREAM, { now: NOW });
    const next = nextDrawShare(res.share)!;
    const before = decodeShare(res.share)!;
    expect(decodeShare(next)).toEqual({ ...before, counter: 1 });
  });

  it("꿈 원문 없이 만든 다음 번호가 꿈 원문으로 다시 뽑은 번호와 같다", async () => {
    const first = await interpretDream(DREAM, { now: NOW });
    const again = await interpretDream(DREAM, { now: NOW, counter: 1 });
    const viaPayload = await buildSharedResult(nextDrawShare(first.share));
    expect(viaPayload?.games).toEqual(again.games);
    expect(viaPayload?.counter).toBe(1);
    expect(viaPayload?.games).not.toEqual(first.games);
  });

  it("횟수가 끝(999)이거나 값이 잘못되면 null", () => {
    const last = encodeShare({ seed: 1, date: "2026-10-01", counter: 999, matches: [] });
    expect(nextDrawShare(last)).toBeNull();
    expect(nextDrawShare("garbage")).toBeNull();
    expect(nextDrawShare(undefined)).toBeNull();
  });
});

describe("검색 노출 (결과 페이지는 noindex, sitemap 제외, robots.txt 로는 막지 않음)", () => {
  it("두 결과 페이지 모두 noindex 이고 제목은 '{상징} 꿈 해몽 결과'", async () => {
    const res = await interpretDream(DREAM, { now: NOW });
    for (const generate of [ownMetadata, sharedMetadata]) {
      const meta = await generate(params(res.share));
      expect(meta.robots).toEqual({ index: false, follow: true });
      expect(meta.title).toBe("돼지·불 꿈 해몽 결과");
      // 대표 주소는 공유 주소(/r/…)로 맞춘다.
      expect(meta.alternates?.canonical).toBe(`${SITE_URL}/r/${res.share}`);
    }
  });

  it("상징이 없으면 '꿈 해몽 결과', 잘못된 주소도 noindex", async () => {
    const none = await interpretDream("오늘은 평범한 하루였어요", { now: NOW });
    expect(resultTitle(none)).toBe("꿈 해몽 결과");
    for (const generate of [ownMetadata, sharedMetadata]) {
      const meta = await generate(params("not-a-real-link"));
      expect(meta.robots).toEqual({ index: false, follow: true });
      expect(meta.title).toBe("꿈 해몽 결과");
    }
  });

  it("sitemap 에 결과·공유 주소가 없다", () => {
    const urls = sitemap().map((e) => e.url);
    expect(urls.filter((u) => u.includes("/result/") || u.includes("/r/"))).toEqual([]);
  });

  it("robots.txt 는 결과·공유 주소를 막지 않는다 (noindex 를 읽을 수 있게)", () => {
    const rules = [robots().rules].flat();
    const disallowed = rules.flatMap((r) => [r?.disallow ?? []].flat());
    expect(disallowed.some((path) => /^\/(result|r)\b/.test(path))).toBe(false);
  });
});
