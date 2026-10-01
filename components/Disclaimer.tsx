import { AGE_NOTICE, DISCLAIMER } from "@/lib/site";

/** 결과·사전 상세·가이드 아래에 두는 고지 상자 (재미용 + 구매 연령) */
export function Disclaimer() {
  return (
    <div
      role="note"
      className="mt-8 space-y-1 rounded-xl border border-line bg-surface-2 px-4 py-3 text-center text-sm text-ink-soft"
    >
      <p>{DISCLAIMER}</p>
      <p>{AGE_NOTICE}</p>
    </div>
  );
}
