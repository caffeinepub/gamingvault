export const QUESTIONS_PREFIX = "hfst_pq_";

export function getBuyerQuestion(productId: bigint): string {
  return localStorage.getItem(QUESTIONS_PREFIX + productId.toString()) ?? "";
}

export function setBuyerQuestion(productId: bigint, question: string): void {
  if (question.trim()) {
    localStorage.setItem(
      QUESTIONS_PREFIX + productId.toString(),
      question.trim(),
    );
  } else {
    localStorage.removeItem(QUESTIONS_PREFIX + productId.toString());
  }
}
