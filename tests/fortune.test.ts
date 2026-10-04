// 운세 유형과 라벨 (사전 후속 E-1)
// - 민감한 소재(죽음·장례식·돌아가신 가족·병원·귀신·조상)에는 건강·재물 라벨 대신 중립 유형 '변화'·'마음'을 쓴다.
// - 운세 유형은 배지·번호 이유 태그·요약 둘째 문장·'같은 ○○ 꿈' 목록에만 쓰고, 번호 계산에는 쓰지 않는다.
// 사전 페이지·카테고리·공유 페이지에서 실제로 보이는 모습은 e2e/flow.spec.ts 에서 확인한다.

import { readFileSync } from "node:fs";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { FortuneBadge } from "@/components/FortuneBadge";
import { GameList } from "@/components/GameList";
import { FORTUNE_PHRASE } from "@/lib/interpret/ruleBased";
import { buildSharedResult, interpretDream } from "@/lib/service";
import { getSymbolBySlug } from "@/lib/symbols";
import { FORTUNE_LABEL, FORTUNE_TYPES } from "@/lib/types";

const CSS = readFileSync("app/globals.css", "utf8");
const NOW = new Date("2026-10-03T03:00:00Z");

/** [slug, 바꾸기 전 유형, 지금 유형, 숫자 후보(바뀌면 안 된다)] */
const CHANGED = [
  ["death", "건강", "변화", [5, 22, 33, 39]],
  ["funeral", "재물", "변화", [4, 21, 32, 38]],
  ["deceased-family", "재물", "마음", [6, 17, 23, 34, 40]],
  ["hospital", "건강", "마음", [17, 34, 45]],
  ["ghost", "주의", "마음", [2, 13, 30]],
  ["ancestor", "재물", "마음", [11, 17, 28, 34, 45]],
] as const;

/** 유형을 바꾸기 전(2026-10-03)에 만든 공유 링크 값과 그때 나온 5게임 번호 */
const SHARED: [string, number[][], string[]][] = [
  [
    "WzEsMTQxMjc5NjkyMSwiMjAyNi0xMC0wMyIsMCxbImRlYXRoIl0sWyJmdW5lcmFsIl0sWyJkZWNlYXNlZC1mYW1pbHkiLCJyZWNlaXZlIl0sWyJob3NwaXRhbCJdXQ",
    [
      [9, 10, 13, 22, 33, 40],
      [19, 23, 34, 35, 38, 39],
      [17, 22, 23, 26, 28, 33],
      [3, 8, 21, 22, 34, 39],
      [4, 10, 27, 30, 41, 45],
    ],
    ["죽는 꿈 → 변화", "장례식 꿈 → 변화", "돌아가신 가족 꿈 → 마음", "병원 꿈 → 마음"],
  ],
  [
    "WzEsMzczNTkyODU1OSwiMjAyNi0xMC0wMyIsMixbImFuY2VzdG9yIiwibGF1Z2giXSxbImdob3N0Il1d",
    [
      [13, 17, 35, 38, 42, 45],
      [9, 11, 17, 37, 44, 45],
      [11, 23, 24, 28, 42, 45],
      [11, 13, 15, 17, 28, 33],
      [2, 3, 4, 7, 28, 33],
    ],
    ["조상 꿈 → 마음", "귀신 꿈 → 마음"],
  ],
];

describe("운세 유형과 라벨 (사전 후속 E-1)", () => {
  it("새 유형 '변화'(변화운)·'마음'(마음 풀이)이 있고, 모든 유형이 이름·요약 문구·배지 색을 가진다", () => {
    expect(FORTUNE_TYPES).toEqual(expect.arrayContaining(["변화", "마음"]));
    expect(FORTUNE_LABEL.변화).toBe("변화운");
    expect(FORTUNE_LABEL.마음).toBe("마음 풀이");
    for (const type of FORTUNE_TYPES) {
      expect(FORTUNE_PHRASE[type], type).toMatch(/꿈$/);
      const html = renderToStaticMarkup(createElement(FortuneBadge, { type }));
      expect(html, type).toContain(`>${FORTUNE_LABEL[type]}</span>`);
      const token = html.match(/var\(--(f-[a-z]+)-bg\)/)?.[1];
      // 다크(:root)와 라이트 테마 모두에 색 토큰이 있다 (명도 대비는 tests/theme.test.ts)
      for (const part of ["bg", "fg"]) expect(CSS.split(`--${token}-${part}:`).length - 1, `${type} --${token}-${part}`).toBe(2);
    }
  });

  it("번호 옆 이유 태그도 새 유형의 색과 이름으로 보인다", () => {
    const reasons = ["죽는 꿈 → 변화", "돌아가신 가족 꿈 → 마음", "행운 보충", "행운 보충", "행운 보충", "행운 보충"];
    const html = renderToStaticMarkup(createElement(GameList, { games: [{ numbers: [5, 6, 11, 17, 22, 40], reasons }] }));
    expect(html).toContain("죽는 꿈 → 변화");
    expect(html).toContain("돌아가신 가족 → 마음");
    expect(html).toContain("var(--f-change-bg)");
    expect(html).toContain("var(--f-mind-bg)");
  });

  it("죽음·장례식은 변화, 돌아가신 가족·병원·귀신·조상은 마음이고 숫자 후보는 그대로다", () => {
    for (const [slug, , type, numbers] of CHANGED) {
      const s = getSymbolBySlug(slug)!;
      expect(s.fortune_type, slug).toBe(type);
      expect(s.numbers, slug).toEqual(numbers);
    }
  });

  it("바꾼 상징만 나온 꿈의 요약 둘째 문장은 새 유형 문구이고, 건강·재물 문구가 아니다", async () => {
    const dreams: [string, string][] = [
      ["내가 죽는 꿈을 꿨어요", "death"],
      ["장례식에 가는 꿈을 꿨어요", "funeral"],
      ["돌아가신 할머니가 꿈에 나왔어요", "deceased-family"],
      ["병원에 입원하는 꿈을 꿨어요", "hospital"],
      ["귀신을 보는 꿈을 꿨어요", "ghost"],
      ["조상님이 꿈에 나왔어요", "ancestor"],
    ];
    for (const [dream, slug] of dreams) {
      const result = await interpretDream(dream, { now: NOW });
      expect(result.symbols.map((s) => s.slug), dream).toEqual([slug]);
      const second = result.summary.slice(result.summary.indexOf("전체적으로"));
      expect(second, dream).toBe(`전체적으로 ${FORTUNE_PHRASE[getSymbolBySlug(slug)!.fortune_type]}으로 볼 수 있어요.`);
      expect(second, dream).not.toMatch(/재물|건강|몸과 마음의 기운|조심할/);
    }
  });

  it("유형을 바꾸기 전에 만든 공유 링크도 같은 번호로 열리고, 이유 태그만 새 유형으로 바뀐다", async () => {
    for (const [payload, games, reasons] of SHARED) {
      const result = await buildSharedResult(payload);
      expect(result, payload).not.toBeNull();
      expect(result!.games.map((g) => g.numbers)).toEqual(games);
      const all = new Set(result!.games.flatMap((g) => g.reasons));
      for (const reason of reasons) expect(all.has(reason), reason).toBe(true);
      expect([...all].some((r) => /→ (건강|재물|주의)$/.test(r))).toBe(false);
    }
  });
});
