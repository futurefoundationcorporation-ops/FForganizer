import { initializeApp, getApps, getApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

// Padrão de inicialização robusto: usa o app existente ou cria um novo.
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Exporta os serviços do Firebase associados explicitamente ao nosso app.
export const auth = getAuth(app);
export const db = getFirestore(app);

export async function callFunction(path, options = {}) {
  const res = await fetch(`/api/${path}`, {
    method: options.method || 'POST',
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    credentials: 'include',
    body: options.body ? JSON.stringify(options.body) : undefined,
  })
  const data = await res.json()
  return { ok: res.ok, data }
}
