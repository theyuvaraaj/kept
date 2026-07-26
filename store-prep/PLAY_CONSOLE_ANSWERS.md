# Play Console — fill-in answers

Copy-paste as you go through the Console. Edit anything that doesn't match reality.

## App details
- **App name:** Kept
- **Short description (80):** Show up at your spots. Build the streak. Don't break the chain.
- **Full description:** see STORE_LISTING.md
- **App category:** Health & Fitness
- **Email:** yuvarajpeddi9@gmail.com
- **Privacy policy URL:** (your hosted PRIVACY_POLICY.md URL)

## App access
- "All functionality is available without special access" → **Yes**
  (No login required to use the app; cloud sync sign-in is optional. If a
  reviewer needs to test sync, provide a throwaway email/password in the notes.)

## Ads
- Contains ads → **No**

## Content rating (questionnaire)
- Category: **Utility / Productivity / Other** (or Health)
- Violence / sexual / profanity / drugs / gambling → **No** to all
- User-generated content / user interaction / shares location with other users → **No**
  (location is used only to check YOU in; not shared with other users)
- Personal info collected → your habit data + email (for the account) — answer truthfully;
  results in **Everyone / PEGI 3**.

## Target audience & content
- Target age group: **18+** (or 13+). NOT designed for children.
- Appeals to children → **No**

## Data safety (summary — full detail in DATA_SAFETY_AND_PERMISSIONS.md)
- Collects data → **Yes** (email, location, app activity — all OPTIONAL, only when signed in / searching)
- Shares data → **No**
- Encrypted in transit → **Yes**
- Users can request deletion → **Yes** (in-app Account → Delete account)

## Location permissions declaration (App content → Sensitive permissions)
Foreground + **background** location. Declaration text:

> Kept is a location-based habit tracker. Foreground location confirms the user
> is at their chosen spot when they check in. Background location powers an
> opt-in "Auto check-in" feature that automatically marks a habit complete when
> the user arrives at its location, even when the app is closed. Location is
> processed on the device to compare against the user's saved spots; it is not
> sold, shared, or used for advertising. Users enable Auto check-in per habit
> and are shown a disclosure before background location is requested.

- Attach the **demo video** (screen-record: enable Auto check-in on a habit →
  it auto-marks on arrival).

## Data deletion (App content → Data deletion)
- In-app deletion: **Yes** — Account → Delete account (deletes account + cloud data).
- Web URL for deletion requests: optional; can reuse the privacy policy URL /
  support email.

## Store settings
- Free app, contains no in-app purchases.
- Countries: your choice (start with India, or worldwide).

## Release
1. Upload the `.aab` from `eas build --profile production`.
2. Roll out to **Internal testing** first (add your email as tester) → verify.
3. Promote to **Production** when happy.

## Reviewer test note (paste in "App access" or release notes)
> Sign-in is optional; the app is fully usable without an account. To test cloud
> sync: create an account in-app (Profile → Sign in to sync) with any email +
> password (email confirmation is disabled).
