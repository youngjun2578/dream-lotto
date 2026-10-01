// 소개/개인정보처리방침/이용약관/문의 같은 글 위주 페이지의 공통 틀

export function StaticPage({ title, updated, children }: { title: string; updated?: string; children: React.ReactNode }) {
  return (
    <article className="prose-dream text-ink-soft">
      <h1 className="text-2xl font-bold text-ink sm:text-3xl">{title}</h1>
      {updated && <p className="!mt-2 text-sm text-ink-faint">최종 수정일: {updated}</p>}
      {children}
    </article>
  );
}
