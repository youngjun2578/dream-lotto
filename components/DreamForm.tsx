"use client";

// 홈 화면의 꿈 입력창 + 결과 영역 (브라우저에서 동작)

import { useState } from "react";
import { MAX_DREAM_LENGTH } from "@/lib/normalize";
import type { InterpretResponse } from "@/lib/types";
import { ResultView } from "./ResultView";

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
      <form onSubmit={onSubmit} className="rounded-3xl border border-line bg-surface p-5 shadow-sm sm:p-6">
        <label htmlFor="dream" className="mb-2 block text-lg font-bold">
          어젯밤 어떤 꿈을 꾸셨나요?
        </label>
        <textarea
          id="dream"
          value={text}
          onChange={(e) => setText(e.target.value)}
          maxLength={MAX_DREAM_LENGTH}
          rows={5}
          placeholder="예) 돼지가 집으로 들어오고, 마당에 불이 활활 타는 꿈을 꿨어요."
          className="w-full resize-y rounded-2xl border border-line bg-page p-4 leading-7 text-ink placeholder:text-ink-faint focus:border-link focus:outline-none"
        />
        <div className="mt-3 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
          <span className="text-sm text-ink-faint" aria-live="polite">
            {text.length}/{MAX_DREAM_LENGTH}
          </span>
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-2xl bg-btn px-6 py-3 font-bold text-btn-ink hover:bg-btn-hover disabled:opacity-60 sm:w-auto"
          >
            {loading ? "풀이 중…" : "해몽하고 번호 뽑기"}
          </button>
        </div>
        {error && (
          <p role="alert" className="mt-3 text-sm font-semibold text-[var(--f-warn-fg)]">
            {error}
          </p>
        )}
      </form>

      {result && (
        <section aria-live="polite" aria-label="해몽 결과" className="mt-10">
          <ResultView
            result={result}
            numberActions={
              <button
                type="button"
                onClick={() => request(submitted, result.counter + 1)}
                disabled={loading}
                className="rounded-xl border border-line bg-surface px-4 py-2 text-sm font-bold text-link hover:border-link disabled:opacity-60"
              >
                다시 뽑기
              </button>
            }
          />
        </section>
      )}
    </div>
  );
}
