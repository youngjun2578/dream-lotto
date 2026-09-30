// 해몽 + 번호 추천 전체 흐름
// 1) 전처리 → 2) 상징·행동 매칭 → 3) 해몽 생성(Provider) → 4) 번호 생성(lotto.ts)

import { getAllActions } from "./actions";
import { getSeoulDate } from "./date";
import { getInterpretationProvider, type InterpretationProvider } from "./interpret";
import { generateGamesFromSeed, makeSeed } from "./lotto";
import { matchDream } from "./matcher";
import { InputError, prepareDream } from "./normalize";
import { decodeShare, encodeShare, resolveShare, toSharePayload } from "./share";
import { getAllSymbols } from "./symbols";
import type { DreamAction, DreamSymbol, InterpretResponse, SituationReading, SymbolMatch } from "./types";

export const MAX_COUNTER = 999;

export interface InterpretOptions {
  /** 다시 뽑기 횟수 (0~999) */
  counter?: unknown;
  /** 기준 시각 (테스트에서 날짜를 고정할 때 사용) */
  now?: Date;
  provider?: InterpretationProvider;
  symbols?: DreamSymbol[];
  actions?: DreamAction[];
}

function parseCounter(value: unknown): number {
  if (value === undefined || value === null) return 0;
  if (typeof value !== "number" || !Number.isInteger(value) || value < 0 || value > MAX_COUNTER) {
    throw new InputError("다시 뽑기 횟수가 올바르지 않아요.");
  }
  return value;
}

/** 상황 풀이가 적용된 상징만 골라 응답용으로 바꾼다. */
export function toSituationReadings(matches: SymbolMatch[]): SituationReading[] {
  return matches.flatMap((m) =>
    m.situation ? [{ slug: m.symbol.slug, action: m.situation.action, title: m.situation.title }] : [],
  );
}

/** 입력이 잘못되면 InputError 를 던진다. */
export async function interpretDream(rawDream: unknown, options: InterpretOptions = {}): Promise<InterpretResponse> {
  const dream = prepareDream(rawDream); // 검사 + 정규화 (번호 시드에 쓰임)
  const counter = parseCounter(options.counter);
  const date = getSeoulDate(options.now);

  // 문장 부호로 문장을 나눠야 해서 매칭에는 원문을 쓴다. (prepareDream 을 통과했으니 문자열)
  const matches: SymbolMatch[] = matchDream(
    rawDream as string,
    options.symbols ?? getAllSymbols(),
    options.actions ?? getAllActions(),
  );
  const matched = matches.map((m) => m.symbol);

  const provider = options.provider ?? getInterpretationProvider();
  const { summary, symbols } = await provider.interpret({ dream, symbols: matched, matches });

  // 번호는 상징만으로 만든다. (행동·상황 풀이는 번호에 영향을 주지 않는다)
  // generateGames({ normalizedDream: dream, date, … }) 와 같은 계산이다. 시드는 공유 링크에도 쓰므로 한 번만 구한다.
  const seed = makeSeed(dream, date);
  const games = generateGamesFromSeed(seed, matched, counter);
  const share = encodeShare(toSharePayload(seed, date, counter, matches));

  return { summary, symbols, situations: toSituationReadings(matches), games, date, counter, share };
}

/**
 * 공유 링크 값으로 결과를 다시 만든다. (꿈 원문 없이 시드·상징·행동·날짜·횟수만으로)
 * 값이 잘못됐거나 사전에 없는 상징이 들어 있으면 null.
 */
export async function buildSharedResult(
  payloadText: unknown,
  options: Pick<InterpretOptions, "provider" | "symbols"> = {},
): Promise<InterpretResponse | null> {
  const payload = decodeShare(payloadText);
  if (!payload) return null;
  const matches = resolveShare(payload, options.symbols ?? getAllSymbols());
  if (!matches) return null;

  const matched = matches.map((m) => m.symbol);
  const provider = options.provider ?? getInterpretationProvider();
  const { summary, symbols } = await provider.interpret({ dream: "", symbols: matched, matches });
  const games = generateGamesFromSeed(payload.seed, matched, payload.counter);

  return {
    summary,
    symbols,
    situations: toSituationReadings(matches),
    games,
    date: payload.date,
    counter: payload.counter,
    share: encodeShare(payload),
  };
}
