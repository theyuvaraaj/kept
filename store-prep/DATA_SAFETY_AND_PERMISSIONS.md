# Play Data Safety form + permissions declarations

Exact answers for the Google Play Console. Kept is local-only, which makes this
simple — but **background location** triggers extra review steps. Read the
"Background location" section carefully.

## Data Safety form

**Does your app collect or share any of the required user data types?**
→ **No.**
Rationale: "Collect" in Play's definition means data transmitted off the device.
Kept transmits nothing — habits, history, and location are processed and stored
only on the device. No backend, no analytics, no ads.

If the form insists you list Location because the app has the permission:
- Data type: **Location (approximate + precise)**
- Collected: **No** (not sent off device)
- Shared: **No**
- Processed ephemerally / on-device only: **Yes**
- Purpose: **App functionality** (verify check-ins / auto check-in)

**Data encrypted in transit:** N/A (no transmission).
**Users can request deletion:** Yes — in-app "Reset all data" + uninstall.

## Permissions — how you'll justify them

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
3. **In-app prominent disclosure** (recommended to add before submitting): a
   one-time screen shown *before* requesting background location, saying Kept
   collects location in the background to auto-check-in, even when closed, and
   nothing is sent off device. (Our onboarding mentions location — we should
   tighten it into an explicit prominent-disclosure screen. Small task; flag if
   you want it before submitting.)

**If background location review feels heavy for v1:** you can ship **without**
`ACCESS_BACKGROUND_LOCATION` — Auto check-in then works only while the app is
open/foreground (still useful), and the store review is trivial. Add background
in a v1.1 update once the base app is live. This is a very common launch
strategy and I recommend it if you want to ship fast.

## Ads / target audience
- Contains ads: **No**
- Target age: not designed for children.
