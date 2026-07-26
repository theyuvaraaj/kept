# Privacy Policy — Kept

**Last updated: 25 July 2026**

Kept ("the app", "we") is a location-based habit tracker. This policy explains
what data the app uses, stores, and shares.

## Summary

- Kept works **without an account**. Used signed-out, your habits and history
  stay **only on your device**.
- **Optional cloud sync:** if you create an account and sign in, your habit data
  is stored on our backend (Supabase) so it can back up and sync across your
  devices.
- **Location** is used to confirm you're at a habit's spot. Your live location is
  processed on your device; the **spot coordinates you save** are stored with the
  habit (on your device, and in the cloud if you sign in).
- **Place search** sends the text you type to OpenStreetMap to find locations.
- No advertising. No third-party analytics/tracking SDKs.

## What we use and store

**Habit data** (names, the places/coordinates you pick, schedules, check-in
history, streaks). Stored on your device. If you sign in, also stored in your
account on **Supabase** so it syncs across devices.

**Account data.** If you create an account, we store your **email address** and
an authentication record via **Supabase Auth** to sign you in and sync your data.

**Location.** With your permission, Kept reads your device location to (a)
confirm you're within range when you check in, and (b) if you enable "Auto
check-in," detect arrival at a habit's spot in the background. Your live location
is evaluated on your device. The **coordinates of spots you choose** are saved
with your habits (and synced to your account if signed in). We do not
continuously upload your live location.

**Place search.** When you search for a place, the text you type is sent to the
**OpenStreetMap Nominatim** service to return matching locations. No account or
identity is attached.

**Notifications.** Reminders are scheduled locally on your device.

## Third-party services

- **Supabase** (supabase.com) — backend + authentication + database for optional
  cloud sync. Data is transmitted over HTTPS and protected by row-level security
  so you can only access your own data.
- **OpenStreetMap / Nominatim** (openstreetmap.org) — place search (geocoding).

We do not sell your data or share it for advertising.

## Data retention and deletion

- **Local:** in-app **Settings → Reset all data**, or uninstall Kept.
- **Account/cloud:** in-app **Profile → Account → Delete account** permanently
  deletes your account and all cloud data. You can also sign out at any time
  (local data remains on the device).

## Children

Kept is not directed to children under 13 and does not knowingly collect their
data.

## Changes

Updates will be posted at this URL with a new "Last updated" date.

## Contact

**yuvarajpeddi9@gmail.com**

<!-- EDIT ME: replace the contact email before publishing. Host this file at a
     public URL (GitHub Pages / gist) and paste that URL into the store listings. -->
