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
export const GEOFENCE_TASK = 'kept-geofence';
const STORE_KEY = 'kept-v1';

// Grace after the window end: background fixes are throttled by Android, so a
// fix that lands a few minutes late should still count. Keeps a tight window
// from silently missing an arrival.
const GRACE_MIN = 10;

function inWindow(h: Habit): boolean {
  if (!h.start || !h.end) return true;
  const now = new Date();
  const cur = now.getHours() * 60 + now.getMinutes();
  const p = (t: string) => {
    const [hh, mm] = t.split(':').map(Number);
    return hh * 60 + mm;
  };
  return cur >= p(h.start) && cur <= p(h.end) + GRACE_MIN;
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
      h.updatedAt = Date.now();
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

/** Mark one habit kept — used when a geofence ENTER fires (already in range). */
async function markHabitId(id: string) {
  const raw = await AsyncStorage.getItem(STORE_KEY);
  if (!raw) return;
  const parsed = JSON.parse(raw);
  const habits: Habit[] = parsed?.state?.habits ?? [];
  const h = habits.find((x) => x.id === id);
  if (!h || !h.autoCheck || h.archived) return;
  const key = todayKey();
  const st = h.history?.[key];
  if (st === 'green' || st === 'red' || !inWindow(h)) return;
  h.history = { ...h.history, [key]: 'green' };
  h.updatedAt = Date.now();
  await AsyncStorage.setItem(STORE_KEY, JSON.stringify(parsed));
  await Notifications.scheduleNotificationAsync({
    content: { title: 'Kept ✓', body: `Auto-checked in at ${h.place.name}. Streak safe.` },
    trigger: null,
  }).catch(() => {});
}

// Top-level task definitions (import this file early — see _layout).
TaskManager.defineTask(LOCATION_TASK, async ({ data, error }: any) => {
  if (error) return;
  const loc = data?.locations?.[data.locations.length - 1];
  if (loc?.coords) await checkPosition(loc.coords.latitude, loc.coords.longitude).catch(() => {});
});

// OS geofencing: fires on region ENTER even when the app is force-killed.
TaskManager.defineTask(GEOFENCE_TASK, async ({ data, error }: any) => {
  if (error) return;
  if (data?.eventType === Location.GeofencingEventType.Enter && data?.region?.identifier) {
    await markHabitId(data.region.identifier).catch(() => {});
  }
});

/** Start/stop the background watcher. Returns a human status for Settings. */
export async function syncAutoCheck(habits: Habit[]): Promise<string> {
  const active = habits.filter((h) => h.autoCheck && !h.archived);
  const started = await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK).catch(() => false);

  if (active.length === 0) {
    if (started) await Location.stopLocationUpdatesAsync(LOCATION_TASK).catch(() => {});
    if (await Location.hasStartedGeofencingAsync(GEOFENCE_TASK).catch(() => false))
      await Location.stopGeofencingAsync(GEOFENCE_TASK).catch(() => {});
    return 'off — no auto-check habits';
  }

  const fg = await Location.requestForegroundPermissionsAsync();
  if (fg.status !== 'granted') return `blocked — location "${fg.status}"`;
  const bg = await Location.requestBackgroundPermissionsAsync();
  if (bg.status !== 'granted') return `blocked — need "Allow all the time" (got "${bg.status}")`;

  // Check right now too (covers "already parked" the moment auto-check is on).
  try {
    const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
    await checkPosition(pos.coords.latitude, pos.coords.longitude);
  } catch {}

  try {
    if (started) await Location.stopLocationUpdatesAsync(LOCATION_TASK).catch(() => {});
    await Location.startLocationUpdatesAsync(LOCATION_TASK, {
      accuracy: Location.Accuracy.High,
      timeInterval: 60000, // ~1 min
      distanceInterval: 0,
      pausesUpdatesAutomatically: false,
      showsBackgroundLocationIndicator: false,
      foregroundService: {
        notificationTitle: 'Kept is watching your spots',
        notificationBody: 'Auto check-in is on for your habits.',
        notificationColor: '#8fae5e',
      },
    });

    // Also register OS geofences — these fire on ARRIVAL even when force-killed.
    try {
      if (await Location.hasStartedGeofencingAsync(GEOFENCE_TASK).catch(() => false))
        await Location.stopGeofencingAsync(GEOFENCE_TASK).catch(() => {});
      const regions = active.map((h) => ({
        identifier: h.id,
        latitude: h.place.lat,
        longitude: h.place.lng,
        radius: Math.max(h.radius || 100, 50),
        notifyOnEnter: true,
        notifyOnExit: false,
      }));
      if (regions.length) await Location.startGeofencingAsync(GEOFENCE_TASK, regions);
    } catch {}

    return 'active — watching in background';
  } catch (e: any) {
    return `error starting service: ${e?.message ?? String(e)}`;
  }
}
