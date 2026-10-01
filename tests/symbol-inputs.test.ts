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
  ["바다거북이 헤엄치고 있었어요", ["turtle+swim", "swimming"]],
  ["거북이를 선물받았어요", ["turtle+receive"]],
  ["곰에게 쫓겨서 도망쳤어요", ["bear+chased", "chased+escape"]],
  ["북극곰을 끌어안았어요", ["bear+hug"]],
  // 사람
  ["임신해서 배가 불러 왔어요", ["pregnancy"]],
  ["아기를 가졌는데 너무 기뻐서 웃었어요", ["pregnancy+laugh"]],
  ["임신부가 지나갔어요", ["pregnancy"]],
  ["시어머니에게 혼났어요", ["mother+angry"]],
  ["돌아가신 어머니가 밥을 차려 주셔서 먹었어요", ["ancestor+eat", "mother+eat"]],
  ["아빠가 나를 꼭 안아 줬어요", ["father+hug"]],
  ["아버지와 악수했어요", ["father+handshake"]],
  ["친구랑 싸웠어요", ["friend+fight", "fight"]],
  ["단짝과 수다를 떨었어요", ["friend+talk"]],
  ["남자친구와 데이트했어요", ["lover+date"]],
  ["짝사랑하는 사람이 나왔어요", ["lover"]],
  ["전 남자친구가 나왔어요", ["ex-lover"]],
  ["귀신에게 쫓겼어요", ["ghost+chased", "chased"]],
  ["유령을 피해 숨었어요", ["ghost+hide"]],
  ["경찰에게 잡혔어요", ["police+caught"]],
  ["경찰이 찾아왔어요", ["police+enter"]],
  ["선생님께 칭찬을 받았어요", ["teacher+receive"]],
  ["담임 선생님한테 혼났어요", ["teacher+angry"]],
  // 자연
  ["비가 엄청 쏟아졌어요", ["rain"]],
  ["소나기를 피해 숨었어요", ["rain+hide"]],
  ["빗물에 얼굴을 씻었어요", ["rain+wash"]],
  ["함박눈이 펑펑 내렸어요", ["snow"]],
  ["쌓인 눈을 치웠어요", ["snow+clean"]],
  ["강을 건넜어요", ["river"]],
  ["강에 빠졌어요", ["river+drown"]],
  ["강가에서 배를 탔어요", ["river+ride"]],
  ["홍수가 나서 도망쳤어요", ["flood+escape"]],
  ["물난리가 났어요", ["flood"]],
  ["별이 반짝였어요", ["star+shine"]],
  ["별똥별이 떨어졌어요", ["star+fall", "falling"]],
  ["별을 품에 안았어요", ["star+hug"]],
  ["꽃다발을 받았어요", ["flower+receive"]],
  ["꽃이 활짝 피었어요", ["flower"]],
  ["쌍무지개가 떴다", ["rainbow+rise"]],
  ["무지개를 봤어요", ["rainbow"]],
  ["폭포 아래에서 몸을 씻었어요", ["waterfall+wash"]],
  ["폭포수를 마셨어요", ["waterfall+drink"]],
  ["새가 지붕 위에 앉아 있었어요", ["bird"]],
  // 행동
  ["시험에 떨어졌어요", ["exam+fall"]],
  ["수능 시험지를 잃어버렸어요", ["exam+lose"]],
  ["면접을 봤어요", ["exam"]],
  ["회사에 늦어서 혼났어요", ["late+angry"]],
  ["버스를 놓쳤어요", ["late+lose"]],
  ["늦잠을 자다 깼어요", ["late+wake"]],
  ["모르는 사람과 싸웠어요", ["fight"]],
  ["싸우다 다쳤어요", ["fight+hurt"]],
  ["말다툼을 하고 울었어요", ["fight+cry"]],
  ["차를 몰고 고속도로를 달렸어요", ["driving"]],
  ["운전면허를 받았어요", ["driving+receive"]],
  ["운전하다 길을 잃었어요", ["driving+lose", "lost"]],
  ["수영장에서 헤엄쳤어요", ["swimming"]],
  ["바다에서 수영하다 물에 빠졌어요", ["sea+drown", "swimming+drown", "water+drown"]],
  ["길을 잃고 울었어요", ["lost+cry"]],
  ["미로에서 헤맸어요", ["lost"]],
  ["사람들 앞에서 벌거벗고 있었어요", ["naked"]],
  ["알몸으로 도망쳤어요", ["naked+escape"]],
  ["가족과 해외여행을 갔어요", ["travel"]],
  ["여행지에서 맛있는 음식을 먹었어요", ["travel+eat"]],
  ["공항에서 비행기를 탔어요", ["travel+ride"]],
  // 물건
  ["새 차를 샀어요", ["car+buy"]],
  ["주차해 둔 차를 잃어버렸어요", ["car+lose"]],
  ["교통사고가 났어요", ["car"]],
  ["신발을 잃어버렸어요", ["shoes+lose"]],
  ["새 운동화를 샀어요", ["shoes+buy"]],
  ["새 옷을 입었어요", ["clothes+wear"]],
  ["옷에 얼룩이 묻었어요", ["clothes+stain"]],
  ["핸드폰을 잃어버렸어요", ["phone+lose"]],
  ["휴대폰 액정이 깨졌어요", ["phone+break"]],
  ["부엌칼을 들고 있었어요", ["knife"]],
  ["칼에 손을 베어 피가 났어요", ["knife+hurt", "blood+hurt"]],
  ["거울에 비친 내 모습을 봤어요", ["mirror+shine"]],
  ["거울이 깨졌어요", ["mirror+break"]],
  ["열쇠를 잃어버렸어요", ["key+lose"]],
  ["열쇠를 주웠어요", ["key+pick-up"]],
  ["코피가 났어요", ["blood+hurt"]],
  ["옷에 피가 묻었어요", ["blood+stain", "clothes+stain"]],
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
  ["할아버지가 나왔어요", ["father"]],
  ["외할아버지 댁에 갔어요", ["father"]],
  ["장애인 화장실에 들어갔어요", ["lover"]],
  ["남자친구가 나왔어요", ["friend"]],
  ["전 남자친구가 나왔어요", ["lover", "friend"]],
  ["임신부가 지나갔어요", ["wedding"]],
  ["눈을 떴어요", ["snow"]],
  ["눈이 아팠어요", ["snow"]],
  ["눈치를 봤어요", ["snow"]],
  ["눈이 많이 부었어요", ["snow"]],
  ["별로 무섭지 않았어요", ["star"]],
  ["별 일 없었어요", ["star"]],
  ["이별이 슬펐어요", ["star"]],
  ["강 선생님이 나왔어요", ["river"]],
  ["건강을 챙겼어요", ["river"]],
  ["강아지가 짖었어요", ["river"]],
  ["준비가 오래 걸렸어요", ["rain"]],
  ["비밀을 말했어요", ["rain"]],
  ["비둘기가 날아왔어요", ["rain"]],
  ["불꽃이 튀었어요", ["flower"]],
  ["꽃게를 먹었어요", ["flower"]],
  ["밤늦게까지 일했어요", ["late"]],
  ["늦은 밤에 꾼 꿈이에요", ["late"]],
  ["기차를 타고 갔어요", ["car"]],
  ["경찰차가 지나갔어요", ["car"]],
  ["칼국수를 먹었어요", ["knife"]],
  ["피곤해서 잤어요", ["blood"]],
  ["커피를 마셨어요", ["blood"]],
  ["꽃이 피었어요", ["blood"]],
  ["꽃이 피는 꿈을 꿨어요", ["blood"]],
  ["바람 피는 꿈을 꿨어요", ["blood"]],
  ["담배 피는 꿈", ["blood"]],
  ["피로가 쌓였어요", ["blood"]],
  ["피에로가 나왔어요", ["blood"]],
  ["옷을 벗었어요", ["clothes"]],
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
