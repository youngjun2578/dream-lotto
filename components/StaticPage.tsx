// 소개/개인정보처리방침/이용약관/문의 같은 글 위주 페이지의 공통 틀

export function StaticPage({ title, updated, children }: { title: string; updated?: string; children: React.ReactNode }) {
  return (
    <article className="leading-7 text-slate-700 [&_a]:text-violet-700 [&_a]:underline [&_h2]:mt-8 [&_h2]:mb-2 [&_h2]:text-lg [&_h2]:font-bold [&_h2]:text-slate-900 [&_li]:ml-5 [&_li]:list-disc [&_p]:mt-3">
      <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
      {updated && <p className="text-sm text-slate-400">최종 수정일: {updated}</p>}
      {children}
    </article>
  );
}
