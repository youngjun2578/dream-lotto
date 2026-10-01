// 로또 공 색 (번호 구간별). 화면(LottoBall)과 공유 이미지(OG)에서 같이 쓴다.
// 1~10 노랑, 11~20 파랑, 21~30 빨강, 31~40 회색, 41~45 초록 — 글자는 어두운 색이라 명도 대비가 충분하다.

export interface BallColor {
  /** 공 바탕색 */
  bg: string;
  /** 번호 글자색 */
  fg: string;
}

export function ballColor(n: number): BallColor {
  if (n <= 10) return { bg: "#fbc531", fg: "#3b2800" };
  if (n <= 20) return { bg: "#5ab4f0", fg: "#062a45" };
  if (n <= 30) return { bg: "#f57a86", fg: "#4a0710" };
  if (n <= 40) return { bg: "#b4bcc8", fg: "#1f2530" };
  return { bg: "#8fd16a", fg: "#173b06" };
}
