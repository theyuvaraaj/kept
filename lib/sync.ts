import { supabase, hasSupabase } from './supabase';
import type { DayStatus, Habit } from './types';

// Maps between the local Habit shape and the `habits` table rows, and does a
// last-write-wins merge. Cloud is a mirror of local; local stays the UI source.

interface HabitRow {
  id: string;
  user_id: string;
  name: string;
  place_name: string;
  lat: number;
  lng: number;
  schedule_type: string;
  days: number[];
  weekly_target: number;
  start_time: string;
  end_time: string;
  radius: number;
  auto_check: boolean;
  reminder: boolean;
  archived: boolean;
  created_at: string | null;
  history: Record<string, DayStatus>;
  deleted: boolean;
  updated_at: string; // ISO
}

function toRow(h: Habit, userId: string): HabitRow {
  return {
    id: h.id,
    user_id: userId,
    name: h.name,
    place_name: h.place.name,
    lat: h.place.lat,
    lng: h.place.lng,
    schedule_type: h.scheduleType,
    days: h.days ?? [],
    weekly_target: h.weeklyTarget ?? 4,
    start_time: h.start,
    end_time: h.end,
    radius: h.radius ?? 100,
    auto_check: !!h.autoCheck,
    reminder: !!h.reminder,
    archived: !!h.archived,
    created_at: h.createdAt ?? null,
    history: h.history ?? {},
    deleted: !!h.deleted,
    updated_at: new Date(h.updatedAt ?? Date.now()).toISOString(),
  };
}

function fromRow(r: HabitRow): Habit {
  return {
    id: r.id,
    name: r.name,
    place: { name: r.place_name, lat: r.lat, lng: r.lng },
    scheduleType: (r.schedule_type as Habit['scheduleType']) || 'specific',
    days: r.days ?? [],
    weeklyTarget: r.weekly_target ?? 4,
    start: r.start_time,
    end: r.end_time,
    radius: r.radius ?? 100,
    autoCheck: !!r.auto_check,
    reminder: !!r.reminder,
    archived: !!r.archived,
    createdAt: r.created_at ?? undefined,
    history: r.history ?? {},
    deleted: !!r.deleted,
    updatedAt: r.updated_at ? new Date(r.updated_at).getTime() : 0,
  };
}

/** Last-write-wins union of local + remote habits, by updatedAt. */
export function mergeHabits(local: Habit[], remote: Habit[]): Habit[] {
  const byId = new Map<string, Habit>();
  for (const h of local) byId.set(h.id, h);
  for (const r of remote) {
    const l = byId.get(r.id);
    if (!l || (r.updatedAt ?? 0) >= (l.updatedAt ?? 0)) byId.set(r.id, r);
  }
  return [...byId.values()];
}

/** Pull all of the signed-in user's habits from the cloud. */
export async function pullHabits(): Promise<Habit[]> {
  if (!hasSupabase) return [];
  const { data, error } = await supabase.from('habits').select('*');
  if (error) throw error;
  return (data as HabitRow[]).map(fromRow);
}

/** Push (upsert) the given habits to the cloud for this user. */
export async function pushHabits(habits: Habit[], userId: string): Promise<void> {
  if (!hasSupabase || !habits.length) return;
  const rows = habits.map((h) => toRow(h, userId));
  const { error } = await supabase.from('habits').upsert(rows, { onConflict: 'id' });
  if (error) throw error;
}

/** Delete a habit row from the cloud (used when a signed-in user deletes). */
export async function deleteRemoteHabit(id: string): Promise<void> {
  if (!hasSupabase) return;
  const { error } = await supabase.from('habits').delete().eq('id', id);
  if (error) throw error;
}
