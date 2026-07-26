-- Enable Realtime for the habits table so changes on one device push live to
-- another. Run in Supabase → SQL Editor. Safe to run once.

alter publication supabase_realtime add table public.habits;
