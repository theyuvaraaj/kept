import { Platform } from 'react-native';
import * as IntentLauncher from 'expo-intent-launcher';

const PACKAGE = 'com.theyuvaraaj.kept';

// Ask Android to exempt Kept from battery optimization so the background
// auto check-in service isn't slept. Shows the system allow/deny dialog;
// falls back to the battery-optimization settings list.
export async function requestBatteryExemption(): Promise<void> {
  if (Platform.OS !== 'android') return;
  try {
    await IntentLauncher.startActivityAsync(
      'android.settings.REQUEST_IGNORE_BATTERY_OPTIMIZATIONS',
      { data: `package:${PACKAGE}` }
    );
  } catch {
    try {
      await IntentLauncher.startActivityAsync('android.settings.IGNORE_BATTERY_OPTIMIZATION_SETTINGS');
    } catch {}
  }
}
