## 👋 Hi, I’m @jzliii

- 🌱 我正在學日語 🇯🇵、韓語 🇰🇷、英文 🇬🇧、義大利語 🇮🇹、瑞典語 🇸🇪
- 🧠 為了不再每天在不同 App 之間切換，我做了一個小工具來複習

### 🌍 我的語言練習室

一個放在瀏覽器就能用的小網站：**背單字（間隔複習）· 文法練習 · 閱讀練習**，五種語言集中在同一個地方。

👉 **[開始練習](https://jzliii.github.io/language/)**

| 功能 | 說明 |
| --- | --- |
| 🃏 背單字 | 翻卡記憶，內建 SM-2 間隔複習，系統幫你排好複習時間 |
| ✍️ 單字練習 | 選擇題快速測驗單字意思 |
| 📐 文法練習 | 助詞、時態、固定用法的選擇／填空題 |
| 📖 閱讀練習 | 短文 + 中文翻譯 + 理解測驗 |
| 🔊 朗讀 | 用瀏覽器語音念出單字與課文，練發音與聽力 |

> 進度自動存在你的瀏覽器裡，不需要登入。每天回來複習到期的單字就好 💪

---

### ☁️ 跨裝置同步（Firebase，選用）

預設進度只存在當下這台裝置的瀏覽器。想在手機／電腦之間同步，登入 Google 即可。
需先建立一個免費 Firebase 專案，設定一次就好：

1. **建立專案**：到 [Firebase Console](https://console.firebase.google.com/) → 新增專案（免費的 Spark 方案即可）。
2. **開啟 Google 登入**：左側 **Build → Authentication → Get started → Sign-in method →** 啟用 **Google**。
3. **建立資料庫**：左側 **Build → Firestore Database → Create database**（選 *production mode*）。
4. **加入授權網域**：**Authentication → Settings → Authorized domains →** 加入 `jzliii.github.io`。
5. **取得設定值**：專案設定（齒輪 ⚙️）→ 一般 → 你的應用程式 → 若還沒有，點 **</>（Web）** 新增一個網頁應用 → 複製 **firebaseConfig** 內的 `apiKey`、`authDomain`、`projectId`、`appId`。
6. **填入專案**：把上述值貼進 [`js/firebase-config.js`](js/firebase-config.js)，commit 後推到 `main`。
7. **設定安全規則**：Firestore → **Rules** 貼上下面這段（每個人只能存取自己的進度），按 **Publish**：

   ```
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /progress/{uid} {
         allow read, write: if request.auth != null && request.auth.uid == uid;
       }
     }
   }
   ```

設好後，首頁會出現「☁️ 用 Google 登入同步」按鈕。登入後，本機進度會與雲端**自動合併**，之後每次練習都會即時存到雲端；換裝置登入同一個 Google 帳號就能接著練。未設定 `firebase-config.js` 前，網站照常運作，只是不顯示同步按鈕。

<!---
jzliii/jzliii is a ✨ special ✨ repository because its `README.md` (this file) appears on your GitHub profile.
You can click the Preview link to take a look at your changes.
--->
