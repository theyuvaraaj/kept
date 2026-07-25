import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Session } from '@supabase/supabase-js';
import type { DayStatus, Habit, User } from '@/lib/types';
import { normalizeHabitKeys, todayKey } from '@/lib/analytics';
import { mergeHabits } from '@/lib/sync';
import { demoHabits, DEMO_USER } from '@/lib/mockData';

// Persisted to AsyncStorage. First launch seeds demo data; after that the
// user's real habits/history/user are restored on every app start.
// v2: swap the persisted store for a backend + auth sync.

interface DraftHabit {
  name: string;
  place: Habit['place'] | null;
  scheduleType: Habit['scheduleType'];
  days: number[];
  weeklyTarget: number;
  start: string;
  end: string;
  radius: number;
  autoCheck: boolean;
  reminder: boolean;
}

interface KeptState {
  user: User;
  habits: Habit[];
  onboarded: boolean;
  remindersEnabled: boolean;
  hasHydrated: boolean;
  getHabit: (id: string) => Habit | undefined;
  saveHabit: (draft: DraftHabit, editId?: string | null) => string;
  deleteHabit: (id: string) => void;
  archiveHabit: (id: string, archived: boolean) => void;
  setDay: (id: string, status: DayStatus) => void;
  setUser: (user: User) => void;
  setOnboarded: (v: boolean) => void;
  setRemindersEnabled: (v: boolean) => void;
  setHasHydrated: (v: boolean) => void;
  /** Re-read habits from storage (picks up background auto check-ins). */
  refreshFromStorage: () => Promise<void>;
  /** Migrate stored history keys to the zero-padded date format (idempotent). */
  normalizeStoredKeys: () => void;
  autoStatus: string;
  setAutoStatus: (s: string) => void;
  // v2 cloud sync
  session: Session | null;
  setSession: (s: Session | null) => void;
  /** Merge cloud habits into local (last-write-wins). */
  mergeRemote: (remote: Habit[]) => void;
  syncStatus: 'idle' | 'syncing' | 'synced' | 'error';
  setSyncStatus: (s: 'idle' | 'syncing' | 'synced' | 'error') => void;
}

const STORAGE_KEY = 'kept-v1';

function uid(): string {
  return 'h' + Math.random().toString(36).slice(2, 9);
}

export const useStore = create<KeptState>()(
  persist(
    (set, get) => ({
      user: DEMO_USER,
      habits: demoHabits(),
      onboarded: false,
      remindersEnabled: true,
      hasHydrated: false,
      autoStatus: 'not started',
      session: null,
      syncStatus: 'idle',

      getHabit: (id) => get().habits.find((h) => h.id === id && !h.deleted),

      saveHabit: (draft, editId) => {
        const place = draft.place ?? { name: 'Riverside Track', lat: 37.7694, lng: -122.4862 };
        const base = {
          name: draft.name.trim() || 'New Habit',
          place,
          scheduleType: draft.scheduleType,
          days: draft.days,
          weeklyTarget: draft.weeklyTarget,
          start: draft.start,
          end: draft.end,
          radius: draft.radius,
          autoCheck: draft.autoCheck,
          reminder: draft.reminder,
          updatedAt: Date.now(),
        };
        if (editId) {
          set((s) => ({ habits: s.habits.map((h) => (h.id === editId ? { ...h, ...base } : h)) }));
          return editId;
        }
        const id = uid();
        set((s) => ({ habits: [...s.habits, { id, ...base, createdAt: todayKey(), history: {} }] }));
        return id;
      },

      // Soft-delete: keep a tombstone (deleted:true) so the deletion syncs to
      // other devices; filtered out of every list. pushNow uploads it.
      deleteHabit: (id) =>
        set((s) => ({
          habits: s.habits.map((h) =>
            h.id === id ? { ...h, deleted: true, updatedAt: Date.now() } : h
          ),
        })),

      archiveHabit: (id, archived) =>
        set((s) => ({
          habits: s.habits.map((h) => (h.id === id ? { ...h, archived, updatedAt: Date.now() } : h)),
        })),

      setDay: (id, status) =>
        set((s) => ({
          habits: s.habits.map((h) =>
            h.id === id
              ? { ...h, history: { ...h.history, [todayKey()]: status }, updatedAt: Date.now() }
              : h
          ),
        })),

      setUser: (user) => set({ user }),
      setOnboarded: (v) => set({ onboarded: v }),
      setRemindersEnabled: (v) => set({ remindersEnabled: v }),
      setHasHydrated: (v) => set({ hasHydrated: v }),
      setAutoStatus: (s) => set({ autoStatus: s }),
      setSession: (session) => set({ session }),
      mergeRemote: (remote) => set((s) => ({ habits: mergeHabits(s.habits, remote) })),
      setSyncStatus: (syncStatus) => set({ syncStatus }),
      refreshFromStorage: async () => {
        try {
          const raw = await AsyncStorage.getItem(STORAGE_KEY);
          if (!raw) return;
          const parsed = JSON.parse(raw);
          const habits: Habit[] | undefined = parsed?.state?.habits;
          if (habits) {
            const cur = get().habits;
            // only replace if something actually changed (avoid needless re-renders)
            if (JSON.stringify(cur) !== JSON.stringify(habits)) set({ habits });
          }
        } catch {}
      },
      normalizeStoredKeys: () => {
        const { habits, changed } = normalizeHabitKeys(get().habits);
        // set() triggers a persist write, so the on-disk blob (which the
        // geofence background task reads raw) gets normalized too.
        if (changed) set({ habits });
      },
    }),
    {
      name: STORAGE_KEY,
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({
        user: s.user,
        habits: s.habits,
        onboarded: s.onboarded,
        remindersEnabled: s.remindersEnabled,
      }),
      onRehydrateStorage: () => (state) => {
        state?.normalizeStoredKeys();
        state?.setHasHydrated(true);
      },
    }
  )
);
