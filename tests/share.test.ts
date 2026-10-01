// 공유 링크 (/r/[payload]) 인코딩·디코딩과 결과 재현

import { describe, expect, it } from "vitest";
import { makeSeed } from "@/lib/lotto";
import { decodeShare, encodeShare, MAX_PAYLOAD_LENGTH, resolveShare, type SharePayload } from "@/lib/share";
import { buildSharedResult, interpretDream } from "@/lib/service";
import { getAllSymbols } from "@/lib/symbols";

const SYMBOLS = getAllSymbols();
const NOW = new Date("2026-09-30T03:00:00Z");

const b64 = (value: unknown) => Buffer.from(JSON.stringify(value), "utf8").toString("base64url");

const SAMPLE: SharePayload = {
  seed: 1412796921,
  date: "2026-09-30",
  counter: 2,
  matches: [{ symbol: "pig", action: "enter" }, { symbol: "fire" }],
};

describe("encodeShare / decodeShare", () => {
  it("인코딩 → 디코딩하면 같은 값", () => {
    expect(decodeShare(encodeShare(SAMPLE))).toEqual(SAMPLE);
    const empty = { ...SAMPLE, matches: [] };
    expect(decodeShare(encodeShare(empty))).toEqual(empty);
  });

  it("주소에 그대로 쓸 수 있는 글자(base64url)만 쓴다", () => {
    expect(encodeShare(SAMPLE)).toMatch(/^[A-Za-z0-9_-]+$/);
  });

  it("잘못된 값은 모두 null", () => {
    const bad: unknown[] = [
      undefined,
      123,
      "",
      "!!!",
      "not base64 %%%",
      b64({ v: 1 }),
      b64([2, 1, "2026-09-30", 0]), // 버전이 다름
      b64([1, -1, "2026-09-30", 0]), // 시드 범위
      b64([1, 2 ** 32, "2026-09-30", 0]),
      b64([1, 1.5, "2026-09-30", 0]),
      b64([1, 1, "2026-13-01", 0]), // 없는 날짜
      b64([1, 1, "2026-02-30", 0]),
      b64([1, 1, "20260930", 0]),
      b64([1, 1, "2026-09-30", 1000]), // 다시 뽑기 횟수 범위
      b64([1, 1, "2026-09-30", -1]),
      b64([1, 1, "2026-09-30", 0, "pig"]), // 상징은 배열이어야 함
      b64([1, 1, "2026-09-30", 0, ["pig"], ["pig"]]), // 중복
      b64([1, 1, "2026-09-30", 0, ["<script>"]]),
      b64([1, 1, "2026-09-30", 0, ["pig", "enter", "x"]]),
      b64([1, 1, "2026-09-30", 0, ["a"], ["b"], ["c"], ["d"], ["e"]]), // 4개 초과
      "A".repeat(MAX_PAYLOAD_LENGTH + 1),
    ];
    for (const value of bad) expect(decodeShare(value), String(value)).toBeNull();
  });

  it("사전에 없는 상징이나, 그 상징에 없는 상황이면 resolve 단계에서 null", () => {
    expect(resolveShare({ ...SAMPLE, matches: [{ symbol: "unicorn" }] }, SYMBOLS)).toBeNull();
    expect(resolveShare({ ...SAMPLE, matches: [{ symbol: "pig", action: "bite" }] }, SYMBOLS)).toBeNull();
    const ok = resolveShare(SAMPLE, SYMBOLS)!;
    expect(ok.map((m) => [m.symbol.slug, m.situation?.action])).toEqual([
      ["pig", "enter"],
      ["fire", undefined],
    ]);
  });
});

describe("공유 링크로 같은 결과 재현", () => {
  const dreams = [
    "돼지가 집으로 들어오고 마당에 불이 활활 타는 꿈을 꿨어요",
    "돌아가신 할머니가 돈을 주셨어요. 뱀에게 물리기도 했어요.",
    "용이 하늘로 올라갔어요",
    "오늘은 평범한 하루였다",
  ];

  it("해몽·상징·상황·번호·날짜·횟수가 모두 같다", async () => {
    for (const dream of dreams) {
      for (const counter of [0, 1, 7]) {
        const original = await interpretDream(dream, { now: NOW, counter });
        const shared = await buildSharedResult(original.share);
        expect(shared, dream).toEqual(original);
      }
    }
  });

  it("꿈 원문은 링크에 들어 있지 않다 (시드·slug·날짜·숫자만)", async () => {
    const dream = "돼지가 집으로 들어오고 마당에 불이 활활 타는 꿈을 꿨어요";
    const res = await interpretDream(dream, { now: NOW });
    const decoded = Buffer.from(res.share, "base64url").toString("utf8");
    expect(decoded).toBe(JSON.stringify([1, makeSeed("돼지가 집으로 들어오고 마당에 불이 활활 타는 꿈을 꿨어요", "2026-09-30"), "2026-09-30", 0, ["pig", "enter"], ["fire", "burn"], ["house"]]));
    expect(decoded).not.toMatch(/[가-힣]/);
  });

  it("잘못된 링크는 null (페이지에서는 메인으로 보낸다)", async () => {
    await expect(buildSharedResult("garbage")).resolves.toBeNull();
    await expect(buildSharedResult(b64([1, 1, "2026-09-30", 0, ["unicorn"]]))).resolves.toBeNull();
  });
});
