// 사전 content lint (사전 3차 후속 A): data/ 의 모든 문장이 CLAUDE.md "사전 콘텐츠 작성 규칙"을 지키는지 본다.
// 검사 범위: 상징 요약·본문·상황 제목·상황 풀이, 가이드 제목·소개·소제목·본문, 행동 사전(actions.json) 표현
// 새 데이터가 걸리면 먼저 문장을 고친다. 꼭 남겨야 하는 문장만 EXCEPTIONS 에 이유와 함께 적는다.

import { describe, expect, it } from "vitest";
import { getAllActions } from "@/lib/actions";
import { getAllGuides } from "@/lib/guides";
import { getAllSymbols } from "@/lib/symbols";

type Rule = "당첨 언급" | "사람 건강·사망 암시" | "건강 상태 판단" | "단정 표현";

/** 검사할 문장 하나. source 는 예외를 걸 단위(symbol:slug, guide:slug, action:slug) */
type Unit = { source: string; where: string; text: string };

const RULES: { rule: Rule; re: RegExp }[] = [
  // 1. 복권·당첨·로또 이야기
  { rule: "당첨 언급", re: /당첨|복권|로또/ },
  // 2. 실제 가족·지인의 건강·사망·질병·사고를 알리거나 암시하는 말
  {
    rule: "사람 건강·사망 암시",
    re: new RegExp(
      [
        // "가족이 죽는 꿈은 그 사람이 건강해진다는 뜻" 처럼 사람 + 건강·죽음 + 뜻·신호
        "(가족|부모|어머니|아버지|엄마|아빠|자녀|아이|배우자|남편|아내|형제|친구|지인|주변 사람|가까운 사람|그 사람|그분|집안)[^.?!]*(건강|장수|질병|병에|사고|다치|아프|죽|세상을 떠|돌아가)[^.?!]*(뜻|신호|징조|조짐|예고|암시|경고)(이에요|예요|이라|라는|으로|로|일 수|하)",
        "건강과 장수를 뜻|장수를 (뜻|누리)|오래 산다는 (뜻|신호|징조)|수명이 (늘|줄)",
        // "건강을 살피라는 뜻", "서로의 건강을 확인하는 것이"
        "건강[^.?!]{0,20}(살피|점검|확인|챙기)(라는|는 계기|하라는|하는 것이)",
        "사고(가|를) (나|날|난다|생기|당하)|다치게 되|아프게 되|병에 걸리|죽게 되|세상을 떠나게 되|돌아가시게 되",
      ].join("|"),
    ),
  },
  // 3. 꿈으로 몸 상태를 판단하는 말
  {
    rule: "건강 상태 판단",
    re: new RegExp(
      [
        "건강운|건강 검진|검진을 받|몸의 신호|몸이 보내는",
        "건강해지|건강해진|건강해질|건강을 되찾|건강[^.?!]{0,6}(좋아지|회복|나빠지)",
        "(기력|체력|컨디션|기운|몸과 마음|몸)(이|가|도)? (다시 |차츰 )?(회복되|회복하|좋아지|돌아오|나빠지|약해지)",
        "(병|질병)(이|은|도) (낫|나을|물러가|씻겨)|앓던 병|병을 앓던",
        "(회복|쾌유)(의|되는|될|된다는)? ?(조짐|신호|징조)",
        "(몸|몸과 마음|기력|체력)(이|가)? (많이 )?(지쳐|약해져|쇠약해져) 있[^.?!]{0,25}(신호|뜻)",
        "몸의 (피로|이상)[^.?!]{0,25}(신호|뜻)(이에요|예요|일|이라|으로|로)",
        "체력이 (따라가지 못|떨어지|바닥)",
        "(건강|몸)(을|도)? (한 번 )?(점검|검사|진찰)하라",
        // 태몽·임신에서 아이의 건강을 점치는 말
        "건강(한|하고) [^.?!]{0,8}?(아이|아기)를,? ?[^.?!]{0,10}?(상징|뜻|낳)",
      ].join("|"),
    ),
  },
  // 4. 작성 규칙의 단정 표현 ("~할 거예요"는 아래 predicts 가 따로 본다)
  { rule: "단정 표현", re: /(으로|로|고) 봐요|라고 (풀어요|봐요)|(으로|로) 풀어요|해몽에서는|반드시|무조건|틀림없이/ },
];

/** 예외 없이 막는 말: 당첨을 약속·예고하는 표현 (복권 상징 안에서도 금지) */
const WIN_PROMISE =
  /당첨(될 (거|것|수)|된다는|되는 (길몽|징조|신호)|의 (징조|신호|기운|조짐)|운이|을 (부르|예고|암시|가져다))|당첨 (징조|신호|조짐|예감)/;

/** 규칙에서 빼는 문장. text 가 없으면 그 source 전체를 뺀다. 쓰이지 않는 예외는 테스트가 실패한다. */
const EXCEPTIONS: { rule: Rule; source: string; text?: string; reason: string }[] = [
  {
    rule: "당첨 언급",
    source: "symbol:lottery",
    reason:
      "복권 상징 자체(이미 공개된 slug라 지우지 않는다). 꿈속 복권 장면을 풀이하려면 이 낱말이 필요하다. 당첨 약속 표현(WIN_PROMISE)은 이 상징에서도 금지하고, 요약에 당첨을 알려 주지 않는다는 문장이 있는지 따로 확인한다.",
  },
  {
    rule: "당첨 언급",
    source: "action:win",
    reason: "\"당첨됐어요\" 같은 입력 문장을 읽는 매칭 표현이라 풀이 문장이 아니다.",
  },
  {
    rule: "당첨 언급",
    source: "guide:wealth-dreams",
    text: "꿈이 당첨을 약속하지는 않아요",
    reason: "당첨을 약속하지 않는다고 부정하는 문장이다.",
  },
  {
    rule: "당첨 언급",
    source: "guide:wealth-dreams",
    text: "당첨 확률과는 관계가 없어요",
    reason: "이 사이트의 추천 번호가 재미를 위한 것이라는 고지다.",
  },
  {
    rule: "당첨 언급",
    source: "guide:wealth-dreams",
    text: "복권은 여유 있는 범위에서 가볍게 즐기고",
    reason: "복권을 여유 있는 범위에서만 즐기라는 책임 있는 이용 안내다.",
  },
];

/** ㄹ 받침 + "거예요"(…할 거예요) = 앞날을 단정하는 말 */
function predicts(sentence: string): boolean {
  return [...sentence.matchAll(/([가-힣]) 거예요/g)].some((m) => (m[1].codePointAt(0)! - 0xac00) % 28 === 8);
}

function sentences(text: string): string[] {
  return text
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1") // [돼지](/dream/pig) → 돼지
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function allUnits(): Unit[] {
  const units: Unit[] = [];
  const add = (source: string, where: string, text: string) =>
    units.push(...sentences(text).map((s) => ({ source, where, text: s })));
  for (const s of getAllSymbols()) {
    const source = `symbol:${s.slug}`;
    add(source, `${s.slug}.meaning`, s.meaning);
    add(source, `${s.slug}.body`, s.body);
    for (const sit of s.situations) {
      add(source, `${s.slug}/${sit.action} 제목`, sit.title);
      add(source, `${s.slug}/${sit.action}`, sit.meaning);
    }
  }
  for (const g of getAllGuides()) {
    const source = `guide:${g.slug}`;
    add(source, `${g.slug} 제목`, g.title);
    add(source, `${g.slug} 소개`, g.description);
    for (const sec of g.sections) {
      add(source, `${g.slug} «${sec.heading}»`, sec.heading);
      for (const text of sec.blocks.flat()) add(source, `${g.slug} «${sec.heading}»`, text);
    }
  }
  for (const a of getAllActions()) {
    for (const w of [a.verb, ...a.synonyms]) units.push({ source: `action:${a.slug}`, where: `action:${a.slug}`, text: w });
  }
  return units;
}

function exceptionFor(rule: Rule, unit: Unit) {
  return EXCEPTIONS.find((e) => e.rule === rule && e.source === unit.source && (!e.text || unit.text.includes(e.text)));
}

/** 규칙에 걸린 문장. 예외로 빠진 문장은 used 에 기록한다. */
function lint(units: Unit[], used = new Set<object>()): string[] {
  return units.flatMap((u) => {
    const hits: Rule[] = RULES.filter(({ re }) => re.test(u.text)).map(({ rule }) => rule);
    if (predicts(u.text) && !hits.includes("단정 표현")) hits.push("단정 표현");
    return hits.flatMap((rule) => {
      const exception = exceptionFor(rule, u);
      if (exception) {
        used.add(exception);
        return [];
      }
      return [`[${rule}] ${u.where}: ${u.text}`];
    });
  });
}

const UNITS = allUnits();

describe("사전 content lint", () => {
  it("data/ 전체 문장이 네 가지 규칙(당첨·사람 건강·건강 판단·단정)을 지킨다", () => {
    expect(UNITS.length).toBeGreaterThan(3000);
    expect(lint(UNITS)).toEqual([]);
  });

  it("예외 목록은 모두 실제로 쓰이고, 이유가 적혀 있다", () => {
    const used = new Set<object>();
    lint(UNITS, used);
    for (const e of EXCEPTIONS) {
      expect(e.reason.length, `${e.source} ${e.text ?? ""}`).toBeGreaterThan(10);
      expect(used.has(e), `쓰이지 않는 예외: ${e.source} ${e.text ?? ""}`).toBe(true);
    }
  });

  it("당첨을 약속하는 표현은 예외 없이 쓰지 않는다 (복권 상징 포함)", () => {
    expect(UNITS.filter((u) => WIN_PROMISE.test(u.text)).map((u) => `${u.where}: ${u.text}`)).toEqual([]);
  });

  it("복권 상징 요약에는 꿈이 당첨을 알려 주지 않는다는 문장이 있다", () => {
    const lottery = getAllSymbols().find((s) => s.slug === "lottery")!;
    expect(lottery.meaning).toMatch(/당첨을 알려 주지는 않아요/);
  });

  it("검사 규칙 자체가 동작한다 (사전 3차 후속에서 고친 문장)", () => {
    const check = (text: string, source = "symbol:test") => lint([{ source, where: "t", text }]);
    // 고치기 전 문장은 걸린다
    expect(check("가족이나 지인이 죽는 꿈은 그 사람이 오히려 건강해지거나 좋은 일이 생긴다는 뜻으로 해석하는 경우가 많아요.")).toHaveLength(2);
    expect(check("반대로 조상이 슬퍼하거나 화난 얼굴로 나타나는 꿈은 건강이나 가족 관계를 한 번 더 살피라는 뜻으로 풀이하기도 해요.")).toHaveLength(1);
    expect(check("조상꿈은 복권 당첨 이야기에 자주 등장할 만큼 유명한 재물 꿈이에요.")).toHaveLength(1);
    expect(check("가족이나 친구가 세상을 떠나 목 놓아 우는 꿈은 오히려 그 사람의 건강과 장수를 뜻하는 반대 꿈으로 알려져 있어요.")).toHaveLength(1);
    expect(check("다만 꿈속에서 계속 괴롭고 두려웠다면 몸과 마음이 많이 지쳐 있다는 신호일 수 있어요.")).toHaveLength(1);
    expect(check("이런 꿈을 꿨다면 건강 검진이나 집 안 정리처럼 기본을 챙기는 일부터 시작해 보세요.")).toHaveLength(1);
    expect(check("죽는 꿈은 무섭지만 해몽에서는 낡은 것이 끝나고 새롭게 태어나는 재생의 길몽이에요.")).toHaveLength(1);
    expect(check("곧 큰돈이 들어올 거예요.")).toHaveLength(1);
    // 고친 뒤 문장과 부정·안내 문장은 통과한다
    expect(check("가족이나 친구가 세상을 떠나 목 놓아 우는 꿈은 그 사람에게 실제로 무슨 일이 생긴다는 뜻이 아니라, 소중한 사람을 잃고 싶지 않은 마음과 아끼는 마음이 크게 드러난 꿈이에요.")).toEqual([]);
    expect(check("지금 곁에 계신 할머니·할아버지가 꿈에 나왔다면 그분들의 건강을 점치는 꿈이 아니라, 요즘 내가 그분들을 자주 떠올리고 있다는 표현에 가까워요.")).toEqual([]);
    expect(check("방긋 웃는 건강한 아기를 품에 안는 꿈은 새로운 인연이 찾아오는 길몽으로 풀이하기도 해요.")).toEqual([]);
    expect(check("마음이 드러난 거예요.")).toEqual([]);
    // 예외는 정해진 source 와 문장에만 적용된다
    expect(check("꿈이 당첨을 약속하지는 않아요.", "guide:wealth-dreams")).toEqual([]);
    expect(check("꿈이 당첨을 약속하지는 않아요.", "guide:taemong")).toHaveLength(1);
    expect(WIN_PROMISE.test("복권에 당첨될 거예요.")).toBe(true);
    expect(WIN_PROMISE.test("꿈이 실제 당첨을 알려 주지는 않아요.")).toBe(false);
  });
});
