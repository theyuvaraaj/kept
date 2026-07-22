# Kept — mobile app (v1)

Location-based habit tracker. Show up at your spot, keep the streak.
Built with **Expo (React Native) + expo-router + TypeScript**.

Neobrutalist look ported from the HTML prototype in the parent folder.

## v1 scope (this build)

Full UI + feel, mock/in-memory data. No real GPS, no real auth.

- Login / Signup — pure UI, any input → Home (real auth is v2)
- Home — habit list, Kept %, week dots, streak, mode tag, search
- Habit dashboard — streak, wins, Kept % / this-week / this-month tiles, month calendar, check-in
- Check-in — "Finding you…" → auto-success (no GPS yet), marks the day, bumps streak
- Setup — add/edit habit, two schedule modes (specific days **or** N days/week), location picker (mock list), radius, auto-check toggle
- Stats — overall Kept %, weekly/monthly, GitHub-style yearly heatmap, per-habit breakdown
- Profile — user, totals, habit list, log out

## Run it

```bash
cd kept-app
npm install          # if deps not already installed
npx expo start       # then press i (iOS sim), a (Android), or scan QR in Expo Go
```

- iOS simulator needs Xcode; Android needs Android Studio/emulator. Or use the **Expo Go** app on a physical phone (scan the QR).
- Type check: `npm run typecheck`

## v2 (see ../notes.txt)

- Real geofencing (expo-location region monitoring) for auto check-in
- Auth + login/out (Supabase/Firebase or similar), cloud sync
- Persistence (AsyncStorage now, backend later)
- Reminder notifications, streak-freeze/grace day, home-screen widget
- Fix: auto-mark missed days (midnight job), UTC date keys for timezone safety

## Structure

```
app/            expo-router screens (index=Login, home, habit/[id]=Dashboard, setup, checkin, stats, profile)
components/     Screen, ui (Txt/Neo/Button/Field/Bar), icons, Heatmap
lib/            types, analytics (streak/Kept%/heatmap math), mockData
store/          zustand store (in-memory, seeded)
theme/          tokens (colors, fonts, hard shadow, radius)
```
