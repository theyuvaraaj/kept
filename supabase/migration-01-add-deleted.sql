-- Run this in Supabase → SQL Editor if you already created the habits table
-- BEFORE the `deleted` column existed (adds soft-delete support). Idempotent.

alter table public.habits
  add column if not exists deleted boolean not null default false;
