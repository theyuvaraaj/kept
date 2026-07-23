// Background auto check-in. Requires a dev/EAS build (NOT Expo Go) + "Allow all
// the time" location. A periodic background location task checks "am I at a
// spot during its window?" — so it works whether you just arrived OR are already
// parked there, with the app closed. Battery cost is why this is opt-in per habit.

import * as TaskManager from 'expo-task-manager';
import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Habit } from './types';
import { todayKey } from './analytics';
import { distanceM } from './geo';

export const LOCATION_TASK = 'kept-location-watch';
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

/** Given a fix, mark every auto habit you're currently at (during its window). */
async function checkPosition(lat: number, lng: number) {
  const raw = await AsyncStorage.getItem(STORE_KEY);
  if (!raw) return;
  const parsed = JSON.parse(raw);
  const habits: Habit[] = parsed?.state?.habits ?? [];
  const key = todayKey();
  const marked: Habit[] = [];

  for (const h of habits) {
    if (!h.autoCheck || h.archived) continue;
    const st = h.history?.[key];
    if (st === 'green' || st === 'red') continue;
    if (!inWindow(h)) continue;
    if (distanceM(lat, lng, h.place.lat, h.place.lng) <= (h.radius || 100)) {
      h.history = { ...h.history, [key]: 'green' };
      marked.push(h);
    }
  }

  if (marked.length) {
    await AsyncStorage.setItem(STORE_KEY, JSON.stringify(parsed));
    for (const h of marked) {
      await Notifications.scheduleNotificationAsync({
        content: { title: 'Kept ✓', body: `Auto-checked in at ${h.place.name}. Streak safe.` },
        trigger: null,
      }).catch(() => {});
    }
  }
}

// Top-level task definition (import this file early — see _layout).
TaskManager.defineTask(LOCATION_TASK, async ({ data, error }: any) => {
  if (error) return;
  const loc = data?.locations?.[data.locations.length - 1];
  if (loc?.coords) await checkPosition(loc.coords.latitude, loc.coords.longitude).catch(() => {});
});

/** Start/stop the background watcher based on whether any auto habit exists. */
export async function syncAutoCheck(habits: Habit[]): Promise<'ok' | 'denied' | 'none'> {
  const active = habits.filter((h) => h.autoCheck && !h.archived);
  const started = await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK).catch(() => false);

  if (active.length === 0) {
    if (started) await Location.stopLocationUpdatesAsync(LOCATION_TASK).catch(() => {});
    return 'none';
  }

  const fg = await Location.requestForegroundPermissionsAsync();
  if (fg.status !== 'granted') return 'denied';
  const bg = await Location.requestBackgroundPermissionsAsync();
  if (bg.status !== 'granted') return 'denied';

  // Check right now too (covers "already parked" the moment auto-check is on).
  try {
    const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
    await checkPosition(pos.coords.latitude, pos.coords.longitude);
  } catch {}

  if (!started) {
    await Location.startLocationUpdatesAsync(LOCATION_TASK, {
      accuracy: Location.Accuracy.Balanced,
      timeInterval: 120000, // ~2 min
      distanceInterval: 0,
      pausesUpdatesAutomatically: false,
      showsBackgroundLocationIndicator: false,
      foregroundService: {
        notificationTitle: 'Kept is watching your spots',
        notificationBody: 'Auto check-in is on for your habits.',
        notificationColor: '#8fae5e',
      },
    });
  }
  return 'ok';
}
