"use client";

// 홈 화면의 꿈 입력창 + 결과 영역 (브라우저에서 동작)

import Link from "next/link";
import { useState } from "react";
import { MAX_DREAM_LENGTH } from "@/lib/normalize";
import { FILL_REASON, type InterpretResponse } from "@/lib/types";
import { AdSlot } from "./AdSlot";
import { Disclaimer } from "./Disclaimer";
import { FortuneBadge } from "./FortuneBadge";
import { LottoBall } from "./LottoBall";

const GAME_LABELS = ["A", "B", "C", "D", "E"];

export function DreamForm() {
  const [text, setText] = useState("");
  const [submitted, setSubmitted] = useState(""); // 결과를 만든 꿈 (다시 뽑기에 사용)
  const [result, setResult] = useState<InterpretResponse | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function request(dream: string, counter: number) {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/interpret", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dream, counter }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "문제가 생겼어요. 다시 시도해 주세요.");
        return;
      }
      setResult(data as InterpretResponse);
      setSubmitted(dream);
    } catch {
      setError("서버에 연결하지 못했어요. 잠시 후 다시 시도해 주세요.");
    } finally {
      setLoading(false);
    }
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) {
      setError("꿈 내용을 입력해 주세요.");
      return;
    }
    request(text, 0);
  }

  return (
    <div>
      <form onSubmit={onSubmit} className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
        <label htmlFor="dream" className="mb-2 block font-semibold">
          어젯밤 어떤 꿈을 꾸셨나요?
        </label>
        <textarea
          id="dream"
          value={text}
          onChange={(e) => setText(e.target.value)}
          maxLength={MAX_DREAM_LENGTH}
          rows={5}
          placeholder="예) 돼지가 집으로 들어오고, 마당에 불이 활활 타는 꿈을 꿨어요."
          className="w-full resize-y rounded-lg border border-slate-300 p-3 leading-7 outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-200"
        />
        <div className="mt-3 flex items-center justify-between gap-3">
          <span className="text-sm text-slate-400">
            {text.length} / {MAX_DREAM_LENGTH}자
          </span>
          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-violet-600 px-5 py-2.5 font-semibold text-white hover:bg-violet-700 disabled:opacity-50"
          >
            {loading ? "풀이 중…" : "해몽하고 번호 뽑기"}
          </button>
        </div>
        {error && (
          <p role="alert" className="mt-3 text-sm text-red-600">
            {error}
          </p>
        )}
      </form>

      {result && (
        <section aria-live="polite" className="mt-10 space-y-8">
          <div>
            <h2 className="mb-3 text-xl font-bold">🔮 꿈해몽</h2>
            <p className="rounded-xl bg-violet-50 p-4 leading-7 text-slate-800">{result.summary}</p>
          </div>

          {result.symbols.length > 0 && (
            <div>
              <h3 className="mb-3 font-bold">꿈속 상징 풀이</h3>
              <ul className="space-y-3">
                {result.symbols.map((s) => (
                  <li key={s.slug} className="rounded-xl bg-white p-4 ring-1 ring-slate-200">
                    <div className="mb-1 flex items-center gap-2">
                      <strong>{s.keyword}</strong>
                      <FortuneBadge type={s.fortune_type} />
                    </div>
                    <p className="text-sm leading-6 text-slate-600">{s.meaning}</p>
                    <Link href={`/dream/${s.slug}`} className="mt-1 inline-block text-sm text-violet-700 hover:underline">
                      {s.keyword} 꿈 자세히 보기 →
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div>
            <div className="mb-3 flex items-end justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold">🍀 추천 번호</h2>
                <p className="text-xs text-slate-400">
                  {result.date} 기준{result.counter > 0 ? ` · 다시 뽑기 ${result.counter}회` : ""}
                </p>
              </div>
              <button
                type="button"
                onClick={() => request(submitted, result.counter + 1)}
                disabled={loading}
                className="rounded-lg border border-violet-300 px-4 py-2 text-sm font-semibold text-violet-700 hover:bg-violet-50 disabled:opacity-50"
              >
                다시 뽑기
              </button>
            </div>
            <ol className="space-y-3">
              {result.games.map((game, i) => {
                const dreamPicks = game.numbers
                  .map((n, j) => ({ n, reason: game.reasons[j] }))
                  .filter((p) => p.reason !== FILL_REASON);
                return (
                  <li key={i} className="rounded-xl bg-white p-4 ring-1 ring-slate-200">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <span className="w-5 text-sm font-bold text-slate-400">{GAME_LABELS[i]}</span>
                      <div className="flex flex-wrap gap-1.5 sm:gap-2">
                        {game.numbers.map((n, j) => (
                          <LottoBall key={n} n={n} small highlight={game.reasons[j] !== FILL_REASON} />
                        ))}
                      </div>
                    </div>
                    <p className="mt-2 pl-7 text-xs leading-5 text-slate-500">
                      {dreamPicks.length > 0
                        ? dreamPicks.map((p) => `${p.n}: ${p.reason}`).join(" · ") + ` · 나머지: ${FILL_REASON}`
                        : `모든 번호: ${FILL_REASON}`}
                    </p>
                  </li>
                );
              })}
            </ol>
            <p className="mt-2 text-xs text-slate-400">테두리가 있는 공이 꿈 상징에서 나온 번호예요.</p>
          </div>

          <AdSlot name="result-bottom" />
          <Disclaimer />
        </section>
      )}
    </div>
  );
}
