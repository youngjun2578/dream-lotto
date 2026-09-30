// 네이버 검색광고 API "키워드 도구"로 꿈 관련 연관 키워드와 월간 검색량을 모은다.
//
// 실행:  npm run keywords                 (기본 씨앗 단어: 사전의 상징 + "꿈")
//        npm run keywords -- 돼지꿈 뱀꿈   (씨앗 단어 직접 지정)
// 결과:  data/keywords.csv  (꿈 관련 키워드만, 검색량 많은 순, 사전에 있는 상징 표시)
//
// 필요한 값(.env.local): NAVER_AD_API_KEY, NAVER_AD_SECRET_KEY, NAVER_AD_CUSTOMER_ID
// 키 발급 방법은 README "키워드 수집 스크립트" 참고. 키는 절대 코드나 git 에 넣지 않는다.

import { createHmac } from "node:crypto";
import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

export const API_BASE = "https://api.searchad.naver.com";
export const KEYWORD_TOOL_URI = "/keywordstool";
/** API 한 번에 넣을 수 있는 씨앗 단어 수 */
export const HINTS_PER_REQUEST = 5;

// ───────────────────────── 설정 ─────────────────────────

export interface NaverAdConfig {
  apiKey: string;
  secretKey: string;
  customerId: string;
}

/** .env 형식(KEY=VALUE) 문자열을 읽는다. 주석(#)과 빈 줄은 건너뛰고, 따옴표는 벗긴다. */
export function parseEnv(text: string): Record<string, string> {
  const env: Record<string, string> = {};
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq <= 0) continue;
    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();
    if (/^(["']).*\1$/.test(value)) value = value.slice(1, -1);
    env[key] = value;
  }
  return env;
}

/** 필요한 키가 모두 있는지 확인한다. 없으면 무엇이 빠졌는지 알려 준다. */
export function getConfig(env: Record<string, string | undefined>): NaverAdConfig {
  const need = ["NAVER_AD_API_KEY", "NAVER_AD_SECRET_KEY", "NAVER_AD_CUSTOMER_ID"] as const;
  const missing = need.filter((k) => !env[k]?.trim());
  if (missing.length > 0) {
    throw new Error(
      `.env.local 에 ${missing.join(", ")} 값이 없어요. .env.example 을 참고해 채워 주세요. (README "키워드 수집 스크립트")`,
    );
  }
  return {
    apiKey: env.NAVER_AD_API_KEY!.trim(),
    secretKey: env.NAVER_AD_SECRET_KEY!.trim(),
    customerId: env.NAVER_AD_CUSTOMER_ID!.trim(),
  };
}

// ───────────────────────── 요청 서명 ─────────────────────────

/** 네이버 검색광고 API 서명: base64(HMAC-SHA256(비밀키, "타임스탬프.메서드.경로")) */
export function signRequest(timestamp: string, method: string, uri: string, secretKey: string): string {
  return createHmac("sha256", secretKey).update(`${timestamp}.${method}.${uri}`).digest("base64");
}

export function buildHeaders(config: NaverAdConfig, method: string, uri: string, now: number): Record<string, string> {
  const timestamp = String(now);
  return {
    "Content-Type": "application/json; charset=UTF-8",
    "X-Timestamp": timestamp,
    "X-API-KEY": config.apiKey,
    "X-Customer": config.customerId,
    "X-Signature": signRequest(timestamp, method, uri, config.secretKey),
  };
}

// ───────────────────────── API 호출 (간격 제한 + 재시도) ─────────────────────────

/** API 응답의 키워드 한 줄 (필요한 필드만) */
export interface RawKeyword {
  relKeyword: string;
  /** 숫자 또는 "< 10" 같은 문자열 */
  monthlyPcQcCnt: number | string;
  monthlyMobileQcCnt: number | string;
}

export class NaverApiError extends Error {
  constructor(
    message: string,
    readonly status?: number,
  ) {
    super(message);
    this.name = "NaverApiError";
  }
}

export interface ClientOptions {
  config: NaverAdConfig;
  /** 테스트에서 가짜 fetch 를 넣을 수 있다. */
  fetchImpl?: typeof fetch;
  sleep?: (ms: number) => Promise<void>;
  now?: () => number;
  /** 요청과 요청 사이 최소 간격 (기본 1초) */
  minIntervalMs?: number;
  /** 429/5xx/네트워크 오류일 때 다시 시도할 횟수 (기본 3번) */
  maxRetries?: number;
  /** 재시도 대기 시간의 시작값. 1초 → 2초 → 4초 … (기본 1초) */
  backoffMs?: number;
}

const defaultSleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

export function createKeywordClient(options: ClientOptions) {
  const {
    config,
    fetchImpl = fetch,
    sleep = defaultSleep,
    now = Date.now,
    minIntervalMs = 1000,
    maxRetries = 3,
    backoffMs = 1000,
  } = options;
  let lastRequestAt = -Infinity;

  /** 씨앗 단어(최대 5개)의 연관 키워드를 가져온다. */
  async function fetchRelated(hints: string[]): Promise<RawKeyword[]> {
    if (hints.length === 0 || hints.length > HINTS_PER_REQUEST) {
      throw new Error(`씨앗 단어는 한 번에 1~${HINTS_PER_REQUEST}개만 보낼 수 있어요.`);
    }
    const query = new URLSearchParams({ hintKeywords: hints.join(","), showDetail: "1" });
    const url = `${API_BASE}${KEYWORD_TOOL_URI}?${query}`;

    for (let attempt = 0; ; attempt++) {
      // 호출 간격 제한: 마지막 요청 뒤 minIntervalMs 가 지나기 전에는 기다린다.
      const wait = lastRequestAt + minIntervalMs - now();
      if (wait > 0) await sleep(wait);
      lastRequestAt = now();

      let res: Response;
      try {
        res = await fetchImpl(url, { method: "GET", headers: buildHeaders(config, "GET", KEYWORD_TOOL_URI, now()) });
      } catch (error) {
        if (attempt < maxRetries) {
          await sleep(backoffMs * 2 ** attempt);
          continue;
        }
        throw new NaverApiError(`네트워크 오류로 요청에 실패했어요: ${(error as Error).message}`);
      }

      if (res.ok) {
        const body = (await res.json()) as { keywordList?: RawKeyword[] };
        return Array.isArray(body.keywordList) ? body.keywordList : [];
      }
      if (res.status === 401 || res.status === 403) {
        throw new NaverApiError("인증에 실패했어요. API 키, 비밀키, CUSTOMER_ID 를 확인해 주세요.", res.status);
      }
      if ((res.status === 429 || res.status >= 500) && attempt < maxRetries) {
        await sleep(backoffMs * 2 ** attempt); // 너무 잦은 요청이거나 서버 오류 → 점점 길게 기다렸다 재시도
        continue;
      }
      const detail = await res.text().catch(() => "");
      throw new NaverApiError(`API 오류 (HTTP ${res.status}) ${detail.slice(0, 200)}`.trim(), res.status);
    }
  }

  return { fetchRelated };
}

// ───────────────────────── 가공 ─────────────────────────

/** "< 10" 처럼 숫자가 아닌 검색량은 0 으로 세고 low 로 표시한다. */
export function parseVolume(value: number | string): { count: number; low: boolean } {
  if (typeof value === "number" && Number.isFinite(value)) return { count: value, low: false };
  const text = String(value).trim();
  if (/^\d+$/.test(text)) return { count: Number(text), low: false };
  return { count: 0, low: true };
}

/** 키워드 비교용: 띄어쓰기 제거 + 소문자 */
export function keywordKey(keyword: string): string {
  return keyword.replace(/\s+/g, "").toLowerCase();
}

export function chunk<T>(items: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}

export interface KeywordRow {
  keyword: string;
  pc: number;
  mobile: number;
  total: number;
  pcLow: boolean;
  mobileLow: boolean;
  /** 이 키워드가 가리키는 사전 상징 slug (없으면 빈 배열) */
  symbols: string[];
  /** 이 키워드를 돌려준 씨앗 단어 */
  seeds: string[];
}

/** 꿈 관련 키워드만 남기고, 같은 키워드(띄어쓰기만 다른 것 포함)는 하나로 합친다. */
export function mergeDreamKeywords(batches: { seeds: string[]; list: RawKeyword[] }[]): KeywordRow[] {
  const rows = new Map<string, KeywordRow>();
  for (const { seeds, list } of batches) {
    for (const item of list) {
      if (typeof item?.relKeyword !== "string" || !item.relKeyword.includes("꿈")) continue;
      const key = keywordKey(item.relKeyword);
      const pc = parseVolume(item.monthlyPcQcCnt);
      const mobile = parseVolume(item.monthlyMobileQcCnt);
      const row = rows.get(key);
      if (!row) {
        rows.set(key, {
          keyword: item.relKeyword,
          pc: pc.count,
          mobile: mobile.count,
          total: pc.count + mobile.count,
          pcLow: pc.low,
          mobileLow: mobile.low,
          symbols: [],
          seeds: [...seeds],
        });
      } else {
        // 같은 키워드는 보통 검색량도 같다. 혹시 다르면 큰 값을 쓴다.
        if (pc.count > row.pc) [row.pc, row.pcLow] = [pc.count, pc.low];
        if (mobile.count > row.mobile) [row.mobile, row.mobileLow] = [mobile.count, mobile.low];
        row.total = row.pc + row.mobile;
        for (const s of seeds) if (!row.seeds.includes(s)) row.seeds.push(s);
      }
    }
  }
  return [...rows.values()];
}

export interface DictionarySymbol {
  slug: string;
  keyword: string;
  synonyms: string[];
}

/**
 * 키워드가 사전의 어떤 상징을 가리키는지 찾는다.
 * 2글자 이상 표현은 포함되면 인정("돼지꿈해몽" → 돼지), 1글자 표현은 바로 뒤에 "꿈"이 올 때만("용꿈").
 */
export function findDictionarySymbols(keyword: string, symbols: DictionarySymbol[]): string[] {
  const key = keywordKey(keyword);
  const found: string[] = [];
  for (const s of symbols) {
    const terms = [s.keyword, ...s.synonyms].map(keywordKey).filter(Boolean);
    const hit = terms.some((t) => (t.length >= 2 ? key.includes(t) : key.includes(`${t}꿈`)));
    if (hit) found.push(s.slug);
  }
  return found;
}

/** 검색량 많은 순 (같으면 가나다순) */
export function sortRows(rows: KeywordRow[]): KeywordRow[] {
  return [...rows].sort((a, b) => b.total - a.total || a.keyword.localeCompare(b.keyword, "ko"));
}

function csvCell(value: string | number): string {
  const text = String(value);
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export const CSV_HEADER = ["keyword", "pc", "mobile", "total", "in_dictionary", "symbols", "seeds"];

/** CSV 문자열로. "< 10" 이었던 검색량은 "<10" 으로 적는다. (합계에는 0으로 계산) */
export function toCsv(rows: KeywordRow[]): string {
  const lines = [CSV_HEADER.join(",")];
  for (const r of rows) {
    lines.push(
      [
        r.keyword,
        r.pcLow ? "<10" : r.pc,
        r.mobileLow ? "<10" : r.mobile,
        r.total,
        r.symbols.length > 0 ? "Y" : "",
        r.symbols.join(" "),
        r.seeds.join(" "),
      ]
        .map(csvCell)
        .join(","),
    );
  }
  return `${lines.join("\n")}\n`;
}

/** 기본 씨앗 단어: 꿈해몽 일반어 + 사전 상징마다 "키워드+꿈" (API 는 띄어쓰기 없는 단어만 받는다) */
export function defaultSeeds(symbols: DictionarySymbol[]): string[] {
  const seeds = ["꿈해몽", "꿈풀이", "로또꿈", "태몽", "길몽", ...symbols.map((s) => `${s.keyword}꿈`)];
  return [...new Set(seeds.map(keywordKey))];
}

export interface CollectOptions {
  seeds: string[];
  client: ReturnType<typeof createKeywordClient>;
  symbols: DictionarySymbol[];
  onProgress?: (done: number, total: number) => void;
}

/** 씨앗 단어를 5개씩 나눠 조회 → 꿈 키워드만 병합 → 사전 표시 → 검색량 순 정렬 */
export async function collectKeywords({ seeds, client, symbols, onProgress }: CollectOptions): Promise<KeywordRow[]> {
  const hints = [...new Set(seeds.map(keywordKey).filter(Boolean))];
  const groups = chunk(hints, HINTS_PER_REQUEST);
  const batches: { seeds: string[]; list: RawKeyword[] }[] = [];
  for (const [i, group] of groups.entries()) {
    batches.push({ seeds: group, list: await client.fetchRelated(group) });
    onProgress?.(i + 1, groups.length);
  }
  const rows = mergeDreamKeywords(batches);
  for (const row of rows) row.symbols = findDictionarySymbols(row.keyword, symbols);
  return sortRows(rows);
}

// ───────────────────────── 실행 ─────────────────────────

function loadSymbols(root: string): DictionarySymbol[] {
  const dir = join(root, "data/symbols");
  return readdirSync(dir)
    .filter((f) => f.endsWith(".json"))
    .sort()
    .flatMap((f) => JSON.parse(readFileSync(join(dir, f), "utf8")) as DictionarySymbol[]);
}

/** 호출 간격 설정값. 비었거나 잘못된 값이면 기본 1초 (빈 값이 0초로 읽혀 간격이 사라지는 것을 막는다) */
export function parseInterval(value: string | undefined, fallback = 1000): number {
  const text = value?.trim();
  if (!text) return fallback;
  const ms = Number(text);
  return Number.isFinite(ms) && ms >= 0 ? ms : fallback;
}

export async function main(argv: string[] = process.argv.slice(2), root = process.cwd()): Promise<void> {
  const envPath = join(root, ".env.local");
  const fileEnv = existsSync(envPath) ? parseEnv(readFileSync(envPath, "utf8")) : {};
  const config = getConfig({ ...fileEnv, ...process.env });

  const symbols = loadSymbols(root);
  const seeds = argv.length > 0 ? argv : defaultSeeds(symbols);
  const interval = parseInterval(process.env.NAVER_AD_INTERVAL_MS || fileEnv.NAVER_AD_INTERVAL_MS);
  const client = createKeywordClient({ config, minIntervalMs: interval });

  console.log(`씨앗 단어 ${seeds.length}개로 연관 키워드를 모읍니다…`);
  const rows = await collectKeywords({
    seeds,
    client,
    symbols,
    onProgress: (done, total) => console.log(`  요청 ${done}/${total} 완료`),
  });

  const out = join(root, "data/keywords.csv");
  writeFileSync(out, toCsv(rows));
  const inDict = rows.filter((r) => r.symbols.length > 0).length;
  console.log(`완료: 꿈 키워드 ${rows.length}개 (사전에 있는 상징 ${inDict}개) → ${out}`);
}

// 직접 실행할 때만 main() 을 부른다. (테스트에서 import 할 때는 실행되지 않음)
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error: Error) => {
    console.error(`실패: ${error.message}`);
    process.exitCode = 1;
  });
}
