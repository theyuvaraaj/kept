# Kept

A location-based habit tracker. Pick a place, show up, keep the streak — Kept
checks that you actually got there instead of trusting a tap on the couch.

Built with **Expo (React Native) · expo-router · TypeScript · Supabase**.

## Features

- **Location check-in** — confirm you're within range of a habit's spot (GPS).
- **Auto check-in** — opt-in background geofencing marks a habit when you arrive,
  even with the app closed.
- **Two schedules** — specific weekdays, or "any N days a week".
- **Honest streaks** — count only scheduled days, one grace day, Kept % that
  reflects missed days.
- **Stats** — weekly/monthly summaries + a GitHub-style yearly heatmap.
- **Reminders** — local notifications in each habit's window (skipped once kept).
- **Cloud sync (optional)** — email sign-in backs up + syncs habits across
  devices (Supabase), with real-time updates and account deletion. Works fully
  local + offline without an account.

## Setup

```bash
npm install --legacy-peer-deps          # peer-deps flag is required (see .npmrc)
cp .env.example .env                     # fill in the values below
```

`.env` (all optional — the app runs without them):

| Var | Purpose |
| --- | --- |
| `EXPO_PUBLIC_SUPABASE_URL` / `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Cloud sync + auth |
| `EXPO_PUBLIC_MAPPLS_CLIENT_ID` / `_SECRET` or `EXPO_PUBLIC_GOOGLE_PLACES_KEY` | Map search (v1.1 — currently uses "current location" only) |

Supabase schema: run `supabase/schema.sql` (+ the `migration-*.sql` files) in the
Supabase SQL editor.

## Run

```bash
npx expo start        # scan QR in Expo Go (SDK 54) or press a / i
npm run typecheck     # tsc --noEmit
```

Background geofencing needs a real build (below), not Expo Go.

## Build & release (EAS)

```bash
eas build --profile development --platform android   # dev client (Metro)
eas build --profile preview     --platform android   # standalone APK to test/share
eas build --profile production  --platform android   # .aab for Play
eas submit  --profile production --platform android
```

`.env` isn't read by cloud builds — non-secret `EXPO_PUBLIC_*` values live in
`eas.json` per profile. See `store-prep/LAUNCH_CHECKLIST.md` for the full path.

## Assets & store prep

- **App icon / splash:** `assets/icon.png`, `adaptive-icon.png`, `splash-icon.png`
  (regenerate: `node scripts/gen-icons.mjs`)
- **Play feature graphic:** `assets/feature-graphic.png` (1024×500,
  `node scripts/gen-feature-graphic.mjs`)
- **Screenshots:** not committed — capture 5 from the running app on a device
  (Home, Dashboard, Stats, Setup, Check-in success) for the Play listing.
- **Store docs:** `store-prep/` — privacy policy, listing copy, Data Safety
  answers, Play Console fill-ins, launch checklist.

## Project structure

```
app/         expo-router screens: home, habit/[id] (dashboard), setup, checkin,
             stats, profile, account, auth, onboarding
components/  Screen, ui (Txt/Neo/Button/Field/Bar), icons, Heatmap
lib/         analytics (streak/Kept%/heatmap), geofence, notifications, geo,
             supabase, auth, sync, syncEngine, types
store/       zustand store (AsyncStorage-persisted) + cloud session
theme/       tokens (colors, fonts, hard shadow)
supabase/    schema.sql, migrations, delete-account Edge Function
```

## Notes

- Pinned to **Expo SDK 54** (matches the installed Expo Go).
- Roadmap (v1.1): map/place search, iOS build, offline sync queue.
