# Kept — building real apps with EAS

Prep is done in the repo:
- **Icon / adaptive icon / splash** in `assets/` (regenerate: `node scripts/gen-icons.mjs`)
- `app.json` — icon, splash, notifications icon, bundle IDs
  (iOS `com.theyuvaraaj.kept`, Android `com.theyuvaraaj.kept`)
- `eas.json` — `development` / `preview` / `production` profiles
- `expo-dev-client` installed (needed for geofencing/native modules beyond Expo Go)

## One-time setup (you must do — needs your login)

1. Free Expo account → https://expo.dev/signup
2. Install CLI: `npm i -g eas-cli`   (or prefix commands with `npx`)
3. `cd kept-app`
4. `eas login`
5. `eas init`  ← links the project + writes `extra.eas.projectId` into app.json

## Development build (test on device, no Expo Go, unlocks geofencing)

```bash
eas build --profile development --platform android
```
- Builds in the cloud (~10–15 min), gives a QR/link → install the **APK** on your phone.
- Then run `npx expo start --dev-client` and open it from the installed app (not Expo Go).
- This build is NOT tied to Expo Go's SDK 54 cap — the SDK-mismatch problem is gone.

iOS dev build needs an Apple Developer account + device registration:
`eas build --profile development --platform ios` (do Android first — simpler).

## Shareable test build (APK to send people)

```bash
eas build --profile preview --platform android
```

## Store builds

```bash
eas build --profile production --platform android   # .aab for Play
eas build --profile production --platform ios       # needs Apple Dev acct
eas submit --profile production --platform android   # uploads to Play console
```

## Notes
- Free tier has a limited number of cloud builds/month; extra builds are paid.
- EAS auto-generates + stores the Android keystore / iOS credentials.
- Bump `version` (and let `autoIncrement` handle build numbers) for each store release.
- Still to do before submitting: privacy policy + Play Data Safety + Apple privacy
  label (location = sensitive), store screenshots/description, dev accounts
  (Apple $99/yr, Google $25 once). See parent `notes.txt`.
```
