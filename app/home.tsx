import { memo, useCallback, useMemo, useRef, useState } from 'react';
import { View, Pressable, StyleSheet, BackHandler, ToastAndroid, Platform } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Screen } from '@/components/Screen';
import { Txt, Neo, Bar } from '@/components/ui';
import { Chart, User, Search, Pin, Flame, Plus, Check } from '@/components/icons';
import { colors, fonts, radius, hardShadow } from '@/theme/tokens';
import { useStore } from '@/store/useStore';
import {
  streakOf,
  keptPct,
  dateKey,
  todayKey,
  isMissedDay,
  scheduleLabelShort,
} from '@/lib/analytics';
import type { Habit } from '@/lib/types';

function weekDots(habit: Habit) {
  const out: string[] = [];
  for (let back = 6; back >= 0; back--) {
    const d = new Date();
    d.setDate(d.getDate() - back);
    const st = (habit.history || {})[dateKey(d)];
    const missed = st !== 'green' && (st === 'red' || isMissedDay(habit, d));
    out.push(st === 'green' ? colors.green : missed ? colors.red : colors.surface);
  }
  return out;
}

const HabitCard = memo(function HabitCard({ habit }: { habit: Habit }) {
  const router = useRouter();
  const streak = streakOf(habit);
  const pct = keptPct(habit);
  const done = (habit.history || {})[todayKey()] === 'green';
  const dots = weekDots(habit);

  return (
    <Pressable onPress={() => router.push(`/habit/${habit.id}`)}>
      <Neo r={radius.xl} style={styles.card}>
        <View style={styles.cardTop}>
          <View style={{ flexShrink: 1 }}>
            <Txt variant="big" numberOfLines={1}>
              {habit.name}
            </Txt>
            <View style={styles.placeRow}>
              <Pin size={12} color={colors.muted} width={2.3} />
              <Txt style={styles.placeText}>{habit.place.name}</Txt>
            </View>
          </View>
          <View style={styles.streakPill}>
            <Txt style={styles.streakNum}>{streak}</Txt>
            <Flame size={15} />
          </View>
        </View>

        <View style={styles.dotRow}>
          {dots.map((c, i) => (
            <View key={i} style={[styles.dot, { backgroundColor: c, borderColor: c === colors.surface ? '#ddd9c9' : colors.ink }]} />
          ))}
          <View style={{ flex: 1 }} />
          <Txt style={styles.modeTag}>{scheduleLabelShort(habit)}</Txt>
        </View>

        <View style={styles.barRow}>
          <Bar pct={pct} />
          <Txt style={styles.pct}>{pct}%</Txt>
          {done && (
            <View style={styles.doneRow}>
              <Check size={12} color={colors.greenDark} width={3.4} />
              <Txt style={styles.doneText}>DONE</Txt>
            </View>
          )}
        </View>
      </Neo>
    </Pressable>
  );
});

export default function Home() {
  const router = useRouter();
  const habits = useStore((s) => s.habits);
  const user = useStore((s) => s.user);
  const [q, setQ] = useState('');

  // Home is the root: Android back asks to confirm exit instead of popping to
  // a stale/empty route.
  const lastBack = useRef(0);
  useFocusEffect(
    useCallback(() => {
      const onBack = () => {
        const now = Date.now();
        if (now - lastBack.current < 2000) {
          BackHandler.exitApp();
          return true;
        }
        lastBack.current = now;
        if (Platform.OS === 'android') ToastAndroid.show('Press back again to exit', ToastAndroid.SHORT);
        return true;
      };
      const sub = BackHandler.addEventListener('hardwareBackPress', onBack);
      return () => sub.remove();
    }, [])
  );

  const active = useMemo(() => habits.filter((h) => !h.archived && !h.deleted), [habits]);
  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return active;
    return active.filter(
      (h) => h.name.toLowerCase().includes(t) || h.place.name.toLowerCase().includes(t)
    );
  }, [active, q]);
  const noHabits = active.length === 0;

  return (
    <Screen scroll contentStyle={{ paddingTop: 4 }}>
      <View style={styles.header}>
        <Txt variant="big" style={{ fontSize: 22 }}>
          Kept
        </Txt>
        <View style={styles.headerBtns}>
          <Pressable onPress={() => router.push('/stats')} style={[styles.iconBtn, { backgroundColor: colors.surface }]}>
            <Chart size={18} />
          </Pressable>
          <Pressable onPress={() => router.push('/profile')} style={[styles.iconBtn, { backgroundColor: colors.green }]}>
            <User size={18} />
          </Pressable>
        </View>
      </View>

      <Txt style={styles.greeting}>
        {noHabits
          ? `Hi ${user.name.split(' ')[0]} — let's set your first spot.`
          : `Hi ${user.name.split(' ')[0]} — ${active.length} ${active.length === 1 ? 'habit' : 'habits'} in play.`}
      </Txt>

      {noHabits ? (
        <View style={styles.emptyState}>
          <Neo bg={colors.green} r={radius.lg} offset={4} style={styles.emptyIcon}>
            <Pin size={30} width={2.2} />
          </Neo>
          <Txt variant="big" style={{ textAlign: 'center', marginTop: 18 }}>
            No habits yet
          </Txt>
          <Txt style={styles.emptyBody}>
            Pick a place, pick your days, and start keeping the promise. Your streak begins the first time you show up.
          </Txt>
          <Pressable onPress={() => router.push('/setup')} style={[styles.newBtn, { marginTop: 22 }]}>
            <Plus size={17} />
            <Txt style={styles.newText}>NEW HABIT</Txt>
          </Pressable>
        </View>
      ) : (
        <>
          <Neo r={radius.md} style={styles.searchWrap}>
            <Search size={17} />
            <View style={{ flex: 1 }}>
              <View style={styles.searchInputWrap}>
                <SearchInput value={q} onChangeText={setQ} />
              </View>
            </View>
          </Neo>

          <View style={{ gap: 12, marginTop: 14 }}>
            {filtered.map((h) => (
              <HabitCard key={h.id} habit={h} />
            ))}
            {filtered.length === 0 && <Txt style={styles.empty}>No habits match “{q}”.</Txt>}
          </View>

          <Pressable onPress={() => router.push('/setup')} style={styles.newBtn}>
            <Plus size={17} />
            <Txt style={styles.newText}>NEW HABIT</Txt>
          </Pressable>
        </>
      )}
    </Screen>
  );
}

// Small controlled input used inside the search Neo box.
import { TextInput } from 'react-native';
function SearchInput({ value, onChangeText }: { value: string; onChangeText: (t: string) => void }) {
  return (
    <TextInput
      value={value}
      onChangeText={onChangeText}
      placeholder="Search habits…"
      placeholderTextColor={colors.muted}
      style={styles.searchInput}
    />
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerBtns: { flexDirection: 'row', gap: 8 },
  iconBtn: {
    width: 38,
    height: 38,
    borderWidth: 2,
    borderColor: colors.ink,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    ...hardShadow(2),
  },
  greeting: { fontFamily: fonts.bodySemi, fontSize: 13, color: colors.muted2, marginTop: 8 },
  searchWrap: {
    marginTop: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 13,
  },
  searchInputWrap: { justifyContent: 'center' },
  searchInput: { fontFamily: fonts.bodySemi, fontSize: 13, color: colors.ink, paddingVertical: 12 },
  card: { padding: 15 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  placeRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 4 },
  placeText: { fontFamily: fonts.bodySemi, fontSize: 11.5, color: colors.muted2 },
  streakPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderWidth: 2,
    borderColor: colors.ink,
    borderRadius: radius.sm,
    backgroundColor: colors.ink,
    paddingVertical: 5,
    paddingLeft: 10,
    paddingRight: 9,
  },
  streakNum: { fontFamily: fonts.displayBold, fontSize: 17, color: colors.surface },
  dotRow: { flexDirection: 'row', gap: 5, marginTop: 13, alignItems: 'center' },
  dot: { width: 13, height: 13, borderRadius: 5, borderWidth: 1.5 },
  modeTag: { fontFamily: fonts.bodyBold, fontSize: 10, color: colors.muted },
  barRow: { flexDirection: 'row', alignItems: 'center', gap: 9, marginTop: 11 },
  pct: { fontFamily: fonts.display, fontSize: 10, color: colors.greenDark },
  doneRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  doneText: { fontFamily: fonts.display, fontSize: 9, color: colors.greenDark, letterSpacing: 0.8 },
  empty: { fontFamily: fonts.bodySemi, fontSize: 12.5, color: colors.muted, textAlign: 'center', paddingVertical: 28 },
  emptyState: { marginTop: 60, alignItems: 'center' },
  emptyIcon: { width: 72, height: 72, alignItems: 'center', justifyContent: 'center' },
  emptyBody: {
    fontFamily: fonts.bodySemi,
    fontSize: 13.5,
    color: colors.muted2,
    textAlign: 'center',
    marginTop: 10,
    maxWidth: 280,
    lineHeight: 20,
  },
  newBtn: {
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 2.5,
    borderColor: colors.ink,
    borderStyle: 'dashed',
    borderRadius: radius.lg,
    backgroundColor: colors.cream,
    paddingVertical: 15,
  },
  newText: { fontFamily: fonts.displayBold, fontSize: 14, color: colors.ink },
});
