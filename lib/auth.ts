import { supabase } from './supabase';
import { useStore } from '@/store/useStore';

export async function signUp(email: string, password: string) {
  const { data, error } = await supabase.auth.signUp({ email: email.trim(), password });
  if (error) throw error;
  return data;
}

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
  if (error) throw error;
  return data;
}

export async function signOut() {
  await supabase.auth.signOut();
}

export async function updatePassword(newPassword: string) {
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) throw error;
}

/** Delete the account (auth user + habits via FK cascade) through an Edge
 *  Function, then sign out. Requires the `delete-account` function deployed. */
export async function deleteAccount() {
  const { error } = await supabase.functions.invoke('delete-account');
  if (error) throw error;
  await supabase.auth.signOut();
}

export async function sendPasswordReset(email: string) {
  const { error } = await supabase.auth.resetPasswordForEmail(email.trim());
  if (error) throw error;
}

/** Load the current session + subscribe to changes. Call once on app start. */
export function initAuth(): () => void {
  supabase.auth.getSession().then(({ data }) => {
    useStore.getState().setSession(data.session);
    useStore.getState().setAuthReady(true);
  });
  const { data } = supabase.auth.onAuthStateChange((_event, session) => {
    useStore.getState().setSession(session);
    useStore.getState().setAuthReady(true);
  });
  return () => data.subscription.unsubscribe();
}
