import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';
import { getMessaging, isSupported } from 'firebase/messaging';

// Configuração oficial do projeto Controle Financeiro Família Bazil no Firebase
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyA9v2ItA82IEYUjFB-sDEP_QdR0GhnGGYs",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "controle-financeiro-4b59c.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "controle-financeiro-4b59c",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "controle-financeiro-4b59c.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "63089218959",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:63089218959:web:a8a543b37c82653b2ce7fa",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-DN03TVBC9S"
};

// Inicializa o Firebase
const app = initializeApp(firebaseConfig);

// Instâncias dos serviços do Firebase
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);

// Notificações Push (FCM) para Web e Android (APK)
export const getFCM = async () => {
  const supported = await isSupported();
  if (supported) {
    return getMessaging(app);
  }
  return null;
};

export default app;
