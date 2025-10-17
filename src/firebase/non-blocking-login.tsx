'use client';
import {
  Auth, // Import Auth type for type hinting
  signInAnonymously,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  // Assume getAuth and app are initialized elsewhere
} from 'firebase/auth';

/** Initiate anonymous sign-in (non-blocking). */
export function initiateAnonymousSignIn(authInstance: Auth): void {
  // CRITICAL: Call signInAnonymously directly. Do NOT use 'await signInAnonymously(...)'.
  signInAnonymously(authInstance);
  // Code continues immediately. Auth state change is handled by onAuthStateChanged listener.
}

/** Initiate email/password sign-up (blocking for error handling). */
export async function initiateEmailSignUp(authInstance: Auth, email: string, password: string): Promise<void> {
  // Use await to catch errors properly
  await createUserWithEmailAndPassword(authInstance, email, password);
}

/** Initiate email/password sign-in (blocking for error handling). */
export async function initiateEmailSignIn(authInstance: Auth, email: string, password: string): Promise<void> {
  // Use await to catch errors properly
  await signInWithEmailAndPassword(authInstance, email, password);
}
