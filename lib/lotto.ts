// 로또 번호 생성 (순수 함수 — 같은 입력이면 항상 같은 결과)
// 번호 생성은 이 파일에서만 한다. AI(LLM)에게 맡기지 않는다.

import { createHash } from "node:crypto";
import { FILL_REASON, type DreamSymbol, type LottoGame } from "./types";

export { FILL_REASON };
export const GAME_COUNT = 5;
export const NUMBERS_PER_GAME = 6;
export const MAX_NUMBER = 45;

/** SHA-256(정규화된 꿈 + "|" + 날짜) 의 앞 4바이트를 32비트 정수로 */
export function makeSeed(normalizedDream: string, date: string): number {
  const hash = createHash("sha256").update(`${normalizedDream}|${date}`, "utf8").digest();
  return hash.readUInt32BE(0);
}

/** mulberry32: 시드가 같으면 같은 순서로 0 이상 1 미만의 수를 만든다. */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** "돼지 꿈 → 재물" 형태의 이유 문장 */
export function dreamReason(symbol: DreamSymbol): string {
  return `${symbol.keyword} 꿈 → ${symbol.fortune_type}`;
}

interface ScoreEntry {
  score: number;
  /** 이 숫자를 후보로 가진 상징 중 가중치가 가장 높은 것 (이유 표시용) */
  source: DreamSymbol;
}

/** 매칭된 상징들의 numbers 에 weight 를 더해 점수표를 만든다. */
export function buildScoreTable(symbols: DreamSymbol[]): Map<number, ScoreEntry> {
  const table = new Map<number, ScoreEntry>();
  for (const symbol of symbols) {
    for (const n of symbol.numbers) {
      const entry = table.get(n);
      if (!entry) {
        table.set(n, { score: symbol.weight, source: symbol });
      } else {
        entry.score += symbol.weight;
        if (symbol.weight > entry.source.weight) entry.source = symbol;
      }
    }
  }
  return table;
}

/** 게임 1개 생성. rng 는 호출할 때마다 상태가 이어진다. */
function generateGame(rng: () => number, table: Map<number, ScoreEntry>): LottoGame {
  const picked = new Map<number, string>(); // 숫자 → 이유

  // 1) 꿈 번호: 점수표에서 가중 랜덤으로 2~3개
  if (table.size > 0) {
    const want = Math.min(2 + Math.floor(rng() * 2), table.size);
    const pool = [...table.entries()].sort(([a], [b]) => a - b); // 순서를 고정해야 결과가 재현된다
    while (picked.size < want) {
      const total = pool.reduce((sum, [, e]) => sum + e.score, 0);
      let r = rng() * total;
      let idx = pool.findIndex(([, e]) => (r -= e.score) < 0);
      if (idx === -1) idx = pool.length - 1; // 부동소수점 오차 대비
      const [n, entry] = pool.splice(idx, 1)[0];
      picked.set(n, dreamReason(entry.source));
    }
  }

  // 2) 나머지: 아직 안 뽑힌 1~45 중 균등 랜덤
  const rest: number[] = [];
  for (let n = 1; n <= MAX_NUMBER; n++) if (!picked.has(n)) rest.push(n);
  while (picked.size < NUMBERS_PER_GAME) {
    const [n] = rest.splice(Math.floor(rng() * rest.length), 1);
    picked.set(n, FILL_REASON);
  }

  // 3) 오름차순 정렬 (이유도 같은 순서로)
  const numbers = [...picked.keys()].sort((a, b) => a - b);
  return { numbers, reasons: numbers.map((n) => picked.get(n)!) };
}

export interface GenerateOptions {
  /** 정규화된 꿈 문장 */
  normalizedDream: string;
  /** Asia/Seoul 기준 YYYY-MM-DD */
  date: string;
  /** 매칭된 상징 (0개면 전부 균등 랜덤) */
  symbols: DreamSymbol[];
  /** "다시 뽑기" 횟수. 0이 첫 결과 */
  counter?: number;
}

/** 5게임을 같은 PRNG 로 이어서 생성한다. */
export function generateGames({ normalizedDream, date, symbols, counter = 0 }: GenerateOptions): LottoGame[] {
  return generateGamesFromSeed(makeSeed(normalizedDream, date), symbols, counter);
}

/**
 * 이미 계산한 시드(makeSeed 결과)로 5게임을 만든다. generateGames 와 결과가 같다.
 * 공유 링크처럼 꿈 원문 없이 시드만 가지고 있을 때 쓴다.
 */
export function generateGamesFromSeed(baseSeed: number, symbols: DreamSymbol[], counter = 0): LottoGame[] {
  const rng = mulberry32((baseSeed + counter) >>> 0);
  const table = buildScoreTable(symbols);
  return Array.from({ length: GAME_COUNT }, () => generateGame(rng, table));
}
