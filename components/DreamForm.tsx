"use client";

// 홈 화면의 꿈 입력창 + 결과 영역 (브라우저에서 동작)
// 입력 도우미: 예시 꿈 버튼, 글자 수, 입력 중 키워드 추천 칩, 인식된 상징 미리보기, 상징 0개일 때 안내

import { useMemo, useRef, useState } from "react";
import { matchSymbols, type MatchableSymbol } from "@/lib/matcher";
import { MAX_DREAM_LENGTH } from "@/lib/normalize";
import { appendTerm, applySuggestion, suggestTerms, type VocabEntry } from "@/lib/suggest";
import type { InterpretResponse } from "@/lib/types";
import { ResultView } from "./ResultView";
import { ShareButtons } from "./ShareButtons";

/** 예시 꿈 (버튼 이름 → 입력창에 채울 문장) */
export const EXAMPLE_DREAMS = [
  { label: "돼지가 들어온 꿈", text: "커다란 돼지가 집 안으로 들어와서 제 품에 안겼어요." },
  { label: "할머니가 돈을 주신 꿈", text: "돌아가신 할머니가 환하게 웃으면서 돈을 주셨어요." },
  { label: "하늘을 날다 떨어진 꿈", text: "하늘을 날다가 갑자기 떨어져서 깜짝 놀라 깼어요." },
  { label: "뱀에게 물린 꿈", text: "구렁이가 몸을 칭칭 감더니 팔을 물었어요." },
  { label: "이가 빠진 꿈", text: "이가 흔들리다가 우수수 빠져서 너무 놀랐어요." },
];

const CHIP =
  "rounded-full border border-line bg-page px-3 py-1.5 text-sm text-ink-soft hover:border-link hover:text-link";

export function DreamForm({
  dictionary,
  vocabulary,
  hintKeywords,
}: {
  /** 인식된 상징 미리보기에 쓰는 사전 (이름·동의어·가중치만) */
  dictionary: MatchableSymbol[];
  /** 추천 칩에 쓰는 단어 목록 */
  vocabulary: VocabEntry[];
  /** 상징을 못 찾았을 때 보여 줄 단어 */
  hintKeywords: string[];
}) {
  const [text, setText] = useState("");
  const [submitted, setSubmitted] = useState(""); // 결과를 만든 꿈 (다시 뽑기에 사용)
  const [result, setResult] = useState<InterpretResponse | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const recognized = useMemo(() => matchSymbols(text, dictionary).map((s) => s.keyword), [text, dictionary]);
  const suggestions = useMemo(() => suggestTerms(text, vocabulary), [text, vocabulary]);
  const showExamples = text.trim() === "" || EXAMPLE_DREAMS.some((e) => e.text === text);
  const nearLimit = text.length >= MAX_DREAM_LENGTH - 50;

  /** 입력창 내용을 바꾸고 커서를 끝으로 보낸다. */
  function fill(next: string) {
    const value = next.slice(0, MAX_DREAM_LENGTH);
    setText(value);
    setError("");
    requestAnimationFrame(() => {
      const el = textareaRef.current;
      if (!el) return;
      el.focus();
      el.setSelectionRange(value.length, value.length);
    });
  }

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
          ref={textareaRef}
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            if (error) setError("");
          }}
          maxLength={MAX_DREAM_LENGTH}
          rows={5}
          aria-describedby="dream-count dream-recognized"
          placeholder="예) 돼지가 집으로 들어오고, 마당에 불이 활활 타는 꿈을 꿨어요."
          className="w-full resize-y rounded-2xl border border-line bg-page p-4 leading-7 text-ink placeholder:text-ink-faint focus:border-link focus:outline-none"
        />

        <div className="mt-2 flex items-start justify-between gap-3 text-sm">
          <p id="dream-recognized" aria-live="polite" className="text-ink-soft">
            {recognized.length > 0 ? (
              <>
                인식된 꿈 상징: <strong className="text-ink">{recognized.join(" · ")}</strong>
              </>
            ) : text.trim() ? (
              <span className="text-ink-faint">아직 사전에 있는 상징이 보이지 않아요</span>
            ) : null}
          </p>
          <span
            id="dream-count"
            className={`shrink-0 tabular-nums ${nearLimit ? "font-bold text-[var(--f-warn-fg)]" : "text-ink-faint"}`}
          >
            {text.length}/{MAX_DREAM_LENGTH}
          </span>
        </div>

        {suggestions.length > 0 && (
          <div className="mt-3" role="group" aria-label="추천 키워드">
            <p className="mb-1.5 text-xs font-semibold text-ink-faint">이 단어를 찾으세요?</p>
            <ul className="flex flex-wrap gap-2">
              {suggestions.map((s) => (
                <li key={s.term}>
                  <button type="button" onClick={() => fill(applySuggestion(text, s.term))} className={CHIP}>
                    {s.term}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {showExamples && (
          <div className="mt-3" role="group" aria-label="예시 꿈">
            <p className="mb-1.5 text-xs font-semibold text-ink-faint">예시로 채워 보기</p>
            <ul className="flex flex-wrap gap-2">
              {EXAMPLE_DREAMS.map((example) => (
                <li key={example.label}>
                  <button
                    type="button"
                    onClick={() => fill(example.text)}
                    aria-pressed={text === example.text}
                    className={`${CHIP} aria-pressed:border-link aria-pressed:text-link`}
                  >
                    {example.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="mt-5 w-full rounded-2xl bg-btn px-6 py-3.5 text-lg font-bold text-btn-ink hover:bg-btn-hover disabled:opacity-60"
        >
          {loading ? "풀이 중…" : "해몽하고 번호 뽑기"}
        </button>
        {error && (
          <p role="alert" className="mt-3 text-sm font-semibold text-[var(--f-warn-fg)]">
            {error}
          </p>
        )}
      </form>

      {result && result.symbols.length === 0 && (
        <div role="note" className="mt-6 rounded-2xl border border-line bg-surface-2 p-5">
          <p className="font-bold">꿈속 상징을 찾지 못했어요. 이런 단어를 넣어 보세요</p>
          <p className="mt-1 text-sm text-ink-soft">
            꿈에 나온 동물·사람·물건이나 한 일을 적으면 더 자세히 풀이해요. 단어를 누르면 입력창에 더해져요.
          </p>
          <ul className="mt-3 flex flex-wrap gap-2">
            {hintKeywords.map((word) => (
              <li key={word}>
                <button type="button" onClick={() => fill(appendTerm(text, word))} className={CHIP}>
                  + {word}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {result && (
        <section aria-live="polite" aria-label="해몽 결과" className="mt-10">
          <ResultView
            // 다시 뽑기마다 새로 그려서 공 애니메이션이 처음부터 다시 나오게 한다.
            key={`${result.date}-${result.counter}`}
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
            afterNumbers={<ShareButtons share={result.share} />}
          />
        </section>
      )}
    </div>
  );
}
