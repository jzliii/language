import { LANGUAGES, getLang } from './data/index.js';
import { DAILY } from './data/daily.js';
import * as store from './store.js';
import * as srs from './srs.js';
import { speak, canSpeak, hasVoiceFor } from './tts.js';
import * as sync from './sync.js';

const app = document.getElementById('app');

// ---------- 小工具 ----------
const shuffle = (arr) => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

const esc = (s) =>
  String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

const speakBtn = (text, lang) =>
  canSpeak() && lang
    ? `<button class="speak" data-speak="${esc(text)}" data-lang="${lang}" title="朗讀" aria-label="朗讀">🔊</button>`
    : '';

function bindSpeak(root) {
  root.querySelectorAll('[data-speak]').forEach((b) => {
    b.addEventListener('click', (e) => {
      e.stopPropagation();
      speak(b.dataset.speak, b.dataset.lang);
    });
  });
}

const MODES = [
  { id: 'flashcards', icon: '🃏', name: '背單字（間隔複習）', desc: '翻卡記憶，系統幫你排複習時間' },
  { id: 'vocab', icon: '✍️', name: '單字練習', desc: '選擇題測驗單字意思' },
  { id: 'grammar', icon: '📐', name: '文法練習', desc: '挑出正確的助詞、時態與用法' },
  { id: 'reading', icon: '📖', name: '閱讀練習', desc: '短文 + 理解測驗' },
  { id: 'script', icon: '🔤', name: '拼音／閱讀辨識', desc: '看文字選正確讀音', needs: 'reading_drill' },
];

// 某語言「到期需複習」的數量（含尚未學過的新卡）
function dueCount(lang) {
  const vocab = lang.content.vocab || [];
  return vocab.filter((v) => srs.isDue(store.getCard(`${lang.code}:vocab:${v.id}`))).length;
}

// 單字熟練度統計：已熟（reps≥2）、學習中（已建卡但 reps<2）
function vocabStats(lang) {
  const vocab = lang.content.vocab || [];
  let mastered = 0;
  let learning = 0;
  for (const v of vocab) {
    const c = store.getCard(`${lang.code}:vocab:${v.id}`);
    if (!c) continue;
    if ((c.reps || 0) >= 2) mastered++;
    else learning++;
  }
  return { total: vocab.length, mastered, learning, studied: mastered + learning };
}

const pct = (n, d) => (d ? Math.round((n / d) * 100) : 0);

function dayIndex() {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  return Math.floor((now - start) / 86400000);
}

// ---------- 路由 ----------
function router() {
  const hash = location.hash.slice(1) || '/';
  const parts = hash.split('/').filter(Boolean);
  window.scrollTo(0, 0);

  if (parts[0] === 'lang' && parts[1]) {
    const lang = getLang(parts[1]);
    if (!lang) return go(renderDashboard, '/');
    const mode = parts[2];
    if (!mode) return go(() => renderLangMenu(lang), hash);
    if (mode === 'flashcards') return go(() => renderFlashcards(lang), hash);
    if (mode === 'vocab') return go(() => renderVocabQuiz(lang), hash);
    if (mode === 'grammar') return go(() => renderGrammarQuiz(lang), hash);
    if (mode === 'reading') return go(() => renderReadingList(lang), hash);
    if (mode === 'script') return go(() => renderScriptDrill(lang), hash);
  }
  if (parts[0] === 'review') return go(renderReview, '/review');
  if (parts[0] === 'wordbook') return go(renderWordbook, '/wordbook');
  if (parts[0] === 'stats') return go(renderStats, '/stats');
  if (parts[0] === 'settings') return go(renderSettings, '/settings');
  return go(renderDashboard, '/');
}

function go(render, hash) {
  render();
  setActiveTab(hash);
}

window.addEventListener('hashchange', router);
window.addEventListener('DOMContentLoaded', router);

// ---------- 底部分頁導覽 ----------
const TABS = [
  { id: '/', icon: '🏠', label: '首頁', href: '#/' },
  { id: '/review', icon: '🔁', label: '複習', href: '#/review' },
  { id: '/wordbook', icon: '📚', label: '單字本', href: '#/wordbook' },
  { id: '/stats', icon: '📊', label: '統計', href: '#/stats' },
  { id: '/settings', icon: '☁️', label: '同步', href: '#/settings' },
];

function createTabBar() {
  const nav = document.createElement('nav');
  nav.className = 'tabbar';
  nav.innerHTML = TABS.map(
    (t) => `<a class="tab" data-tab="${t.id}" href="${t.href}"><span class="tab-ic">${t.icon}</span><small>${t.label}</small></a>`
  ).join('');
  document.body.appendChild(nav);
}

function setActiveTab(hash) {
  const top = '/' + (hash.split('/').filter(Boolean)[0] || '');
  // 語言子頁歸到「首頁」
  const active = TABS.some((t) => t.id === top) ? top : '/';
  document.querySelectorAll('.tab').forEach((a) => {
    a.classList.toggle('on', a.dataset.tab === active);
  });
}

createTabBar();

function greeting() {
  const h = new Date().getHours();
  if (h < 5) return '夜深了';
  if (h < 11) return '早安';
  if (h < 14) return '午安';
  if (h < 18) return '午安';
  return '晚安';
}

// 招呼語的名字：登入後用 Google 名字，否則不帶名
function greetName() {
  const u = sync.getUser && sync.getUser();
  const n = u && (u.displayName || (u.email ? u.email.split('@')[0] : ''));
  return n ? `，${n}` : '';
}

const CAT_COUNT = 20;
function catImg() {
  const n = String(Math.floor(Math.random() * CAT_COUNT) + 1).padStart(2, '0');
  return `<img src="assets/cats/cat${n}.png" alt="" class="cat-art" loading="eager">`;
}

// ---------- 首頁 Dashboard ----------
function renderDashboard() {
  const streak = store.getStreak();
  const dues = LANGUAGES.map((l) => ({ l, due: dueCount(l) }));
  const totalDue = dues.reduce((s, d) => s + d.due, 0);

  const dueGrid = dues
    .map(
      ({ l, due }) =>
        `<div class="due-item"><span class="due-flag">${l.flag}</span><span class="due-n ${due ? '' : 'zero'}">${due}</span><span class="due-name">${esc(l.short)}</span></div>`
    )
    .join('');

  const dw = DAILY[dayIndex() % DAILY.length];
  const dailyRows = dw.items
    .map((it) => {
      const lang = getLang(it.code);
      return `<div class="daily-row">
        <span class="daily-flag">${lang ? lang.flag : ''}</span>
        <span class="daily-w">${esc(it.w)} ${speakBtn(it.w, lang ? lang.tts : '')}</span>
        <span class="daily-r">${esc(it.r)}</span>
      </div>`;
    })
    .join('');

  // 一週課表：週一～週六各排一種語言，週日（第七天）到複習區總複習
  const dow = new Date().getDay(); // 0=日 .. 6=六
  const plan = dow === 0 ? { type: 'review' } : { type: 'lang', lang: LANGUAGES[dow - 1] };
  const WD = ['日', '一', '二', '三', '四', '五', '六'];
  const weekStrip = [1, 2, 3, 4, 5, 6, 0]
    .map((d) => {
      const label = d === 0 ? '複' : LANGUAGES[d - 1].short;
      return `<div class="wk-cell${d === dow ? ' on' : ''}"><span class="wk-d">${WD[d]}</span><span class="wk-l">${label}</span></div>`;
    })
    .join('');
  let todayFocus;
  if (plan.type === 'review') {
    todayFocus = `
      <div class="tf-main"><span class="tf-flag">🎉</span><div class="tf-text"><strong>今天是總複習日</strong><small>把這週學的單字一起複習一輪</small></div></div>
      <a class="btn primary big" href="#/review">開始綜合複習</a>`;
  } else {
    const l = plan.lang;
    todayFocus = `
      <div class="tf-main"><span class="tf-flag">${l.flag}</span><div class="tf-text"><strong>今天學 ${l.name}</strong><small>${esc(l.level)} · 待複習 ${dueCount(l)}</small></div></div>
      <a class="btn primary big" href="#/lang/${l.code}/flashcards">開始背單字</a>
      <a class="btn tf-more" href="#/lang/${l.code}">看 ${l.name} 全部練習</a>`;
  }

  const cards = LANGUAGES.map((l) => {
    const st = vocabStats(l);
    const p = pct(st.mastered, st.total);
    const due = dueCount(l);
    return `
      <a class="lang-row" href="#/lang/${l.code}">
        <span class="lr-flag">${l.flag}</span>
        <span class="lr-main">
          <strong>${l.name}</strong>
          <small>${esc(l.level)}</small>
          <span class="pbar"><i style="width:${p}%"></i></span>
          <span class="lr-stat">已熟 ${st.mastered}/${st.total}（${p}%）· 學過 ${st.studied} 字</span>
        </span>
        <span class="lr-badge${due ? '' : ' done'}">${due || '✓'}</span>
      </a>`;
  }).join('');

  app.innerHTML = `
    <header class="topbar">
      <span class="brand">Language Garden <span class="leaf">🌱</span></span>
      <div class="tagline">One brew, one word, one step closer.</div>
    </header>

    <section class="hero-card">
      <div class="hero-greet">${greeting()}${esc(greetName())}！</div>
      <div class="hero-sub">今天也是精進語言的一天 ☕</div>
      <div class="hero-streak">
        <span class="hs-ic">🔥</span>
        <span><small>連續學習</small><strong>${streak}</strong> 天</span>
      </div>
      <div class="hero-cat">${catImg()}</div>
    </section>

    <section class="dash-card today-card">
      <div class="dash-h">📅 今日課表 <span class="dash-total">週${WD[dow]}</span></div>
      <div class="week-strip">${weekStrip}</div>
      <div class="today-focus">${todayFocus}</div>
    </section>

    <section class="dash-card">
      <div class="dash-h">🧠 今日待複習 <span class="dash-total">共 ${totalDue} 項</span></div>
      <div class="due-grid">${dueGrid}</div>
      ${totalDue ? '<a class="btn primary big dash-cta" href="#/review">開始綜合複習</a>' : '<p class="hint center">今天都複習完了，太強了 🎉</p>'}
    </section>

    <section class="dash-card">
      <div class="dash-h">🌍 每日一字 · <span class="daily-zh">${esc(dw.zh)}</span></div>
      <div class="daily-list">${dailyRows}</div>
    </section>

    <h2 class="sec-title">我的語言</h2>
    <section class="lang-grid">${cards}</section>`;
  bindSpeak(app);
}

// ---------- 統計 ----------
function renderStats() {
  let totalStudied = 0;
  let totalMastered = 0;
  let activeLangs = 0;
  const rows = LANGUAGES.map((l) => {
    const st = vocabStats(l);
    if (st.studied) activeLangs++;
    totalStudied += st.studied;
    totalMastered += st.mastered;
    const p = pct(st.mastered, st.total);
    const modes = [
      ['flashcards', '背單字'],
      ['vocab', '單字'],
      ['grammar', '文法'],
      ['reading', '閱讀'],
      ['script', '拼音'],
    ];
    const chips = modes
      .map(([m, label]) => {
        const sc = store.getScore(l.code, m);
        return sc ? `<span class="sl-chip">${label} <b>${sc.best}%</b></span>` : '';
      })
      .filter(Boolean)
      .join('');
    return `
      <div class="stat-lang">
        <div class="sl-head">
          <span class="lr-flag">${l.flag}</span>
          <strong>${l.name}</strong>
          <span class="sl-pct">已熟 ${st.mastered}/${st.total}（${p}%）</span>
        </div>
        <span class="pbar big"><i style="width:${p}%"></i></span>
        <div class="sl-scores">${chips || '<span class="sl-chip">尚無測驗紀錄</span>'}</div>
      </div>`;
  }).join('');

  app.innerHTML = `
    <header class="topbar"><span class="brand">📊 統計</span></header>
    <div class="stat-overview">
      <div class="stat-box"><div class="sb-n">${store.getStreak()}</div><div class="sb-l">連續天數</div></div>
      <div class="stat-box"><div class="sb-n">${totalStudied}</div><div class="sb-l">學過單字</div></div>
      <div class="stat-box"><div class="sb-n">${totalMastered}</div><div class="sb-l">已熟單字</div></div>
    </div>
    ${rows}`;
}

// ---------- 語言選單 ----------
function renderLangMenu(lang) {
  const due = dueCount(lang);
  const st = vocabStats(lang);
  const p = pct(st.mastered, st.total);
  const modes = MODES.filter((m) => !m.needs || lang.content[m.needs]?.length)
    .map((m) => {
      const score = store.getScore(lang.code, m.id);
      let meta = '';
      if (m.id === 'flashcards') meta = due > 0 ? `<em>${due} 個待複習</em>` : '<em>今天都複習完了 ✓</em>';
      else if (m.id === 'reading') meta = `<em>${lang.content.reading?.length || 0} 篇短文</em>`;
      else if (score) meta = `<em>最佳 ${score.best}%</em>`;
      return `
        <a class="mode-card" href="#/lang/${lang.code}/${m.id}">
          <span class="mode-icon">${m.icon}</span>
          <span class="mode-text"><strong>${m.name}</strong><small>${m.desc}</small>${meta}</span>
          <span class="chev">›</span>
        </a>`;
    })
    .join('');

  app.innerHTML = `
    <header class="bar">
      <a class="back" href="#/">‹ 首頁</a>
      <h2>${lang.flag} ${lang.name} <small>${esc(lang.level)}</small></h2>
    </header>
    <section class="lang-progress" style="--c:${lang.color}">
      <div class="lp-top"><span>單字熟練度</span><span>${st.mastered}/${st.total}（${p}%）</span></div>
      <span class="pbar big"><i style="width:${p}%;background:${lang.color}"></i></span>
      <div class="lp-sub">學習中 ${st.learning} · 待複習 ${due}</div>
    </section>
    <section class="mode-list">${modes}</section>`;
  if (!hasVoiceFor(lang.tts)) {
    app.insertAdjacentHTML(
      'beforeend',
      `<p class="hint">提示：你的瀏覽器可能沒有安裝「${esc(lang.name)}」語音，朗讀功能或許無法發聲。Chrome／Edge 通常支援最完整。</p>`
    );
  }
}

// ---------- 背單字（SRS 翻卡，通用 runner）----------
// items: [{ lang, v }]
function runFlashcards({ title, items, backHref, reviewingAll, retry, mixed }) {
  let queue = [...items];
  let idx = 0;
  let done = 0;

  function showCard() {
    if (idx >= queue.length) return finish();
    const { lang, v } = queue[idx];
    app.innerHTML = `
      <header class="bar">
        <a class="back" href="${backHref}">‹ 返回</a>
        <h2>${title}</h2>
        <span class="progress-pill">${idx + 1} / ${queue.length}</span>
      </header>
      ${reviewingAll ? '<p class="hint center">今天沒有到期的卡片，這是額外複習回合 🌟</p>' : ''}
      <div class="flashcard" id="card">
        ${mixed ? `<div class="fc-tag">${lang.flag} ${esc(lang.name)}</div>` : ''}
        <div class="fc-front">
          <div class="fc-word">${esc(v.front)} ${speakBtn(v.front, lang.tts)}</div>
          ${v.reading ? `<div class="fc-reading">${esc(v.reading)}</div>` : ''}
        </div>
        <div class="fc-back hidden" id="back">
          <div class="fc-meaning">${esc(v.back)}</div>
          ${v.example ? `<div class="fc-example">${esc(v.example)} ${speakBtn(v.example.split('(')[0].trim(), lang.tts)}</div>` : ''}
        </div>
      </div>
      <div class="fc-actions" id="actions">
        <button class="btn primary big" id="reveal">顯示答案</button>
      </div>`;
    bindSpeak(app);
    document.getElementById('reveal').onclick = reveal;
    document.getElementById('card').onclick = (e) => {
      if (document.getElementById('back').classList.contains('hidden') && !e.target.dataset.speak) reveal();
    };
  }

  function reveal() {
    document.getElementById('back').classList.remove('hidden');
    document.getElementById('actions').innerHTML = `
      <button class="btn rate again" data-q="0">😵 不會</button>
      <button class="btn rate hard" data-q="1">🤔 模糊</button>
      <button class="btn rate easy" data-q="2">😎 簡單</button>`;
    document.querySelectorAll('.rate').forEach((b) => {
      b.onclick = () => rate(parseInt(b.dataset.q, 10));
    });
  }

  function rate(q) {
    const { lang, v } = queue[idx];
    const key = `${lang.code}:vocab:${v.id}`;
    const card = store.getCard(key) || srs.newCard();
    store.setCard(key, srs.review(card, q));
    if (q === 0) queue.push({ lang, v }); // 答錯排到後面再練
    done++;
    idx++;
    showCard();
  }

  function finish() {
    store.markStudied();
    app.innerHTML = `
      <header class="bar"><a class="back" href="${backHref}">‹ 返回</a><h2>${title}</h2></header>
      <div class="result">
        <div class="result-big">👏</div>
        <p>這回合複習了 <strong>${done}</strong> 張卡片！</p>
        <div class="result-actions">
          <button class="btn primary" id="again">再來一輪</button>
          <a class="btn" href="${backHref}">返回</a>
        </div>
      </div>`;
    document.getElementById('again').onclick = retry;
  }

  if (!queue.length) {
    app.innerHTML = `
      <header class="bar"><a class="back" href="${backHref}">‹ 返回</a><h2>${title}</h2></header>
      <p class="hint center">目前沒有可複習的卡片 🎉</p>`;
    return;
  }
  showCard();
}

function renderFlashcards(lang) {
  const vocab = lang.content.vocab || [];
  let due = vocab.filter((v) => srs.isDue(store.getCard(`${lang.code}:vocab:${v.id}`)));
  const reviewingAll = due.length === 0;
  const picked = reviewingAll ? shuffle(vocab).slice(0, Math.min(vocab.length, 15)) : shuffle(due);
  runFlashcards({
    title: '🃏 背單字',
    items: picked.map((v) => ({ lang, v })),
    backHref: `#/lang/${lang.code}`,
    reviewingAll,
    retry: () => renderFlashcards(lang),
  });
}

// ---------- 綜合複習（跨語言到期卡）----------
function renderReview() {
  const all = [];
  for (const lang of LANGUAGES) {
    for (const v of lang.content.vocab || []) {
      const c = store.getCard(`${lang.code}:vocab:${v.id}`);
      if (c && srs.isDue(c)) all.push({ lang, v });
    }
  }
  if (!all.length) {
    app.innerHTML = `
      <header class="bar"><a class="back" href="#/">‹ 首頁</a><h2>🔁 綜合複習</h2></header>
      <div class="result">
        <div class="result-big">🎉</div>
        <p>目前沒有到期的卡片！<br>先去各語言「背單字」建立一些卡片，之後就會在這裡集合複習。</p>
        <div class="result-actions"><a class="btn primary" href="#/">回首頁</a></div>
      </div>`;
    return;
  }
  runFlashcards({
    title: '🔁 綜合複習',
    items: shuffle(all),
    backHref: '#/',
    reviewingAll: false,
    mixed: true,
    retry: () => renderReview(),
  });
}

// ---------- 通用選擇題測驗 ----------
function runQuiz(lang, mode, title, icon, questions, backHref) {
  const qs = shuffle(questions);
  let idx = 0;
  let correct = 0;

  function show() {
    if (idx >= qs.length) return finish();
    const q = qs[idx];
    const opts = q.options.map((o, i) => `<button class="opt" data-i="${i}">${esc(o)}</button>`).join('');
    app.innerHTML = `
      <header class="bar">
        <a class="back" href="${backHref}">‹ 返回</a>
        <h2>${icon} ${title}</h2>
        <span class="progress-pill">${idx + 1} / ${qs.length}</span>
      </header>
      <div class="quiz">
        <div class="q-prompt">${esc(q.prompt)} ${q.speak ? speakBtn(q.speak, lang.tts) : ''}</div>
        <div class="options">${opts}</div>
        <div class="explain hidden" id="explain"></div>
        <button class="btn primary hidden" id="next">下一題 ›</button>
      </div>`;
    bindSpeak(app);
    app.querySelectorAll('.opt').forEach((b) => {
      b.onclick = () => choose(parseInt(b.dataset.i, 10), q);
    });
  }

  function choose(i, q) {
    const buttons = app.querySelectorAll('.opt');
    buttons.forEach((b) => (b.disabled = true));
    buttons[q.answer].classList.add('right');
    if (i === q.answer) correct++;
    else buttons[i].classList.add('wrong');
    const ex = document.getElementById('explain');
    if (q.explanation) {
      ex.textContent = (i === q.answer ? '✅ 正確！ ' : '❌ ') + q.explanation;
      ex.classList.remove('hidden');
    }
    const next = document.getElementById('next');
    next.classList.remove('hidden');
    next.textContent = idx + 1 >= qs.length ? '看結果 ›' : '下一題 ›';
    next.onclick = () => {
      idx++;
      show();
    };
  }

  function finish() {
    store.recordScore(lang.code, mode, correct, qs.length);
    const p = pct(correct, qs.length);
    const emoji = p >= 90 ? '🏆' : p >= 70 ? '🎉' : p >= 50 ? '💪' : '📚';
    app.innerHTML = `
      <header class="bar"><a class="back" href="${backHref}">‹ 返回</a><h2>${icon} 結果</h2></header>
      <div class="result">
        <div class="result-big">${emoji}</div>
        <p>答對 <strong>${correct}</strong> / ${qs.length} 題（${p}%）</p>
        <div class="result-actions">
          <button class="btn primary" id="retry">再做一次</button>
          <a class="btn" href="${backHref}">回到選單</a>
        </div>
      </div>`;
    document.getElementById('retry').onclick = () => runQuiz(lang, mode, title, icon, questions, backHref);
  }

  show();
}

function renderVocabQuiz(lang) {
  const vocab = lang.content.vocab || [];
  const back = `#/lang/${lang.code}`;
  if (vocab.length < 4) {
    app.innerHTML = `<header class="bar"><a class="back" href="${back}">‹ 返回</a></header><p class="hint center">單字不足，無法出題。</p>`;
    return;
  }
  const meanings = vocab.map((v) => v.back);
  const questions = shuffle(vocab).slice(0, 12).map((v) => {
    const distractors = shuffle(meanings.filter((m) => m !== v.back)).slice(0, 3);
    const options = shuffle([v.back, ...distractors]);
    return {
      prompt: v.reading ? `${v.front}（${v.reading}）` : v.front,
      speak: v.front,
      options,
      answer: options.indexOf(v.back),
      explanation: v.example || '',
    };
  });
  runQuiz(lang, 'vocab', '單字練習', '✍️', questions, back);
}

function renderGrammarQuiz(lang) {
  const back = `#/lang/${lang.code}`;
  const items = lang.content.grammar || [];
  if (!items.length) {
    app.innerHTML = `<header class="bar"><a class="back" href="${back}">‹ 返回</a></header><p class="hint center">尚無文法題目。</p>`;
    return;
  }
  runQuiz(lang, 'grammar', '文法練習', '📐', items, back);
}

function renderScriptDrill(lang) {
  const back = `#/lang/${lang.code}`;
  const items = (lang.content.reading_drill || []).map((d) => ({
    prompt: d.front,
    speak: d.front,
    options: d.options,
    answer: d.answer,
    explanation: d.back ? `讀音：${d.back}` : '',
  }));
  if (!items.length) return renderLangMenu(lang);
  runQuiz(lang, 'script', '拼音／閱讀辨識', '🔤', items, back);
}

// ---------- 閱讀 ----------
function renderReadingList(lang) {
  const back = `#/lang/${lang.code}`;
  const list = (lang.content.reading || [])
    .map(
      (r) => `
      <button class="mode-card read-item" data-id="${r.id}">
        <span class="mode-icon">📖</span>
        <span class="mode-text"><strong>${esc(r.title)}</strong><small>${esc(r.level)} · ${r.questions.length} 題理解</small></span>
        <span class="chev">›</span>
      </button>`
    )
    .join('');
  app.innerHTML = `
    <header class="bar"><a class="back" href="${back}">‹ 返回</a><h2>📖 閱讀練習</h2></header>
    <section class="mode-list">${list || '<p class="hint center">尚無閱讀內容。</p>'}</section>`;
  app.querySelectorAll('.read-item').forEach((b) => {
    b.onclick = () => renderReading(lang, b.dataset.id);
  });
}

function renderReading(lang, id) {
  const r = (lang.content.reading || []).find((x) => x.id === id);
  if (!r) return renderReadingList(lang);
  const back = `#/lang/${lang.code}/reading`;
  let answered = 0;
  let correct = 0;

  const qHtml = r.questions
    .map((q, qi) => {
      const opts = q.options
        .map((o, i) => `<button class="opt" data-q="${qi}" data-i="${i}">${esc(o)}</button>`)
        .join('');
      return `<div class="rq"><p class="rq-q">${qi + 1}. ${esc(q.q)}</p><div class="options">${opts}</div></div>`;
    })
    .join('');

  app.innerHTML = `
    <header class="bar"><a class="back" href="${back}">‹ 返回</a><h2>📖 ${esc(r.title)}</h2></header>
    <article class="reading">
      <div class="reading-toolbar">
        <span class="lvl">${esc(r.level)}</span>
        ${canSpeak() ? '<button class="btn small" id="read-aloud">🔊 朗讀全文</button>' : ''}
        <button class="btn small" id="toggle-trans">顯示中文翻譯</button>
      </div>
      <div class="reading-text">${esc(r.text).replace(/\n/g, '<br>')}</div>
      <div class="reading-trans hidden" id="trans">${esc(r.translation).replace(/\n/g, '<br>')}</div>
    </article>
    <section class="reading-q">
      <h3>理解測驗</h3>
      ${qHtml}
      <div class="reading-result hidden" id="rresult"></div>
    </section>`;

  const transBtn = document.getElementById('toggle-trans');
  transBtn.onclick = () => {
    const t = document.getElementById('trans');
    t.classList.toggle('hidden');
    transBtn.textContent = t.classList.contains('hidden') ? '顯示中文翻譯' : '隱藏中文翻譯';
  };
  const aloud = document.getElementById('read-aloud');
  if (aloud) aloud.onclick = () => speak(r.text.replace(/\n/g, ' '), lang.tts);

  app.querySelectorAll('.rq').forEach((block, qi) => {
    const q = r.questions[qi];
    block.querySelectorAll('.opt').forEach((b) => {
      b.onclick = () => {
        if (block.dataset.done) return;
        block.dataset.done = '1';
        const btns = block.querySelectorAll('.opt');
        btns.forEach((x) => (x.disabled = true));
        btns[q.answer].classList.add('right');
        const chosen = parseInt(b.dataset.i, 10);
        if (chosen === q.answer) correct++;
        else b.classList.add('wrong');
        answered++;
        if (answered === r.questions.length) {
          store.recordScore(lang.code, 'reading', correct, r.questions.length);
          const res = document.getElementById('rresult');
          res.classList.remove('hidden');
          res.innerHTML = `完成！答對 <strong>${correct}</strong> / ${r.questions.length} 題 ${
            correct === r.questions.length ? '🏆' : '👍'
          }`;
        }
      };
    });
  });
}

// ---------- 單字本（依語言 + 熟練度）----------
function wordItem(v, lang) {
  return `<li class="wb-word">
    <span class="wb-front">${esc(v.front)} ${speakBtn(v.front, lang.tts)}</span>
    ${v.reading ? `<span class="wb-reading">${esc(v.reading)}</span>` : ''}
    <span class="wb-back">${esc(v.back)}</span>
  </li>`;
}

function renderWordbook() {
  let totalStudied = 0;
  const sections = LANGUAGES.map((lang) => {
    const vocab = lang.content.vocab || [];
    const mastered = [];
    const learning = [];
    for (const v of vocab) {
      const c = store.getCard(`${lang.code}:vocab:${v.id}`);
      if (!c) continue;
      ((c.reps || 0) >= 2 ? mastered : learning).push(v);
    }
    totalStudied += mastered.length + learning.length;
    if (!mastered.length && !learning.length) {
      return `
        <section class="wb-lang">
          <div class="wb-head${lang.light ? ' light' : ''}" style="background:${lang.color}"><span>${lang.flag} ${lang.name}</span><span class="wb-count">尚未開始</span></div>
          <p class="hint">去 <a href="#/lang/${lang.code}/flashcards">背單字</a> 翻幾張卡，這裡就會記錄下來。</p>
        </section>`;
    }
    const group = (label, arr, cls) =>
      arr.length
        ? `<div class="wb-group"><div class="wb-group-h ${cls}">${label}（${arr.length}）</div><ul class="wb-list">${arr.map((v) => wordItem(v, lang)).join('')}</ul></div>`
        : '';
    return `
      <section class="wb-lang">
        <div class="wb-head${lang.light ? ' light' : ''}" style="background:${lang.color}">
          <span>${lang.flag} ${lang.name}</span>
          <span class="wb-count">${mastered.length + learning.length} 字</span>
        </div>
        ${group('🌟 已熟', mastered, 'mastered')}
        ${group('🌱 學習中', learning, 'learning')}
      </section>`;
  }).join('');

  app.innerHTML = `
    <header class="topbar"><span class="brand">📚 單字本</span></header>
    <p class="wb-intro">翻卡複習過的單字會自動收進這裡，依語言與熟練度分類。目前共 <strong>${totalStudied}</strong> 字。</p>
    ${sections}`;
  bindSpeak(app);
}

// ---------- 設定 ----------
function syncSectionHtml() {
  if (!sync.isReady()) {
    return `<p class="hint">尚未設定雲端同步。在 <code>js/firebase-config.js</code> 填入 Firebase 設定即可啟用跨裝置同步（步驟見 README）。</p>`;
  }
  const u = sync.getUser();
  if (u) {
    const who = u.displayName || u.email || '已登入';
    const status = sync.isSyncing() ? '同步中…' : `上次同步：${relTime(sync.getLastSync())}`;
    return `
      <p class="set-status">☁️ ${esc(who)}<br><small>${status}</small></p>
      <div class="set-actions">
        <button class="btn primary" id="sync-now" ${sync.isSyncing() ? 'disabled' : ''}>立即同步</button>
        <button class="btn" id="sync-out">登出</button>
      </div>`;
  }
  return `<button class="btn primary big" id="sync-in">☁️ 用 Google 登入同步</button>`;
}

function relTime(ts) {
  if (!ts) return '尚未同步';
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return '剛剛';
  const m = Math.floor(s / 60);
  if (m < 60) return `${m} 分鐘前`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} 小時前`;
  return `${Math.floor(h / 24)} 天前`;
}

function renderSettings() {
  app.innerHTML = `
    <header class="topbar"><span class="brand">☁️ 雲端同步</span></header>
    <section class="dash-card">
      <div class="dash-h">跨裝置同步</div>
      ${syncSectionHtml()}
    </section>
    <section class="dash-card">
      <div class="dash-h">資料</div>
      <p class="hint">進度存在這個瀏覽器（登入後另存雲端）。</p>
      <button class="btn danger" id="reset">清除本機所有進度</button>
    </section>
    <p class="foot">🌱 我的語言練習室 · 進度自動儲存</p>`;

  const inBtn = document.getElementById('sync-in');
  if (inBtn) inBtn.onclick = () => sync.signIn();
  const outBtn = document.getElementById('sync-out');
  if (outBtn) outBtn.onclick = () => sync.signOutUser();
  const nowBtn = document.getElementById('sync-now');
  if (nowBtn) nowBtn.onclick = () => sync.syncNow();
  document.getElementById('reset').onclick = () => {
    if (confirm('確定要清除這個瀏覽器上的所有學習進度嗎？此動作無法復原。')) {
      store.replaceState({});
      renderSettings();
    }
  };
}

// ---------- 雲端同步初始化 ----------
sync.initSync();
sync.onChange(() => {
  const hash = location.hash.slice(1) || '/';
  if (hash === '/settings') renderSettings();
});
