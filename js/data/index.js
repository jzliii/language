import ja from './ja.js';
import it from './it.js';
import sv from './sv.js';
import ko from './ko.js';
import en from './en.js';

// 每個語言的中繼資料 + 內容
export const LANGUAGES = [
  { code: 'ja', name: '日語', flag: '🇯🇵', tts: 'ja-JP', level: 'N5–N4', content: ja },
  { code: 'ko', name: '韓語', flag: '🇰🇷', tts: 'ko-KR', level: '加強閱讀・文法', content: ko },
  { code: 'en', name: '英文', flag: '🇬🇧', tts: 'en-US', level: '多益 600–750', content: en },
  { code: 'it', name: '義大利語', flag: '🇮🇹', tts: 'it-IT', level: '點餐・打招呼', content: it },
  { code: 'sv', name: '瑞典語', flag: '🇸🇪', tts: 'sv-SE', level: '發音・咖啡', content: sv },
];

export function getLang(code) {
  return LANGUAGES.find((l) => l.code === code);
}
