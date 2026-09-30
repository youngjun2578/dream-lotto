// POST /api/interpret
// 요청: { "dream": "꿈 내용", "counter": 0 }   (counter 는 다시 뽑기 횟수, 생략 가능)
// 응답: { summary, symbols[], games[], date, counter }  /  오류 시 { error } + 400/500

import { NextResponse } from "next/server";
import { InputError } from "@/lib/normalize";
import { interpretDream } from "@/lib/service";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "요청 형식이 올바르지 않아요." }, { status: 400 });
  }

  const { dream, counter } = (body && typeof body === "object" ? body : {}) as {
    dream?: unknown;
    counter?: unknown;
  };

  try {
    const result = await interpretDream(dream, { counter });
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof InputError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error("[api/interpret]", error);
    return NextResponse.json({ error: "해몽 중 문제가 생겼어요. 잠시 후 다시 시도해 주세요." }, { status: 500 });
  }
}
