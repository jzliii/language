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

function pickVoice(lang) {
  const voices = speechSynthesis.getVoices();
  // 先找完全符合，再找語言前綴符合（如 en）
  return (
    voices.find((v) => v.lang.toLowerCase() === lang.toLowerCase()) ||
    voices.find((v) => v.lang.toLowerCase().startsWith(lang.split('-')[0].toLowerCase()))
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
