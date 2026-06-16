// ⚙️ Firebase 設定（duolange-c6ef1）
// 這些是 Firebase 的「網頁用 config」，本來就會出現在前端原始碼、可以公開；
// 真正的保護來自 Firestore 安全規則（每人只能存取自己的 progress 文件）。
//
// 跨裝置同步是用 CDN 版 Firebase SDK（見 js/sync.js 從 gstatic 載入），
// 純靜態網站、不需要 npm 或打包工具。
export const firebaseConfig = {
  apiKey: 'AIzaSyC-BsgagCEvxRw42IoDJ5gqrMVuP72K9zQ',
  authDomain: 'duolange-c6ef1.firebaseapp.com',
  projectId: 'duolange-c6ef1',
  storageBucket: 'duolange-c6ef1.firebasestorage.app',
  messagingSenderId: '793007099961',
  appId: '1:793007099961:web:d2cf31f5b191f80fae3de8',
  measurementId: 'G-Y7FZP2L3GS',
};

// 是否已填入真正的設定（用來決定要不要啟用同步功能）
export const isConfigured = !String(firebaseConfig.apiKey).startsWith('YOUR_');
