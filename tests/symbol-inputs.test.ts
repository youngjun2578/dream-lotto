// 상징별 대표 입력과 오매칭 방지 (사전 확장 1차·2차)
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
  // 사전 확장 3차: 태몽은 임신과 다른 상징
  ["태몽을 꿨어요", ["taemong-dream"]],
  ["태몽에서 커다란 용이 품에 안겼어요", ["dragon", "taemong-dream+hug"]],
  ["태몽으로 탐스러운 복숭아를 받았어요", ["taemong-dream+receive"]],
  ["엄마가 울고 있었어요", ["mother+cry"]],
  ["돌아가신 어머니가 밥을 차려 주셔서 먹었어요", ["ancestor+eat", "mother+eat"]],
  ["아빠가 나를 꼭 안아 줬어요", ["father+hug"]],
  ["아버지와 악수했어요", ["father+handshake"]],
  ["친구랑 싸웠어요", ["friend+fight", "fight"]],
  ["단짝과 수다를 떨었어요", ["friend+talk"]],
  ["애인과 데이트했어요", ["lover+date", "dating"]],
  ["연인이 갑자기 사라졌어요", ["lover+disappear"]],
  ["전 남자친구가 나왔어요", ["ex-lover"]],
  ["귀신에게 쫓겼어요", ["ghost+chased", "chased"]],
  ["유령을 피해 숨었어요", ["ghost+hide"]],
  ["경찰에게 잡혔어요", ["police+caught"]],
  ["경찰이 찾아왔어요", ["police+enter"]],
  ["선생님께 칭찬을 받았어요", ["teacher+receive"]],
  ["담임 선생님한테 혼났어요", ["teacher+angry"]],
  // 사람(2차): 가족·직장·이웃
  ["부모님과 함께 밥을 먹었어요", ["parents+eat"]],
  ["엄마 아빠가 나를 꼭 껴안아 줬어요", ["parents+hug"]],
  ["부모님께 혼났어요", ["parents+angry"]],
  ["언니랑 크게 다퉜어요", ["siblings+fight", "fight"]],
  ["남동생이 웃고 있었어요", ["siblings+laugh"]],
  ["오빠에게 선물을 받았어요", ["siblings+receive"]],
  ["딸이 서럽게 울었어요", ["children+cry"]],
  ["아들을 꼭 안아 줬어요", ["children+hug"]],
  ["남편이랑 싸웠어요", ["spouse+fight", "fight"]],
  ["아내가 갑자기 사라졌어요", ["spouse+disappear"]],
  ["우리 신랑이랑 여행 갔어요", ["spouse", "travel"]],
  ["시어머니가 화를 냈어요", ["in-laws+angry"]],
  ["시어머니에게 혼났어요", ["in-laws+angry"]],
  ["장모님께 선물을 받았어요", ["in-laws+receive"]],
  ["시댁에서 밥을 먹었어요", ["in-laws+eat"]],
  ["부장님한테 혼났어요", ["boss+angry"]],
  ["팀장님께 칭찬을 받았어요", ["boss+receive"]],
  ["회사 동료랑 점심을 먹었어요", ["coworker+eat"]],
  ["동료와 다퉜어요", ["coworker+fight", "fight"]],
  ["옆집 사람이 찾아왔어요", ["neighbor+enter"]],
  ["이웃에게 떡을 받았어요", ["neighbor+receive"]],
  ["명절에 친척들과 음식을 먹었어요", ["relatives+eat"]],
  ["외삼촌에게 용돈을 받았어요", ["money+receive", "relatives+receive"]],
  ["사촌 동생이 울었어요", ["relatives"]],
  ["조카딸이 놀러 왔어요", ["relatives"]],
  // 연애·결혼
  ["여자친구와 데이트했어요", ["girlfriend+date", "dating"]],
  ["여친이랑 크게 싸웠어요", ["girlfriend+fight", "fight"]],
  ["남자친구가 나왔어요", ["boyfriend"]],
  ["남자친구와 데이트했어요", ["boyfriend+date", "dating"]],
  ["남친한테 꽃을 받았어요", ["boyfriend+receive", "flower+receive"]],
  ["첫사랑을 다시 만났어요", ["first-love+reunite"]],
  ["첫사랑과 결혼했어요", ["wedding", "first-love+marry"]],
  ["짝사랑하는 사람이 나왔어요", ["crush"]],
  ["썸남이랑 대화했어요", ["crush+talk"]],
  ["소개팅에서 도망쳤어요", ["blind-date+escape"]],
  ["맞선 자리에서 밥을 먹었어요", ["blind-date+eat"]],
  ["데이트하다 싸웠어요", ["dating+fight", "fight"]],
  ["데이트 약속을 놓쳤어요", ["dating+lose"]],
  ["고백을 받았어요", ["confession+receive"]],
  ["좋아한다고 말했다가 울었어요", ["confession+cry"]],
  ["키스하는 꿈을 꿨어요", ["kiss"]],
  ["이마에 뽀뽀를 받았어요", ["kiss+receive"]],
  ["청혼을 받았어요", ["proposal+receive"]],
  ["프러포즈를 받고 울었어요", ["proposal+cry"]],
  ["결혼하자고 했어요", ["proposal"]],
  ["결혼식에 갔어요", ["wedding-ceremony"]],
  ["청첩장을 받았어요", ["wedding-ceremony+receive"]],
  ["웨딩드레스를 입었어요", ["wedding-ceremony+wear"]],
  ["결혼식에서 울었어요", ["wedding-ceremony+cry"]],
  ["결혼하는 꿈", ["wedding"]],
  ["이혼하고 펑펑 울었어요", ["divorce+cry"]],
  ["이혼 서류에 도장을 찍었어요", ["divorce"]],
  ["애인과 헤어지는 꿈을 꿨어요", ["lover", "breakup"]],
  ["남편과 갈라섰어요", ["spouse", "breakup"]],
  ["여자친구한테 차였어요", ["girlfriend", "breakup"]],
  ["남자친구와 헤어지고 울었어요", ["boyfriend+cry", "breakup+cry"]],
  ["이별 통보를 받았어요", ["breakup"]],
  ["남편이 바람피우는 꿈을 꿨어요", ["spouse", "affair"]],
  ["바람 피는 꿈을 꿨어요", ["affair"]],
  ["외도를 알고 울었어요", ["affair+cry"]],
  ["이상형과 사귀는 꿈을 꿨어요", ["ideal-type+date"]],
  ["이상형이 나를 보며 웃었어요", ["ideal-type+laugh"]],
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
  // 사전 확장 3차(정비): 달 strict, 기존 상징의 새 표현, 행동 활용형과 부정형
  ["달이 떴어요", ["moon+rise"]],
  ["보름달을 봤어요", ["moon"]],
  ["달님이 웃었어요", ["moon"]],
  ["돼지 들어옴", ["pig+enter"]],
  ["황금돼지가 들어왔어요", ["pig+enter"]],
  ["아기 돼지를 안았어요", ["pig+hug"]],
  ["빈집털이가 들어왔어요", ["thief+enter"]],
  ["영화배우가 나왔어요", ["celebrity"]],
  ["전남편이 찾아왔어요", ["ex-lover"]],
  ["백사장을 걸었어요", ["sea"]],
  ["산신령이 나타났어요", ["mountain"]],
  ["돌아가신 조상님이 웃었어요", ["ancestor+laugh"]],
  ["도둑을 잡진 못했어요", ["thief"]],
  ["돈을 못받았어요", ["money"]],
  ["돈을 받지를 못했어요", ["money"]],
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
  ["전 남자친구가 나왔어요", ["lover", "friend", "boyfriend"]],
  ["친구를 만났어요", ["boyfriend", "girlfriend"]],
  ["시어머니가 화를 냈어요", ["mother"]],
  ["시아버지가 웃었어요", ["father"]],
  ["엄마 아빠가 나왔어요", ["mother", "father"]],
  ["결혼식에 갔어요", ["wedding"]],
  ["딸기를 먹었어요", ["children"]],
  ["형광등이 켜졌어요", ["siblings"]],
  ["인형이 웃고 있었어요", ["siblings"]],
  ["성형을 했어요", ["siblings"]],
  ["학부모 모임에 갔어요", ["parents"]],
  ["이모티콘을 보냈어요", ["relatives"]],
  ["상사병에 걸렸어요", ["boss"]],
  ["장인 정신이 느껴졌어요", ["in-laws"]],
  ["바람을 피해 숨었어요", ["affair"]],
  ["이상한 꿈이었어요", ["ideal-type"]],
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
  // 사전 확장 3차(정비): 연애가 아닌 헤어짐, 손주, '한 달'·'다음 달'의 달, 금이 간 것, 임신과 태몽
  ["친구와 놀다 헤어졌어요", ["breakup"]],
  ["가족과 헤어지는 꿈을 꿨어요", ["breakup"]],
  ["기차였어요", ["breakup"]],
  ["손녀딸이 웃었어요", ["children"]],
  ["외손녀딸이 놀러 왔어요", ["children"]],
  ["한 달이 지났어요", ["moon"]],
  ["다음 달에 이사해요", ["moon"]],
  ["몇 달 동안 아팠어요", ["moon"]],
  ["한 달 전에 꾼 꿈이에요", ["moon"]],
  ["달라졌어요", ["moon"]],
  ["달라고 했어요", ["moon"]],
  ["약을 달이는 꿈", ["moon"]],
  ["거울에 금이 갔어요", ["gold"]],
  ["태몽을 꿨어요", ["pregnancy"]],
  ["부동산에 갔어요", ["mountain"]],
  ["장소를 몰라서 헤맸어요", ["cow"]],
  ["물소리가 들렸어요", ["cow"]],
  ["피아노를 배우는 꿈", ["celebrity"]],
  ["배우자가 나왔어요", ["celebrity"]],
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

describe("겹치는 호칭은 긴 표현이 이긴다 (사전 확장 2차)", () => {
  const slugs = (dream: string) => pairs(dream).map((p) => p.split("+")[0]);

  it("'남자친구가 나왔어요'는 남자친구이고 친구가 아니다", () => {
    expect(slugs("남자친구가 나왔어요")).toContain("boyfriend");
    expect(slugs("남자친구가 나왔어요")).not.toContain("friend");
  });

  it("'친구를 만났어요'는 친구이고 남자친구가 아니다", () => {
    expect(slugs("친구를 만났어요")).toEqual(["friend"]);
  });

  it("'시어머니가 화를 냈어요'는 시댁·처가이고 어머니가 아니다", () => {
    expect(pairs("시어머니가 화를 냈어요")).toEqual(["in-laws+angry"]);
    expect(slugs("시어머니가 화를 냈어요")).not.toContain("mother");
  });

  it("'결혼식에 갔어요'는 결혼식, '결혼하는 꿈'은 결혼", () => {
    expect(slugs("결혼식에 갔어요")).toEqual(["wedding-ceremony"]);
    expect(slugs("결혼하는 꿈")).toEqual(["wedding"]);
  });

  it("'딸기를 먹었어요'는 자녀가 아니고, '형광등이 켜졌어요'는 형제자매가 아니다", () => {
    expect(slugs("딸기를 먹었어요")).not.toContain("children");
    expect(slugs("형광등이 켜졌어요")).not.toContain("siblings");
  });
});

describe("알려진 오탐 정리 (사전 확장 3차)", () => {
  const slugs = (dream: string) => pairs(dream).map((p) => p.split("+")[0]);

  it("'친구와 놀다 헤어졌어요'는 이별이 아니고, 연인과 함께 나온 헤어짐만 이별이다", () => {
    expect(slugs("친구와 놀다 헤어졌어요")).toEqual(["friend"]);
    expect(slugs("남자친구와 헤어졌어요")).toEqual(["boyfriend", "breakup"]);
    // 연인은 다른 문장에 있으면 문맥으로 치지 않는다
    expect(slugs("남자친구가 나왔어요. 친구와 놀다 헤어졌어요")).toEqual(["boyfriend", "friend"]);
    // '이별'이라는 말은 문맥 없이도 이별
    expect(slugs("이별하고 울었어요")).toEqual(["breakup"]);
  });

  it("'손녀딸이'는 자녀로 잡지 않는다 (딸은 그대로 자녀)", () => {
    expect(slugs("손녀딸이 웃었어요")).not.toContain("children");
    expect(slugs("딸이 울었어요")).toEqual(["children"]);
    expect(slugs("큰딸이 웃었어요")).toEqual(["children"]);
  });

  it("달은 '달이·달을·달빛·보름달·달 꿈'만, '한 달·다음 달·달라'는 아니다", () => {
    for (const dream of ["달이 떴어요", "둥근 달을 봤어요", "환한 달빛이 비쳤어요", "보름달이 떠올랐어요", "달 꿈을 꿨어요"]) {
      expect(slugs(dream), dream).toContain("moon");
    }
    for (const dream of ["한 달이 지났어요", "다음 달에 이사해요", "지난 달은 바빴어요", "두세 달 걸렸어요", "달라요", "달라졌어요", "달력을 봤어요", "달걀을 먹었어요"]) {
      expect(slugs(dream), dream).not.toContain("moon");
    }
  });
});
