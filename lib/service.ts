// 해몽 + 번호 추천 전체 흐름
// 1) 전처리 → 2) 상징 매칭 → 3) 해몽 생성(Provider) → 4) 번호 생성(lotto.ts)

import { getSeoulDate } from "./date";
import { getInterpretationProvider, type InterpretationProvider } from "./interpret";
import { generateGames } from "./lotto";
import { matchSymbols } from "./matcher";
import { InputError, prepareDream } from "./normalize";
import { getAllSymbols } from "./symbols";
import type { DreamSymbol, InterpretResponse } from "./types";

export const MAX_COUNTER = 999;

export interface InterpretOptions {
  /** 다시 뽑기 횟수 (0~999) */
  counter?: unknown;
  /** 기준 시각 (테스트에서 날짜를 고정할 때 사용) */
  now?: Date;
  provider?: InterpretationProvider;
  symbols?: DreamSymbol[];
}

function parseCounter(value: unknown): number {
  if (value === undefined || value === null) return 0;
  if (typeof value !== "number" || !Number.isInteger(value) || value < 0 || value > MAX_COUNTER) {
    throw new InputError("다시 뽑기 횟수가 올바르지 않아요.");
  }
  return value;
}

/** 입력이 잘못되면 InputError 를 던진다. */
export async function interpretDream(rawDream: unknown, options: InterpretOptions = {}): Promise<InterpretResponse> {
  const dream = prepareDream(rawDream);
  const counter = parseCounter(options.counter);
  const date = getSeoulDate(options.now);

  const matched = matchSymbols(dream, options.symbols ?? getAllSymbols());
  const provider = options.provider ?? getInterpretationProvider();
  const { summary, symbols } = await provider.interpret({ dream, symbols: matched });

  const games = generateGames({ normalizedDream: dream, date, symbols: matched, counter });

  return { summary, symbols, games, date, counter };
}
