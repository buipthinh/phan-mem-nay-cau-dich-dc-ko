/** Thẻ tem của khách: danh sách mã gian hàng đã quét, không trùng, giữ thứ tự. */
export type StampCard = string[];

/**
 * UC07 Săn tem: thêm tem của một gian vào thẻ, mỗi gian chỉ được 1 tem.
 */
export function addStamp(card: StampCard, stallId: string): { card: StampCard; added: boolean } {
  if (card.includes(stallId)) return { card, added: false };
  return { card: [...card, stallId], added: true };
}

export function canRedeem(card: StampCard, goal: number): boolean {
  return card.length >= goal;
}

export function progress(card: StampCard, goal: number): number {
  return Math.min(1, card.length / goal);
}
