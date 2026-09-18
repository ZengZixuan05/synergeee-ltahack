'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import {
  User,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
  updateProfile as updateFirebaseProfile,
} from 'firebase/auth';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { auth, db, isFirebaseConfigured } from '@/lib/firebase';
import { UserProfile, OnboardingFormState } from '@/types/auth';
import { CommuterPreferences, RegularRoute } from '@/types';
import { MDM_LIM_COMMUTER } from '@/fixtures/mdm-lim';

interface AuthContextValue {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  isFirebaseConfigured: boolean;
  signIn: (email: string, pass: string) => Promise<UserProfile>;
  signUp: (name: string, email: string, pass: string) => Promise<UserProfile>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  completeOnboarding: (form: OnboardingFormState) => Promise<void>;
  seedMdmLimProfile: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(Boolean(auth));

  // Fetch or safely recover user profile from Firestore users/{uid}
  const fetchUserProfile = useCallback(async (firebaseUser: User): Promise<UserProfile> => {
    if (!db) {
      const fallbackProfile: UserProfile = {
        uid: firebaseUser.uid,
        displayName: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Commuter',
        email: firebaseUser.email || '',
        onboardingComplete: false,
      };
      setProfile(fallbackProfile);
      return fallbackProfile;
    }

    try {
      const userDocRef = doc(db, 'users', firebaseUser.uid);
      const docSnap = await getDoc(userDocRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        const userProfile: UserProfile = {
          uid: firebaseUser.uid,
          displayName: data.displayName || firebaseUser.displayName || 'Commuter',
          email: data.email || firebaseUser.email || '',
          onboardingComplete: Boolean(data.onboardingComplete),
          createdAt: data.createdAt?.toMillis?.() ?? data.createdAt ?? null,
          updatedAt: data.updatedAt?.toMillis?.() ?? data.updatedAt ?? null,
          preferences: data.preferences as CommuterPreferences | undefined,
          regularRoutes: data.regularRoutes as RegularRoute[] | undefined,
        };
        setProfile(userProfile);
        return userProfile;
      } else {
        // Recover base profile if document does not exist yet
        const initialProfile: UserProfile = {
          uid: firebaseUser.uid,
          displayName: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Commuter',
          email: firebaseUser.email || '',
          onboardingComplete: false,
        };

        await setDoc(userDocRef, {
          uid: initialProfile.uid,
          displayName: initialProfile.displayName,
          email: initialProfile.email,
          onboardingComplete: false,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });

        setProfile(initialProfile);
        return initialProfile;
      }
    } catch (err) {
      console.error('Error fetching Firestore user profile:', err);
      const fallback: UserProfile = {
        uid: firebaseUser.uid,
        displayName: firebaseUser.displayName || 'Commuter',
        email: firebaseUser.email || '',
        onboardingComplete: false,
      };
      setProfile(fallback);
      return fallback;
    }
  }, []);

  // Monitor Firebase Auth state for automatic session restoration
  useEffect(() => {
    if (!auth) {
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        await fetchUserProfile(firebaseUser);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [fetchUserProfile]);

  // Sign In with Email and Password
  const signIn = async (email: string, pass: string): Promise<UserProfile> => {
    if (!auth) {
      throw new Error('Firebase Authentication is not configured. Please add keys to .env.local.');
    }

    const userCredential = await signInWithEmailAndPassword(auth, email.trim(), pass);
    const userProfile = await fetchUserProfile(userCredential.user);
    setUser(userCredential.user);
    return userProfile;
  };

  // Sign Up with Name, Email, Password
  const signUp = async (name: string, email: string, pass: string): Promise<UserProfile> => {
    if (!auth || !db) {
      throw new Error('Firebase is not configured. Please add keys to .env.local.');
    }

    // 1. Create account in Firebase Authentication
    const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), pass);
    const firebaseUser = userCredential.user;

    // Update Firebase Auth displayName
    try {
      await updateFirebaseProfile(firebaseUser, { displayName: name.trim() });
    } catch (e) {
      console.warn('Failed to update Firebase profile display name:', e);
    }

    // 2. Create initial document in users/{uid}
    // NEVER store password, passwordHash, or confirmPassword!
    const userDocRef = doc(db, 'users', firebaseUser.uid);
    const initialDocData = {
      uid: firebaseUser.uid,
      displayName: name.trim(),
      email: email.trim().toLowerCase(),
      onboardingComplete: false,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    await setDoc(userDocRef, initialDocData);

    const initialProfile: UserProfile = {
      uid: firebaseUser.uid,
      displayName: name.trim(),
      email: email.trim().toLowerCase(),
      onboardingComplete: false,
    };

    setUser(firebaseUser);
    setProfile(initialProfile);
    return initialProfile;
  };

  // Sign Out
  const signOut = async () => {
    if (auth) {
      await firebaseSignOut(auth);
    }
    setUser(null);
    setProfile(null);
  };

  // Password Reset
  const resetPassword = async (email: string) => {
    if (!auth) {
      throw new Error('Firebase Authentication is not configured. Please add keys to .env.local.');
    }
    await sendPasswordResetEmail(auth, email.trim());
  };

  // Complete Onboarding: Save commuter preferences to Firestore users/{uid}
  const completeOnboarding = async (form: OnboardingFormState) => {
    if (!user) throw new Error('No authenticated user found');

    const formattedPreferences: CommuterPreferences = {
      minimiseWalking: form.priorities.lessWalking,
      preferSheltered: form.priorities.sheltered,
      preferFewerTransfers: form.priorities.fewerTransfers,
      avoidHighCrowding: form.priorities.lessCrowded,
      transportModes: ['rail', 'bus', 'walking'],
      avoidStairs: form.accessibility.avoidStairs,
      requireWorkingLifts: form.accessibility.requireWorkingLifts,
      wheelchairMode: form.accessibility.wheelchairMode,
      walkingPace: form.walking.walkingPace,
      maxContinuousWalk: form.walking.maxContinuousWalk,
      textSize: form.display.textSize,
      language: form.display.language,
      notifications: {
        plannedDisruptions: true,
        unexpectedDisruptions: true,
        weatherDisruptions: true,
        crowdingDisruptions: true,
      },
    };

    if (db) {
      const userDocRef = doc(db, 'users', user.uid);
      await updateDoc(userDocRef, {
        onboardingComplete: true,
        preferences: formattedPreferences,
        regularRoutes: form.regularRoutes,
        updatedAt: serverTimestamp(),
      });
    }

    setProfile((prev) => ({
      uid: user.uid,
      displayName: prev?.displayName || user.displayName || 'Commuter',
      email: prev?.email || user.email || '',
      onboardingComplete: true,
      preferences: formattedPreferences,
      regularRoutes: form.regularRoutes,
    }));
  };

  // Seed Mdm Lim demo profile into the active user's Firestore profile
  const seedMdmLimProfile = async () => {
    if (!user) throw new Error('No authenticated user found');

    const mdmLimPrefs = MDM_LIM_COMMUTER.preferences;

    if (db) {
      const userDocRef = doc(db, 'users', user.uid);
      await updateDoc(userDocRef, {
        onboardingComplete: true,
        preferences: mdmLimPrefs,
        updatedAt: serverTimestamp(),
      });
    }

    setProfile((prev) => ({
      uid: user.uid,
      displayName: prev?.displayName || user.displayName || 'Commuter',
      email: prev?.email || user.email || '',
      onboardingComplete: true,
      preferences: mdmLimPrefs,
    }));
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchUserProfile(user);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        isFirebaseConfigured,
        signIn,
        signUp,
        signOut,
        resetPassword,
        completeOnboarding,
        seedMdmLimProfile,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
