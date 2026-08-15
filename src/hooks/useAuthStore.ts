import { create } from 'zustand';

import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  type Unsubscribe,
} from 'firebase/auth';

import {
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore';

import { auth, db } from '../services/firebase';
import type { UserProfile, UserRole } from '../types';

interface AuthState {
  user: UserProfile | null;
  isLoading: boolean;
  initialized: boolean;

  initAuth: () => Promise<void>;

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

let authUnsubscribe: Unsubscribe | null = null;
let authInitialization: Promise<void> | null = null;

const getUserProfile = async (
  firebaseUid: string,
  fallbackEmail: string,
  fallbackName: string
): Promise<UserProfile> => {
  const userRef = doc(db, 'users', firebaseUid);
  const userSnapshot = await getDoc(userRef);

  if (userSnapshot.exists()) {
    const data =
      userSnapshot.data() as Omit<UserProfile, 'uid'>;

    return {
      uid: firebaseUid,
      ...data,
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

export const useAuthStore = create<AuthState>(
  (set) => ({
    user: null,
    isLoading: true,
    initialized: false,

    initAuth: async (): Promise<void> => {
      if (authInitialization) {
        return authInitialization;
      }

      authInitialization = new Promise<void>(
        (resolve) => {
          let firstCallbackCompleted = false;

          const finishInitialization = () => {
            if (firstCallbackCompleted) {
              return;
            }

            firstCallbackCompleted = true;
            resolve();
          };

          authUnsubscribe?.();

          authUnsubscribe = onAuthStateChanged(
            auth,
            async (firebaseUser) => {
              console.log(
                '[Auth] auth state changed:',
                firebaseUser?.uid ?? 'signed out'
              );

              try {
                if (!firebaseUser) {
                  set({
                    user: null,
                    isLoading: false,
                    initialized: true,
                  });

                  finishInitialization();
                  return;
                }

                const profile =
                  await getUserProfile(
                    firebaseUser.uid,
                    firebaseUser.email ?? '',
                    firebaseUser.displayName ?? ''
                  );

                set({
                  user: profile,
                  isLoading: false,
                  initialized: true,
                });

                finishInitialization();
              } catch (error) {
                console.error(
                  '[Auth] profile loading error:',
                  error
                );

                set({
                  user: null,
                  isLoading: false,
                  initialized: true,
                });

                finishInitialization();
              }
            },
            (error) => {
              console.error(
                '[Auth] auth listener error:',
                error
              );

              set({
                user: null,
                isLoading: false,
                initialized: true,
              });

              finishInitialization();
            }
          );
        }
      );

      return authInitialization;
    },

    login: async (
      email,
      password
    ): Promise<void> => {
      set({ isLoading: true });

      try {
        const credential =
          await signInWithEmailAndPassword(
            auth,
            email.trim().toLowerCase(),
            password
          );

        const profile = await getUserProfile(
          credential.user.uid,
          credential.user.email ??
            email.trim().toLowerCase(),
          credential.user.displayName ?? ''
        );

        set({
          user: profile,
          isLoading: false,
          initialized: true,
        });
      } catch (error) {
        set({ isLoading: false });
        throw error;
      }
    },

    register: async (
      email,
      password,
      displayName,
      role,
      phoneNumber
    ): Promise<void> => {
      set({ isLoading: true });

      try {
        const cleanEmail = email
          .trim()
          .toLowerCase();

        const cleanName = displayName.trim();
        const cleanPhone = phoneNumber?.trim();

        const credential =
          await createUserWithEmailAndPassword(
            auth,
            cleanEmail,
            password
          );

        await updateProfile(credential.user, {
          displayName: cleanName,
        });

        const profile: UserProfile = {
          uid: credential.user.uid,
          email: cleanEmail,
          displayName: cleanName,
          role,
          phoneNumber: cleanPhone || undefined,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        await setDoc(
          doc(db, 'users', credential.user.uid),
          {
            ...profile,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          }
        );

        set({
          user: profile,
          isLoading: false,
          initialized: true,
        });
      } catch (error) {
        set({ isLoading: false });
        throw error;
      }
    },

    forgotPassword: async (
      email
    ): Promise<void> => {
      await sendPasswordResetEmail(
        auth,
        email.trim().toLowerCase()
      );
    },

    logout: async (): Promise<void> => {
      await signOut(auth);

      set({
        user: null,
        isLoading: false,
        initialized: true,
      });
    },
  })
);