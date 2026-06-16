import ja from './ja.js';
import it from './it.js';
import sv from './sv.js';
import ko from './ko.js';
import en from './en.js';
import es from './es.js';

// 每個語言的中繼資料 + 內容。color：色卡底色；light：底色偏亮時用深色字。
export const LANGUAGES = [
  { code: 'ja', name: '日語', short: '日', flag: '🇯🇵', tts: 'ja-JP', level: 'N5–N4', color: '#C0392B', content: ja },
  { code: 'ko', name: '韓語', short: '韓', flag: '🇰🇷', tts: 'ko-KR', level: '加強閱讀・文法', color: '#7E8B3A', content: ko },
  { code: 'en', name: '英文', short: '英', flag: '🇬🇧', tts: 'en-US', level: '多益 600–750', color: '#2E5A87', content: en },
  { code: 'it', name: '義大利語', short: '義', flag: '🇮🇹', tts: 'it-IT', level: '點餐・打招呼', color: '#6B4A2B', content: it },
  { code: 'sv', name: '瑞典語', short: '瑞', flag: '🇸🇪', tts: 'sv-SE', level: '發音・咖啡', color: '#E3A92B', light: true, content: sv },
  { code: 'es', name: '西班牙語', short: '西', flag: '🇪🇸', tts: 'es-ES', level: '旅行・基礎對話', color: '#CF6B2C', content: es },
];

export function getLang(code) {
  return LANGUAGES.find((l) => l.code === code);
}
