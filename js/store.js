// 進度儲存於瀏覽器 localStorage。
const KEY = 'polyglot-progress-v1';

let state = load();

function load() {
  try {
    return JSON.parse(localStorage.getItem(KEY)) || {};
  } catch {
    return {};
  }
}

function persist() {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch (e) {
    console.warn('無法儲存進度', e);
  }
}

// 卡片狀態 key：lang:type:id（type 通常為 vocab）
export function getCard(key) {
  return state.cards?.[key];
}

export function setCard(key, card) {
  state.cards = state.cards || {};
  state.cards[key] = card;
  persist();
}

// 紀錄某語言某模式的最佳分數與最近一次練習時間
export function recordScore(lang, mode, correct, total) {
  state.scores = state.scores || {};
  const k = `${lang}:${mode}`;
  const prev = state.scores[k] || { best: 0, attempts: 0 };
  const pct = total ? Math.round((correct / total) * 100) : 0;
  state.scores[k] = {
    best: Math.max(prev.best, pct),
    last: pct,
    attempts: prev.attempts + 1,
    when: Date.now(),
  };
  bumpStreak();
  persist();
}

export function getScore(lang, mode) {
  return state.scores?.[`${lang}:${mode}`];
}

// 連續學習天數
function bumpStreak() {
  const today = new Date().toDateString();
  state.streak = state.streak || { count: 0, last: null };
  if (state.streak.last === today) return;
  const yesterday = new Date(Date.now() - 86400000).toDateString();
  state.streak.count = state.streak.last === yesterday ? state.streak.count + 1 : 1;
  state.streak.last = today;
}

export function getStreak() {
  const s = state.streak || { count: 0, last: null };
  // 若超過一天沒練習，連續天數視覺上歸零
  const today = new Date().toDateString();
  const yesterday = new Date(Date.now() - 86400000).toDateString();
  if (s.last !== today && s.last !== yesterday) return 0;
  return s.count;
}

export function markStudied() {
  bumpStreak();
  persist();
}
