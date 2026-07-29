import { useStore } from '@/store/useStore';
import { pullHabits, pushHabits } from './sync';
import { hasSupabase } from './supabase';

// Orchestrates sync using the live store. Kept out of the store file to avoid a
// store <-> sync import cycle (store imports mergeHabits from ./sync).
//
// Loop-safety: only LOCAL edits push (guarded by the store's `dirty` flag in
// _layout). Realtime events call pullMerge (pull only) - never push - so a
// push can't trigger a realtime event that triggers another push.

/** Pull cloud → merge into local (last-write-wins). No push. */
export async function pullMerge(): Promise<void> {
  const { session, setSyncStatus, mergeRemote } = useStore.getState();
  if (!hasSupabase || !session?.user?.id) return;
  setSyncStatus('syncing');
  try {
    mergeRemote(await pullHabits());
    setSyncStatus('synced');
  } catch {
    setSyncStatus('error');
  }
}

/** Full sync on sign-in: pull → merge → push once. Clears dirty. */
export async function syncNow(): Promise<void> {
  const { session, setSyncStatus, mergeRemote, clearDirty } = useStore.getState();
  const userId = session?.user?.id;
  if (!hasSupabase || !userId) return;
  setSyncStatus('syncing');
  try {
    mergeRemote(await pullHabits());
    await pushHabits(useStore.getState().habits, userId);
    clearDirty();
    setSyncStatus('synced');
  } catch {
    setSyncStatus('error');
  }
}

/** Push local → cloud (after local edits). Clears dirty on success. */
export async function pushNow(): Promise<void> {
  const { session, setSyncStatus, clearDirty } = useStore.getState();
  const userId = session?.user?.id;
  if (!hasSupabase || !userId) return;
  setSyncStatus('syncing');
  try {
    await pushHabits(useStore.getState().habits, userId);
    clearDirty();
    setSyncStatus('synced');
  } catch {
    setSyncStatus('error');
  }
}
