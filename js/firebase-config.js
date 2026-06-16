// ⚙️ Firebase 設定
// 把下面的值換成你自己的 Firebase 專案設定：
//   Firebase Console → 專案設定（齒輪）→「一般」→ 你的應用程式 → SDK 設定與配置 → Config
// 設定好之前，網站照常運作，只是首頁的「雲端同步」按鈕會提示尚未設定。
//
// 詳細步驟見 README 的「跨裝置同步（Firebase）」章節。
export const firebaseConfig = {
  apiKey: 'YOUR_API_KEY',
  authDomain: 'YOUR_PROJECT_ID.firebaseapp.com',
  projectId: 'YOUR_PROJECT_ID',
  appId: 'YOUR_APP_ID',
};

// 是否已填入真正的設定（用來決定要不要啟用同步功能）
export const isConfigured = !String(firebaseConfig.apiKey).startsWith('YOUR_');
