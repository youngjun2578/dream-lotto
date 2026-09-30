import { describe, expect, it } from "vitest";
import { getSeoulDate } from "@/lib/date";
import type { InterpretationProvider } from "@/lib/interpret";
import { NO_SYMBOL_SUMMARY } from "@/lib/interpret/ruleBased";
import { FILL_REASON } from "@/lib/lotto";
import { InputError } from "@/lib/normalize";
import { interpretDream } from "@/lib/service";

// 한국 시간 2026-09-30 12:00
const NOW = new Date("2026-09-30T03:00:00Z");
const NEXT_DAY = new Date("2026-10-01T03:00:00Z");

describe("interpretDream", () => {
  it("응답 형태: summary, symbols[], games[5], date, counter", async () => {
    const res = await interpretDream("돼지가 집으로 들어오는 꿈을 꿨어요", { now: NOW });
    expect(res.summary.length).toBeGreaterThan(0);
    expect(res.symbols.map((s) => s.keyword)).toEqual(["돼지", "집"]);
    for (const s of res.symbols) {
      expect(s).toEqual({
        slug: expect.any(String),
        keyword: expect.any(String),
        meaning: expect.any(String),
        fortune_type: expect.any(String),
      });
    }
    expect(res.games).toHaveLength(5);
    expect(res.date).toBe("2026-09-30");
    expect(res.counter).toBe(0);
  });

  it("같은 날 같은 꿈이면 같은 결과, 표기만 다른 입력도 같은 결과", async () => {
    const a = await interpretDream("돼지 꿈!!", { now: NOW });
    const b = await interpretDream("  돼지   꿈 ", { now: new Date("2026-09-30T14:59:00Z") });
    expect(b.games).toEqual(a.games);
  });

  it("날짜가 바뀌면 다른 결과", async () => {
    const a = await interpretDream("돼지 꿈", { now: NOW });
    const b = await interpretDream("돼지 꿈", { now: NEXT_DAY });
    expect(b.games).not.toEqual(a.games);
  });

  it("다시 뽑기(counter)는 다른 결과", async () => {
    const a = await interpretDream("돼지 꿈", { now: NOW, counter: 0 });
    const b = await interpretDream("돼지 꿈", { now: NOW, counter: 1 });
    expect(b.games).not.toEqual(a.games);
    expect(b.counter).toBe(1);
  });

  it("상징이 0개면 기본 템플릿 + 균등 랜덤 번호", async () => {
    const res = await interpretDream("오늘은 평범한 하루였다", { now: NOW });
    expect(res.summary).toBe(NO_SYMBOL_SUMMARY);
    expect(res.symbols).toEqual([]);
    expect(res.games).toHaveLength(5);
    for (const g of res.games) expect(g.reasons.every((r) => r === FILL_REASON)).toBe(true);
  });

  it("빈 입력은 InputError", async () => {
    await expect(interpretDream("", { now: NOW })).rejects.toThrow(InputError);
    await expect(interpretDream("   ", { now: NOW })).rejects.toThrow(InputError);
    await expect(interpretDream(undefined, { now: NOW })).rejects.toThrow(InputError);
  });

  it("500자 초과 입력은 InputError", async () => {
    await expect(interpretDream("돼".repeat(501), { now: NOW })).rejects.toThrow(InputError);
  });

  it("잘못된 counter 는 InputError", async () => {
    for (const counter of [-1, 1.5, "1", 1000]) {
      await expect(interpretDream("돼지 꿈", { now: NOW, counter })).rejects.toThrow(InputError);
    }
  });

  it("해몽 Provider 를 바꿔도 번호는 그대로 (번호는 Provider 가 만들지 않는다)", async () => {
    const fake: InterpretationProvider = {
      name: "fake-llm",
      interpret: async () => ({ summary: "가짜 AI 해몽", symbols: [] }),
    };
    const rule = await interpretDream("돼지 꿈", { now: NOW });
    const llm = await interpretDream("돼지 꿈", { now: NOW, provider: fake });
    expect(llm.summary).toBe("가짜 AI 해몽");
    expect(llm.games).toEqual(rule.games);
  });
});

describe("getSeoulDate", () => {
  it("UTC 가 아니라 한국 시간 기준 날짜", () => {
    expect(getSeoulDate(new Date("2026-09-30T14:59:59Z"))).toBe("2026-09-30");
    expect(getSeoulDate(new Date("2026-09-30T15:00:00Z"))).toBe("2026-10-01");
  });
});
