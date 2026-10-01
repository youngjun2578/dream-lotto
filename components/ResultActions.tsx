"use client";

// 본인 결과 페이지(/result/…)의 버튼: 다시 뽑기 · 링크 복사 · 공유 · 다른 꿈 해몽하기
// - 다시 뽑기: 다시 뽑기 횟수만 올린 새 결과 주소로 바꾼다. router.replace 라서 방문 기록이 쌓이지 않고,
//   뒤로 가기 한 번이면 입력창으로 돌아간다. (새로고침·북마크는 지금 보고 있는 번호를 그대로 보여 준다)
// - 링크 복사·공유: 지금 연 주소와 상관없이 항상 대표 도메인의 공유 주소(/r/…)를 쓴다. 꿈 원문은 들어 있지 않다.

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { absoluteUrl } from "@/lib/site";
import { sharedPath } from "@/lib/share";
import { saveDraft } from "./dreamDraft";
import { keepNumbersInView } from "./ScrollToTop";

const PRIMARY = "rounded-xl bg-btn px-4 py-2.5 text-sm font-bold text-btn-ink hover:bg-btn-hover disabled:opacity-60";
const SECONDARY =
  "rounded-xl border border-line bg-surface px-4 py-2.5 text-sm font-bold text-link hover:border-link disabled:opacity-60";

function copyWithTextarea(text: string): boolean {
  const el = document.createElement("textarea");
  el.value = text;
  el.setAttribute("readonly", "");
  el.style.position = "fixed";
  el.style.opacity = "0";
  document.body.appendChild(el);
  el.select();
  let ok = false;
  try {
    ok = document.execCommand("copy");
  } catch {
    ok = false;
  }
  document.body.removeChild(el);
  return ok;
}

export function ResultActions({ share, nextPath }: { share: string; nextPath: string | null }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [status, setStatus] = useState("");
  const shareUrl = absoluteUrl(sharedPath(share));

  function redraw() {
    if (!nextPath || pending) return;
    setStatus("");
    keepNumbersInView();
    startTransition(() => router.replace(nextPath, { scroll: false }));
  }

  async function copyLink(done = "링크를 복사했어요. 원하는 곳에 붙여넣어 보내 보세요.") {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setStatus(done);
    } catch {
      setStatus(copyWithTextarea(shareUrl) ? done : `복사하지 못했어요. 이 주소를 직접 복사해 주세요: ${shareUrl}`);
    }
  }

  async function nativeShare() {
    if (typeof navigator.share !== "function") {
      // 공유 창이 없는 브라우저(일부 PC)는 링크 복사로 대신한다.
      await copyLink("이 브라우저는 공유 창을 지원하지 않아서 링크를 복사했어요.");
      return;
    }
    try {
      await navigator.share({
        title: "꿈해몽 결과",
        text: "내 꿈해몽 결과와 행운 번호를 확인해 보세요. (재미로 보는 결과예요)",
        url: shareUrl,
      });
    } catch (error) {
      // 사용자가 공유창을 닫은 경우(AbortError)는 조용히 넘어간다.
      if ((error as DOMException)?.name !== "AbortError") setStatus("공유하지 못했어요. 링크 복사를 이용해 주세요.");
    }
  }

  return (
    <section aria-labelledby="result-actions-heading" className="rounded-2xl border border-line bg-surface p-5">
      <h2 id="result-actions-heading" className="font-bold">
        번호 다시 뽑기와 결과 공유
      </h2>
      <p className="mt-0.5 text-xs text-ink-faint">꿈 내용은 링크에 들어가지 않고, 해몽과 번호만 공유돼요.</p>
      <div className="mt-4 flex flex-wrap gap-2">
        {nextPath && (
          <button type="button" onClick={redraw} disabled={pending} aria-busy={pending} className={PRIMARY}>
            {pending ? "다시 뽑는 중…" : "다시 뽑기"}
          </button>
        )}
        <button type="button" onClick={() => copyLink()} className={SECONDARY}>
          링크 복사
        </button>
        <button type="button" onClick={nativeShare} className={SECONDARY}>
          공유
        </button>
        <Link href="/" onClick={() => saveDraft("")} className={SECONDARY}>
          다른 꿈 해몽하기
        </Link>
      </div>
      <p role="status" aria-live="polite" className="mt-2 break-all text-sm text-ink-soft empty:hidden">
        {status}
      </p>
    </section>
  );
}
