// 입력 중인 꿈을 이 브라우저 탭의 임시 저장소(sessionStorage)에만 잠깐 보관한다.
// 결과 페이지에서 입력창으로 돌아왔을 때 다시 채워 넣기 위한 것이다. 탭을 닫으면 지워지고 서버로 보내지 않는다.
// (개인정보처리방침 7번 '쿠키와 웹 스토리지'와 같은 내용) 저장이 막힌 브라우저에서는 조용히 넘어간다.

const KEY = "dream-draft";

export function loadDraft(): string {
  try {
    return sessionStorage.getItem(KEY) ?? "";
  } catch {
    return "";
  }
}

export function saveDraft(text: string): void {
  try {
    if (text) sessionStorage.setItem(KEY, text);
    else sessionStorage.removeItem(KEY);
  } catch {
    // 저장이 막혀 있으면 복원만 안 될 뿐 해몽은 그대로 된다.
  }
}
