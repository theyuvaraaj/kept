import { View, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen } from '@/components/Screen';
import { Txt, Neo, Button, BackButton } from '@/components/ui';
import { User, Chart, Gear } from '@/components/icons';
import { colors, fonts, radius, hardShadow } from '@/theme/tokens';
import { useStore } from '@/store/useStore';
import { streakOf, winsOf } from '@/lib/analytics';
import { hasSupabase } from '@/lib/supabase';
import { syncNow } from '@/lib/syncEngine';

const SYNC_LABEL = {
  idle: 'Up to date',
  syncing: 'Syncing…',
  synced: 'Synced ✓',
  error: 'Sync error — tap to retry',
} as const;

export default function Profile() {
  const router = useRouter();
  const user = useStore((s) => s.user);
  const session = useStore((s) => s.session);
  const syncStatus = useStore((s) => s.syncStatus);
  const allHabits = useStore((s) => s.habits);
  const habits = allHabits.filter((h) => !h.archived && !h.deleted);
  const archived = allHabits.filter((h) => h.archived && !h.deleted);

  const best = habits.reduce((mx, h) => Math.max(mx, streakOf(h)), 0);
  const totalWins = habits.reduce((s, h) => s + winsOf(h), 0);

  return (
    <Screen scroll contentStyle={{ paddingTop: 6 }}>
      <View style={styles.header}>
        <BackButton onPress={() => router.replace('/home')} />
        <Pressable onPress={() => router.push('/settings')} style={styles.gearBtn}>
          <Gear size={18} />
        </Pressable>
      </View>

      <View style={styles.identity}>
        <Neo bg={colors.green} r={20} offset={4} style={styles.avatar}>
          <User size={34} width={2.2} />
        </Neo>
        <View>
          <Txt variant="big" style={{ fontSize: 22 }}>
            {user.name}
          </Txt>
          <Txt style={styles.email}>{user.email}</Txt>
        </View>
      </View>

      <View style={styles.stats}>
        <StatBox value={String(habits.length)} label="HABITS" />
        <StatBox value={String(best)} label="BEST" highlight />
        <StatBox value={String(totalWins)} label="WINS" />
      </View>

      <Button
        label="VIEW FULL STATS"
        variant="dark"
        icon={<Chart size={17} color={colors.green} />}
        onPress={() => router.push('/stats')}
        style={{ marginTop: 14 }}
      />

      {hasSupabase && (
        <>
          <Txt variant="label" style={{ marginTop: 20, marginBottom: 10 }}>
            CLOUD SYNC
          </Txt>
          {session ? (
            <Neo r={radius.md} offset={0} borderWidth={2.5} style={styles.syncCard}>
              <Pressable style={{ flex: 1, paddingRight: 12 }} onPress={() => syncNow()}>
                <Txt style={styles.syncTitle}>{SYNC_LABEL[syncStatus]}</Txt>
                <Txt style={styles.syncSub}>{session.user?.email} · tap to sync</Txt>
              </Pressable>
              <Pressable onPress={() => router.push('/account')}>
                <Txt style={styles.syncManage}>Account</Txt>
              </Pressable>
            </Neo>
          ) : (
            <Button label="SIGN IN TO SYNC" variant="light" onPress={() => router.push('/auth')} />
          )}
        </>
      )}

      <Txt variant="label" style={{ marginTop: 20, marginBottom: 10 }}>
        YOUR HABITS
      </Txt>
      <View style={{ gap: 9 }}>
        {habits.map((h) => (
          <Pressable key={h.id} onPress={() => router.push(`/habit/${h.id}`)} style={styles.habitRow}>
            <View>
              <Txt style={styles.habitName}>{h.name}</Txt>
              <Txt style={styles.habitPlace}>{h.place.name}</Txt>
            </View>
            <Txt style={styles.streak}>{streakOf(h)}d streak</Txt>
          </Pressable>
        ))}
      </View>

      {archived.length > 0 && (
        <>
          <Txt variant="label" style={{ marginTop: 20, marginBottom: 10 }}>
            ARCHIVED
          </Txt>
          <View style={{ gap: 9 }}>
            {archived.map((h) => (
              <Pressable
                key={h.id}
                onPress={() => router.push(`/setup?id=${h.id}`)}
                style={[styles.habitRow, { opacity: 0.6 }]}
              >
                <View>
                  <Txt style={styles.habitName}>{h.name}</Txt>
                  <Txt style={styles.habitPlace}>{h.place.name}</Txt>
                </View>
                <Txt style={styles.streak}>Tap to restore</Txt>
              </Pressable>
            ))}
          </View>
        </>
      )}

    </Screen>
  );
}

function StatBox({ value, label, highlight }: { value: string; label: string; highlight?: boolean }) {
  return (
    <Neo bg={highlight ? colors.green : colors.surface} r={radius.md} offset={3} style={styles.statBox}>
      <Txt variant="big" style={{ fontSize: 26 }}>
        {value}
      </Txt>
      <Txt variant="label" style={[styles.statLabel, highlight && { color: '#1c2a10' }]}>
        {label}
      </Txt>
    </Neo>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
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
  syncCard: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 15 },
  syncTitle: { fontFamily: fonts.displayBold, fontSize: 14, color: colors.ink },
  syncSub: { fontFamily: fonts.bodySemi, fontSize: 12, color: colors.muted, marginTop: 3 },
  syncAction: { fontFamily: fonts.bodyBold, fontSize: 13, color: colors.red },
  syncManage: { fontFamily: fonts.bodyBold, fontSize: 13, color: colors.greenDark },
  identity: { flexDirection: 'row', alignItems: 'center', gap: 14, marginTop: 22 },
  avatar: { width: 66, height: 66, alignItems: 'center', justifyContent: 'center' },
  email: { fontFamily: fonts.bodySemi, fontSize: 12, color: colors.muted2, marginTop: 4 },
  stats: { flexDirection: 'row', gap: 10, marginTop: 22 },
  statBox: { flex: 1, alignItems: 'center', paddingVertical: 14, paddingHorizontal: 4 },
  statLabel: { fontSize: 8, letterSpacing: 1, marginTop: 5 },
  habitRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.ink,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    paddingVertical: 11,
    paddingHorizontal: 13,
  },
  habitName: { fontFamily: fonts.displayBold, fontSize: 13, color: colors.ink },
  habitPlace: { fontFamily: fonts.bodySemi, fontSize: 10.5, color: colors.muted, marginTop: 2 },
  streak: { fontFamily: fonts.bodySemi, fontSize: 11, color: colors.greenDark },
});
