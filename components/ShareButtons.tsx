"use client";

// 결과 공유: 링크 복사 + (지원하는 기기에서) 휴대폰 공유창(Web Share API)
// 링크에는 꿈 원문이 없고, 결과를 다시 만드는 데 필요한 값만 들어 있다. (lib/share.ts)

import { useEffect, useState } from "react";

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

export function ShareButtons({ share }: { share: string }) {
  const [status, setStatus] = useState("");
  const [canShare, setCanShare] = useState(false);
  // navigator.share 는 브라우저에서만 알 수 있어서, 화면에 붙은 뒤에 확인한다.
  useEffect(() => setCanShare(typeof navigator.share === "function"), []);

  const shareUrl = () => `${window.location.origin}/r/${share}`;

  async function copyLink() {
    const url = shareUrl();
    try {
      await navigator.clipboard.writeText(url);
      setStatus("링크를 복사했어요. 원하는 곳에 붙여넣어 보내 보세요.");
    } catch {
      setStatus(copyWithTextarea(url) ? "링크를 복사했어요." : `복사하지 못했어요. 이 주소를 직접 복사해 주세요: ${url}`);
    }
  }

  async function nativeShare() {
    try {
      await navigator.share({
        title: "꿈해몽 결과",
        text: "내 꿈해몽 결과와 행운 번호를 확인해 보세요. (재미로 보는 결과예요)",
        url: shareUrl(),
      });
    } catch (error) {
      // 사용자가 공유창을 닫은 경우(AbortError)는 조용히 넘어간다.
      if ((error as DOMException)?.name !== "AbortError") setStatus("공유하지 못했어요. 링크 복사를 이용해 주세요.");
    }
  }

  return (
    <div className="mt-5 rounded-2xl border border-line bg-surface p-4">
      <p className="text-sm font-semibold">결과 공유하기</p>
      <p className="mt-0.5 text-xs text-ink-faint">꿈 내용은 링크에 들어가지 않고, 해몽과 번호만 공유돼요.</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={copyLink}
          className="rounded-xl bg-btn px-4 py-2.5 text-sm font-bold text-btn-ink hover:bg-btn-hover"
        >
          링크 복사
        </button>
        {canShare && (
          <button
            type="button"
            onClick={nativeShare}
            className="rounded-xl border border-line bg-surface px-4 py-2.5 text-sm font-bold text-link hover:border-link"
          >
            공유하기
          </button>
        )}
      </div>
      <p role="status" aria-live="polite" className="mt-2 break-all text-sm text-ink-soft empty:hidden">
        {status}
      </p>
    </div>
  );
}
