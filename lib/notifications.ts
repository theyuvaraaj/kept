import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import type { Habit } from './types';
import { fmtTime, dateKey } from './analytics';

// Local reminders only (works in Expo Go). Remote push is a v2/dev-build concern.
// Strategy: on any change, cancel EVERYTHING and reschedule from scratch - no
// per-habit id bookkeeping to drift out of sync.

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function ensureNotificationPermission(): Promise<boolean> {
  const current = await Notifications.getPermissionsAsync();
  let status = current.status;
  if (status !== 'granted') {
    const req = await Notifications.requestPermissionsAsync();
    status = req.status;
  }
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('reminders', {
      name: 'Reminders',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }
  return status === 'granted';
}

function parseTime(t: string): { hour: number; minute: number } {
  const [h, m] = (t || '18:00').split(':').map(Number);
  return { hour: h || 0, minute: m || 0 };
}

const HORIZON_DAYS = 14; // reschedule this far ahead; refreshed on every app open

/** Cancel all, then reschedule one-shot reminders for the next HORIZON_DAYS,
 *  SKIPPING any day already resolved (kept/missed) - so a day you've already
 *  checked in never gets a redundant "time to keep" nudge. Re-run on app open
 *  and on any habit change to keep the horizon fresh. */
export async function syncReminders(habits: Habit[], globalEnabled: boolean): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
  if (!globalEnabled) return;

  const granted = await ensureNotificationPermission();
  if (!granted) return;

  const now = new Date();

  for (const h of habits) {
    if (!h.reminder || h.archived || h.deleted) continue;
    const { hour, minute } = parseTime(h.start);
    const specific = (h.scheduleType || 'specific') !== 'count';
    const body = `Time to keep "${h.name}" at ${h.place.name} · window ${fmtTime(h.start)}–${fmtTime(h.end)}.`;
    const content = { title: 'Kept', body, ...(Platform.OS === 'android' ? { channelId: 'reminders' } : {}) };

    for (let i = 0; i < HORIZON_DAYS; i++) {
      const d = new Date(now);
      d.setDate(now.getDate() + i);
      d.setHours(hour, minute, 0, 0);
      if (d <= now) continue; // time already passed today
      if (specific && !(h.days || []).includes(d.getDay())) continue; // not a scheduled weekday
      const st = (h.history || {})[dateKey(d)];
      if (st === 'green' || st === 'red') continue; // already resolved that day → no reminder

      await Notifications.scheduleNotificationAsync({
        content,
        trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: d },
      });
    }
  }
}
