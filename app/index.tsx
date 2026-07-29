import { Redirect } from 'expo-router';
import { useStore } from '@/store/useStore';
import { hasSupabase } from '@/lib/supabase';

// App entry. Login is required: onboard once, then sign in, then Home.
// Everything syncs automatically once signed in — there is no separate "sync".
export default function Index() {
  const onboarded = useStore((s) => s.onboarded);
  const session = useStore((s) => s.session);
  const authReady = useStore((s) => s.authReady);

  if (!onboarded) return <Redirect href="/onboarding" />;
  // No backend configured → fall back to local-only (dev builds without env).
  if (!hasSupabase) return <Redirect href="/home" />;
  // Wait for the initial getSession() so we don't flash the login screen.
  if (!authReady) return null;
  if (!session) return <Redirect href="/auth" />;
  return <Redirect href="/home" />;
}
