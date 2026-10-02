// 사전 품질 검사 (사전 확장 1차·2차·3차)
// - slug·키워드·표현이 상징끼리 겹치지 않는다
// - 한 상징의 표현이 다른 상징의 표현 안에 들어 있는 경우는 어느 쪽으로 잡을지 정해 둔 것뿐이다 (긴 표현이 이긴다)
// - 새로 넣는 상징에는 한 글자 동의어를 쓰지 않는다
// - 새 상징을 넣어도 기존 30개 상징의 매칭 결과는 그대로다 (일부러 바꾼 것만 예외로 적어 둔다)

import { describe, expect, it } from "vitest";
import { getAllActions } from "@/lib/actions";
import { MAX_MATCHED_SYMBOLS, matchDream, matchSymbols } from "@/lib/matcher";
import { normalizeDream } from "@/lib/normalize";
import { getAllSymbols } from "@/lib/symbols";
import type { DreamSymbol } from "@/lib/types";
import { isV1 } from "./v1-symbols";

const ALL = getAllSymbols();
const ACTIONS = getAllActions();

const V1 = ALL.filter((s) => isV1(s.slug));
const ADDED = ALL.filter((s) => !isV1(s.slug));

const termsOf = (s: DreamSymbol) => [...new Set([s.keyword, ...s.synonyms].map(normalizeDream).filter(Boolean))];

/** 그 표현만 입력했을 때 쓸 문장 (strict 상징의 한 글자 이름은 '꿈'이 붙어야 잡힌다) */
const inputFor = (s: DreamSymbol, term: string) => (s.strict && term.length === 1 ? `${term} 꿈` : term);

/**
 * 한 상징의 표현이 다른 상징의 표현 안에 들어 있어서 같은 자리에서 함께 잡히는 경우와, 그때 잡히는 상징.
 * (같은 자리에서는 긴 표현이 이긴다) 새로 생기면 어느 쪽으로 잡을지 정한 뒤 여기에 적는다.
 * 형식: "안에 든 상징 < 긴 표현의 상징:표현 → 결과"
 */
const DECIDED_CONFLICTS = [
  // 사전 v1
  "baby < pig:아기돼지 → pig",
  "ring < gold:금반지 → gold",
  "wedding < ring:결혼반지 → ring",
  // 동물: 새끼 동물은 아기(사람)가 아니라 그 동물로, 반달곰은 달이 아니라 곰으로, 도둑고양이는 도둑이 아니라 고양이로
  "baby < dog:아기 강아지 → dog",
  "baby < cat:아기 고양이 → cat",
  "baby < bird:아기 새 → bird",
  "baby < turtle:아기 거북 → turtle",
  "baby < bear:아기 곰 → bear",
  "thief < cat:도둑고양이 → cat",
  "sea < turtle:바다거북 → turtle",
  "moon < bear:반달곰 → bear",
  // 사람: 아기를 가진 것은 임신으로, 임신부의 '신부'는 결혼이 아니라 임신으로
  "baby < pregnancy:아기를 가졌 → pregnancy",
  "baby < pregnancy:배 속의 아기 → pregnancy",
  "baby < pregnancy:배 속에 아기 → pregnancy",
  "wedding < pregnancy:임신부 → pregnancy",
  // 사람(2차): 엄마 아빠처럼 두 분을 함께 부르면 어머니·아버지가 아니라 부모님으로
  "mother < parents:엄마 아빠 → parents",
  "mother < parents:엄마아빠 → parents",
  "mother < parents:아빠 엄마 → parents",
  "mother < parents:엄마와 아빠 → parents",
  "mother < parents:엄마랑 아빠 → parents",
  "mother < parents:어머니 아버지 → parents",
  "mother < parents:아버지 어머니 → parents",
  "father < parents:엄마 아빠 → parents",
  "father < parents:아빠 엄마 → parents",
  "father < parents:엄마와 아빠 → parents",
  "father < parents:엄마랑 아빠 → parents",
  "father < parents:어머니 아버지 → parents",
  "father < parents:아버지 어머니 → parents",
  // 사람(2차): 시어머니는 어머니가 아니라 시댁·처가로, 큰어머니·작은어머니와 사촌 형제는 친척으로,
  // 이웃사촌은 친척이 아니라 이웃으로, 우리 신랑은 결혼(신랑)이 아니라 배우자로
  "mother < in-laws:시어머니 → in-laws",
  "mother < relatives:큰어머니 → relatives",
  "mother < relatives:작은어머니 → relatives",
  "siblings < relatives:사촌 동생 → relatives",
  "siblings < relatives:사촌 언니 → relatives",
  "siblings < relatives:사촌 오빠 → relatives",
  "siblings < relatives:사촌 누나 → relatives",
  "relatives < neighbor:이웃사촌 → neighbor",
  "wedding < spouse:우리 신랑 → spouse",
  // 연애·결혼: 남자친구·여자친구는 친구가 아니라 각자의 상징으로, 헤어진 사이는 전 애인으로
  "friend < boyfriend:남자친구 → boyfriend",
  "friend < boyfriend:남자 친구 → boyfriend",
  "friend < girlfriend:여자친구 → girlfriend",
  "friend < girlfriend:여자 친구 → girlfriend",
  "friend < ex-lover:전 남자친구 → ex-lover",
  "friend < ex-lover:전 여자친구 → ex-lover",
  "friend < ex-lover:전남자친구 → ex-lover",
  "friend < ex-lover:전여자친구 → ex-lover",
  "friend < ex-lover:헤어진 남자친구 → ex-lover",
  "friend < ex-lover:헤어진 여자친구 → ex-lover",
  "boyfriend < ex-lover:전 남자친구 → ex-lover",
  "boyfriend < ex-lover:전남자친구 → ex-lover",
  "boyfriend < ex-lover:헤어진 남자친구 → ex-lover",
  "boyfriend < ex-lover:전 남친 → ex-lover",
  "boyfriend < ex-lover:전남친 → ex-lover",
  "girlfriend < ex-lover:전 여자친구 → ex-lover",
  "girlfriend < ex-lover:전여자친구 → ex-lover",
  "girlfriend < ex-lover:헤어진 여자친구 → ex-lover",
  "girlfriend < ex-lover:전 여친 → ex-lover",
  "girlfriend < ex-lover:전여친 → ex-lover",
  "lover < ex-lover:전 애인 → ex-lover",
  "lover < ex-lover:옛 애인 → ex-lover",
  "lover < ex-lover:옛 연인 → ex-lover",
  "lover < ex-lover:헤어진 연인 → ex-lover",
  // 연애·결혼: 결혼식·웨딩드레스·웨딩홀은 결혼하는 꿈이 아니라 결혼식으로, 결혼하자는 말은 프러포즈로,
  // 약혼반지는 프러포즈가 아니라 반지로
  "wedding < wedding-ceremony:결혼식 → wedding-ceremony",
  "wedding < wedding-ceremony:결혼식장 → wedding-ceremony",
  "wedding < wedding-ceremony:웨딩드레스 → wedding-ceremony",
  "wedding < wedding-ceremony:웨딩홀 → wedding-ceremony",
  "clothes < wedding-ceremony:웨딩드레스 → wedding-ceremony",
  "wedding < proposal:결혼하자고 → proposal",
  "wedding < proposal:결혼하자는 → proposal",
  "proposal < ring:약혼반지 → ring",
  // 자연·행동: 시험에 떨어지는 건 낙하가 아니라 시험으로, 시험에 늦는 건 지각으로, 눈싸움은 싸움이 아니라 눈으로
  "falling < exam:시험에 떨어지 → exam",
  "falling < exam:시험에 떨어졌 → exam",
  "falling < exam:시험에 떨어져 → exam",
  "exam < late:시험에 늦 → late",
  "fight < snow:눈싸움 → snow",
  // 물건: 옷을 벗는 건 옷이 아니라 벌거벗은 꿈으로, 수영복은 수영이 아니라 옷으로
  "clothes < naked:옷을 벗 → naked",
  "clothes < naked:옷을 다 벗 → naked",
  "clothes < naked:옷이 벗겨 → naked",
  "clothes < naked:옷을 안 입 → naked",
  "clothes < naked:옷을 입지 않 → naked",
  "clothes < naked:옷을 하나도 → naked",
  "swimming < clothes:수영복 → clothes",
  // 사전 확장 3차(정비): 새끼·황금 동물은 그 동물로, 헤어진·예전·옛날·구(舊) 연인과 전 배우자는 전 애인으로,
  // 빈집털이는 집이 아니라 도둑으로, 불바다·물바다·백사장·신혼여행은 긴 표현의 상징으로
  "baby < pig:아기 돼지 → pig",
  "baby < snake:아기 뱀 → snake",
  "baby < tiger:아기 호랑이 → tiger",
  "gold < dragon:황금 용 → dragon",
  "gold < fish:황금 물고기 → fish",
  "gold < pig:황금 돼지 → pig",
  "gold < pig:황금돼지 → pig",
  "gold < tiger:황금 호랑이 → tiger",
  "boyfriend < ex-lover:구남친 → ex-lover",
  "boyfriend < ex-lover:예전 남자친구 → ex-lover",
  "boyfriend < ex-lover:옛날 남자친구 → ex-lover",
  "boyfriend < ex-lover:헤어진 남친 → ex-lover",
  "girlfriend < ex-lover:구여친 → ex-lover",
  "girlfriend < ex-lover:예전 여자친구 → ex-lover",
  "girlfriend < ex-lover:옛날 여자친구 → ex-lover",
  "girlfriend < ex-lover:헤어진 여친 → ex-lover",
  "friend < ex-lover:예전 남자친구 → ex-lover",
  "friend < ex-lover:예전 여자친구 → ex-lover",
  "friend < ex-lover:옛날 남자친구 → ex-lover",
  "friend < ex-lover:옛날 여자친구 → ex-lover",
  "lover < ex-lover:예전 애인 → ex-lover",
  "lover < ex-lover:전 연인 → ex-lover",
  "lover < ex-lover:헤어진 애인 → ex-lover",
  "spouse < ex-lover:전 남편 → ex-lover",
  "spouse < ex-lover:전 아내 → ex-lover",
  "spouse < ex-lover:전남편 → ex-lover",
  // 이별의 "헤어진"(연인과 함께 나올 때만 찾는 표현)도 '헤어진 연인' 같은 전 애인 표현 안에서는 전 애인이 이긴다
  "breakup < ex-lover:헤어진 남자친구 → ex-lover",
  "breakup < ex-lover:헤어진 남친 → ex-lover",
  "breakup < ex-lover:헤어진 애인 → ex-lover",
  "breakup < ex-lover:헤어진 여자친구 → ex-lover",
  "breakup < ex-lover:헤어진 여친 → ex-lover",
  "breakup < ex-lover:헤어진 연인 → ex-lover",
  "house < thief:빈집털이 → thief",
  "sea < fire:불바다 → fire",
  "sea < water:물바다 → water",
  "snake < sea:백사장 → sea",
  "wedding < travel:신혼여행 → travel",
  // 사전 확장 3차(신규 상징): 돌아가신 분을 부르는 말은 그 사람(어머니·할머니…)이 아니라 돌아가신 가족으로,
  // 돌아가신 조상은 조상으로, 내 장례식은 장례식이 아니라 죽음으로
  "deceased-family < ancestor:돌아가신 조상 → ancestor",
  "deceased-family < ancestor:돌아가신 조상님 → ancestor",
  "father < deceased-family:돌아가신 아버지 → deceased-family",
  "father < deceased-family:돌아가신 아빠 → deceased-family",
  "grandparents < deceased-family:돌아가신 외할머니 → deceased-family",
  "grandparents < deceased-family:돌아가신 외할아버지 → deceased-family",
  "grandparents < deceased-family:돌아가신 할머니 → deceased-family",
  "grandparents < deceased-family:돌아가신 할아버지 → deceased-family",
  "mother < deceased-family:돌아가신 어머니 → deceased-family",
  "mother < deceased-family:돌아가신 엄마 → deceased-family",
  "parents < deceased-family:돌아가신 부모님 → deceased-family",
  "spouse < deceased-family:돌아가신 남편 → deceased-family",
  "spouse < deceased-family:돌아가신 아내 → deceased-family",
  "funeral < death:나의 장례식 → death",
  "funeral < death:내 장례식 → death",
  "funeral < death:자신의 장례식 → death",
  // 사전 확장 3차(신규 상징): 놓친 비행기·기차, 학교·회사에 늦는 건 지각으로, 학교 친구·선생님과 직장 상사·동료는 그 사람으로,
  // 의사 선생님은 병원으로
  "airplane < late:비행기를 놓쳤 → late",
  "airplane < late:비행기를 놓치 → late",
  "train < late:기차를 놓쳤 → late",
  "train < late:기차를 놓치 → late",
  "school < late:수업에 늦 → late",
  "school < late:학교에 늦 → late",
  "workplace < late:출근에 늦 → late",
  "workplace < late:회사에 늦 → late",
  "school < friend:학교 친구 → friend",
  "school < teacher:학교 선생님 → teacher",
  "teacher < hospital:의사 선생님 → hospital",
  "workplace < boss:직장 상사 → boss",
  "workplace < boss:회사 상사 → boss",
  "workplace < coworker:입사 동기 → coworker",
  "workplace < coworker:직장 동료 → coworker",
  "workplace < coworker:회사 동기 → coworker",
  "workplace < coworker:회사 동료 → coworker",
  "workplace < coworker:회사 사람들 → coworker",
  // 사전 확장 3차(신규 상징): 금·다이아 장신구는 금·반지로, 반지갑은 반지가 아니라 지갑으로, 과일칼은 칼로, 꽃나무는 꽃으로,
  // 배낭여행·여행 가방은 여행으로, 황소개구리는 소가 아니라 개구리로, 돈벼락은 번개가 아니라 돈으로,
  // 눈물바다는 바다·물이 아니라 눈물로
  "jewel < gold:금귀걸이 → gold",
  "jewel < gold:금목걸이 → gold",
  "jewel < gold:금팔찌 → gold",
  "jewel < ring:다이아 반지 → ring",
  "jewel < ring:다이아몬드 반지 → ring",
  "ring < wallet:반지갑 → wallet",
  "fruit < knife:과일칼 → knife",
  "tree < flower:꽃나무 → flower",
  "bag < travel:배낭여행 → travel",
  "bag < travel:여행 가방 → travel",
  "cow < frog:황소개구리 → frog",
  "lightning < money:돈벼락 → money",
  "sea < tears:눈물바다 → tears",
  "water < tears:눈물바다 → tears",
];

function findConflicts(): string[] {
  const rows: string[] = [];
  for (const outer of ALL) {
    for (const term of termsOf(outer)) {
      const input = inputFor(outer, term);
      const result = matchSymbols(input, ALL).map((s) => s.slug);
      for (const inner of ALL) {
        if (inner !== outer && matchSymbols(input, [inner]).length > 0) {
          rows.push(`${inner.slug} < ${outer.slug}:${term} → ${result.join(",")}`);
        }
      }
    }
  }
  return rows;
}

describe("slug·키워드·표현 중복", () => {
  it("slug 와 키워드가 상징끼리 겹치지 않는다", () => {
    const slugs = ALL.map((s) => s.slug);
    const keywords = ALL.map((s) => normalizeDream(s.keyword));
    expect(slugs.filter((x, i) => slugs.indexOf(x) !== i)).toEqual([]);
    expect(keywords.filter((x, i) => keywords.indexOf(x) !== i)).toEqual([]);
  });

  it("같은 표현(키워드·동의어·문맥 표현)이 두 상징에 들어 있지 않다", () => {
    const owner = new Map<string, string>();
    const dups: string[] = [];
    for (const s of ALL) {
      for (const term of new Set([...termsOf(s), ...(s.contextTerms ?? []).map(normalizeDream)])) {
        const prev = owner.get(term);
        if (prev && prev !== s.slug) dups.push(`${term}: ${prev}, ${s.slug}`);
        owner.set(term, s.slug);
      }
    }
    expect(dups).toEqual([]);
  });

  it("한 상징 안에서도 동의어가 겹치지 않는다", () => {
    for (const s of ALL) {
      const words = s.synonyms.map(normalizeDream);
      expect(words.filter((w, i) => words.indexOf(w) !== i), s.slug).toEqual([]);
    }
  });

  it("새로 넣은 상징에는 한 글자 동의어가 없다 (다른 뜻으로 잘못 잡히기 쉬워서)", () => {
    const oneChar = ADDED.flatMap((s) => s.synonyms.filter((w) => normalizeDream(w).length === 1).map((w) => `${s.slug}:${w}`));
    expect(oneChar).toEqual([]);
  });
});

describe("상징끼리 표현이 겹치는 경우", () => {
  it("모든 표현은 그것만 입력해도 자기 상징으로 잡힌다", () => {
    const dead = ALL.flatMap((s) =>
      termsOf(s)
        .filter((term) => !matchSymbols(inputFor(s, term), ALL).some((m) => m.slug === s.slug))
        .map((term) => `${s.slug}:${term}`),
    );
    expect(dead).toEqual([]);
  });

  it("문맥 표현은 문맥 단어와 함께 쓰면 자기 상징으로 잡히고, 혼자 쓰면 잡히지 않는다", () => {
    for (const s of ALL.filter((x) => x.contextTerms)) {
      for (const term of s.contextTerms!) {
        expect(matchSymbols(`${s.contextWords![0]}과 ${term}`, [s]).map((m) => m.slug), `${s.slug}:${term}`).toEqual([s.slug]);
        expect(matchSymbols(term, [s]), `${s.slug}:${term}`).toEqual([]);
      }
    }
  });

  it("다른 상징의 표현 안에 든 경우는 정해 둔 것뿐이다", () => {
    expect(findConflicts().sort()).toEqual([...DECIDED_CONFLICTS].sort());
  });
});

describe("기존 30개 상징 회귀 검사", () => {
  const pairsOf = (dream: string, symbols: DreamSymbol[]) =>
    matchDream(dream, symbols, ACTIONS).map((m) => (m.situation ? `${m.symbol.slug}+${m.situation.action}` : m.symbol.slug));

  /** 기존 상징의 상황 제목·표현과 기존 테스트·예시 문장 */
  const CORPUS = [
    ...V1.flatMap((s) => s.situations.map((sit) => sit.title)),
    ...V1.flatMap((s) => termsOf(s).map((term) => `${term} 꿈을 꿨어요`)),
    "돼지가 집으로 들어오고 마당에 불이 활활 타는 꿈을 꿨어요",
    "돼지가 집으로 들어오고 뱀에게 물렸어요",
    "커다란 돼지가 집 안으로 들어와서 제 품에 안겼어요.",
    "돌아가신 할머니가 환하게 웃으면서 돈을 주셨어요.",
    "하늘을 날다가 갑자기 떨어져서 깜짝 놀라 깼어요.",
    "구렁이가 몸을 칭칭 감더니 팔을 물었어요.",
    "이가 흔들리다가 우수수 빠져서 너무 놀랐어요.",
    "돼지가 도망쳤어요",
    "돼지를 먹고 나서 집으로 들어왔어요",
    "집에 불이 났는데 아무도 안 다쳤어요",
    "금반지를 잃어버려서 한참 찾았어요",
    "은행에서 돈을 찾았어요",
    "엄마가 아기를 낳았어요",
    "도둑을 잡지 못했어요",
    "도둑이 들어와서 지갑을 훔쳐 갔어요",
    "물고기를 잡았다가 놓쳤어요",
    "바다에서 물고기를 잡았다",
    "멧돼지한테 쫓겼다",
    "헤어진 연인이 나왔어",
    "산불이 났다",
    "용꿈을 꿨어요",
    "소 한 마리가 있었다",
    "할머니 장례식에 갔어요",
    "아기를 낳았는데 아기가 방긋 웃었어요",
    "마당으로 들어온 돼지를 봤다",
    "새 집으로 이사하는 꿈을 꿨어요",
    "이사하는 꿈을 꿨어요",
    "물이 불어나서 집이 잠겼어요",
    "바닷물에 빠져서 허우적거렸어요",
    "흙탕물을 마셨어요",
    "웨딩드레스를 입고 결혼식을 올렸어요",
  ];

  /**
   * 일부러 바꾼 결과: 입력 → 지금 결과
   * - 사전 확장 2차: 겹치는 표현은 긴 표현이 이긴다. 결혼식·웨딩드레스는 '결혼하는'이 아니라 '결혼식' 상징으로 잡는다.
   * - 사전 확장 3차: 조상의 '돌아가신'은 돌아가신 가족으로, 죽음의 '장례식'은 장례식으로 옮겼다.
   *   (조상에는 '돌아가신 조상(님)', 죽음에는 '내·나의·자신의 장례식'이 남는다)
   */
  const INTENDED_CHANGES: Record<string, string> = {
    "웨딩드레스를 입고 결혼식을 올렸어요": "wedding-ceremony+wear",
    "돌아가신 할머니가 환하게 웃으면서 돈을 주셨어요.": "deceased-family+receive money+receive",
    "할머니 장례식에 갔어요": "grandparents funeral",
  };

  it("일부러 바꾼 입력은 정해 둔 결과대로 나온다", () => {
    for (const [dream, expected] of Object.entries(INTENDED_CHANGES)) {
      expect(pairsOf(dream, ALL).join(" "), dream).toBe(expected);
    }
  });

  it("새 상징을 넣어도 기존 상징의 매칭 결과(상징·상황 풀이·순서)는 그대로다", () => {
    const changed = CORPUS.filter((dream) => !(dream in INTENDED_CHANGES)).flatMap((dream) => {
      const before = pairsOf(dream, V1);
      const all = pairsOf(dream, ALL);
      const after = all.filter((p) => isV1(p.split("+")[0]));
      // 상징이 4개까지만 나오므로, 새 상징 때문에 4개가 꽉 찼으면 기존 상징 일부가 빠질 수 있다.
      const same =
        all.length === MAX_MATCHED_SYMBOLS ? after.every((p) => before.includes(p)) : after.join() === before.join();
      return same ? [] : [`"${dream}": ${before.join(" ")} → ${all.join(" ")}`];
    });
    expect(changed).toEqual([]);
  });
});
