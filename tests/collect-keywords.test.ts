// 키워드 수집 스크립트 테스트 — 실제 API 대신 가짜(mock) 응답을 쓴다.

import { createHmac } from "node:crypto";
import { describe, expect, it, vi } from "vitest";
import {
  buildHeaders,
  collectKeywords,
  createKeywordClient,
  defaultSeeds,
  findDictionarySymbols,
  getConfig,
  KEYWORD_TOOL_URI,
  mergeDreamKeywords,
  NaverApiError,
  parseEnv,
  parseInterval,
  parseVolume,
  toCsv,
  type NaverAdConfig,
  type RawKeyword,
} from "../scripts/collect-keywords";
import { getAllSymbols } from "@/lib/symbols";

const CONFIG: NaverAdConfig = { apiKey: "test-api-key", secretKey: "test-secret", customerId: "1234567" };
const SYMBOLS = getAllSymbols();

/** 가짜 시계 + sleep: 실제로 기다리지 않고 시간만 앞으로 돌린다. */
function fakeClock(start = 1_000_000) {
  let t = start;
  const sleeps: number[] = [];
  return {
    now: () => t,
    sleep: async (ms: number) => {
      sleeps.push(ms);
      t += ms;
    },
    sleeps,
  };
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}

/** hintKeywords 별로 정해 둔 응답을 돌려주는 가짜 fetch */
function mockFetch(byHints: Record<string, RawKeyword[]>) {
  return vi.fn(async (url: string | URL | Request) => {
    const hints = new URL(String(url)).searchParams.get("hintKeywords") ?? "";
    return jsonResponse({ keywordList: byHints[hints] ?? [] });
  });
}

describe("설정 (.env.local)", () => {
  it(".env 형식을 읽는다 (주석, 빈 줄, 따옴표)", () => {
    const env = parseEnv('# 주석\nNAVER_AD_API_KEY=abc\n\nNAVER_AD_SECRET_KEY="s e c"\nNAVER_AD_CUSTOMER_ID=\'42\'\n');
    expect(env).toEqual({ NAVER_AD_API_KEY: "abc", NAVER_AD_SECRET_KEY: "s e c", NAVER_AD_CUSTOMER_ID: "42" });
  });

  it("호출 간격: 비었거나 잘못된 값이면 1초 (빈 값이 0초가 되지 않게)", () => {
    expect(parseInterval(undefined)).toBe(1000);
    expect(parseInterval("")).toBe(1000);
    expect(parseInterval("  ")).toBe(1000);
    expect(parseInterval("abc")).toBe(1000);
    expect(parseInterval("-5")).toBe(1000);
    expect(parseInterval("1500")).toBe(1500);
  });

  it("키가 빠지면 무엇이 빠졌는지 알려 준다", () => {
    expect(() => getConfig({ NAVER_AD_API_KEY: "a" })).toThrow(/NAVER_AD_SECRET_KEY, NAVER_AD_CUSTOMER_ID/);
    expect(getConfig({ NAVER_AD_API_KEY: "a", NAVER_AD_SECRET_KEY: "b", NAVER_AD_CUSTOMER_ID: "c" })).toEqual({
      apiKey: "a",
      secretKey: "b",
      customerId: "c",
    });
  });
});

describe("요청 서명", () => {
  it('"타임스탬프.메서드.경로"를 비밀키로 HMAC-SHA256 서명한다 (쿼리는 빼고)', () => {
    const headers = buildHeaders(CONFIG, "GET", KEYWORD_TOOL_URI, 1700000000000);
    const expected = createHmac("sha256", "test-secret").update("1700000000000.GET./keywordstool").digest("base64");
    expect(headers).toMatchObject({
      "X-Timestamp": "1700000000000",
      "X-API-KEY": "test-api-key",
      "X-Customer": "1234567",
      "X-Signature": expected,
    });
  });
});

describe("API 호출: 간격 제한과 오류 처리", () => {
  it("요청 사이에 최소 간격을 지킨다", async () => {
    const clock = fakeClock();
    const fetchImpl = mockFetch({});
    const client = createKeywordClient({ config: CONFIG, fetchImpl, ...clock, minIntervalMs: 1000 });
    await client.fetchRelated(["돼지꿈"]);
    await client.fetchRelated(["뱀꿈"]);
    await client.fetchRelated(["용꿈"]);
    expect(fetchImpl).toHaveBeenCalledTimes(3);
    expect(clock.sleeps).toEqual([1000, 1000]);
  });

  it("씨앗 단어는 쉼표로 묶어 hintKeywords 로 보낸다 (최대 5개)", async () => {
    const fetchImpl = mockFetch({});
    const client = createKeywordClient({ config: CONFIG, fetchImpl, ...fakeClock() });
    await client.fetchRelated(["돼지꿈", "뱀꿈"]);
    const url = new URL(String(fetchImpl.mock.calls[0][0]));
    expect(url.pathname).toBe("/keywordstool");
    expect(url.searchParams.get("hintKeywords")).toBe("돼지꿈,뱀꿈");
    expect(url.searchParams.get("showDetail")).toBe("1");
    await expect(client.fetchRelated(["a", "b", "c", "d", "e", "f"])).rejects.toThrow(/1~5개/);
  });

  it("429(너무 잦은 요청)이면 점점 길게 기다렸다가 다시 시도한다", async () => {
    const clock = fakeClock();
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(new Response("slow down", { status: 429 }))
      .mockResolvedValueOnce(new Response("slow down", { status: 429 }))
      .mockResolvedValueOnce(jsonResponse({ keywordList: [{ relKeyword: "돼지꿈", monthlyPcQcCnt: 10, monthlyMobileQcCnt: 20 }] }));
    const client = createKeywordClient({ config: CONFIG, fetchImpl, ...clock, minIntervalMs: 0, backoffMs: 1000 });
    const list = await client.fetchRelated(["돼지꿈"]);
    expect(list).toHaveLength(1);
    expect(fetchImpl).toHaveBeenCalledTimes(3);
    expect(clock.sleeps).toEqual([1000, 2000]);
  });

  it("서버 오류가 계속되면 정해진 횟수만큼만 재시도하고 실패한다", async () => {
    const fetchImpl = vi.fn(async () => new Response("oops", { status: 500 }));
    const client = createKeywordClient({ config: CONFIG, fetchImpl, ...fakeClock(), minIntervalMs: 0, maxRetries: 2 });
    await expect(client.fetchRelated(["돼지꿈"])).rejects.toThrow(NaverApiError);
    expect(fetchImpl).toHaveBeenCalledTimes(3); // 첫 시도 + 재시도 2번
  });

  it("네트워크 오류도 재시도한다", async () => {
    const fetchImpl = vi
      .fn()
      .mockRejectedValueOnce(new Error("ECONNRESET"))
      .mockResolvedValueOnce(jsonResponse({ keywordList: [] }));
    const client = createKeywordClient({ config: CONFIG, fetchImpl, ...fakeClock(), minIntervalMs: 0 });
    await expect(client.fetchRelated(["돼지꿈"])).resolves.toEqual([]);
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });

  it("인증 실패(401/403)는 재시도하지 않고 키를 확인하라고 알려 준다", async () => {
    const fetchImpl = vi.fn(async () => new Response("unauthorized", { status: 401 }));
    const client = createKeywordClient({ config: CONFIG, fetchImpl, ...fakeClock() });
    await expect(client.fetchRelated(["돼지꿈"])).rejects.toThrow(/API 키, 비밀키, CUSTOMER_ID/);
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it("그 밖의 4xx 는 응답 내용을 담아 바로 실패한다", async () => {
    const fetchImpl = vi.fn(async () => new Response('{"code":11001,"title":"invalid hintKeywords"}', { status: 400 }));
    const client = createKeywordClient({ config: CONFIG, fetchImpl, ...fakeClock() });
    await expect(client.fetchRelated(["돼지 꿈"])).rejects.toThrow(/HTTP 400.*invalid hintKeywords/);
  });
});

describe("가공: 필터 → 병합 → 사전 표시 → 정렬 → CSV", () => {
  it('검색량 "< 10" 은 0 으로 세고 low 로 표시', () => {
    expect(parseVolume(1234)).toEqual({ count: 1234, low: false });
    expect(parseVolume("560")).toEqual({ count: 560, low: false });
    expect(parseVolume("< 10")).toEqual({ count: 0, low: true });
  });

  it('"꿈"이 들어간 키워드만 남기고, 띄어쓰기만 다른 키워드는 합친다', () => {
    const rows = mergeDreamKeywords([
      { seeds: ["돼지꿈"], list: [
        { relKeyword: "돼지꿈", monthlyPcQcCnt: 1000, monthlyMobileQcCnt: 9000 },
        { relKeyword: "돼지고기", monthlyPcQcCnt: 5000, monthlyMobileQcCnt: 5000 },
      ] },
      { seeds: ["로또꿈"], list: [{ relKeyword: "돼지 꿈", monthlyPcQcCnt: 1000, monthlyMobileQcCnt: 9000 }] },
    ]);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ keyword: "돼지꿈", total: 10000, seeds: ["돼지꿈", "로또꿈"] });
  });

  it("사전에 있는 상징을 찾아 표시한다 (1글자는 바로 뒤 '꿈'일 때만)", () => {
    expect(findDictionarySymbols("돼지꿈해몽", SYMBOLS)).toEqual(["pig"]);
    expect(findDictionarySymbols("용꿈", SYMBOLS)).toEqual(["dragon"]);
    expect(findDictionarySymbols("이빨빠지는꿈", SYMBOLS)).toEqual(["teeth"]);
    expect(findDictionarySymbols("소원꿈", SYMBOLS)).toEqual([]); // '소'가 들어 있지만 소꿈이 아님
    expect(findDictionarySymbols("기린꿈", SYMBOLS)).toEqual([]);
  });

  it("CSV: 검색량 순 정렬, 사전 표시, <10 표기, 쉼표·따옴표 이스케이프", async () => {
    const fetchImpl = mockFetch({
      "꿈해몽,돼지꿈": [
        { relKeyword: "꿈해몽", monthlyPcQcCnt: 20000, monthlyMobileQcCnt: 180000 },
        { relKeyword: "돼지꿈", monthlyPcQcCnt: 3000, monthlyMobileQcCnt: 27000 },
        { relKeyword: "기린꿈", monthlyPcQcCnt: "< 10", monthlyMobileQcCnt: 40 },
        { relKeyword: "로또 번호", monthlyPcQcCnt: 90000, monthlyMobileQcCnt: 90000 },
      ],
      "뱀꿈": [{ relKeyword: '뱀꿈,"진짜"', monthlyPcQcCnt: 100, monthlyMobileQcCnt: 900 }],
    });
    const client = createKeywordClient({ config: CONFIG, fetchImpl, ...fakeClock(), minIntervalMs: 0 });
    const rows = await collectKeywords({ seeds: ["꿈해몽", "돼지꿈"], client, symbols: SYMBOLS });
    const more = await collectKeywords({ seeds: ["뱀꿈"], client, symbols: SYMBOLS });

    expect(rows.map((r) => r.keyword)).toEqual(["꿈해몽", "돼지꿈", "기린꿈"]);
    const csv = toCsv([...rows, ...more]);
    expect(csv.split("\n")).toEqual([
      "keyword,pc,mobile,total,in_dictionary,symbols,seeds",
      "꿈해몽,20000,180000,200000,,,꿈해몽 돼지꿈",
      "돼지꿈,3000,27000,30000,Y,pig,꿈해몽 돼지꿈",
      "기린꿈,<10,40,40,,,꿈해몽 돼지꿈",
      '"뱀꿈,""진짜""",100,900,1000,Y,snake,뱀꿈',
      "",
    ]);
  });

  it("기본 씨앗 단어: 일반어 + 사전 상징마다 '키워드꿈' (띄어쓰기 없이)", () => {
    const seeds = defaultSeeds(SYMBOLS);
    expect(seeds).toContain("꿈해몽");
    expect(seeds).toContain("돼지꿈");
    expect(seeds).toContain("이빨빠지는꿈");
    expect(seeds.every((s) => !s.includes(" "))).toBe(true);
    expect(new Set(seeds).size).toBe(seeds.length);
  });
});
