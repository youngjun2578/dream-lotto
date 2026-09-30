// 광고 자리 (지금은 비어 있음)
// 2단계에서 애드센스 코드를 이 컴포넌트 안에만 넣으면 모든 광고 자리에 적용된다.
// 위치 규칙: 결과 번호 아래, 사전 본문 중간/끝. 입력창 바로 옆에는 두지 않는다.
// 개발 모드(npm run dev)에서만 위치를 확인할 수 있게 점선 상자를 보여준다.

export function AdSlot({ name }: { name: string }) {
  if (process.env.NODE_ENV !== "development") {
    return <div data-ad-slot={name} aria-hidden="true" />;
  }
  return (
    <div
      data-ad-slot={name}
      aria-hidden="true"
      className="my-8 flex h-24 items-center justify-center rounded-xl border-2 border-dashed border-line text-xs text-ink-faint"
    >
      광고 자리 ({name}) — 개발 모드에서만 보임
    </div>
  );
}
