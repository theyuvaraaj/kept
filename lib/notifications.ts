import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import type { Habit } from './types';
import { fmtTime } from './analytics';

// Local reminders only (works in Expo Go). Remote push is a v2/dev-build concern.
// Strategy: on any change, cancel EVERYTHING and reschedule from scratch — no
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

/** Cancel all, then reschedule reminders for every active habit. */
export async function syncReminders(habits: Habit[], globalEnabled: boolean): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
  if (!globalEnabled) return;

  const granted = await ensureNotificationPermission();
  if (!granted) return;

  for (const h of habits) {
    if (!h.reminder || h.archived) continue;
    const { hour, minute } = parseTime(h.start);
    const body = `Time to keep "${h.name}" at ${h.place.name} · window ${fmtTime(h.start)}–${fmtTime(h.end)}.`;
    const content = { title: 'Kept', body, ...(Platform.OS === 'android' ? { channelId: 'reminders' } : {}) };

    if ((h.scheduleType || 'specific') === 'count') {
      // any day → one daily reminder
      await Notifications.scheduleNotificationAsync({
        content,
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour,
          minute,
        },
      });
    } else {
      // specific weekdays → one weekly reminder each (expo weekday: 1=Sun..7=Sat)
      for (const dow of h.days || []) {
        await Notifications.scheduleNotificationAsync({
          content,
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
            weekday: dow + 1,
            hour,
            minute,
          },
        });
      }
    }
  }
}
