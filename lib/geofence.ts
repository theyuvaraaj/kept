// Background geofencing for auto check-in. Requires a dev/EAS build (NOT Expo Go).
// A region enter during the habit's window marks today kept — even if the app
// is backgrounded. The task runs in its own JS context, so it reads/writes the
// persisted store (AsyncStorage) directly rather than touching the live store.

import * as TaskManager from 'expo-task-manager';
import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Habit } from './types';
import { todayKey } from './analytics';

export const GEOFENCE_TASK = 'kept-geofence';
const STORE_KEY = 'kept-v1';

function inWindow(h: Habit): boolean {
  if (!h.start || !h.end) return true;
  const now = new Date();
  const cur = now.getHours() * 60 + now.getMinutes();
  const p = (t: string) => {
    const [hh, mm] = t.split(':').map(Number);
    return hh * 60 + mm;
  };
  return cur >= p(h.start) && cur <= p(h.end);
}

async function markKept(habitId: string) {
  const raw = await AsyncStorage.getItem(STORE_KEY);
  if (!raw) return;
  const parsed = JSON.parse(raw);
  const habits: Habit[] = parsed?.state?.habits ?? [];
  const h = habits.find((x) => x.id === habitId);
  if (!h) return;
  const key = todayKey();
  if (h.history?.[key] === 'green' || h.history?.[key] === 'red') return; // already resolved
  if (!inWindow(h)) return; // only auto-check during the window

  h.history = { ...h.history, [key]: 'green' };
  await AsyncStorage.setItem(STORE_KEY, JSON.stringify(parsed));

  await Notifications.scheduleNotificationAsync({
    content: { title: 'Kept ✓', body: `Auto-checked in at ${h.place.name}. Streak safe.` },
    trigger: null,
  }).catch(() => {});
}

// Must be defined at module top-level (import this file early — see _layout).
TaskManager.defineTask(GEOFENCE_TASK, async ({ data, error }: any) => {
  if (error) return;
  if (data?.eventType === Location.GeofencingEventType.Enter && data?.region?.identifier) {
    await markKept(data.region.identifier).catch(() => {});
  }
});

/** Ask permissions once, then register/refresh geofences for auto-check habits. */
export async function registerGeofences(habits: Habit[]): Promise<'ok' | 'denied' | 'none'> {
  const active = habits.filter((h) => h.autoCheck && !h.archived);
  const stop = async () => {
    const started = await Location.hasStartedGeofencingAsync(GEOFENCE_TASK).catch(() => false);
    if (started) await Location.stopGeofencingAsync(GEOFENCE_TASK).catch(() => {});
  };
  if (active.length === 0) {
    await stop();
    return 'none';
  }

  const fg = await Location.requestForegroundPermissionsAsync();
  if (fg.status !== 'granted') return 'denied';
  const bg = await Location.requestBackgroundPermissionsAsync();
  if (bg.status !== 'granted') return 'denied';

  const regions = active.map((h) => ({
    identifier: h.id,
    latitude: h.place.lat,
    longitude: h.place.lng,
    radius: Math.max(h.radius || 100, 50),
    notifyOnEnter: true,
    notifyOnExit: false,
  }));

  await stop();
  await Location.startGeofencingAsync(GEOFENCE_TASK, regions);
  return 'ok';
}
