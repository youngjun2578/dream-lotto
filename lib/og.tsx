// 공유 미리보기 이미지(OG, 1200×630) 공통 틀. next/og 의 ImageResponse 로 PNG 를 만든다.
// 한글 글꼴은 assets/fonts 의 Pretendard(SIL OFL 1.1) 서브셋 woff 를 쓴다. (woff2 는 지원 안 됨)

import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { ballColor } from "./ballColors";
import { SITE_NAME } from "./site";

export const OG_SIZE = { width: 1200, height: 630 };
export const OG_CONTENT_TYPE = "image/png";

type OgFont = { name: string; data: Buffer; weight: 400 | 700; style: "normal" };
let fontsPromise: Promise<OgFont[]> | undefined;

/** 글꼴은 한 번만 읽어서 재사용한다. */
function loadFonts(): Promise<OgFont[]> {
  fontsPromise ??= Promise.all([
    readFile(join(process.cwd(), "assets/fonts/Pretendard-Regular.subset.woff")),
    readFile(join(process.cwd(), "assets/fonts/Pretendard-Bold.subset.woff")),
  ]).then(([regular, bold]) => [
    { name: "Pretendard", data: regular, weight: 400, style: "normal" },
    { name: "Pretendard", data: bold, weight: 700, style: "normal" },
  ]);
  return fontsPromise;
}

export interface OgContent {
  /** 제목 위 작은 글씨 (예: "꿈해몽 사전 · 동물") */
  eyebrow: string;
  title: string;
  description?: string;
  /** 보여줄 로또 번호 (없으면 생략) */
  numbers?: number[];
  /** 번호 위 설명 (예: "행운 숫자 후보") */
  numbersLabel?: string;
  /** 제목·설명을 이 글자 수에서 줄인다 (긴 글이 이미지 밖으로 넘치지 않게) */
  titleMax?: number;
  descriptionMax?: number;
}

// 밤하늘 별 위치 (고정값이라 매번 같은 그림). 글자와 겹치면 가운뎃점처럼 보이므로 가장자리에만 둔다.
const STARS: [number, number, number][] = [
  [40, 24, 2], [300, 30, 2], [560, 22, 3], [760, 36, 2], [1030, 30, 2], [1170, 120, 3], [1110, 250, 2],
  [1175, 330, 2], [1050, 390, 3], [860, 420, 2], [1140, 470, 3], [760, 480, 2], [980, 500, 2],
  [220, 604, 2], [520, 608, 3], [860, 610, 2],
];

function clamp(text: string, max: number): string {
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

/** 공통 OG 이미지 만들기 */
export async function renderOgImage({
  eyebrow,
  title,
  description,
  numbers,
  numbersLabel,
  titleMax = 40,
  descriptionMax = 90,
}: OgContent) {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          position: "relative",
          padding: "64px 72px",
          backgroundColor: "#0b1026",
          backgroundImage: "linear-gradient(160deg, #0b1026 0%, #151c46 60%, #22285c 100%)",
          color: "#eef0fb",
          fontFamily: "Pretendard",
        }}
      >
        {STARS.map(([x, y, r], i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              left: x,
              top: y,
              width: r * 2,
              height: r * 2,
              borderRadius: r,
              backgroundColor: "#fff6d8",
              opacity: 0.75,
            }}
          />
        ))}
        {/* 초승달: 노란 원 위에 배경색 원을 겹쳐 만든다 */}
        <div style={{ position: "absolute", right: 90, top: 70, width: 150, height: 150, borderRadius: 75, backgroundColor: "#f6d77a" }} />
        <div style={{ position: "absolute", right: 60, top: 50, width: 150, height: 150, borderRadius: 75, backgroundColor: "#141a42" }} />

        <div style={{ display: "flex", fontSize: 30, fontWeight: 400, color: "#f6d77a" }}>{eyebrow}</div>
        <div
          style={{
            display: "flex",
            marginTop: 18,
            fontSize: title.length > 12 ? 60 : 76, // 긴 제목은 조금 작게 (초승달과 겹치지 않도록)
            fontWeight: 700,
            lineHeight: 1.2,
            maxWidth: 880,
            wordBreak: "keep-all",
          }}
        >
          {clamp(title, titleMax)}
        </div>
        {description && (
          <div style={{ display: "flex", marginTop: 22, fontSize: 32, lineHeight: 1.5, color: "#c7cdef", maxWidth: 1000, wordBreak: "keep-all" }}>
            {clamp(description, descriptionMax)}
          </div>
        )}

        <div style={{ display: "flex", flexGrow: 1 }} />

        {numbers && numbers.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", marginBottom: 28 }}>
            {numbersLabel && <div style={{ display: "flex", fontSize: 24, color: "#aab2e0", marginBottom: 12 }}>{numbersLabel}</div>}
            <div style={{ display: "flex" }}>
              {numbers.map((n) => {
                const c = ballColor(n);
                return (
                  <div
                    key={n}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      width: 76,
                      height: 76,
                      marginRight: 16,
                      borderRadius: 38,
                      backgroundColor: c.bg,
                      color: c.fg,
                      fontSize: 34,
                      fontWeight: 700,
                    }}
                  >
                    {n}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 24, color: "#aab2e0" }}>
          <div style={{ display: "flex", fontWeight: 700, color: "#eef0fb" }}>{SITE_NAME}</div>
          <div style={{ display: "flex" }}>재미로 보는 꿈해몽 · 당첨과 무관해요</div>
        </div>
      </div>
    ),
    { ...OG_SIZE, fonts: await loadFonts() },
  );
}
