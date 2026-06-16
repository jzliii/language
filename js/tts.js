// 用瀏覽器內建 Web Speech API 朗讀單字 / 句子。
let voicesReady = false;

if (typeof speechSynthesis !== 'undefined') {
  speechSynthesis.onvoiceschanged = () => {
    voicesReady = true;
  };
  // 觸發載入
  speechSynthesis.getVoices();
}

export function canSpeak() {
  return typeof speechSynthesis !== 'undefined' && typeof SpeechSynthesisUtterance !== 'undefined';
}

// 各語言偏好的語音名稱（依許願：英=RP 英腔、西=西班牙、義=標準義語）。
// 找得到就優先用，找不到就退回同語言任一可用語音。
const PREFERRED = {
  'en-GB': ['Google UK English', 'Daniel', 'Arthur', 'Serena', 'Kate', 'Sonia'],
  'es-ES': ['Google español de España', 'Google español', 'Mónica', 'Monica', 'Jorge'],
  'it-IT': ['Google italiano', 'Alice', 'Federica', 'Luca'],
  'ja-JP': ['Google 日本語', 'Kyoko', 'O-ren'],
  'ko-KR': ['Google 한국의', 'Yuna', 'Sora'],
  'sv-SE': ['Google svenska', 'Alva', 'Klara'],
};

function pickVoice(lang) {
  const voices = speechSynthesis.getVoices();
  const want = lang.toLowerCase();
  const prefix = lang.split('-')[0].toLowerCase();
  // 完全符合地區的語音（如 en-GB），優先挑偏好名單內的
  const exact = voices.filter((v) => v.lang.toLowerCase().replace('_', '-') === want);
  const prefs = PREFERRED[lang] || [];
  const byName = (list) =>
    list.find((v) => prefs.some((p) => v.name.toLowerCase().includes(p.toLowerCase())));
  return (
    byName(exact) ||
    exact[0] ||
    voices.find((v) => v.lang.toLowerCase().startsWith(prefix))
  );
}

export function speak(text, lang) {
  if (!canSpeak()) return false;
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = lang;
  const v = pickVoice(lang);
  if (v) u.voice = v;
  u.rate = 0.9;
  speechSynthesis.speak(u);
  return true;
}

// 是否有可用於該語言的語音
export function hasVoiceFor(lang) {
  if (!canSpeak()) return false;
  return !!pickVoice(lang);
}
