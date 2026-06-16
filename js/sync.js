// 雲端同步：用 Firebase（Google 登入 + Firestore）把練習進度跨裝置同步。
// 設計：登入後先把雲端進度與本機合併，之後每次進度變動都（防抖後）寫回雲端。
import { firebaseConfig, isConfigured } from './firebase-config.js';
import * as store from './store.js';

const SDK = 'https://www.gstatic.com/firebasejs/10.12.2';

let authInstance = null;
let db = null;
let docRef = null;
let saveTimer = null;
let user = null;
const changeListeners = [];

export function isReady() {
  return isConfigured;
}

export function getUser() {
  return user;
}

export function onChange(fn) {
  changeListeners.push(fn);
}

function emit() {
  changeListeners.forEach((fn) => {
    try {
      fn(user);
    } catch (e) {
      console.warn('同步狀態回呼失敗', e);
    }
  });
}

// 載入時呼叫一次：初始化 Firebase 並監聽登入狀態
export async function initSync() {
  if (!isConfigured) return;
  try {
    const [{ initializeApp }, auth, firestore] = await Promise.all([
      import(`${SDK}/firebase-app.js`),
      import(`${SDK}/firebase-auth.js`),
      import(`${SDK}/firebase-firestore.js`),
    ]);
    const app = initializeApp(firebaseConfig);
    authInstance = auth.getAuth(app);
    db = firestore.getFirestore(app);

    // 進度一變動就排程寫回雲端（登入後 docRef 才有值）
    store.subscribe(scheduleSave);

    auth.onAuthStateChanged(authInstance, async (u) => {
      user = u;
      if (u) {
        docRef = firestore.doc(db, 'progress', u.uid);
        await pullAndMerge(firestore);
      } else {
        docRef = null;
      }
      emit();
    });
  } catch (e) {
    console.warn('Firebase 初始化失敗', e);
  }
}

async function pullAndMerge(firestore) {
  try {
    const snap = await firestore.getDoc(docRef);
    const remote = snap.exists() ? snap.data().state : null;
    const merged = store.merge(store.getState(), remote);
    store.replaceState(merged); // 寫回本機（也會觸發一次雲端寫入）
    await firestore.setDoc(docRef, { state: merged, updatedAt: Date.now() });
  } catch (e) {
    console.warn('雲端進度合併失敗', e);
  }
}

function scheduleSave() {
  if (!docRef) return; // 尚未登入就只存本機
  clearTimeout(saveTimer);
  saveTimer = setTimeout(saveNow, 1500);
}

async function saveNow() {
  if (!docRef) return;
  try {
    const firestore = await import(`${SDK}/firebase-firestore.js`);
    await firestore.setDoc(docRef, { state: store.getState(), updatedAt: Date.now() });
  } catch (e) {
    console.warn('寫入雲端失敗', e);
  }
}

export async function signIn() {
  if (!isConfigured || !authInstance) return;
  const auth = await import(`${SDK}/firebase-auth.js`);
  const provider = new auth.GoogleAuthProvider();
  try {
    await auth.signInWithPopup(authInstance, provider);
  } catch (e) {
    console.warn('登入失敗', e);
    alert('登入失敗，請再試一次。若一直失敗，請確認 Firebase 已把 jzliii.github.io 加入授權網域。');
  }
}

export async function signOutUser() {
  if (!authInstance) return;
  const auth = await import(`${SDK}/firebase-auth.js`);
  await auth.signOut(authInstance);
  docRef = null;
}
