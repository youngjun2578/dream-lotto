// 규칙 기반 해몽: 사전의 meaning 을 조합해서 요약을 만든다. (외부 API 없음)

import type { DreamSymbol, FortuneType } from "../types";
import type { Interpretation, InterpretationInput, InterpretationProvider } from "./provider";

/**
 * 사전에 있는 상징을 하나도 찾지 못했을 때의 요약.
 * 무서운 꿈일 수도 있으니 '길몽' 같은 풀이를 붙이지 않고, 더 적어 달라고 안내만 한다. (번호는 그대로 뽑는다)
 */
export const NO_SYMBOL_SUMMARY =
  "이번 꿈에서는 사전에 있는 상징을 찾지 못해 상징 풀이 없이 행운 번호만 골라 드렸어요. 꿈에 나온 사람·동물·물건이나 그때 한 일을 조금 더 자세히 적어 주시면 상황에 맞는 풀이를 찾아 드릴게요.";

// 상황 풀이는 좋은 뜻일 때도, 조심하라는 뜻일 때도 있어서 중립적인 표현을 쓴다.
// '변화'·'마음'(민감한 소재의 중립 유형)은 건강·재물을 약속하거나 암시하지 않는다. (tests/content-lint.test.ts 가 검사)
export const FORTUNE_PHRASE: Record<FortuneType, string> = {
  재물: "재물운의 흐름이 두드러지는 꿈",
  연애: "연애운과 인연의 흐름이 두드러지는 꿈",
  건강: "몸과 마음의 기운을 살피게 하는 꿈",
  직장: "일과 명예에 관한 흐름이 두드러지는 꿈",
  주의: "조심할 부분을 알려 주는 꿈",
  변화: "지나온 시간을 매듭짓고 새 출발을 그려 보게 하는 꿈",
  마음: "요즘의 마음을 가만히 들여다보게 하는 꿈",
};

/** 요약에 쓰일 수 있는 고정 문구 (공유 이미지 글꼴 검사용) */
export const FORTUNE_PHRASE_TEXT = [
  ...Object.values(FORTUNE_PHRASE),
  "함께 나온 상징까지 더하면 전체적으로 으로 볼 수 있어요. 이니, 서두르기보다 차분하게 하루를 보내 보세요.",
];

/** 요약에 넣을 이름 ('이빨 빠지는' 같은 행동 상징은 '이빨 빠지는 꿈'으로) */
function labelOf(symbol: DreamSymbol): string {
  return symbol.category === "행동" ? `${symbol.keyword} 꿈` : symbol.keyword;
}

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

  async interpret({ matches }: InterpretationInput): Promise<Interpretation> {
    if (matches.length === 0) {
      return { summary: NO_SYMBOL_SUMMARY, symbols: [] };
    }
    const symbols = matches.map((m) => m.symbol);
    // 상황 풀이(예: 돼지 + 들어오다)가 있으면 일반 풀이보다 우선한다.
    const meaningOf = (i: number) => matches[i].situation?.meaning ?? matches[i].symbol.meaning;

    // 1문장: 가장 중요한 상징(상황)의 풀이 첫 문장
    const first = firstSentence(meaningOf(0));

    // 2문장: 함께 나온 상징 + 전체 운세 흐름
    const fortune = dominantFortune(symbols);
    const others = symbols.slice(1).map((s) => `'${labelOf(s)}'`).join(", ");
    const lead = others ? `함께 나온 ${others} 상징까지 더하면 전체적으로` : "전체적으로";
    const second =
      fortune === "주의"
        ? `${lead} ${FORTUNE_PHRASE[fortune]}이니, 서두르기보다 차분하게 하루를 보내 보세요.`
        : `${lead} ${FORTUNE_PHRASE[fortune]}으로 볼 수 있어요.`;

    return {
      summary: `${first} ${second}`,
      symbols: symbols.map((s, i) => ({
        slug: s.slug,
        keyword: s.keyword,
        meaning: meaningOf(i),
        fortune_type: s.fortune_type,
      })),
    };
  }
}
