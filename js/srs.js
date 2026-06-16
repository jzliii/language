// 簡化版 SM-2 間隔複習演算法。
// 每張卡記錄：ef(難度係數)、interval(天)、reps(連續答對次數)、due(下次到期時間 ms)。
const DAY = 24 * 60 * 60 * 1000;

export function newCard() {
  return { ef: 2.5, interval: 0, reps: 0, due: Date.now(), lapses: 0 };
}

// quality: 0 = 不會, 1 = 模糊, 2 = 簡單
export function review(card, quality) {
  const c = { ...card };
  if (quality === 0) {
    // 答錯：重置，10 分鐘後再出現
    c.reps = 0;
    c.interval = 0;
    c.lapses = (c.lapses || 0) + 1;
    c.due = Date.now() + 10 * 60 * 1000;
    return c;
  }
  // 把 0/1/2 對應到 SM-2 的 q 值（3/4/5）
  const q = quality === 1 ? 3 : 5;
  c.ef = Math.max(1.3, c.ef + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02)));
  c.reps = (c.reps || 0) + 1;
  if (c.reps === 1) c.interval = 1;
  else if (c.reps === 2) c.interval = quality === 1 ? 2 : 4;
  else c.interval = Math.round(c.interval * c.ef);
  c.due = Date.now() + c.interval * DAY;
  return c;
}

export function isDue(card) {
  return !card || card.due <= Date.now();
}
