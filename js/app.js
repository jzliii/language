import { LANGUAGES, getLang } from './data/index.js';
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
  canSpeak()
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

// 計算某語言該模式「到期需複習」的數量（僅 flashcards）
function dueCount(lang) {
  const vocab = lang.content.vocab || [];
  return vocab.filter((v) => srs.isDue(store.getCard(`${lang.code}:vocab:${v.id}`))).length;
}

// ---------- 路由 ----------
function router() {
  const hash = location.hash.slice(1) || '/';
  const parts = hash.split('/').filter(Boolean); // e.g. ['lang','ja','vocab']
  window.scrollTo(0, 0);
  if (parts[0] === 'lang' && parts[1]) {
    const lang = getLang(parts[1]);
    if (!lang) return renderHome();
    const mode = parts[2];
    if (!mode) return renderLangMenu(lang);
    if (mode === 'flashcards') return renderFlashcards(lang);
    if (mode === 'vocab') return renderVocabQuiz(lang);
    if (mode === 'grammar') return renderGrammarQuiz(lang);
    if (mode === 'reading') return renderReadingList(lang);
    if (mode === 'reading' && parts[3]) return renderReading(lang, parts[3]);
    if (mode === 'read' && parts[3]) return renderReading(lang, parts[3]);
    if (mode === 'script') return renderScriptDrill(lang);
  }
  renderHome();
}

window.addEventListener('hashchange', router);
window.addEventListener('DOMContentLoaded', router);

// 雲端同步：載入時初始化；登入狀態或合併完成後，若正在首頁就刷新畫面（更新待複習數與按鈕）
sync.initSync();
sync.onChange(() => {
  const hash = location.hash.slice(1) || '/';
  if (hash === '/') renderHome();
});

// ---------- 首頁 ----------
function renderHome() {
  const streak = store.getStreak();
  const cards = LANGUAGES.map((l) => {
    const due = dueCount(l);
    return `
      <a class="lang-card" href="#/lang/${l.code}">
        <span class="flag">${l.flag}</span>
        <span class="lang-info">
          <strong>${l.name}</strong>
          <small>${esc(l.level)}</small>
        </span>
        ${due > 0 ? `<span class="badge" title="待複習單字">${due}</span>` : '<span class="badge done">✓</span>'}
      </a>`;
  }).join('');

  app.innerHTML = `
    <header class="hero">
      <h1>🌍 我的語言練習室</h1>
      <p class="sub">背單字 · 文法 · 閱讀，五種語言一個地方搞定</p>
      <div class="streak">🔥 連續學習 <strong>${streak}</strong> 天</div>
      <div class="sync-bar">${syncBarHtml()}</div>
    </header>
    <section class="lang-grid">${cards}</section>
    <footer class="foot">進度自動存在這個瀏覽器裡 · 每天回來複習到期的單字 💪</footer>`;
  bindSyncBar();
}

// ---------- 雲端同步狀態列 ----------
function syncBarHtml() {
  if (!sync.isReady()) return ''; // 尚未設定 Firebase 就不顯示
  const u = sync.getUser();
  if (u) {
    const who = u.displayName || u.email || '已登入';
    return `<span class="sync-status">☁️ 已同步 · ${esc(who)}</span>
      <button class="btn small" id="sync-out">登出</button>`;
  }
  return `<button class="btn small" id="sync-in">☁️ 用 Google 登入同步</button>`;
}

function bindSyncBar() {
  const inBtn = document.getElementById('sync-in');
  if (inBtn) inBtn.onclick = () => sync.signIn();
  const outBtn = document.getElementById('sync-out');
  if (outBtn) outBtn.onclick = () => sync.signOutUser();
}

// ---------- 語言選單 ----------
function renderLangMenu(lang) {
  const due = dueCount(lang);
  const modes = MODES.filter((m) => !m.needs || lang.content[m.needs]?.length).map((m) => {
    const count = m.id === 'reading'
      ? (lang.content.reading?.length || 0)
      : m.id === 'flashcards'
        ? due
        : null;
    const score = store.getScore(lang.code, m.id);
    let meta = '';
    if (m.id === 'flashcards') meta = due > 0 ? `<em>${due} 個待複習</em>` : '<em>今天都複習完了 ✓</em>';
    else if (m.id === 'reading') meta = `<em>${count} 篇短文</em>`;
    else if (score) meta = `<em>最佳 ${score.best}%</em>`;
    return `
      <a class="mode-card" href="#/lang/${lang.code}/${m.id}">
        <span class="mode-icon">${m.icon}</span>
        <span class="mode-text"><strong>${m.name}</strong><small>${m.desc}</small>${meta}</span>
        <span class="chev">›</span>
      </a>`;
  }).join('');

  app.innerHTML = `
    <header class="bar">
      <a class="back" href="#/">‹ 回首頁</a>
      <h2>${lang.flag} ${lang.name} <small>${esc(lang.level)}</small></h2>
    </header>
    <section class="mode-list">${modes}</section>`;
  if (!hasVoiceFor(lang.tts)) {
    app.insertAdjacentHTML('beforeend',
      `<p class="hint">提示：你的瀏覽器可能沒有安裝「${esc(lang.name)}」語音，朗讀功能或許無法發聲。Chrome／Edge 通常支援最完整。</p>`);
  }
}

// ---------- 背單字（SRS 翻卡）----------
function renderFlashcards(lang) {
  const vocab = lang.content.vocab || [];
  let queue = vocab.filter((v) => srs.isDue(store.getCard(`${lang.code}:vocab:${v.id}`)));
  const reviewingAll = queue.length === 0;
  if (reviewingAll) queue = shuffle(vocab).slice(0, Math.min(vocab.length, 15));
  else queue = shuffle(queue);

  let idx = 0;
  let done = 0;

  function showCard() {
    if (idx >= queue.length) return finish();
    const v = queue[idx];
    app.innerHTML = `
      <header class="bar">
        <a class="back" href="#/lang/${lang.code}">‹ 返回</a>
        <h2>🃏 背單字</h2>
        <span class="progress-pill">${idx + 1} / ${queue.length}</span>
      </header>
      ${reviewingAll ? '<p class="hint center">今天沒有到期的卡片，這是額外複習回合 🌟</p>' : ''}
      <div class="flashcard" id="card">
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
    const v = queue[idx];
    const key = `${lang.code}:vocab:${v.id}`;
    const card = store.getCard(key) || srs.newCard();
    const updated = srs.review(card, q);
    store.setCard(key, updated);
    // 答錯的卡片排到隊伍後面再練一次
    if (q === 0) queue.push(v);
    done++;
    idx++;
    showCard();
  }

  function finish() {
    store.markStudied();
    app.innerHTML = `
      <header class="bar"><a class="back" href="#/lang/${lang.code}">‹ 返回</a><h2>🃏 完成</h2></header>
      <div class="result">
        <div class="result-big">👏</div>
        <p>這回合複習了 <strong>${done}</strong> 張卡片！</p>
        <div class="result-actions">
          <a class="btn primary" href="#/lang/${lang.code}/flashcards">再來一輪</a>
          <a class="btn" href="#/lang/${lang.code}">回到 ${lang.name} 選單</a>
        </div>
      </div>`;
    // 重新綁定「再來一輪」：因為 hash 相同不會觸發 router
    app.querySelector('a[href$="/flashcards"]').onclick = (e) => {
      e.preventDefault();
      renderFlashcards(lang);
    };
  }

  showCard();
}

// ---------- 通用選擇題測驗 ----------
function runQuiz(lang, mode, title, icon, questions, backHref) {
  const qs = shuffle(questions);
  let idx = 0;
  let correct = 0;

  function show() {
    if (idx >= qs.length) return finish();
    const q = qs[idx];
    const opts = q.options
      .map((o, i) => `<button class="opt" data-i="${i}">${esc(o)}</button>`)
      .join('');
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
    const pct = Math.round((correct / qs.length) * 100);
    const emoji = pct >= 90 ? '🏆' : pct >= 70 ? '🎉' : pct >= 50 ? '💪' : '📚';
    app.innerHTML = `
      <header class="bar"><a class="back" href="${backHref}">‹ 返回</a><h2>${icon} 結果</h2></header>
      <div class="result">
        <div class="result-big">${emoji}</div>
        <p>答對 <strong>${correct}</strong> / ${qs.length} 題（${pct}%）</p>
        <div class="result-actions">
          <button class="btn primary" id="retry">再做一次</button>
          <a class="btn" href="${backHref}">回到選單</a>
        </div>
      </div>`;
    document.getElementById('retry').onclick = () =>
      runQuiz(lang, mode, title, icon, questions, backHref);
  }

  show();
}

// ---------- 單字選擇題 ----------
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

// ---------- 文法選擇題 ----------
function renderGrammarQuiz(lang) {
  const back = `#/lang/${lang.code}`;
  const items = lang.content.grammar || [];
  if (!items.length) {
    app.innerHTML = `<header class="bar"><a class="back" href="${back}">‹ 返回</a></header><p class="hint center">尚無文法題目。</p>`;
    return;
  }
  runQuiz(lang, 'grammar', '文法練習', '📐', items, back);
}

// ---------- 拼音／閱讀辨識（韓語等）----------
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

// ---------- 閱讀列表 ----------
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

// ---------- 單篇閱讀 ----------
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
