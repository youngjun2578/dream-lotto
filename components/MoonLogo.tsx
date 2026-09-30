// 사이트 로고용 초승달 (실제 복권 사업자의 로고·디자인과 관계없는 자체 그림)

export function MoonLogo({ className = "h-6 w-6" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className}>
      <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" fill="var(--moon)" />
      <circle cx="18.5" cy="4.5" r="1" fill="var(--moon)" opacity="0.8" />
      <circle cx="21.5" cy="8" r="0.6" fill="var(--moon)" opacity="0.6" />
    </svg>
  );
}
