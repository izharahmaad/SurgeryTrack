import {
  getApp,
  getApps,
  initializeApp,
} from 'firebase/app';

import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  getAuth,
  initializeAuth,
  sendPasswordResetEmail,
  type Auth,
} from 'firebase/auth';

// @ts-ignore: Firebase React Native persistence export is missing from the typings
import { getReactNativePersistence } from 'firebase/auth';

console.log('[firebase.ts] module loading');

const firebaseConfig = {
  apiKey: 'AIzaSyD0zrKbNskPDKkMzrHv-9Wofs0BT4kTEwk',
  authDomain: 'surgerytrack-ec896.firebaseapp.com',
  projectId: 'surgerytrack-ec896',
  storageBucket: 'surgerytrack-ec896.firebasestorage.app',
  messagingSenderId: '1015502901440',
  appId: '1:1015502901440:web:cddabfe7081b7b212fdd25',
  measurementId: 'G-E4FZJ5W8PS',
};

const app = getApps().length > 0
  ? getApp()
  : initializeApp(firebaseConfig);

console.log('[firebase.ts] app initialized:', app.name);

type FirebaseGlobal = typeof globalThis & {
  __SURGERYTRACK_AUTH__?: Auth;
};

const firebaseGlobal = globalThis as FirebaseGlobal;

let auth: Auth;

if (firebaseGlobal.__SURGERYTRACK_AUTH__) {
  console.log('[firebase.ts] reusing existing auth instance');
  auth = firebaseGlobal.__SURGERYTRACK_AUTH__;
} else {
  try {
    console.log('[firebase.ts] calling initializeAuth with persistence');

    auth = initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage),
    });

    console.log('[firebase.ts] initializeAuth succeeded');
  } catch (error: unknown) {
    const firebaseError = error as { code?: string };

    console.error('[firebase.ts] initializeAuth failed:', error);

    if (firebaseError.code === 'auth/already-initialized') {
      console.log('[firebase.ts] falling back to getAuth (already-initialized)');
      auth = getAuth(app);
    } else {
      console.log('[firebase.ts] falling back to getAuth (unexpected error)');
      auth = getAuth(app);
    }
  }

  firebaseGlobal.__SURGERYTRACK_AUTH__ = auth;
}

console.log('[firebase.ts] auth ready');

const db = getFirestore(app);
const storage = getStorage(app);

console.log('[firebase.ts] firestore and storage ready — module fully loaded');

const sendPasswordReset = async (email: string): Promise<void> => {
  await sendPasswordResetEmail(auth, email.trim().toLowerCase());
};

export {
  app,
  auth,
  db,
  storage,
  sendPasswordReset,
};

export default app;