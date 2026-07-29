import { useState } from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen } from '@/components/Screen';
import { Txt, Neo, BackButton, ConfirmModal } from '@/components/ui';
import { colors, fonts, radius } from '@/theme/tokens';
import { useStore } from '@/store/useStore';
import { GRACE_DAYS } from '@/lib/analytics';

export default function Settings() {
  const router = useRouter();
  const remindersEnabled = useStore((s) => s.remindersEnabled);
  const setRemindersEnabled = useStore((s) => s.setRemindersEnabled);
  const autoStatus = useStore((s) => s.autoStatus);
  const [showReset, setShowReset] = useState(false);

  function doReset() {
    setShowReset(false);
    useStore.setState({ habits: [], dirty: true });
    router.replace('/home');
  }

  return (
    <Screen scroll contentStyle={{ paddingTop: 6 }}>
      <View style={styles.header}>
        <BackButton onPress={() => router.replace('/profile')} />
        <Txt variant="kicker">Settings</Txt>
      </View>

      <Txt variant="label" style={{ marginTop: 22, marginBottom: 10 }}>
        NOTIFICATIONS
      </Txt>
      <Neo r={radius.md} offset={0} borderWidth={2.5} style={styles.row}>
        <View style={{ flex: 1, paddingRight: 12 }}>
          <Txt style={styles.rowTitle}>Reminders</Txt>
          <Txt style={styles.rowDesc}>
            Master switch. Turn off to silence every habit reminder at once.
          </Txt>
        </View>
        <Pressable
          onPress={() => setRemindersEnabled(!remindersEnabled)}
          style={[styles.switch, remindersEnabled ? styles.switchOn : styles.switchOff]}
        >
          <View style={styles.knob} />
        </Pressable>
      </Neo>

      <Neo r={radius.md} offset={0} borderWidth={2.5} style={[styles.infoCard, { marginTop: 10 }]}>
        <Txt style={styles.rowTitle}>Background check-in</Txt>
        <Txt style={styles.rowDesc}>Status: {autoStatus}</Txt>
      </Neo>

      <Txt variant="label" style={{ marginTop: 22, marginBottom: 10 }}>
        HOW IT WORKS
      </Txt>
      <Neo r={radius.md} offset={0} borderWidth={2.5} style={styles.infoCard}>
        <Txt style={styles.rowTitle}>Streaks</Txt>
        <Txt style={styles.rowDesc}>
          Only your scheduled days count. Off-days never break a streak.{' '}
          {GRACE_DAYS === 1 ? 'One slip is forgiven' : `${GRACE_DAYS} slips are forgiven`} before it
          resets. Habits set to “days per week” track by week instead.
        </Txt>
      </Neo>
      <Neo r={radius.md} offset={0} borderWidth={2.5} style={[styles.infoCard, { marginTop: 10 }]}>
        <Txt style={styles.rowTitle}>Text size</Txt>
        <Txt style={styles.rowDesc}>
          Kept follows your phone's text-size setting. Change it in your system Settings → Display →
          Font size to scale the whole app.
        </Txt>
      </Neo>

      <Txt variant="label" style={{ marginTop: 22, marginBottom: 10 }}>
        FEEDBACK
      </Txt>
      <Pressable onPress={() => router.push('/feedback')} style={styles.feedbackRow}>
        <View style={{ flex: 1, paddingRight: 12 }}>
          <Txt style={styles.rowTitle}>Send feedback</Txt>
          <Txt style={styles.rowDesc}>Bugs, ideas, gripes — the dev reads every one, every week.</Txt>
        </View>
        <Txt style={styles.feedbackArrow}>→</Txt>
      </Pressable>

      <Txt variant="label" style={{ marginTop: 22, marginBottom: 10 }}>
        DATA
      </Txt>
      <Pressable onPress={() => setShowReset(true)} style={styles.resetBtn}>
        <Txt style={styles.resetText}>Reset all data</Txt>
      </Pressable>

      <Txt style={styles.version}>Kept v1 · SDK 54</Txt>

      <ConfirmModal
        visible={showReset}
        title="Reset all data?"
        message="Deletes every habit and its history. This cannot be undone."
        cancelLabel="Cancel"
        confirmLabel="Reset"
        danger
        onCancel={() => setShowReset(false)}
        onConfirm={doReset}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 13, paddingHorizontal: 15 },
  infoCard: { paddingVertical: 13, paddingHorizontal: 15 },
  rowTitle: { fontFamily: fonts.displayBold, fontSize: 14, color: colors.ink },
  rowDesc: { fontFamily: fonts.bodySemi, fontSize: 12, color: colors.muted, marginTop: 4, lineHeight: 18 },
  switch: {
    width: 52,
    height: 30,
    borderWidth: 2.5,
    borderColor: colors.ink,
    borderRadius: 16,
    padding: 2,
    justifyContent: 'center',
  },
  switchOn: { backgroundColor: colors.green, alignItems: 'flex-end' },
  switchOff: { backgroundColor: colors.creamDeep, alignItems: 'flex-start' },
  knob: { width: 22, height: 22, borderRadius: 11, backgroundColor: colors.ink },
  resetBtn: {
    borderWidth: 2.5,
    borderColor: colors.red,
    borderRadius: radius.md,
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: colors.surface,
  },
  resetText: { fontFamily: fonts.bodyBold, fontSize: 13, color: colors.red },
  feedbackRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2.5,
    borderColor: colors.ink,
    borderRadius: radius.md,
    backgroundColor: colors.greenSoft,
    paddingVertical: 14,
    paddingHorizontal: 15,
  },
  feedbackArrow: { fontFamily: fonts.displayBold, fontSize: 20, color: colors.ink },
  version: { fontFamily: fonts.bodySemi, fontSize: 11, color: colors.faint, textAlign: 'center', marginTop: 24 },
});
