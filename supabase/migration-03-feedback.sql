-- Feedback inbox. Run once in the Supabase SQL editor.
-- Users can only INSERT their own row; reading is done by you (dev) via the
-- dashboard / service role, so there is no SELECT policy for end users.

create table if not exists public.feedback (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references auth.users(id) on delete set null default auth.uid(),
  email      text,
  message    text not null,
  created_at timestamptz not null default now()
);

alter table public.feedback enable row level security;

-- Authenticated users may leave feedback tied to their own account.
drop policy if exists "insert own feedback" on public.feedback;
create policy "insert own feedback"
  on public.feedback
  for insert
  to authenticated
  with check (auth.uid() = user_id);
