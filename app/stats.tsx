import { View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen } from '@/components/Screen';
import { Txt, Neo, Bar, BackButton } from '@/components/ui';
import { Heatmap } from '@/components/Heatmap';
import { colors, fonts, radius } from '@/theme/tokens';
import { useStore } from '@/store/useStore';
import { keptPct, winsOf, weekStats, monthStats, modeLabel, overallHeat, monthTicks } from '@/lib/analytics';

export default function Stats() {
  const router = useRouter();
  const allHabits = useStore((s) => s.habits);
  const habits = allHabits.filter((h) => !h.archived && !h.deleted);

  const pcts = habits.map(keptPct);
  const overall = pcts.length ? Math.round(pcts.reduce((a, b) => a + b, 0) / pcts.length) : 0;
  const wins = habits.reduce((s, h) => s + winsOf(h), 0);
  let wd = 0, wt = 0, md = 0, mt = 0;
  habits.forEach((h) => {
    const w = weekStats(h);
    wd += w.done;
    wt += w.target;
    const m = monthStats(h);
    md += m.done;
    mt += m.target;
  });

  const heatColors = colors.heat;

  return (
    <Screen scroll contentStyle={{ paddingTop: 6 }}>
      <View style={styles.header}>
        <BackButton onPress={() => router.replace('/home')} />
        <Txt variant="kicker">Stats</Txt>
      </View>

      <View style={styles.overallCard}>
        <View>
          <Txt style={styles.overallKicker}>OVERALL KEPT</Txt>
          <Txt style={styles.overallNum}>{overall}%</Txt>
          <Txt style={styles.overallSub}>across {habits.length} habits</Txt>
        </View>
        <View style={styles.winsBox}>
          <Txt style={styles.winsNum}>{wins}</Txt>
          <Txt style={styles.winsLabel}>WINS</Txt>
        </View>
      </View>

      <View style={styles.tileRow}>
        <SummaryTile label="THIS WEEK" value={`${wd}/${wt}`} />
        <SummaryTile label="THIS MONTH" value={`${md}/${mt}`} />
      </View>

      <Neo r={radius.lg} style={styles.heatCard}>
        <View style={styles.heatHeader}>
          <Txt style={styles.heatTitle}>Past year</Txt>
          <View style={styles.legend}>
            <Txt style={styles.legendText}>Less</Txt>
            {heatColors.map((c, i) => (
              <View key={i} style={[styles.legendSwatch, { backgroundColor: c }]} />
            ))}
            <Txt style={styles.legendText}>More</Txt>
          </View>
        </View>
        <Heatmap weeks={overallHeat(habits)} months={monthTicks()} />
        <Txt style={styles.heatCaption}>Shade = how many habits you kept that day.</Txt>
      </Neo>

      <Txt variant="label" style={{ marginTop: 20, marginBottom: 10 }}>
        KEPT BY HABIT
      </Txt>
      <View style={{ gap: 9 }}>
        {habits.map((h) => {
          const p = keptPct(h);
          return (
            <View key={h.id} style={styles.habitRow}>
              <View style={styles.habitRowTop}>
                <View>
                  <Txt style={styles.habitName}>{h.name}</Txt>
                  <Txt style={styles.habitMode}>{modeLabel(h)}</Txt>
                </View>
                <Txt style={styles.habitPct}>{p}%</Txt>
              </View>
              <View style={{ marginTop: 9 }}>
                <Bar pct={p} />
              </View>
            </View>
          );
        })}
      </View>
    </Screen>
  );
}

function SummaryTile({ label, value }: { label: string; value: string }) {
  return (
    <Neo r={radius.md} offset={3} style={styles.summaryTile}>
      <Txt variant="label" style={{ fontSize: 8 }}>
        {label}
      </Txt>
      <Txt variant="big" style={{ fontSize: 24, marginTop: 6 }}>
        {value}
      </Txt>
      <Txt style={styles.summarySub}>days kept vs goal</Txt>
    </Neo>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  overallCard: {
    marginTop: 18,
    backgroundColor: colors.ink,
    borderRadius: radius.xl,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  overallKicker: { fontFamily: fonts.display, fontSize: 11, color: colors.olive, letterSpacing: 1.5 },
  overallNum: { fontFamily: fonts.displayBold, fontSize: 46, color: colors.surface, marginTop: 6 },
  overallSub: { fontFamily: fonts.bodySemi, fontSize: 11, color: '#cfccc0', marginTop: 6 },
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
  tileRow: { flexDirection: 'row', gap: 10, marginTop: 12 },
  summaryTile: { flex: 1, padding: 14 },
  summarySub: { fontFamily: fonts.bodySemi, fontSize: 10, color: colors.muted, marginTop: 3 },
  heatCard: { marginTop: 20, padding: 15 },
  heatHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 11 },
  heatTitle: { fontFamily: fonts.displayBold, fontSize: 13, color: colors.ink },
  legend: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legendText: { fontFamily: fonts.bodySemi, fontSize: 9, color: colors.muted },
  legendSwatch: { width: 9, height: 9, borderRadius: 2, borderWidth: 1, borderColor: colors.border },
  heatCaption: { fontFamily: fonts.bodySemi, fontSize: 10, color: colors.muted, marginTop: 9 },
  habitRow: { borderWidth: 2, borderColor: colors.ink, borderRadius: radius.md, backgroundColor: colors.surface, paddingVertical: 11, paddingHorizontal: 13 },
  habitRowTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  habitName: { fontFamily: fonts.displayBold, fontSize: 13, color: colors.ink },
  habitMode: { fontFamily: fonts.bodySemi, fontSize: 10, color: colors.muted, marginTop: 2 },
  habitPct: { fontFamily: fonts.displayBold, fontSize: 15, color: colors.greenDark },
});
