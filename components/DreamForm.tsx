"use client";

// 홈 화면의 꿈 입력창 (브라우저에서 동작)
// 입력 도우미: 예시 꿈 버튼, 글자 수, 입력 중 키워드 추천 칩, 인식된 상징 미리보기
// 해몽하기를 누르면 버튼을 잠그고 '해몽 중이에요'를 보여 준 뒤, 성공하면 결과 페이지(/result/…)로 이동한다.
// 실패하면 입력창 아래에 안내를 띄우고 입력 내용은 그대로 둔다. 결과 화면은 components/ResultPage.tsx.

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { matchSymbols, type MatchableSymbol } from "@/lib/matcher";
import { MAX_DREAM_LENGTH } from "@/lib/normalize";
import { resultPath } from "@/lib/share";
import { applySuggestion, suggestTerms, type VocabEntry } from "@/lib/suggest";
import type { InterpretResponse } from "@/lib/types";
import { loadDraft, saveDraft } from "./dreamDraft";

/** 예시 꿈 (버튼 이름 → 입력창에 채울 문장). 민감 소재(죽음·돌아가신 가족·장례식·병원·귀신)는 넣지 않는다. */
export const EXAMPLE_DREAMS = [
  { label: "돼지가 들어온 꿈", text: "커다란 돼지가 집 안으로 들어와서 제 품에 안겼어요." },
  { label: "할머니가 용돈을 주신 꿈", text: "할머니가 용돈을 주시면서 환하게 웃으셨어요." },
  { label: "하늘을 날다 떨어진 꿈", text: "하늘을 날다가 갑자기 떨어져서 깜짝 놀라 깼어요." },
  { label: "뱀에게 물린 꿈", text: "구렁이가 몸을 칭칭 감더니 팔을 물었어요." },
  { label: "이가 빠진 꿈", text: "이가 흔들리다가 우수수 빠져서 너무 놀랐어요." },
];

const CHIP =
  "rounded-full border border-line bg-page px-3 py-1.5 text-sm text-ink-soft hover:border-link hover:text-link";

export function DreamForm({
  dictionary,
  vocabulary,
}: {
  /** 인식된 상징 미리보기에 쓰는 사전 (이름·동의어·가중치만) */
  dictionary: MatchableSymbol[];
  /** 추천 칩에 쓰는 단어 목록 */
  vocabulary: VocabEntry[];
}) {
  const router = useRouter();
  const [text, setText] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  // 두 번 빨리 눌러도 요청이 한 번만 가도록 (상태 변경이 화면에 반영되기 전의 클릭까지 막는다)
  const submitting = useRef(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // 결과 페이지에서 돌아오면 입력하던 꿈을 다시 채운다. (이 탭의 임시 저장소에만 있다)
  useEffect(() => {
    const draft = loadDraft();
    if (draft) setText(draft.slice(0, MAX_DREAM_LENGTH));
  }, []);

  function update(value: string) {
    setText(value);
    saveDraft(value);
  }

  const recognized = useMemo(() => matchSymbols(text, dictionary).map((s) => s.keyword), [text, dictionary]);
  const suggestions = useMemo(() => suggestTerms(text, vocabulary), [text, vocabulary]);
  const showExamples = text.trim() === "" || EXAMPLE_DREAMS.some((e) => e.text === text);
  const nearLimit = text.length >= MAX_DREAM_LENGTH - 50;

  /** 입력창 내용을 바꾸고 커서를 끝으로 보낸다. */
  function fill(next: string) {
    const value = next.slice(0, MAX_DREAM_LENGTH);
    update(value);
    setError("");
    requestAnimationFrame(() => {
      const el = textareaRef.current;
      if (!el) return;
      el.focus();
      el.setSelectionRange(value.length, value.length);
    });
  }

  /** 실패하면 안내를 띄우고 다시 누를 수 있게 한다. (입력 내용은 그대로) */
  function fail(message: string) {
    setError(message);
    setLoading(false);
    submitting.current = false;
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting.current) return;
    if (!text.trim()) {
      setError("꿈 내용을 입력해 주세요.");
      return;
    }
    submitting.current = true;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/interpret", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dream: text, counter: 0 }),
      });
      const data = (await res.json().catch(() => ({}))) as Partial<InterpretResponse> & { error?: string };
      if (!res.ok || typeof data.share !== "string") {
        fail(data.error ?? "문제가 생겼어요. 다시 시도해 주세요.");
        return;
      }
      saveDraft(text);
      // 결과 페이지로 이동하는 동안에도 버튼은 잠가 둔다. (이 화면이 사라지면서 상태도 함께 사라진다)
      router.push(resultPath(data.share));
    } catch {
      fail("서버에 연결하지 못했어요. 잠시 후 다시 시도해 주세요.");
    }
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
            update(e.target.value);
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
          aria-busy={loading}
          className="mt-5 w-full rounded-2xl bg-btn px-6 py-3.5 text-lg font-bold text-btn-ink hover:bg-btn-hover disabled:opacity-60"
        >
          {loading ? "해몽 중이에요…" : "해몽하고 번호 뽑기"}
        </button>
        {error && (
          <p role="alert" className="mt-3 text-sm font-semibold text-[var(--f-warn-fg)]">
            {error}
          </p>
        )}
      </form>
    </div>
  );
}
