# Play Data Safety form + permissions declarations

Exact answers for the Google Play Console. Kept works locally, but with **optional
cloud sync** (Supabase) it DOES collect data when a user signs in, and **place
search** sends queries to OpenStreetMap. Answer as data IS collected.
**Background location** also triggers extra review - see that section.

## Data Safety form

**Does your app collect or share any of the required user data types?** → **Yes**
(collect). **Shared:** No (not shared with third parties for their own use;
Supabase/OpenStreetMap are service providers processing on our behalf).

Declare these data types as **collected** (only when the user signs in / searches):

| Data type | Collected | Shared | Ephemeral | Purpose | Required? |
|---|---|---|---|---|---|
| **Email address** | Yes | No | No | Account management, app functionality | Optional (only if user signs in) |
| **Location (approximate + precise)** | Yes | No | Some (live location on-device; saved spot coords stored) | App functionality (verify/auto check-in) | Optional |
| **App activity / other (habit data)** | Yes | No | No | App functionality (sync/backup) | Optional |

Notes for the form:
- **Data encrypted in transit:** Yes (HTTPS to Supabase / OpenStreetMap).
- **Users can request deletion:** Yes - in-app **Account → Delete account**
  (deletes cloud data) and **Settings → Reset all data** (local).
- All cloud collection is **optional** - the app is fully usable signed-out with
  no data leaving the device (except place-search queries when used).
- Third-party processors: **Supabase** (backend/auth/db), **OpenStreetMap
  Nominatim** (geocoding). Neither is used for advertising.

## Permissions - how you'll justify them

| Permission | Why | Notes |
|---|---|---|
| `ACCESS_FINE_LOCATION` | Confirm you're at the habit's spot on check-in | Core function |
| `ACCESS_BACKGROUND_LOCATION` | Auto check-in when you arrive, app closed | **Needs the background-location declaration below** |
| `FOREGROUND_SERVICE` / `FOREGROUND_SERVICE_LOCATION` | Keep Auto check-in running reliably | Shows the persistent "watching your spots" notification |
| `POST_NOTIFICATIONS` | Habit reminders | |
| `REQUEST_IGNORE_BATTERY_OPTIMIZATIONS` | Stop the OS sleeping the Auto check-in service | Optional per habit |

## ⚠️ Background location (the big one)

Google reviews background-location use hard. To publish you must:

1. **In the Play Console "App content" → Location permissions declaration:**
   - Explain the feature: *"Auto check-in detects when the user arrives at a
     habit's chosen location and marks that habit complete, even when the app is
     closed. Location is processed on-device only and never transmitted."*
   - Confirm it's core to a user-facing feature the user turns on.
2. **Record a short demo video** (they require it): screen-record enabling Auto
   check-in on a habit and it auto-marking on arrival. Upload/link it in the
   declaration.
3. **In-app prominent disclosure - DONE.** Enabling "Auto check-in" on a habit
   now shows a consent dialog *before* any background-location request:
   *"Kept uses your location to automatically check you in when you arrive at
   this spot - including in the background, even when the app is closed. Your
   location is used only on your device… never sent anywhere, shared, or used
   for ads."* with **Continue / Not now**. Background permission is only
   requested on **Continue**. Screenshot this dialog for the Play declaration.

**If background location review feels heavy for v1:** you can ship **without**
`ACCESS_BACKGROUND_LOCATION` - Auto check-in then works only while the app is
open/foreground (still useful), and the store review is trivial. Add background
in a v1.1 update once the base app is live. This is a very common launch
strategy and I recommend it if you want to ship fast.

## Ads / target audience
- Contains ads: **No**
- Target age: not designed for children.
