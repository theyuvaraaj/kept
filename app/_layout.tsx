import { useEffect, useMemo } from 'react';
import { AppState } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFonts } from 'expo-font';
import {
  BricolageGrotesque_700Bold,
  BricolageGrotesque_800ExtraBold,
} from '@expo-google-fonts/bricolage-grotesque';
import {
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
} from '@expo-google-fonts/plus-jakarta-sans';
import * as Location from 'expo-location';
import { colors } from '@/theme/tokens';
import { useStore } from '@/store/useStore';
import { syncReminders } from '@/lib/notifications';
import { syncAutoCheck } from '@/lib/geofence'; // also registers the background task
import { todayKey } from '@/lib/analytics';
import { distanceM } from '@/lib/geo';
import type { Habit } from '@/lib/types';
import { hasSupabase, supabase } from '@/lib/supabase';
import { initAuth } from '@/lib/auth';
import { syncNow, pushNow, pullMerge } from '@/lib/syncEngine';

SplashScreen.preventAutoHideAsync();

// Matches lib/geofence's grace so foreground + background agree on the window.
const GRACE_MIN = 10;

function inWindowNow(h: Habit): boolean {
  if (!h.start || !h.end) return true;
  const n = new Date();
  const cur = n.getHours() * 60 + n.getMinutes();
  const p = (t: string) => {
    const [a, b] = t.split(':').map(Number);
    return a * 60 + b;
  };
  return cur >= p(h.start) && cur <= p(h.end) + GRACE_MIN;
}

// While the app is open, do auto check-in through the LIVE store (authoritative)
// so the UI updates immediately and never gets clobbered by a stale re-save.
async function foregroundAutoCheck() {
  const { habits, setDay } = useStore.getState();
  const active = habits.filter((h) => h.autoCheck && !h.archived);
  if (!active.length) return;
  const key = todayKey();
  const pending = active.filter((h) => {
    const st = h.history?.[key];
    return st !== 'green' && st !== 'red' && inWindowNow(h);
  });
  if (!pending.length) return;
  const perm = await Location.getForegroundPermissionsAsync();
  if (perm.status !== 'granted') return;
  let pos;
  try {
    pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
  } catch {
    return;
  }
  for (const h of pending) {
    if (distanceM(pos.coords.latitude, pos.coords.longitude, h.place.lat, h.place.lng) <= (h.radius || 100)) {
      setDay(h.id, 'green');
    }
  }
}

export default function RootLayout() {
  const [loaded] = useFonts({
    Bricolage_700Bold: BricolageGrotesque_700Bold,
    Bricolage_800ExtraBold: BricolageGrotesque_800ExtraBold,
    Jakarta_500Medium: PlusJakartaSans_500Medium,
    Jakarta_600SemiBold: PlusJakartaSans_600SemiBold,
    Jakarta_700Bold: PlusJakartaSans_700Bold,
  });
  const router = useRouter();
  const hydrated = useStore((s) => s.hasHydrated);
  const habits = useStore((s) => s.habits);
  const remindersEnabled = useStore((s) => s.remindersEnabled);
  const session = useStore((s) => s.session);
  const userId = session?.user?.id ?? null;
  const authReady = useStore((s) => s.authReady);
  const onboarded = useStore((s) => s.onboarded);
  const dirty = useStore((s) => s.dirty);

  // Signatures of only the fields each effect cares about, so a check-in (which
  // changes history) doesn't needlessly reschedule notifications or restart GPS.
  const reminderSig = useMemo(
    () =>
      habits
        .map((h) => `${h.id}:${h.reminder ? 1 : 0}:${h.archived ? 1 : 0}:${h.deleted ? 1 : 0}:${h.scheduleType}:${(h.days || []).join(',')}:${h.start}:${h.name}:${h.place.name}`)
        .join('|'),
    [habits]
  );
  const autoSig = useMemo(
    () =>
      habits
        .filter((h) => h.autoCheck && !h.archived && !h.deleted)
        .map((h) => `${h.id}:${h.place.lat},${h.place.lng}:${h.radius}`)
        .join('|'),
    [habits]
  );
  const ready = loaded && hydrated;

  // v2: load + watch the auth session (no-op if Supabase isn't configured).
  useEffect(() => {
    if (!hasSupabase) return;
    return initAuth();
  }, []);

  // On sign-in: full sync (pull → merge → push).
  useEffect(() => {
    if (!hasSupabase || !userId || !hydrated) return;
    syncNow();
  }, [userId, hydrated]);

  // Login required: once auth has loaded, no session means bounce to /auth.
  // Catches sign-out from anywhere (the "log out of the app" behaviour).
  useEffect(() => {
    if (!ready || !hasSupabase || !onboarded || !authReady) return;
    if (!userId) router.replace('/auth');
  }, [ready, onboarded, authReady, userId]);

  // Push local edits up (debounced) — ONLY when there's a local change (dirty).
  // Merges/pulls don't set dirty, so this never fires from a sync → no loop.
  useEffect(() => {
    if (!hasSupabase || !userId || !hydrated || !dirty) return;
    const t = setTimeout(() => pushNow(), 1500);
    return () => clearTimeout(t);
  }, [dirty, habits, userId, hydrated]);

  // Real-time: another device's change PULLS in live (never pushes → no loop).
  useEffect(() => {
    if (!hasSupabase || !userId) return;
    const ch = supabase
      .channel(`habits-${userId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'habits', filter: `user_id=eq.${userId}` },
        () => pullMerge()
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [userId]);

  useEffect(() => {
    if (ready) SplashScreen.hideAsync();
  }, [ready]);

  // Reschedule reminders only when a reminder-relevant field changes (not on
  // every check-in). Reads live habits inside.
  useEffect(() => {
    if (hydrated) syncReminders(useStore.getState().habits, remindersEnabled).catch(() => {});
  }, [hydrated, reminderSig, remindersEnabled]);

  // Restart the background auto-check watcher only when its spots/config change.
  useEffect(() => {
    if (!hydrated) return;
    syncAutoCheck(useStore.getState().habits)
      .then((status) => useStore.getState().setAutoStatus(status))
      .catch((e) => useStore.getState().setAutoStatus(`error: ${e?.message ?? e}`));
  }, [hydrated, autoSig]);

  // Live auto check-in while the app is open (marks via the store → UI updates
  // instantly). On resume, also pull in anything the background task wrote.
  useEffect(() => {
    if (!hydrated) return;
    const tick = () => {
      useStore.getState().refreshFromStorage();
      foregroundAutoCheck();
    };
    tick();
    const sub = AppState.addEventListener('change', (s) => {
      if (s === 'active') tick();
    });
    const iv = setInterval(tick, 15000);
    return () => {
      sub.remove();
      clearInterval(iv);
    };
  }, [hydrated]);

  if (!ready) return null;

  return (
    <SafeAreaProvider>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.cream },
          animation: 'fade',
        }}
      />
    </SafeAreaProvider>
  );
}
