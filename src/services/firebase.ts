import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import AsyncStorage from '@react-native-async-storage/async-storage';
// @ts-ignore
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyD0zrKbNskPDKkMzrHv-9Wofs0BT4kTEwk",
  authDomain: "surgerytrack-ec896.firebaseapp.com",
  projectId: "surgerytrack-ec896",
  storageBucket: "surgerytrack-ec896.firebasestorage.app",
  messagingSenderId: "1015502901440",
  appId: "1:1015502901440:web:cddabfe7081b7b212fdd25",
  measurementId: "G-E4FZJ5W8PS"
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

const g = globalThis as any;
if (!g.__AUTH__) {
  g.__AUTH__ = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
}

const auth = g.__AUTH__;
const db = getFirestore(app);
const storage = getStorage(app);

// Named export for password reset
import { sendPasswordResetEmail as firebaseSendPasswordResetEmail } from 'firebase/auth';
const sendPasswordReset = (email: string) => firebaseSendPasswordResetEmail(auth, email);

export { app, auth, db, storage, sendPasswordReset };
export default app;