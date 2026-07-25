-- Kept v2 — Supabase schema. Paste into Supabase Studio → SQL Editor → Run.
-- One table: each user's habits, protected by row-level security.

create table if not exists public.habits (
  id            text primary key,                 -- app-generated habit id (h…)
  user_id       uuid not null references auth.users (id) on delete cascade,
  name          text not null,
  place_name    text not null,
  lat           double precision not null,
  lng           double precision not null,
  schedule_type text not null default 'specific', -- 'specific' | 'count'
  days          int[] not null default '{}',
  weekly_target int  not null default 4,
  start_time    text not null default '06:00',
  end_time      text not null default '09:00',
  radius        int  not null default 100,
  auto_check    boolean not null default false,
  reminder      boolean not null default true,
  archived      boolean not null default false,
  created_at    text,                             -- app dateKey, e.g. 2026-07-25
  history       jsonb not null default '{}'::jsonb, -- { "2026-07-25": "green" }
  deleted       boolean not null default false,   -- soft-delete tombstone
  updated_at    timestamptz not null default now()
);

alter table public.habits enable row level security;

-- Each user can only see/modify their own rows.
create policy "habits_select_own" on public.habits
  for select using (auth.uid() = user_id);
create policy "habits_insert_own" on public.habits
  for insert with check (auth.uid() = user_id);
create policy "habits_update_own" on public.habits
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "habits_delete_own" on public.habits
  for delete using (auth.uid() = user_id);

-- Note: updated_at is set by the CLIENT on every write (the app's local change
-- time), so last-write-wins merges compare like-for-like. No server trigger.
