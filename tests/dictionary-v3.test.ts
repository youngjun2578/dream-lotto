// 사전 확장 3차에서 정한 것
// 3-A(정비)
// - 임신하는 꿈과 태몽은 다른 상징이다. 임신 상징은 slug·숫자 후보를 그대로 두고 '태몽'만 뗐다.
// - 태몽 상징은 태몽 가이드로 이어지고, 임신 여부·성별·앞날을 단정하지 않는다.
// - 달은 strict 이고, 기존 30개 상징에도 새 한 글자 동의어를 넣지 않는다.
// 3-B(신규 상징 34개)
// - 분량은 직전(2차) 평균 이상: 요약 118자, 본문 468자
// - 죽음·장례식·병원·사고성 소재는 겁주지 않고, 실제 죽음·질병·사고를 예고하지 않는다는 문장을 함께 둔다
// - 복권·로또·도박 소재는 넣지 않는다
// - 조상의 '돌아가신'은 돌아가신 가족으로, 죽음의 '장례식'은 장례식으로 옮겼다 (slug·숫자 후보는 그대로)
// 3차 후속 C
// - 민감 소재(죽음·돌아가신 가족·장례식·병원·귀신)는 sensitive 표시를 하고, 인기 꿈 키워드와 홈 예시 꿈에 내보내지 않는다

import { describe, expect, it } from "vitest";
import { EXAMPLE_DREAMS } from "@/components/DreamForm";
import { getActionBySlug } from "@/lib/actions";
import { matchSymbols } from "@/lib/matcher";
import { getAllSymbols, getPopularSymbols, getSymbolBySlug, validateSymbols } from "@/lib/symbols";
import { normalizeDream } from "@/lib/normalize";
import { isV1 } from "./v1-symbols";

const textsOf = (slug: string) => {
  const s = getSymbolBySlug(slug)!;
  return [s.meaning, s.body, ...s.situations.flatMap((sit) => [sit.title, sit.meaning])].join("\n");
};

describe("임신과 태몽", () => {
  it("임신 상징은 slug·이름·숫자 후보가 그대로이고, 표현과 본문에서 태몽을 뗐다", () => {
    const pregnancy = getSymbolBySlug("pregnancy")!;
    expect(pregnancy).toMatchObject({ keyword: "임신", category: "사람", weight: 3, numbers: [1, 12, 18, 29, 35] });
    expect(pregnancy.synonyms).not.toContain("태몽");
    expect(pregnancy.body).not.toMatch(/태몽처럼/);
    expect(pregnancy.body).toContain("[태몽](/dream/taemong-dream)");
  });

  it("태몽 상징은 태몽 가이드와 임신 상징으로 이어진다", () => {
    const taemong = getSymbolBySlug("taemong-dream")!;
    expect(taemong).toMatchObject({ keyword: "태몽", category: "사람" });
    expect(taemong.body).toContain("(/guide/taemong)");
    expect(taemong.body).toContain("(/dream/pregnancy)");
  });

  it("태몽·임신 풀이는 성별이나 임신 여부를 예측하지 않는다", () => {
    for (const slug of ["taemong-dream", "pregnancy"]) {
      expect(textsOf(slug), slug).not.toMatch(/(아들|딸)(을|이)?\s?(낳|가질|생길|태어날)|임신(한|이)?\s?(것이다|거예요|확실)|성별은 (아들|딸)/);
    }
  });
});

describe("기존 30개 상징 정비", () => {
  it("달은 strict 로 찾는다 (한 글자 '달'은 '달 꿈'일 때만)", () => {
    expect(getSymbolBySlug("moon")?.strict).toBe(true);
  });

  it("기존 30개 상징의 한 글자 동의어는 원래 있던 것뿐이다 (새로 넣지 않는다)", () => {
    const LEGACY = ["소", "뱀", "용", "범", "왕", "물", "불", "산", "달", "똥", "돈", "금", "집"];
    const oneChar = getAllSymbols()
      .filter((s) => isV1(s.slug))
      .flatMap((s) => s.synonyms.filter((w) => normalizeDream(w).length === 1));
    expect(oneChar.filter((w) => !LEGACY.includes(w))).toEqual([]);
  });
});

/** 사전 확장 3차(3-B)에서 새로 넣은 상징 */
const V3B_SLUGS = [
  "spider", "bugs", "frog", "butterfly",
  "tree", "fruit", "lightning", "earthquake",
  "deceased-family", "grandparents", "monk",
  "hair", "nails", "tears", "funeral", "military",
  "school", "workplace", "hospital", "airplane", "train", "elevator", "stairs", "wallet", "jewel",
  "food", "alcohol", "gift", "letter", "toilet", "rice", "bag", "clock", "umbrella",
];

const sentencesOf = (text: string) => text.split(/(?<=[.!?])\s+/).filter(Boolean);
const allSentences = (slug: string) => {
  const s = getSymbolBySlug(slug)!;
  return [s.meaning, ...s.body.split(/\n{2,}/), ...s.situations.map((sit) => sit.meaning)].flatMap(sentencesOf);
};

describe("신규 상징 (3-B)", () => {
  it("34개가 모두 있고, 사전은 128개 이상이다", () => {
    expect(V3B_SLUGS.filter((slug) => !getSymbolBySlug(slug))).toEqual([]);
    expect(new Set(V3B_SLUGS).size).toBe(34);
    expect(getAllSymbols().length).toBeGreaterThanOrEqual(128);
  });

  it("분량은 직전 평균 이상 (요약 118자, 본문 468자)", () => {
    for (const slug of V3B_SLUGS) {
      const s = getSymbolBySlug(slug)!;
      expect(s.meaning.length, `${slug}.meaning`).toBeGreaterThanOrEqual(118);
      expect(s.body.length, `${slug}.body`).toBeGreaterThanOrEqual(468);
    }
  });

  it("복권·로또·도박 소재와 징조·경고 단정이 없다", () => {
    const bad = V3B_SLUGS.flatMap((slug) =>
      allSentences(slug)
        .filter((t) => /복권|로또|도박|당첨|징조|경고예요|경고로 받아들이세요|예고해요|수명|저승/.test(t))
        .map((t) => `${slug}: ${t}`),
    );
    expect(bad).toEqual([]);
  });

  it("사고·건강·죽음을 말하는 문장은 모두 '실제로 그렇다는 뜻은 아니다'로 쓴다", () => {
    const bad = V3B_SLUGS.flatMap((slug) =>
      allSentences(slug)
        .filter((t) => /사고|건강|몸 상태|몸의 이상|죽음/.test(t) && !/아니|보다|상관없/.test(t))
        .map((t) => `${slug}: ${t}`),
    );
    expect(bad).toEqual([]);
  });

  it("민감 소재(돌아가신 가족·장례식·병원·할머니·할아버지)는 안심시키는 문장을 함께 둔다", () => {
    expect(getSymbolBySlug("deceased-family")!.body).toMatch(/뜻이나 경고로 받아들이기보다/);
    expect(getSymbolBySlug("deceased-family")!.body).toMatch(/상담 전문가/);
    expect(getSymbolBySlug("funeral")!.body).toMatch(/실제 누군가의 죽음을 알리는 것은 아니에요/);
    expect(getSymbolBySlug("hospital")!.meaning).toMatch(/실제 건강 상태를 알려 주는 꿈이 아니라/);
    expect(getSymbolBySlug("hospital")!.body).toMatch(/실제로 무슨 일이 생긴다는 뜻은 아니에요/);
    expect(getSymbolBySlug("grandparents")!.body).toMatch(/건강을 점치는 꿈이 아니라/);
  });

  it("다른 뜻으로 흔히 쓰는 한 글자 이름(술, 쌀)은 strict 로 찾는다", () => {
    expect(getSymbolBySlug("alcohol")).toMatchObject({ keyword: "술", strict: true });
    expect(getSymbolBySlug("rice")).toMatchObject({ keyword: "쌀", strict: true });
  });

  it("새 행동(자르다, 갇히다)과 보강한 활용형이 있다", () => {
    expect(getActionBySlug("cut")?.verb).toBe("자르다");
    expect(getActionBySlug("trapped")?.verb).toBe("갇히다");
    expect(getActionBySlug("pick-up")?.synonyms).toContain("따는");
    expect(getActionBySlug("wash")?.synonyms).toContain("머리 감");
  });
});

describe("옮긴 표현 (3-B)", () => {
  it("조상의 '돌아가신'은 돌아가신 가족으로 옮겼고, 조상은 slug·숫자 후보와 '돌아가신 조상(님)'이 그대로다", () => {
    const ancestor = getSymbolBySlug("ancestor")!;
    expect(ancestor).toMatchObject({ keyword: "조상", numbers: [11, 17, 28, 34, 45] });
    expect(ancestor.synonyms).not.toContain("돌아가신");
    expect(ancestor.synonyms).toEqual(expect.arrayContaining(["돌아가신 조상", "돌아가신 조상님"]));
    expect(getSymbolBySlug("deceased-family")!.synonyms).toContain("돌아가신");
  });

  it("죽음의 '장례식'은 장례식으로 옮겼고, 죽음은 slug·숫자 후보와 '내 장례식'이 그대로다", () => {
    const death = getSymbolBySlug("death")!;
    expect(death).toMatchObject({ numbers: [5, 22, 33, 39] });
    expect(death.synonyms).not.toContain("장례식");
    expect(death.synonyms).toEqual(expect.arrayContaining(["내 장례식", "나의 장례식", "자신의 장례식"]));
    expect(getSymbolBySlug("funeral")!.synonyms).toContain("장례식");
  });
});

describe("민감 소재 (3차 후속 C)", () => {
  const SENSITIVE = ["death", "deceased-family", "funeral", "hospital", "ghost"];

  it("죽음·돌아가신 가족·장례식·병원·귀신에 sensitive 표시가 있다", () => {
    expect(getAllSymbols().filter((s) => s.sensitive).map((s) => s.slug).sort()).toEqual([...SENSITIVE].sort());
  });

  it("인기 꿈 키워드에는 민감 소재가 나오지 않는다 (가중치 3인 돌아가신 가족도 빠진다)", () => {
    const popular = getPopularSymbols().map((s) => s.slug);
    expect(popular.filter((slug) => SENSITIVE.includes(slug))).toEqual([]);
    expect(popular).toEqual(expect.arrayContaining(["pig", "ancestor", "teeth"]));
  });

  it("홈 예시 꿈은 민감 소재로 잡히지 않는다", () => {
    for (const { text } of EXAMPLE_DREAMS) {
      expect(matchSymbols(text, getAllSymbols()).filter((s) => s.sensitive).map((s) => s.slug), text).toEqual([]);
    }
  });

  it("sensitive 는 true/false 로만 쓴다", () => {
    const ghost = getSymbolBySlug("ghost")!;
    expect(validateSymbols([{ ...ghost, sensitive: "yes" as unknown as boolean }]).join()).toMatch(/sensitive/);
  });
});
