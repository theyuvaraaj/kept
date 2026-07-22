import { useEffect, useRef, useState } from 'react';
import { View, Animated, Easing, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Screen } from '@/components/Screen';
import { Txt, Button, BackButton, Neo } from '@/components/ui';
import { Check, Flame } from '@/components/icons';
import { colors, fonts, radius } from '@/theme/tokens';
import { useStore } from '@/store/useStore';
import { streakOf } from '@/lib/analytics';

const LOCATE_MS = 1700;

export default function CheckIn() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const habit = useStore((s) => s.getHabit(id));
  const setDay = useStore((s) => s.setDay);
  const [phase, setPhase] = useState<'locating' | 'success'>('locating');

  const spin = useRef(new Animated.Value(0)).current;
  const ripple = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(spin, { toValue: 1, duration: 1000, easing: Easing.linear, useNativeDriver: true })
    ).start();
    Animated.loop(
      Animated.timing(ripple, { toValue: 1, duration: 1800, easing: Easing.out(Easing.ease), useNativeDriver: true })
    ).start();

    // v1: no real GPS. Auto-succeed after a beat (people only tap CHECK IN
    // NOW when they're actually at the spot). Real geofence check is v2.
    const t = setTimeout(() => {
      if (id) setDay(id, 'green');
      setPhase('success');
    }, LOCATE_MS);
    return () => clearTimeout(t);
  }, [id]);

  const rotate = spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  const rScale = ripple.interpolate({ inputRange: [0, 1], outputRange: [0.6, 2.4] });
  const rOpacity = ripple.interpolate({ inputRange: [0, 1], outputRange: [0.5, 0] });

  const streak = habit ? streakOf(habit) : 0;
  const placeName = habit?.place.name ?? 'your spot';

  return (
    <Screen contentStyle={styles.wrap}>
      <BackButton onPress={() => router.replace(`/habit/${id}`)} />

      <View style={styles.center}>
        {phase === 'locating' ? (
          <>
            <View style={styles.locateWrap}>
              <Animated.View style={[styles.ripple, { transform: [{ scale: rScale }], opacity: rOpacity }]} />
              <Animated.View style={[styles.spinner, { transform: [{ rotate }] }]} />
            </View>
            <Txt variant="title" style={{ fontSize: 22 }}>
              Finding you…
            </Txt>
            <Txt style={styles.sub}>Checking if you're at {placeName}</Txt>
          </>
        ) : (
          <>
            <Neo bg={colors.green} r={36} offset={7} style={styles.successBadge}>
              <Check size={66} width={3.2} />
            </Neo>
            <Txt variant="title" style={{ fontSize: 29, textAlign: 'center' }}>
              You're at the spot!
            </Txt>
            <Txt style={styles.congrats}>Congrats — you kept the promise.</Txt>
            <View style={styles.streakRow}>
              <Txt style={styles.streakText}>
                Streak is now <Txt style={styles.streakBold}>{streak} days</Txt>
              </Txt>
              <Flame size={19} color="#d1602f" />
            </View>
            <Button
              label="SEE MY STREAK"
              onPress={() => router.replace(`/habit/${id}`)}
              style={styles.seeBtn}
            />
          </>
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingTop: 8 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  locateWrap: { width: 150, height: 150, alignItems: 'center', justifyContent: 'center', marginBottom: 26 },
  ripple: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 75,
    borderWidth: 3,
    borderColor: colors.green,
  },
  spinner: {
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 4,
    borderColor: colors.ink,
    borderTopColor: colors.green,
  },
  sub: { fontFamily: fonts.bodySemi, fontSize: 13, color: colors.muted2, marginTop: 8, textAlign: 'center', maxWidth: 220 },
  successBadge: { width: 130, height: 130, alignItems: 'center', justifyContent: 'center', marginBottom: 26 },
  congrats: { fontFamily: fonts.bodyBold, fontSize: 14, color: colors.greenDark, marginTop: 10, textAlign: 'center' },
  streakRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 },
  streakText: { fontFamily: fonts.bodySemi, fontSize: 13, color: colors.muted2 },
  streakBold: { fontFamily: fonts.bodyBold, color: colors.ink },
  seeBtn: { marginTop: 28, width: 'auto', paddingHorizontal: 40 },
});
