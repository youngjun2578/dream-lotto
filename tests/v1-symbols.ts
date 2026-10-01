// 사전 v1 의 상징 30개 (여러 테스트에서 같이 쓴다)
// 공유 링크(/r/)가 slug 를 쓰므로 바꾸거나 지우지 않는다. 새로 넣은 상징과 구분할 때 쓴다.

export const V1_SLUGS = [
  "pig", "cow", "snake", "dragon", "tiger", "fish",
  "ancestor", "baby", "celebrity", "president", "ex-lover", "thief",
  "water", "fire", "sun", "moon", "mountain", "sea",
  "teeth", "flying", "falling", "chased", "death", "wedding",
  "poop", "money", "gold", "ring", "lottery", "house",
];

export const isV1 = (slug: string) => V1_SLUGS.includes(slug);
