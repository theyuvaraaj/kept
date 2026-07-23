import { useEffect, useRef } from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter, Redirect } from 'expo-router';
import * as Location from 'expo-location';
import { Screen } from '@/components/Screen';
import { Txt, Neo, Button } from '@/components/ui';
import { ArrowLeft, Gear, Flame, Check, XMark } from '@/components/icons';
import { colors, fonts, radius, hardShadow } from '@/theme/tokens';
import { distanceM } from '@/lib/geo';
import type { Habit } from '@/lib/types';
import { useStore } from '@/store/useStore';
import {
  streakOf,
  streakUnit,
  winsOf,
  keptPct,
  weekStats,
  monthStats,
  modeLabel,
  monthCells,
  monthLabel,
  fmtTime,
  todayKey,
  type CalendarCell,
} from '@/lib/analytics';

function inWindowNow(h: Habit): boolean {
  if (!h.start || !h.end) return true;
  const n = new Date();
  const cur = n.getHours() * 60 + n.getMinutes();
  const p = (t: string) => {
    const [a, b] = t.split(':').map(Number);
    return a * 60 + b;
  };
  return cur >= p(h.start) && cur <= p(h.end);
}

function Tile({ value, label, highlight }: { value: string; label: string; highlight?: boolean }) {
  return (
    <Neo bg={highlight ? colors.green : colors.surface} r={15} offset={3} style={styles.tile}>
      <Txt variant="big" style={{ fontSize: 21 }}>
        {value}
      </Txt>
      <Txt variant="label" style={[styles.tileLabel, highlight && { color: '#1c2a10' }]}>
        {label}
      </Txt>
    </Neo>
  );
}

function DayCell({ c }: { c: CalendarCell }) {
  if (c.kind === 'blank') return <View style={styles.cellSlot} />;
  const map = {
    today: { bg: colors.ink, fg: colors.surface, border: colors.ink },
    green: { bg: colors.green, fg: '#1c2a10', border: colors.ink },
    red: { bg: colors.red, fg: colors.surface, border: colors.ink },
    none: { bg: colors.surface, fg: '#c9c5b2', border: colors.border },
  }[c.kind];
  return (
    <View style={styles.cellSlot}>
      <View style={[styles.cell, { backgroundColor: map.bg, borderColor: map.border }]}>
        <Txt style={{ fontFamily: fonts.display, fontSize: 12, color: map.fg }}>{c.n}</Txt>
      </View>
    </View>
  );
}

export default function Dashboard() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const habit = useStore((s) => s.getHabit(id));
  const setDay = useStore((s) => s.setDay);
  const autoTried = useRef(false);

  // Auto check-in when you open the habit while already at the spot (geofencing
  // only fires on arrival/crossing the radius, so being parked there won't).
  useEffect(() => {
    if (!habit || autoTried.current || !habit.autoCheck) return;
    const st = (habit.history || {})[todayKey()];
    if (st === 'green' || st === 'red' || !inWindowNow(habit)) return;
    autoTried.current = true;
    (async () => {
      try {
        const perm = await Location.getForegroundPermissionsAsync(); // don't prompt here
        if (perm.status !== 'granted') return;
        const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        const d = distanceM(pos.coords.latitude, pos.coords.longitude, habit.place.lat, habit.place.lng);
        if (d <= (habit.radius || 100)) setDay(habit.id, 'green');
      } catch {}
    })();
  }, [habit, setDay]);

  if (!habit) return <Redirect href="/home" />;

  const streak = streakOf(habit);
  const wins = winsOf(habit);
  const wk = weekStats(habit);
  const mo = monthStats(habit);
  const cells = monthCells(habit);
  const todaySt = (habit.history || {})[todayKey()];

  const DOW = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  return (
    <Screen scroll contentStyle={{ paddingTop: 6 }}>
      <View style={styles.header}>
        <View style={{ flexShrink: 1 }}>
          <Pressable onPress={() => router.replace('/home')} style={styles.allBtn}>
            <ArrowLeft size={12} />
            <Txt style={styles.allText}>ALL HABITS</Txt>
          </Pressable>
          <Txt variant="kicker">Your spot</Txt>
          <Txt variant="title" style={{ marginTop: 4 }}>
            {habit.name}
          </Txt>
          <Txt style={styles.place}>{habit.place.name}</Txt>
        </View>
        <Pressable onPress={() => router.push(`/setup?id=${habit.id}`)} style={styles.gearBtn}>
          <Gear size={18} />
        </Pressable>
      </View>

      {/* streak + wins */}
      <View style={styles.streakCard}>
        <View>
          <Txt style={styles.streakKicker}>{streakUnit(habit)}</Txt>
          <View style={styles.streakRow}>
            <Txt style={styles.streakNum}>{streak}</Txt>
            <Flame size={27} />
          </View>
        </View>
        <View style={styles.winsBox}>
          <Txt style={styles.winsNum}>{wins}</Txt>
          <Txt style={styles.winsLabel}>WINS</Txt>
        </View>
      </View>

      {/* metric tiles */}
      <View style={styles.tiles}>
        <Tile value={`${keptPct(habit)}%`} label="KEPT" highlight />
        <Tile value={`${wk.done}/${wk.target}`} label="THIS WK" />
        <Tile value={`${mo.done}/${mo.target}`} label="THIS MO" />
      </View>
      <Txt style={styles.modeLabel}>{modeLabel(habit)}</Txt>

      {/* calendar */}
      <View style={styles.calHeader}>
        <Txt style={styles.monthLabel}>{monthLabel()}</Txt>
        <View style={styles.legend}>
          <LegendDot color={colors.green} label="Done" />
          <LegendDot color={colors.red} label="Missed" />
        </View>
      </View>
      <View style={styles.dowRow}>
        {DOW.map((d, i) => (
          <Txt key={i} style={styles.dow}>
            {d}
          </Txt>
        ))}
      </View>
      <View style={styles.calGrid}>
        {cells.map((c, i) => (
          <DayCell key={i} c={c} />
        ))}
      </View>

      {/* check-in area */}
      <View style={{ marginTop: 20 }}>
        {todaySt === 'green' ? (
          <View style={[styles.statusBox, { backgroundColor: colors.greenSoft }]}>
            <Check size={19} width={3.4} />
            <Txt style={styles.statusText}>CHECKED IN TODAY</Txt>
          </View>
        ) : todaySt === 'red' ? (
          <View style={[styles.statusBox, { backgroundColor: colors.redSoft }]}>
            <XMark size={18} width={3.4} />
            <Txt style={styles.statusText}>MISSED TODAY</Txt>
          </View>
        ) : (
          <>
            <Button label="CHECK IN NOW" onPress={() => router.push(`/checkin?id=${habit.id}`)} />
            {habit.autoCheck ? (
              <View style={styles.autoNote}>
                <View style={styles.autoDot} />
                <Txt style={styles.autoText}>
                  Auto check-in on · we'll mark you here {fmtTime(habit.start)} – {fmtTime(habit.end)} within{' '}
                  {habit.radius} m.
                </Txt>
              </View>
            ) : (
              <Txt style={styles.manualNote}>
                Manual · Window {fmtTime(habit.start)} – {fmtTime(habit.end)}
              </Txt>
            )}
          </>
        )}
      </View>
    </Screen>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.legendSwatch, { backgroundColor: color }]} />
      <Txt style={styles.legendText}>{label}</Txt>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  allBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    alignSelf: 'flex-start',
    borderWidth: 2,
    borderColor: colors.ink,
    borderRadius: 10,
    backgroundColor: colors.surface,
    paddingVertical: 5,
    paddingHorizontal: 10,
    marginBottom: 9,
    ...hardShadow(2),
  },
  allText: { fontFamily: fonts.display, fontSize: 10, color: colors.ink },
  place: { fontFamily: fonts.bodySemi, fontSize: 12, color: colors.muted2, marginTop: 5 },
  gearBtn: {
    width: 38,
    height: 38,
    borderWidth: 2,
    borderColor: colors.ink,
    borderRadius: radius.sm,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    ...hardShadow(2),
  },
  streakCard: {
    marginTop: 16,
    backgroundColor: colors.ink,
    borderRadius: radius.xl,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  streakKicker: { fontFamily: fonts.display, fontSize: 11, color: colors.olive, letterSpacing: 1.5 },
  streakRow: { flexDirection: 'row', alignItems: 'center', gap: 7, marginTop: 3 },
  streakNum: { fontFamily: fonts.displayBold, fontSize: 46, color: colors.surface },
  winsBox: {
    backgroundColor: colors.green,
    borderWidth: 2,
    borderColor: '#000',
    borderRadius: 15,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  winsNum: { fontFamily: fonts.displayBold, fontSize: 22, color: colors.ink },
  winsLabel: { fontFamily: fonts.display, fontSize: 9, color: colors.ink, letterSpacing: 1, marginTop: 3 },
  tiles: { flexDirection: 'row', gap: 8, marginTop: 12 },
  tile: { flex: 1, alignItems: 'center', paddingVertical: 12, paddingHorizontal: 4 },
  tileLabel: { fontSize: 8, letterSpacing: 0.8, marginTop: 5, color: colors.muted },
  modeLabel: { fontFamily: fonts.bodySemi, fontSize: 10, color: colors.muted, textAlign: 'center', marginTop: 7 },
  calHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 16, marginBottom: 11 },
  monthLabel: { fontFamily: fonts.displayBold, fontSize: 15, color: colors.ink },
  legend: { flexDirection: 'row', gap: 12 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legendSwatch: { width: 11, height: 11, borderRadius: 4, borderWidth: 1.5, borderColor: colors.ink },
  legendText: { fontFamily: fonts.bodySemi, fontSize: 10, color: colors.muted2 },
  dowRow: { flexDirection: 'row', marginBottom: 6 },
  dow: { flex: 1, textAlign: 'center', fontFamily: fonts.display, fontSize: 9, color: colors.faint },
  calGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  cellSlot: { width: `${100 / 7}%`, aspectRatio: 1, padding: 3 },
  cell: {
    flex: 1,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  statusBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
    borderWidth: 2.5,
    borderColor: colors.ink,
    borderRadius: radius.md,
    paddingVertical: 15,
    ...hardShadow(4),
  },
  statusText: { fontFamily: fonts.displayBold, fontSize: 15, color: colors.ink },
  autoNote: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 9 },
  autoDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.green },
  autoText: { fontFamily: fonts.bodySemi, fontSize: 11, color: colors.muted, textAlign: 'center', flexShrink: 1 },
  manualNote: { fontFamily: fonts.bodySemi, fontSize: 11, color: colors.muted, textAlign: 'center', marginTop: 9 },
});
