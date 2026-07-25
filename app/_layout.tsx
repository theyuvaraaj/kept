import { useEffect } from 'react';
import { AppState } from 'react-native';
import { Stack } from 'expo-router';
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
import { hasSupabase } from '@/lib/supabase';
import { initAuth } from '@/lib/auth';
import { pullHabits, pushHabits } from '@/lib/sync';

SplashScreen.preventAutoHideAsync();

function inWindowNow(h: Habit): boolean {
  if (!h.start || !h.end) return true;
  const n = new Date();
  const cur = n.getHours() * 60 + n.getMinutes();
  const p = (t: string) => {
    const [a, b] = t.split(':').map(Number);
    return a * 60 + b;
  };
  return cur >= p(h.start) && cur <= p(h.end);
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
    pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
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
  const hydrated = useStore((s) => s.hasHydrated);
  const habits = useStore((s) => s.habits);
  const remindersEnabled = useStore((s) => s.remindersEnabled);
  const session = useStore((s) => s.session);
  const userId = session?.user?.id ?? null;
  const ready = loaded && hydrated;

  // v2: load + watch the auth session (no-op if Supabase isn't configured).
  useEffect(() => {
    if (!hasSupabase) return;
    return initAuth();
  }, []);

  // On sign-in: pull cloud → merge (last-write-wins) → push the merged set back.
  useEffect(() => {
    if (!hasSupabase || !userId || !hydrated) return;
    let cancelled = false;
    (async () => {
      try {
        const remote = await pullHabits();
        if (cancelled) return;
        useStore.getState().mergeRemote(remote);
        await pushHabits(useStore.getState().habits, userId);
      } catch {}
    })();
    return () => {
      cancelled = true;
    };
  }, [userId, hydrated]);

  // While signed in, push local changes up (debounced).
  useEffect(() => {
    if (!hasSupabase || !userId || !hydrated) return;
    const t = setTimeout(() => {
      pushHabits(useStore.getState().habits, userId).catch(() => {});
    }, 1500);
    return () => clearTimeout(t);
  }, [habits, userId, hydrated]);

  useEffect(() => {
    if (ready) SplashScreen.hideAsync();
  }, [ready]);

  // Keep scheduled reminders in sync with habits + the global toggle.
  useEffect(() => {
    if (hydrated) syncReminders(habits, remindersEnabled).catch(() => {});
  }, [hydrated, habits, remindersEnabled]);

  // Start/stop the background auto check-in watcher (safe no-op in Expo Go).
  useEffect(() => {
    if (!hydrated) return;
    syncAutoCheck(habits)
      .then((status) => useStore.getState().setAutoStatus(status))
      .catch((e) => useStore.getState().setAutoStatus(`error: ${e?.message ?? e}`));
  }, [hydrated, habits]);

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
