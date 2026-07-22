import React from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { colors } from '@/theme/tokens';
import type { HeatWeek } from '@/lib/types';
import { Txt } from './ui';

const CELL = 9;
const GAP = 3;

/** GitHub-style yearly contribution grid. Horizontally scrollable. */
export function Heatmap({ weeks, months }: { weeks: HeatWeek[]; months: string[] }) {
  return (
    <View>
      <View style={styles.monthRow}>
        {months.map((m, i) => (
          <Txt key={i} variant="label" style={styles.month}>
            {m}
          </Txt>
        ))}
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.grid}>
          {weeks.map((w, wi) => (
            <View key={wi} style={styles.col}>
              {w.days.map((c, di) => (
                <View
                  key={di}
                  style={[
                    styles.cell,
                    {
                      backgroundColor: c.future ? 'transparent' : c.color,
                      borderColor: c.future ? 'transparent' : colors.border,
                    },
                  ]}
                />
              ))}
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  monthRow: { flexDirection: 'row', marginBottom: 5 },
  month: { flex: 1, fontSize: 8, color: colors.faint },
  grid: { flexDirection: 'row', gap: GAP, paddingBottom: 3 },
  col: { flexDirection: 'column', gap: GAP },
  cell: { width: CELL, height: CELL, borderRadius: 2, borderWidth: 1 },
});
