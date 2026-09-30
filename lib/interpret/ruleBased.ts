// 규칙 기반 해몽: 사전의 meaning 을 조합해서 요약을 만든다. (외부 API 없음)

import type { DreamSymbol, FortuneType } from "../types";
import type { Interpretation, InterpretationInput, InterpretationProvider } from "./provider";

export const NO_SYMBOL_SUMMARY =
  "꿈속에서 사전에 등록된 뚜렷한 상징을 찾지 못했어요. 특별한 상징이 없는 꿈은 마음이 비교적 평온하다는 뜻으로 보아 무난한 길몽으로 풀이해요.";

const FORTUNE_PHRASE: Record<FortuneType, string> = {
  재물: "재물운이 돋보이는 꿈",
  연애: "연애운과 인연의 흐름이 좋은 꿈",
  건강: "몸과 마음의 기운을 살피게 하는 꿈",
  직장: "일과 명예에서 인정받는 흐름이 보이는 꿈",
  주의: "조심할 부분을 알려 주는 꿈",
};

function firstSentence(text: string): string {
  return text.split(/(?<=[.!?])\s+/)[0];
}

/** 가중치 합이 가장 큰 운세 유형 (같으면 먼저 나온 상징의 유형) */
export function dominantFortune(symbols: DreamSymbol[]): FortuneType {
  const totals = new Map<FortuneType, number>();
  for (const s of symbols) totals.set(s.fortune_type, (totals.get(s.fortune_type) ?? 0) + s.weight);
  let best = symbols[0].fortune_type;
  for (const [type, total] of totals) if (total > totals.get(best)!) best = type;
  return best;
}

export class RuleBasedProvider implements InterpretationProvider {
  readonly name = "rule-based";

  async interpret({ symbols }: InterpretationInput): Promise<Interpretation> {
    if (symbols.length === 0) {
      return { summary: NO_SYMBOL_SUMMARY, symbols: [] };
    }

    // 1문장: 가장 중요한 상징의 meaning 첫 문장
    const first = firstSentence(symbols[0].meaning);

    // 2문장: 함께 나온 상징 + 전체 운세 흐름
    const fortune = dominantFortune(symbols);
    const others = symbols.slice(1).map((s) => `'${s.keyword}'`).join(", ");
    const lead = others ? `함께 나온 ${others} 상징까지 더하면 전체적으로` : "전체적으로";
    const second =
      fortune === "주의"
        ? `${lead} ${FORTUNE_PHRASE[fortune]}이니, 서두르기보다 차분하게 하루를 보내 보세요.`
        : `${lead} ${FORTUNE_PHRASE[fortune]}으로 풀이돼요.`;

    return {
      summary: `${first} ${second}`,
      symbols: symbols.map((s) => ({
        slug: s.slug,
        keyword: s.keyword,
        meaning: s.meaning,
        fortune_type: s.fortune_type,
      })),
    };
  }
}
