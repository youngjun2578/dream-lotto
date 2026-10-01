// 상징별 대표 입력과 오매칭 방지 (사전 확장 1차)
// - 새로 넣은 상징마다 실제로 쓸 법한 문장 2개 이상으로 찾는 상징과 상황 풀이를 확인한다.
// - 다른 뜻으로 흔히 쓰이는 말("말했어요", "한 개", "눈물" …)은 상징으로 잡지 않는다.

import { describe, expect, it } from "vitest";
import { getAllActions } from "@/lib/actions";
import { matchDream } from "@/lib/matcher";
import { getAllSymbols } from "@/lib/symbols";
import { isV1 } from "./v1-symbols";

const ALL = getAllSymbols();
const ACTIONS = getAllActions();

/** "상징+행동" 목록 (상황 풀이가 없으면 상징만) */
const pairs = (dream: string) =>
  matchDream(dream, ALL, ACTIONS).map((m) => (m.situation ? `${m.symbol.slug}+${m.situation.action}` : m.symbol.slug));

/** [입력, 기대 결과] */
const CASES: [string, string[]][] = [
  // 동물
  ["강아지가 꼬리를 치며 나를 반겼어요", ["dog"]],
  ["큰 개한테 물렸어요", ["dog+bite"]],
  ["길에서 개가 짖으면서 쫓아왔어요", ["dog+chased", "chased"]],
  ["진돗개를 품에 안았어요", ["dog+hug"]],
  ["검은 고양이가 나를 쳐다봤어요", ["cat"]],
  ["고양이한테 물렸어요", ["cat+bite"]],
  ["길고양이가 방 안으로 들어왔어요", ["cat+enter"]],
  ["하얀 말을 타고 들판을 달렸어요", ["horse+ride"]],
  ["말 꿈을 꿨어요", ["horse"]],
  ["조랑말이 풀을 먹고 있었어요", ["horse"]],
  ["닭이 알을 낳았어요", ["chicken+birth"]],
  ["병아리가 졸졸 따라왔어요", ["chicken"]],
  ["수탉이 우는 소리에 깼어요", ["chicken+cry"]],
  ["부엌에서 쥐 한 마리가 나왔어요", ["rat"]],
  ["쥐를 잡았어요", ["rat+catch"]],
  ["생쥐가 방으로 들어왔어요", ["rat+enter"]],
  ["참새가 창가에 앉아 있었어요", ["bird"]],
  ["새가 날아 들어왔어요", ["bird+enter"]],
  ["까치가 울었어요", ["bird+cry"]],
  ["바다거북이 헤엄치고 있었어요", ["turtle+swim"]],
  ["거북이를 선물받았어요", ["turtle+receive"]],
  ["곰에게 쫓겨서 도망쳤어요", ["bear+chased", "chased+escape"]],
  ["북극곰을 끌어안았어요", ["bear+hug"]],
];

/** [입력, 잡히면 안 되는 상징] */
const FALSE_POSITIVES: [string, string[]][] = [
  ["말했어요", ["horse"]],
  ["엄마가 나한테 말을 했어요", ["horse"]],
  ["그 말이 맞았어요", ["horse"]],
  ["말도 안 되는 꿈이었어요", ["horse"]],
  ["거짓말 꿈을 꿨어요", ["horse"]],
  ["한 개 샀어요", ["dog"]],
  ["사과 두 개를 먹었어요", ["dog"]],
  ["개꿈이었어요", ["dog"]],
  ["무지개가 나타났어요", ["dog"]],
  ["베개가 젖어 있었어요", ["dog"]],
  ["안개가 자욱했어요", ["dog"]],
  ["달라요", ["moon"]],
  ["눈물이 났어요", ["snow"]],
  ["다리에 쥐가 났어요", ["rat"]],
  ["새 옷을 샀어요", ["bird"]],
  ["새로운 회사에 들어갔어요", ["bird"]],
  ["이상한 냄새가 났어요", ["bird"]],
  ["곰곰이 생각해 봤어요", ["bear"]],
  ["속이 거북했어요", ["turtle"]],
  ["닭살이 돋았어요", ["chicken"]],
];

describe("새 상징 대표 입력", () => {
  for (const [dream, expected] of CASES) {
    it(`"${dream}" → ${expected.join(", ")}`, () => {
      expect(pairs(dream)).toEqual(expected);
    });
  }

  it("새로 넣은 상징마다 대표 입력이 2개 이상 있다", () => {
    const count = (slug: string) => CASES.filter(([, expected]) => expected.some((p) => p.split("+")[0] === slug)).length;
    const lacking = ALL.filter((s) => !isV1(s.slug) && count(s.slug) < 2).map((s) => s.slug);
    expect(lacking).toEqual([]);
  });
});

describe("오매칭 방지", () => {
  for (const [dream, forbidden] of FALSE_POSITIVES) {
    it(`"${dream}" 에서 ${forbidden.join(", ")} 를 찾지 않는다`, () => {
      const found = pairs(dream).map((p) => p.split("+")[0]);
      expect(found.filter((slug) => forbidden.includes(slug))).toEqual([]);
    });
  }
});
