import { create } from 'zustand';
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from 'firebase/auth';
import {
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore';

import { auth, db } from '../services/firebase';
import { UserProfile, UserRole } from '../types';

interface AuthState {
  user: UserProfile | null;
  isLoading: boolean;
  initialized: boolean;

  initAuth: () => () => void;

  login: (
    email: string,
    password: string
  ) => Promise<void>;

  register: (
    email: string,
    password: string,
    displayName: string,
    role: UserRole,
    phoneNumber?: string
  ) => Promise<void>;

  forgotPassword: (email: string) => Promise<void>;

  logout: () => Promise<void>;
}

const getUserProfile = async (
  firebaseUid: string,
  fallbackEmail: string,
  fallbackName: string
): Promise<UserProfile> => {
  const userRef = doc(db, 'users', firebaseUid);
  const userSnapshot = await getDoc(userRef);

  if (userSnapshot.exists()) {
    return {
      uid: firebaseUid,
      ...(userSnapshot.data() as Omit<UserProfile, 'uid'>),
    };
  }

  return {
    uid: firebaseUid,
    email: fallbackEmail,
    displayName: fallbackName,
    role: 'family',
    createdAt: new Date(),
    updatedAt: new Date(),
  };
};

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,
  initialized: false,

  initAuth: () => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (!firebaseUser) {
          set({
            user: null,
            isLoading: false,
            initialized: true,
          });
          return;
        }

        const profile = await getUserProfile(
          firebaseUser.uid,
          firebaseUser.email ?? '',
          firebaseUser.displayName ?? ''
        );

        set({
          user: profile,
          isLoading: false,
          initialized: true,
        });
      } catch (error) {
        console.error('Auth initialization error:', error);

        set({
          user: null,
          isLoading: false,
          initialized: true,
        });
      }
    });

    return unsubscribe;
  },

  login: async (email, password) => {
    const credential = await signInWithEmailAndPassword(
      auth,
      email.trim(),
      password
    );

    const profile = await getUserProfile(
      credential.user.uid,
      credential.user.email ?? email.trim(),
      credential.user.displayName ?? ''
    );

    set({
      user: profile,
      isLoading: false,
      initialized: true,
    });
  },

  register: async (
    email,
    password,
    displayName,
    role,
    phoneNumber
  ) => {
    const credential = await createUserWithEmailAndPassword(
      auth,
      email.trim(),
      password
    );

    await updateProfile(credential.user, {
      displayName: displayName.trim(),
    });

    const profile: UserProfile = {
      uid: credential.user.uid,
      email: email.trim(),
      displayName: displayName.trim(),
      role,
      phoneNumber: phoneNumber?.trim() || undefined,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await setDoc(doc(db, 'users', credential.user.uid), {
      ...profile,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    set({
      user: profile,
      isLoading: false,
      initialized: true,
    });
  },

  forgotPassword: async (email) => {
    await sendPasswordResetEmail(auth, email.trim());
  },

  logout: async () => {
    await signOut(auth);

    set({
      user: null,
      isLoading: false,
      initialized: true,
    });

    // Important:
    // Do not call AsyncStorage.clear().
    // The onboarding-completed flag must remain saved.
  },
}));