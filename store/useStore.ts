import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { DayStatus, Habit, User } from '@/lib/types';
import { todayKey } from '@/lib/analytics';
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

      getHabit: (id) => get().habits.find((h) => h.id === id),

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
        };
        if (editId) {
          set((s) => ({ habits: s.habits.map((h) => (h.id === editId ? { ...h, ...base } : h)) }));
          return editId;
        }
        const id = uid();
        set((s) => ({ habits: [...s.habits, { id, ...base, createdAt: todayKey(), history: {} }] }));
        return id;
      },

      deleteHabit: (id) => set((s) => ({ habits: s.habits.filter((h) => h.id !== id) })),

      archiveHabit: (id, archived) =>
        set((s) => ({ habits: s.habits.map((h) => (h.id === id ? { ...h, archived } : h)) })),

      setDay: (id, status) =>
        set((s) => ({
          habits: s.habits.map((h) =>
            h.id === id ? { ...h, history: { ...h.history, [todayKey()]: status } } : h
          ),
        })),

      setUser: (user) => set({ user }),
      setOnboarded: (v) => set({ onboarded: v }),
      setRemindersEnabled: (v) => set({ remindersEnabled: v }),
      setHasHydrated: (v) => set({ hasHydrated: v }),
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
        state?.setHasHydrated(true);
      },
    }
  )
);
