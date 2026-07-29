import { View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen } from '@/components/Screen';
import { Txt, Neo, Button } from '@/components/ui';
import { Pin, Check, Flame } from '@/components/icons';
import { colors, fonts, radius } from '@/theme/tokens';
import { useStore } from '@/store/useStore';
import { ensureNotificationPermission } from '@/lib/notifications';

const STEPS = [
  { icon: 'pin', title: 'Pick your spot', body: 'Choose a real place - the track, the gym, the library.' },
  { icon: 'check', title: 'Show up in the window', body: 'Check in while you\'re there during your chosen hours.' },
  { icon: 'flame', title: 'Keep the streak', body: 'Every day you show up builds the chain. Don\'t break it.' },
];

function StepIcon({ kind }: { kind: string }) {
  if (kind === 'pin') return <Pin size={22} width={2.2} />;
  if (kind === 'flame') return <Flame size={22} />;
  return <Check size={22} width={3} />;
}

export default function Onboarding() {
  const router = useRouter();
  const setOnboarded = useStore((s) => s.setOnboarded);

  async function start() {
    // Prime notification permission now that we've explained the value.
    await ensureNotificationPermission().catch(() => {});
    setOnboarded(true);
    router.replace('/'); // index routes to /auth (login) then /home
  }

  return (
    <Screen contentStyle={styles.wrap}>
      <View style={styles.top}>
        <Neo bg={colors.green} r={20} offset={4} style={styles.logo}>
          <Pin size={30} width={2.2} />
        </Neo>
        <Txt variant="display" style={{ fontSize: 44, marginTop: 18 }}>
          Kept.
        </Txt>
        <Txt variant="body" style={styles.tagline}>
          A habit only counts when you actually show up. Here's how it works.
        </Txt>

        <View style={styles.steps}>
          {STEPS.map((s, i) => (
            <View key={i} style={styles.step}>
              <Neo bg={colors.surface} r={radius.md} offset={3} style={styles.stepIcon}>
                <StepIcon kind={s.icon} />
              </Neo>
              <View style={{ flex: 1 }}>
                <Txt style={styles.stepTitle}>{s.title}</Txt>
                <Txt style={styles.stepBody}>{s.body}</Txt>
              </View>
            </View>
          ))}
        </View>

        <Txt style={styles.note}>
          Next we'll ask to send reminders during your window. Location for auto check-in comes later,
          only when you turn it on.
        </Txt>
      </View>

      <Button label="GET STARTED" onPress={start} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  wrap: { justifyContent: 'space-between', paddingTop: 20 },
  top: { flex: 1, justifyContent: 'center' },
  logo: { width: 64, height: 64, alignItems: 'center', justifyContent: 'center' },
  tagline: { marginTop: 12, maxWidth: 300, fontSize: 14 },
  steps: { marginTop: 28, gap: 16 },
  step: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  stepIcon: { width: 46, height: 46, alignItems: 'center', justifyContent: 'center' },
  stepTitle: { fontFamily: fonts.displayBold, fontSize: 16, color: colors.ink },
  stepBody: { fontFamily: fonts.bodySemi, fontSize: 12.5, color: colors.muted2, marginTop: 2, lineHeight: 18 },
  note: { fontFamily: fonts.bodySemi, fontSize: 12, color: colors.muted, marginTop: 28, lineHeight: 18 },
});
