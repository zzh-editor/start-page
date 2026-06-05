import { getClient, isConfigured } from "./supabase";
import type { User } from "@supabase/supabase-js";

type AuthListener = (user: User | null) => void;

const listeners = new Set<AuthListener>();
let currentUser: User | null = null;
let initPromise: Promise<User | null> | null = null;

function notify() {
  listeners.forEach((fn) => fn(currentUser));
}

export function onAuthChange(fn: AuthListener): () => void {
  listeners.add(fn);
  fn(currentUser);
  return () => listeners.delete(fn);
}

export function getCurrentUser(): User | null {
  return currentUser;
}

async function restoreSession(): Promise<User | null> {
  const supabase = getClient();
  if (!supabase) return null;
  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user) return null;
  return data.user;
}

export async function initAuth(): Promise<User | null> {
  if (initPromise) return initPromise;
  if (!isConfigured()) {
    initPromise = Promise.resolve(null);
    return initPromise;
  }
  initPromise = (async () => {
    const user = await restoreSession();
    currentUser = user;
    notify();

    const supabase = getClient();
    if (supabase) {
      supabase.auth.onAuthStateChange((_event, session) => {
        currentUser = session?.user ?? null;
        notify();
      });
    }
    return user;
  })();
  return initPromise;
}

export async function signInWithEmail(email: string, password: string): Promise<User | null> {
  const supabase = getClient();
  if (!supabase) return null;
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  currentUser = data.user;
  notify();
  return data.user;
}

export async function signUpWithEmail(email: string, password: string): Promise<User | null> {
  const supabase = getClient();
  if (!supabase) return null;
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) throw error;
  currentUser = data.user;
  notify();
  return data.user;
}

export async function linkEmail(email: string, password: string): Promise<User | null> {
  const supabase = getClient();
  if (!supabase) return null;
  const { data, error } = await supabase.auth.updateUser({ email, password });
  if (error) throw error;
  currentUser = data.user;
  notify();
  return data.user;
}

export async function signOut(): Promise<void> {
  const supabase = getClient();
  if (!supabase) return;
  await supabase.auth.signOut();
  currentUser = null;
  notify();
}

export async function resetPassword(email: string): Promise<void> {
  const supabase = getClient();
  if (!supabase) return;
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: window.location.origin,
  });
  if (error) throw error;
}

export async function resendVerification(): Promise<void> {
  const supabase = getClient();
  if (!supabase) return;
  const { error } = await supabase.auth.resend({ type: "signup", email: currentUser?.email ?? "" });
  if (error) throw error;
}

export function isEmailVerified(): boolean {
  return currentUser?.email_confirmed_at !== null;
}
