"use client";

// 상징을 못 찾은 결과에서 보여 주는 단어 칩: 누르면 입력하던 꿈 끝에 그 단어를 더해 입력창으로 돌아간다.
// (입력하던 꿈은 이 탭의 임시 저장소에만 있다. components/dreamDraft.ts)

import { useRouter } from "next/navigation";
import { appendTerm } from "@/lib/suggest";
import { loadDraft, saveDraft } from "./dreamDraft";

const CHIP =
  "rounded-full border border-line bg-page px-3 py-1.5 text-sm text-ink-soft hover:border-link hover:text-link";

export function HintWords({ words }: { words: string[] }) {
  const router = useRouter();

  function add(word: string) {
    saveDraft(appendTerm(loadDraft(), word));
    router.push("/");
  }

  return (
    <ul className="mt-3 flex flex-wrap gap-2">
      {words.map((word) => (
        <li key={word}>
          <button type="button" onClick={() => add(word)} className={CHIP}>
            + {word}
          </button>
        </li>
      ))}
    </ul>
  );
}
