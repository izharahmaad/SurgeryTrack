import { create } from 'zustand';
import { UserProfile, UserRole } from '../types';
import { auth, db, sendPasswordReset } from '../services/firebase';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updateProfile,
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';

interface AuthState {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setUser: (user: UserProfile | null) => void;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string, role: UserRole, phone?: string) => Promise<void>;
  logout: () => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  initAuth: () => () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,

  setUser: (user) => set({ user, isAuthenticated: !!user }),

  login: async (email, password) => {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    const userDoc = await getDoc(doc(db, 'users', cred.user.uid));
    if (userDoc.exists()) {
      set({ user: userDoc.data() as UserProfile, isAuthenticated: true });
    } else {
      throw new Error('User profile not found');
    }
  },

  register: async (email, password, name, role, phone) => {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(cred.user, { displayName: name });

    // ✅ FIXED: Build object without undefined values
    const userProfile: Record<string, any> = {
      uid: cred.user.uid,
      email: email.trim().toLowerCase(),
      displayName: name.trim(),
      role: role,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    // Only add fields that have values (no undefined!)
    if (phone && phone.trim()) {
      userProfile.phoneNumber = phone.trim();
    }

    await setDoc(doc(db, 'users', cred.user.uid), userProfile);

    set({ 
      user: {
        uid: cred.user.uid,
        email: email.trim().toLowerCase(),
        displayName: name.trim(),
        role: role,
        phoneNumber: phone ? phone.trim() : undefined,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as UserProfile, 
      isAuthenticated: true 
    });
  },

  logout: async () => {
    await signOut(auth);
    set({ user: null, isAuthenticated: false });
  },

  forgotPassword: async (email) => {
    await sendPasswordReset(email);
  },

  initAuth: () => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          if (userDoc.exists()) {
            const data = userDoc.data();
            set({ 
              user: {
                uid: data.uid,
                email: data.email,
                displayName: data.displayName,
                role: data.role,
                hospitalId: data.hospitalId,
                phoneNumber: data.phoneNumber,
                avatar: data.avatar,
                createdAt: data.createdAt?.toDate() || new Date(),
                updatedAt: data.updatedAt?.toDate() || new Date(),
              } as UserProfile, 
              isAuthenticated: true, 
              isLoading: false 
            });
          } else {
            await signOut(auth);
            set({ user: null, isAuthenticated: false, isLoading: false });
          }
        } catch (error) {
          console.error('Auth init error:', error);
          set({ user: null, isAuthenticated: false, isLoading: false });
        }
      } else {
        set({ user: null, isAuthenticated: false, isLoading: false });
      }
    });

    return unsubscribe;
  },
}));