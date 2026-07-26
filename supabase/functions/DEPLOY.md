# Deploy the `delete-account` Edge Function

The in-app "Delete account" button calls this function. Until it's deployed, the
app falls back to signing you out. Deploy once:

```bash
# 1. Install the Supabase CLI (one-time)
brew install supabase/tap/supabase

# 2. From the project root
cd ~/Desktop/kept
supabase login                       # opens browser
supabase link --project-ref tankabiujpxoknopgqna

# 3. Deploy
supabase functions deploy delete-account
```

- `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are injected automatically into
  Edge Functions — you don't set them.
- The function only deletes the user identified by the caller's own JWT, so it's
  safe to expose.
- Deleting the auth user cascades to their `habits` rows (FK `on delete cascade`).

Test after deploy: in the app, sign in → Account → Delete account.
