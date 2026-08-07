# Kept - launch checklist (Google Play first)

Ordered. Things only you can do are marked 🫵.

## 1. Accounts
- [ ] 🫵 Google Play Console account - $25 one-time - https://play.google.com/console
- [ ] 🫵 Host the privacy policy at a public URL (free: GitHub Pages / gist) →
      note the URL. Source: `store-prep/PRIVACY_POLICY.md` (edit the email first).

## 2. Background-location scope for v1 → DECISION: A (ship with background)
Auto check-in is the core feature, so v1 ships **with** `ACCESS_BACKGROUND_LOCATION`.
Slower/stricter review; requires the declaration + demo video below.
- [x] Prominent in-app disclosure before the background request (setup screen).
- [x] Android 11+ escalation: if the OS won't grant "Allow all the time" from the
      dialog, the app shows an "Open Settings" step and starts the watcher on
      return (setup.tsx + root AppState recovery in _layout.tsx).
- [ ] 🫵 Record the demo video (see §3 / §Background section).
- [ ] 🫵 Fill the Play "App content → Location permissions" declaration
      (text drafted in `DATA_SAFETY_AND_PERMISSIONS.md`).

## 3. Store listing
- [ ] Text ready → `store-prep/STORE_LISTING.md` (edit email + policy URL)
- [ ] 🫵 Feature graphic 1024×500
- [ ] Screenshots (2–8) - I can help stage; capture Home, Dashboard, Stats,
      Setup, Check-in success
- [ ] Content rating questionnaire (Everyone)
- [ ] Data Safety form → answers in `store-prep/DATA_SAFETY_AND_PERMISSIONS.md`

## 4. Build + submit
- [ ] Bump `version` in app.json if needed (currently 1.0.0)
- [ ] `eas build --profile production --platform android`  (builds an .aab)
- [ ] `eas submit --profile production --platform android`  (uploads to Play)
- [ ] 🫵 In Play Console: fill listing, upload assets, complete declarations,
      roll out to Internal testing first → then Production

## 5. After live
- [ ] v1.1: background location (if you chose B), OS-geofencing for
      force-killed arrival, map/place search, real auth + cloud sync (see notes.txt)

## Notes
- iOS later: needs Apple Developer ($99/yr) + its own privacy nutrition label
  (same facts as the Data Safety form).
- Keep Expo Go SDK cap in mind for dev testing, but production/preview builds are
  standalone and unaffected.
