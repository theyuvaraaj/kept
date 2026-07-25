import { useStore } from '@/store/useStore';
import { pullHabits, pushHabits } from './sync';
import { hasSupabase } from './supabase';

// Orchestrates sync using the live store. Kept out of the store file to avoid a
// store <-> sync import cycle (store imports mergeHabits from ./sync).

/** Full sync: pull → merge (last-write-wins) → push. */
export async function syncNow(): Promise<void> {
  const { session, setSyncStatus, mergeRemote } = useStore.getState();
  const userId = session?.user?.id;
  if (!hasSupabase || !userId) return;
  setSyncStatus('syncing');
  try {
    const remote = await pullHabits();
    mergeRemote(remote);
    await pushHabits(useStore.getState().habits, userId);
    setSyncStatus('synced');
  } catch {
    setSyncStatus('error');
  }
}

/** Push local → cloud only (used after local edits). */
export async function pushNow(): Promise<void> {
  const { session, setSyncStatus } = useStore.getState();
  const userId = session?.user?.id;
  if (!hasSupabase || !userId) return;
  setSyncStatus('syncing');
  try {
    await pushHabits(useStore.getState().habits, userId);
    setSyncStatus('synced');
  } catch {
    setSyncStatus('error');
  }
}
