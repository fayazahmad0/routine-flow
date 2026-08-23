/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useRef,
} from 'react';
import {
  User as FirebaseUser,
  onAuthStateChanged,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signInAnonymously,
  signOut as fbSignOut,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  ConfirmationResult,
  deleteUser,
} from 'firebase/auth';
import {
  doc,
  setDoc,
  updateDoc,
  collection,
  getDocs,
  deleteDoc,
  onSnapshot,
} from 'firebase/firestore';
import { auth, db, googleProvider, handleFirestoreError, OperationType, testFirebaseConnection } from '../lib/firebase';
import firebaseConfig from '../../firebase-applet-config.json';
import { UserProfile } from '../types';

declare global {
  interface Window {
    recaptchaVerifier?: RecaptchaVerifier;
    confirmationResult?: ConfirmationResult;
  }
}

interface AuthContextType {
  user: FirebaseUser | null;
  userProfile: UserProfile | null;
  loading: boolean;
  isFirebaseConnected: boolean;
  signInWithGoogle: (useRedirect?: boolean) => Promise<void>;
  signInAsGuest: () => Promise<void>;
  sendPhoneOtp: (phoneNumber: string, appVerifierContainerId: string) => Promise<boolean>;
  verifyPhoneOtp: (otp: string) => Promise<boolean>;
  resendPhoneOtp: (phoneNumber: string, appVerifierContainerId: string) => Promise<boolean>;
  signOut: () => Promise<void>;
  updateUserProfile: (updates: Partial<UserProfile>) => Promise<void>;
  deleteUserAccount: () => Promise<void>;
  error: string | null;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isFirebaseConnected, setIsFirebaseConnected] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Safely hold current active confirmationResult
  const confirmationResultRef = useRef<ConfirmationResult | null>(null);

  const clearError = () => setError(null);

  // Test connection on boot
  useEffect(() => {
    testFirebaseConnection().then((connected) => {
      setIsFirebaseConnected(connected);
    });
  }, []);

  // Handle redirect result if user returned from Google Redirect flow
  useEffect(() => {
    getRedirectResult(auth)
      .then((result) => {
        if (result?.user) {
          console.log('[RoutineFlow Auth] Successfully authenticated via redirect:', result.user.uid);
          setUser(result.user);
        }
      })
      .catch((err: any) => {
        console.error('[RoutineFlow Auth] Redirect sign-in error:', err);
        mapGoogleAuthError(err);
      });
  }, []);

  // Listen to Auth State
  useEffect(() => {
    let unsubscribeProfile: (() => void) | undefined;

    // Fallback safety timer in case Firebase auth takes unusually long to determine state
    const authTimeout = setTimeout(() => {
      setLoading((prevLoading) => {
        if (prevLoading) {
          console.warn('[RoutineFlow Auth] Auth state resolution reached timeout fallback; unblocking UI shell.');
          const current = auth.currentUser;
          if (current) {
            setUser(current);
            setUserProfile((prev) => prev || {
              uid: current.uid,
              displayName: current.displayName || current.phoneNumber || 'Routine Flow User',
              email: current.email || null,
              phoneNumber: current.phoneNumber || null,
              photoURL: current.photoURL || null,
              createdAt: new Date().toISOString(),
              timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
              theme: 'system',
              weekStartsOn: 'monday',
              onboardingCompleted: false,
              selectedGoals: ['Productivity', 'Health'],
              notificationsEnabled: false,
            });
          }
          return false;
        }
        return false;
      });
    }, 1800);

    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      clearTimeout(authTimeout);
      setUser(currentUser);

      if (currentUser) {
        // Construct instant optimistic user profile from auth token so UI renders at 0ms
        const detectedTz = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
        const instantProfile: UserProfile = {
          uid: currentUser.uid,
          displayName: currentUser.displayName || currentUser.phoneNumber || 'Routine Flow User',
          email: currentUser.email || null,
          phoneNumber: currentUser.phoneNumber || null,
          photoURL: currentUser.photoURL || null,
          createdAt: new Date().toISOString(),
          timezone: detectedTz,
          theme: 'system',
          weekStartsOn: 'monday',
          onboardingCompleted: false,
          selectedGoals: ['Productivity', 'Health'],
          notificationsEnabled: false,
        };

        setUserProfile((prev) => prev || instantProfile);
        // CRITICAL: Unblock UI shell immediately without waiting for Firestore network trip
        setLoading(false);

        // Progressively synchronize user profile document from Firestore in the background
        const userDocRef = doc(db, 'users', currentUser.uid);
        try {
          unsubscribeProfile = onSnapshot(
            userDocRef,
            (snapshot) => {
              if (snapshot.exists()) {
                setUserProfile(snapshot.data() as UserProfile);
              } else {
                // Initialize default profile document asynchronously in background
                setDoc(userDocRef, instantProfile).catch((writeErr) => {
                  console.warn('Initial profile doc creation pending/deferred:', writeErr);
                });
              }
            },
            (err) => {
              console.warn('User profile snapshot fallback active:', err);
            }
          );
        } catch (err) {
          console.warn('Profile listener initialization notice:', err);
        }
      } else {
        setUserProfile(null);
        setLoading(false);
      }
    });

    return () => {
      clearTimeout(authTimeout);
      unsubscribeAuth();
      if (unsubscribeProfile) {
        unsubscribeProfile();
      }
    };
  }, []);

  // Helper to map Google Authentication errors with detailed troubleshooting guidance
  const mapGoogleAuthError = (err: any) => {
    const currentHost = typeof window !== 'undefined' ? window.location.hostname : 'unknown';
    console.error('[RoutineFlow Auth] Google Sign-In Diagnostic:', {
      method: 'signInWithGoogle',
      hostname: currentHost,
      projectId: firebaseConfig.projectId,
      errorCode: err?.code,
      errorMessage: err?.message,
      customData: err?.customData,
    });

    if (err?.code === 'auth/unauthorized-domain') {
      setError(
        `Google Sign-In is not authorized for domain "${currentHost}". Please add "${currentHost}" in Firebase Console > Authentication > Settings > Authorized Domains.`
      );
    } else if (err?.code === 'auth/operation-not-allowed') {
      setError(
        'Google Sign-In is not enabled for this project. Please enable "Google" under Authentication > Sign-in method in Firebase Console.'
      );
    } else if (err?.code === 'auth/popup-closed-by-user') {
      setError('Sign-in popup was closed before completion. Please try again.');
    } else if (err?.code === 'auth/popup-blocked') {
      setError(
        'Popup window was blocked by your browser. Please allow popups or open the app in a new browser tab.'
      );
    } else if (err?.code === 'auth/cancelled-popup-request') {
      setError('A sign-in window was already open. Please try again.');
    } else if (err?.code === 'auth/network-request-failed') {
      setError('Network connection error. Please check your internet connection and try again.');
    } else if (err?.code === 'auth/invalid-api-key') {
      setError('Invalid Firebase API key. Please check your project configuration.');
    } else {
      setError(
        `Google Sign-In failed (${err?.code || 'unknown'}): ${err?.message || 'Please check your connection and Firebase Console settings.'}`
      );
    }
  };

  // Google Sign-in
  const signInWithGoogle = async (useRedirect: boolean = false) => {
    try {
      setError(null);
      setLoading(true);
      console.log('[RoutineFlow Auth] Initiating Google Sign-In on hostname:', window.location.hostname);

      if (useRedirect) {
        await signInWithRedirect(auth, googleProvider);
      } else {
        await signInWithPopup(auth, googleProvider);
      }
    } catch (err: any) {
      mapGoogleAuthError(err);
      setLoading(false);
      throw err;
    }
  };

  // Guest / Anonymous Sign-In
  const signInAsGuest = async () => {
    try {
      setError(null);
      setLoading(true);
      await signInAnonymously(auth);
    } catch (err: any) {
      console.error('[RoutineFlow Auth] Anonymous auth error:', err);
      if (err.code === 'auth/operation-not-allowed') {
        setError(
          'Anonymous guest sign-in is not enabled in Firebase Console. Please enable "Anonymous" under Authentication > Sign-in method.'
        );
      } else if (err.code === 'auth/unauthorized-domain') {
        setError(
          `Domain "${window.location.hostname}" is not authorized. Please add it to Firebase Console > Authentication > Settings > Authorized Domains.`
        );
      } else {
        setError('Unable to sign in as guest. Please try Google Sign-In.');
      }
      setLoading(false);
    }
  };

  // Helper to cleanup recaptcha safely
  const cleanupRecaptcha = () => {
    try {
      if (window.recaptchaVerifier) {
        window.recaptchaVerifier.clear();
        delete window.recaptchaVerifier;
      }
    } catch (e) {
      console.warn('Error clearing reCAPTCHA:', e);
    }
  };

  // Helper to map Phone Authentication errors with clear Firebase Console instructions
  const mapPhoneAuthError = (err: any, maskedPhone: string) => {
    const currentHost = typeof window !== 'undefined' ? window.location.hostname : 'unknown';
    console.error('[RoutineFlow Auth] Phone OTP Diagnostic:', {
      maskedPhone,
      hostname: currentHost,
      projectId: firebaseConfig.projectId,
      errorCode: err?.code,
      errorMessage: err?.message,
    });

    if (err?.code === 'auth/operation-not-allowed') {
      setError(
        'Phone authentication is disabled in your Firebase project. Please enable "Phone" under Authentication > Sign-in method in the Firebase Console.'
      );
    } else if (err?.code === 'auth/unauthorized-domain') {
      setError(
        `Phone authentication is not authorized for domain "${currentHost}". Please add "${currentHost}" in Firebase Console > Authentication > Settings > Authorized Domains.`
      );
    } else if (err?.code === 'auth/quota-exceeded') {
      setError(
        'SMS quota exceeded for this project or billing limit reached. Please verify SMS limits & Cloud Billing in the Firebase Console.'
      );
    } else if (err?.code === 'auth/too-many-requests') {
      setError('Too many SMS requests sent to this number. Please wait a while before requesting again.');
    } else if (err?.code === 'auth/invalid-phone-number') {
      setError('Invalid phone number format. Please enter a valid 10-digit mobile number with country code.');
    } else if (err?.code === 'auth/missing-phone-number') {
      setError('Please enter a valid phone number.');
    } else if (err?.code === 'auth/captcha-check-failed') {
      setError('reCAPTCHA security verification failed. Please refresh the page and try again.');
    } else if (err?.code === 'auth/invalid-app-credential') {
      setError(
        'Firebase app verification failed. Please ensure the domain is added to Firebase Authorized Domains.'
      );
    } else if (err?.code === 'auth/network-request-failed') {
      setError('Network connection error. Please check your internet connection.');
    } else {
      setError(
        `Failed to send verification SMS (${err?.code || 'error'}): ${err?.message || 'Please verify Firebase configuration.'}`
      );
    }
  };

  // Send Phone OTP via Real Firebase Phone Authentication
  const sendPhoneOtp = async (phoneNumber: string, appVerifierContainerId: string): Promise<boolean> => {
    // Mask phone number for safe dev logging (e.g. +91 98****3210)
    const maskedPhone = phoneNumber.length > 6
      ? `${phoneNumber.substring(0, 5)}****${phoneNumber.substring(phoneNumber.length - 2)}`
      : '***';

    try {
      setError(null);
      cleanupRecaptcha();

      console.log('[RoutineFlow Auth] Starting real Firebase Phone verification for:', maskedPhone);

      // Verify DOM container exists
      const container = document.getElementById(appVerifierContainerId);
      if (!container) {
        throw new Error(`reCAPTCHA container (#${appVerifierContainerId}) not found in document.`);
      }

      window.recaptchaVerifier = new RecaptchaVerifier(auth, appVerifierContainerId, {
        size: 'invisible',
        callback: () => {
          console.log('[RoutineFlow Auth] reCAPTCHA verified successfully');
        },
        'expired-callback': () => {
          setError('Security verification expired. Please request a new code.');
        },
      });

      const confirmation = await signInWithPhoneNumber(auth, phoneNumber, window.recaptchaVerifier);
      window.confirmationResult = confirmation;
      confirmationResultRef.current = confirmation;
      console.log('[RoutineFlow Auth] Real Firebase SMS confirmation result received successfully');
      return true;
    } catch (err: any) {
      cleanupRecaptcha();
      confirmationResultRef.current = null;
      window.confirmationResult = undefined;
      mapPhoneAuthError(err, maskedPhone);
      return false;
    }
  };

  // Resend Phone OTP
  const resendPhoneOtp = async (phoneNumber: string, appVerifierContainerId: string): Promise<boolean> => {
    return sendPhoneOtp(phoneNumber, appVerifierContainerId);
  };

  // Verify Phone OTP via Real Firebase ConfirmationResult
  const verifyPhoneOtp = async (otp: string): Promise<boolean> => {
    const confirmation = confirmationResultRef.current || window.confirmationResult;
    if (!confirmation) {
      setError('Verification session expired. Please request a new OTP code.');
      return false;
    }

    try {
      setError(null);
      setLoading(true);
      console.log('[RoutineFlow Auth] Confirming OTP with Firebase...');

      const result = await confirmation.confirm(otp);
      console.log('[RoutineFlow Auth] Real Phone OTP verified successfully for UID:', result.user?.uid);
      cleanupRecaptcha();
      confirmationResultRef.current = null;
      window.confirmationResult = undefined;
      return true;
    } catch (err: any) {
      console.error('[RoutineFlow Auth] OTP confirmation error:', err);
      setLoading(false);
      if (err.code === 'auth/invalid-verification-code') {
        setError('Incorrect or expired OTP. Please try again.');
      } else if (err.code === 'auth/code-expired') {
        setError('This OTP code has expired. Please click Resend OTP to request a new code.');
      } else if (err.code === 'auth/session-expired') {
        setError('Verification session expired. Please enter your number and request a new code.');
      } else if (err.code === 'auth/network-request-failed') {
        setError('Network connection error. Please check your connection.');
      } else {
        setError('Verification failed. Please check the code and try again.');
      }
      return false;
    }
  };

  // Sign out
  const signOut = async () => {
    try {
      cleanupRecaptcha();
      confirmationResultRef.current = null;
      window.confirmationResult = undefined;
      await fbSignOut(auth);
      setUser(null);
      setUserProfile(null);
    } catch (err) {
      console.error('Sign out error:', err);
    }
  };

  // Update Profile
  const updateUserProfile = async (updates: Partial<UserProfile>) => {
    if (!user) return;
    const userDocRef = doc(db, 'users', user.uid);
    // Optimistically update local profile state immediately
    setUserProfile((prev) => {
      if (prev) return { ...prev, ...updates };
      const detectedTz = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
      return {
        uid: user.uid,
        displayName: user.displayName || user.phoneNumber || 'Routine Flow User',
        email: user.email || null,
        phoneNumber: user.phoneNumber || null,
        photoURL: user.photoURL || null,
        createdAt: new Date().toISOString(),
        timezone: detectedTz,
        theme: 'system',
        weekStartsOn: 'monday',
        onboardingCompleted: true,
        selectedGoals: ['Productivity', 'Health'],
        notificationsEnabled: false,
        ...updates,
      };
    });

    try {
      await setDoc(userDocRef, updates, { merge: true });
    } catch (err) {
      console.warn('Profile cloud update error (optimistic state preserved):', err);
    }
  };

  // Delete User Account and Data
  const deleteUserAccount = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const uid = user.uid;

      // Clean up subcollections
      const subcollections = ['tasks', 'taskCompletions', 'dailyRecords', 'categories', 'achievements'];
      for (const sub of subcollections) {
        const subRef = collection(db, `users/${uid}/${sub}`);
        const snap = await getDocs(subRef);
        for (const d of snap.docs) {
          await deleteDoc(d.ref);
        }
      }

      // Delete user root doc
      await deleteDoc(doc(db, 'users', uid));

      // Delete Firebase Auth User
      await deleteUser(user);
      setUser(null);
      setUserProfile(null);
    } catch (err: any) {
      console.error('Account deletion error:', err);
      if (err.code === 'auth/requires-recent-login') {
        setError('Deleting your account requires recent authentication. Please sign out and sign in again before deleting.');
      } else {
        setError('Failed to delete account data completely. Please try again.');
      }
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        userProfile,
        loading,
        isFirebaseConnected,
        signInWithGoogle,
        signInAsGuest,
        sendPhoneOtp,
        verifyPhoneOtp,
        resendPhoneOtp,
        signOut,
        updateUserProfile,
        deleteUserAccount,
        error,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
