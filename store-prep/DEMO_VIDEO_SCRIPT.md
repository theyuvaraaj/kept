# Kept - background-location demo video script

For the Google Play **App content → Location permissions** declaration. Google
must SEE three things: the prominent disclosure, the "Allow all the time" grant,
and background location actually driving Auto check-in.

- Length: **60-120s**. One screen recording, no cuts needed.
- Record on a **real Android 12+ device** (emulator background location is flaky).
- Turn on screen-record with **mic** so you can narrate, or add captions after.
- Host on YouTube **Unlisted** and paste the link in the declaration.

## Prep (before you hit record)
- Sign in to Kept.
- Be physically **near the spot** you'll use, OR use a location you can reach in
  the clip. Easiest: use **"Use my current location"** with a small radius so
  arrival = where you're standing.
- Make sure background location is currently **not** granted yet (fresh install
  or revoke in Settings → Apps → Kept → Permissions → Location → Deny), so the
  disclosure + grant flow is on camera.

## Shot list (narration → on-screen action)

**1. Intro (0-8s)**
> "This is Kept, a habit tracker. Its core feature, Auto check-in, uses location
> to mark a habit done when I actually arrive at the place - even when the app is
> closed."
- Show the home screen.

**2. Create / open a habit (8-25s)**
> "I create a habit and set its spot."
- New habit → name it → **Use my current location** → set radius ~100m.
- Point out the **Auto check-in** card: *"even with the app closed."*

**3. Prominent disclosure (25-45s) - REQUIRED ON CAMERA**
> "When I turn on Auto check-in, Kept shows exactly how location is used before
> asking for permission."
- Auto check-in is on → tap **START TRACKING** (or toggle) so the disclosure
  modal appears. Pause so the full text is readable on screen:
  > "Kept uses your location to automatically check you in when you arrive at
  > this spot - including in the background, even when the app is closed. Your
  > location is used only on your device... never sent anywhere, shared, or used
  > for ads."
- Tap **Continue**.

**4. Grant "Allow all the time" (45-70s) - REQUIRED ON CAMERA**
> "I grant location, then choose Allow all the time so it works in the
> background."
- System dialog → grant **While using the app**.
- The **"One more step"** modal appears → tap **Open Settings** → in Android
  Location settings pick **Allow all the time** → return to Kept.

**5. Background proof (70-100s) - THE KEY PART**
> "Auto check-in is now watching in the background."
- Show the persistent notification **"Kept is watching your spots"** (pull down
  the shade) - this proves the background/foreground-service use.
- **Close the app** (swipe it away / press Home).
- Arrival: either you're already inside the radius, or step into it. Wait for the
  geofence to fire.
- Re-open Kept → the habit's today dot is now **green**, marked automatically.
> "I never tapped check-in - Kept detected the arrival and marked the habit."

**6. Close (100-115s)**
> "Location is only ever used on-device to mark habits. That's the entire use of
> background location in Kept."

## What each shot satisfies
| Google requirement | Shot |
|---|---|
| Feature that needs background location | 1, 2, 5 |
| Prominent in-app disclosure before the request | 3 |
| Runtime permission + "Allow all the time" | 4 |
| Background access in action (app closed) | 5 |
| Data stays on-device, not shared | 3, 6 |

## Tips
- If waiting for the geofence on camera is slow, narrate that arrival detection
  can take a moment, and keep the recording rolling - a real detection is more
  convincing than a cut.
- Foreground fallback: even before the geofence fires, re-opening the app runs a
  live check that marks it - fine to show, but make clear the background path
  (notification + app-closed) is the feature under review.
- Keep it honest and literal; reviewers reject vague or staged-looking clips.
