// 進度儲存於瀏覽器 localStorage（離線也能用）；可選擇登入後同步到雲端。
const KEY = 'polyglot-progress-v1';

let state = load();
const subscribers = [];

function load() {
  try {
    return JSON.parse(localStorage.getItem(KEY)) || {};
  } catch {
    return {};
  }
}

function persist() {
  state.updatedAt = Date.now();
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch (e) {
    console.warn('無法儲存進度', e);
  }
  // 通知同步層（雲端）有變動
  subscribers.forEach((fn) => {
    try {
      fn();
    } catch (e) {
      console.warn('同步通知失敗', e);
    }
  });
}

// ---- 給同步層使用 ----
export function getState() {
  return state;
}

// 用新的狀態整個取代（例如雲端合併後），並寫回 localStorage
export function replaceState(next) {
  state = next || {};
  persist();
}

// 註冊變動回呼；每次進度寫入後會被呼叫
export function subscribe(fn) {
  subscribers.push(fn);
}

// 合併兩份進度（本機 + 雲端），用於跨裝置同步。盡量保留「較有進度」的那份。
export function merge(local, remote) {
  if (!remote) return local || {};
  if (!local) return remote;
  const out = { cards: {}, scores: {} };

  const cardKeys = new Set([
    ...Object.keys(local.cards || {}),
    ...Object.keys(remote.cards || {}),
  ]);
  for (const k of cardKeys) out.cards[k] = pickCard(local.cards?.[k], remote.cards?.[k]);

  const scoreKeys = new Set([
    ...Object.keys(local.scores || {}),
    ...Object.keys(remote.scores || {}),
  ]);
  for (const k of scoreKeys) out.scores[k] = pickScore(local.scores?.[k], remote.scores?.[k]);

  out.streak = pickStreak(local.streak, remote.streak);
  out.updatedAt = Date.now();
  return out;
}

// 兩張卡取「複習進度較前面」的（due 較晚＝記得較熟）
function pickCard(a, b) {
  if (!a) return b;
  if (!b) return a;
  return (b.due || 0) > (a.due || 0) ? b : a;
}

function pickScore(a, b) {
  if (!a) return b;
  if (!b) return a;
  const latest = (b.when || 0) >= (a.when || 0) ? b : a;
  return {
    best: Math.max(a.best || 0, b.best || 0),
    attempts: Math.max(a.attempts || 0, b.attempts || 0),
    last: latest.last,
    when: Math.max(a.when || 0, b.when || 0),
  };
}

function pickStreak(a, b) {
  if (!a) return b;
  if (!b) return a;
  // 以最近一次學習日期較新的那份為準；同一天則取較大連續天數
  if (a.last === b.last) return { count: Math.max(a.count || 0, b.count || 0), last: a.last };
  return new Date(b.last) > new Date(a.last) ? b : a;
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
