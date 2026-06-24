// 進度儲存於瀏覽器 localStorage（離線也能用）；可選擇登入後同步到雲端。
const KEY = 'polyglot-progress-v1';

let state = load();
const subscribers = [];
ensureWeek();

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
  const out = { cards: {}, scores: {}, quiz: {}, wrong: {} };
  out.week = Math.max(local.week || 0, remote.week || 0);

  // 本週練習：同週聯集，跨週取較新一週的
  if ((local.week || 0) === (remote.week || 0)) {
    out.weekly = {};
    const wl = new Set([...Object.keys(local.weekly || {}), ...Object.keys(remote.weekly || {})]);
    for (const lg of wl) out.weekly[lg] = { ...(local.weekly?.[lg] || {}), ...(remote.weekly?.[lg] || {}) };
  } else {
    out.weekly = (local.week || 0) > (remote.week || 0) ? local.weekly || {} : remote.weekly || {};
  }

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

  // 測驗作答狀態：每個 key 取較新（ts 大）的
  const quizKeys = new Set([...Object.keys(local.quiz || {}), ...Object.keys(remote.quiz || {})]);
  for (const k of quizKeys) {
    const a = local.quiz?.[k];
    const b = remote.quiz?.[k];
    const pick = !a ? b : !b ? a : (b.ts || 0) >= (a.ts || 0) ? b : a;
    if (pick && pick.week === out.week) out.quiz[k] = pick; // 丟掉上一週的作答
  }

  // 錯題庫：深層聯集
  const wrongLangs = new Set([...Object.keys(local.wrong || {}), ...Object.keys(remote.wrong || {})]);
  for (const lg of wrongLangs) {
    out.wrong[lg] = {};
    const cats = new Set([
      ...Object.keys(local.wrong?.[lg] || {}),
      ...Object.keys(remote.wrong?.[lg] || {}),
    ]);
    for (const c of cats) {
      out.wrong[lg][c] = { ...(local.wrong?.[lg]?.[c] || {}), ...(remote.wrong?.[lg]?.[c] || {}) };
    }
  }

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

// ---- 每週週期（依使用者當地時間，週一為一週起點）----
function mondayMs(d = new Date()) {
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const dow = (x.getDay() + 6) % 7; // 週一=0 ... 週日=6
  x.setDate(x.getDate() - dow);
  return x.getTime();
}

export function currentWeek() {
  return mondayMs();
}

// 換到新的一週時：清空作答(題目更新)與本週練習；保留 SRS 卡片、分數、錯題庫、streak
function ensureWeek() {
  const wk = mondayMs();
  if (state.week !== wk) {
    state.week = wk;
    state.quiz = {};
    state.weekly = {};
    persist();
  }
}

// 記錄某語言本週練習過的單字
export function recordWeekly(lang, id) {
  ensureWeek();
  state.weekly = state.weekly || {};
  state.weekly[lang] = state.weekly[lang] || {};
  if (!state.weekly[lang][id]) {
    state.weekly[lang][id] = 1;
    persist();
  }
}

// 某語言本週練習過幾個單字
export function weeklyDone(lang) {
  return Object.keys(state.weekly?.[lang] || {}).length;
}

// ---- 測驗作答狀態（單頁、可重看）----
// key 例：'ja:vocab'、'ja:grammar'、'ja:reading:ja-r1'
export function getQuiz(key) {
  const q = state.quiz?.[key];
  return q && q.week === state.week ? q : undefined; // 只回傳本週的作答
}

export function saveQuiz(key, data) {
  state.quiz = state.quiz || {};
  state.quiz[key] = { ...data, ts: Date.now(), week: state.week };
  persist();
}

export function clearQuiz(key) {
  if (state.quiz && state.quiz[key]) {
    delete state.quiz[key];
    persist();
  }
}

// ---- 錯題庫：state.wrong[lang][cat][id] = 加入時間 ----
export function addWrong(lang, cat, id) {
  state.wrong = state.wrong || {};
  state.wrong[lang] = state.wrong[lang] || {};
  state.wrong[lang][cat] = state.wrong[lang][cat] || {};
  if (!state.wrong[lang][cat][id]) {
    state.wrong[lang][cat][id] = Date.now();
    persist();
  }
}

export function removeWrong(lang, cat, id) {
  if (state.wrong?.[lang]?.[cat]?.[id]) {
    delete state.wrong[lang][cat][id];
    persist();
  }
}

// 回傳某語言的錯題 id 清單：{ vocab:[...], grammar:[...] }
export function getWrong(lang) {
  const w = state.wrong?.[lang] || {};
  return { vocab: Object.keys(w.vocab || {}), grammar: Object.keys(w.grammar || {}) };
}
