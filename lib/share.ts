// 공유 링크 (/r/[payload]) — DB 없이 결과를 다시 만들 수 있는 값만 주소에 담는다.
//
// 담는 값: [버전, 시드, 날짜, 다시 뽑기 횟수, [상징 slug, 행동 slug?]...]
//   예) [1, 1412796921, "2026-10-01", 0, ["pig", "enter"], ["fire"]]  →  JSON → base64url
// ⚠️ 꿈 원문은 절대 넣지 않는다. 시드는 SHA-256 해시의 앞 4바이트라 원문을 되돌릴 수 없다.
// 주소는 누구나 고칠 수 있으므로, 읽을 때는 모든 값을 검사하고 이상하면 null 을 돌려준다.

import type { DreamSymbol, SymbolMatch } from "./types";

export const SHARE_VERSION = 1;
/** 주소에 붙는 payload 최대 길이 (그보다 길면 읽지 않는다) */
export const MAX_PAYLOAD_LENGTH = 400;
export const MAX_SHARED_SYMBOLS = 4;
export const MAX_SHARED_COUNTER = 999;

export interface SharePayload {
  seed: number;
  date: string;
  counter: number;
  /** 매칭된 순서 그대로 (상황 풀이가 있으면 action 도) */
  matches: { symbol: string; action?: string }[];
}

type Encoded = [number, number, string, number, ...([string] | [string, string])[]];

export function encodeShare(payload: SharePayload): string {
  const data: Encoded = [
    SHARE_VERSION,
    payload.seed,
    payload.date,
    payload.counter,
    ...payload.matches.map((m) => (m.action ? ([m.symbol, m.action] as [string, string]) : ([m.symbol] as [string]))),
  ];
  return Buffer.from(JSON.stringify(data), "utf8").toString("base64url");
}

/** 매칭 결과 → 공유용 값 */
export function toSharePayload(seed: number, date: string, counter: number, matches: SymbolMatch[]): SharePayload {
  return {
    seed,
    date,
    counter,
    matches: matches.map((m) => (m.situation ? { symbol: m.symbol.slug, action: m.situation.action } : { symbol: m.symbol.slug })),
  };
}

function isValidDate(text: unknown): text is string {
  if (typeof text !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(text)) return false;
  const d = new Date(`${text}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === text;
}

/** 주소의 payload 를 읽는다. 형식이 틀리면 null. (사전에 있는지까지는 resolveShare 에서 확인) */
export function decodeShare(text: unknown): SharePayload | null {
  if (typeof text !== "string" || text.length === 0 || text.length > MAX_PAYLOAD_LENGTH) return null;
  if (!/^[A-Za-z0-9_-]+$/.test(text)) return null;

  let data: unknown;
  try {
    data = JSON.parse(Buffer.from(text, "base64url").toString("utf8"));
  } catch {
    return null;
  }
  if (!Array.isArray(data) || data.length < 4 || data.length > 4 + MAX_SHARED_SYMBOLS) return null;

  const [version, seed, date, counter, ...rest] = data as unknown[];
  if (version !== SHARE_VERSION) return null;
  if (typeof seed !== "number" || !Number.isInteger(seed) || seed < 0 || seed > 0xffffffff) return null;
  if (!isValidDate(date)) return null;
  if (typeof counter !== "number" || !Number.isInteger(counter) || counter < 0 || counter > MAX_SHARED_COUNTER) return null;

  const matches: SharePayload["matches"] = [];
  for (const item of rest) {
    if (!Array.isArray(item) || item.length < 1 || item.length > 2) return null;
    const [symbol, action] = item as unknown[];
    if (typeof symbol !== "string" || !/^[a-z0-9-]{1,40}$/.test(symbol)) return null;
    if (action !== undefined && (typeof action !== "string" || !/^[a-z-]{1,40}$/.test(action))) return null;
    if (matches.some((m) => m.symbol === symbol)) return null;
    matches.push(action === undefined ? { symbol } : { symbol, action: action as string });
  }
  return { seed, date, counter, matches };
}

/** 공유 값의 slug 를 실제 사전 데이터로 바꾼다. 사전에 없는 상징·상황이 있으면 null. */
export function resolveShare(payload: SharePayload, symbols: DreamSymbol[]): SymbolMatch[] | null {
  const matches: SymbolMatch[] = [];
  for (const m of payload.matches) {
    const symbol = symbols.find((s) => s.slug === m.symbol);
    if (!symbol) return null;
    if (m.action === undefined) {
      matches.push({ symbol });
      continue;
    }
    const situation = symbol.situations.find((s) => s.action === m.action);
    if (!situation) return null;
    matches.push({ symbol, situation });
  }
  return matches;
}
