import { useCallback, useEffect, useRef, useState } from 'react';
import { View, Animated, Easing, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Location from 'expo-location';
import { Screen } from '@/components/Screen';
import { Txt, Button, BackButton, Neo } from '@/components/ui';
import { Check, Flame, XMark } from '@/components/icons';
import { colors, fonts } from '@/theme/tokens';
import { useStore } from '@/store/useStore';
import { streakOf } from '@/lib/analytics';
import { distanceM } from '@/lib/geo';

type Phase = 'locating' | 'success' | 'fail';

export default function CheckIn() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const habit = useStore((s) => s.getHabit(id)); // for display only

  const [phase, setPhase] = useState<Phase>('locating');
  const [distTxt, setDistTxt] = useState('');
  const [failTitle, setFailTitle] = useState('');
  const [failMsg, setFailMsg] = useState('');

  const spin = useRef(new Animated.Value(0)).current;
  const ripple = useRef(new Animated.Value(0)).current;

  // Read the habit + setDay from the store imperatively so marking the day
  // green (which creates a new habit object) never re-triggers locate - that
  // was the "finding you… → success → finding you…" loop.
  const locate = useCallback(async () => {
    setPhase('locating');
    const h = useStore.getState().getHabit(id);
    if (!h) return;
    const setDay = useStore.getState().setDay;
    const t0 = Date.now();
    let apply: () => void;
    try {
      const perm = await Location.requestForegroundPermissionsAsync();
      if (perm.status !== 'granted') {
        apply = () => {
          setFailTitle('Location needed');
          setFailMsg("Allow location access so Kept can confirm you're at your spot.");
          setPhase('fail');
        };
      } else {
        const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        const d = distanceM(pos.coords.latitude, pos.coords.longitude, h.place.lat, h.place.lng);
        const radius = h.radius || 100;
        if (d <= radius) {
          apply = () => {
            setDay(h.id, 'green');
            setDistTxt(`${Math.round(d)} m from your spot`);
            setPhase('success');
          };
        } else {
          apply = () => {
            setFailTitle('Not at your spot');
            const away = d > 1000 ? `${(d / 1000).toFixed(1)} km` : `${Math.round(d)} m`;
            setFailMsg(`You're ${away} away. Get within ${radius} m of ${h.place.name} and try again.`);
            setPhase('fail');
          };
        }
      }
    } catch {
      apply = () => {
        setFailTitle('Location error');
        setFailMsg('Could not read your location. Check GPS / permissions and try again.');
        setPhase('fail');
      };
    }
    // keep "Finding you…" on screen for a beat so it never flickers
    const wait = Math.max(0, 850 - (Date.now() - t0));
    setTimeout(apply, wait);
  }, [id]);

  // Run once on mount. locate no longer depends on the reactive habit, so a
  // successful check-in can't restart this effect.
  useEffect(() => {
    Animated.loop(
      Animated.timing(spin, { toValue: 1, duration: 1000, easing: Easing.linear, useNativeDriver: true })
    ).start();
    Animated.loop(
      Animated.timing(ripple, { toValue: 1, duration: 1800, easing: Easing.out(Easing.ease), useNativeDriver: true })
    ).start();
    locate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const rotate = spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  const rScale = ripple.interpolate({ inputRange: [0, 1], outputRange: [0.6, 2.4] });
  const rOpacity = ripple.interpolate({ inputRange: [0, 1], outputRange: [0.5, 0] });

  const streak = habit ? streakOf(habit) : 0;
  const placeName = habit?.place.name ?? 'your spot';

  return (
    <Screen contentStyle={styles.wrap}>
      <BackButton onPress={() => router.replace(`/habit/${id}`)} />

      <View style={styles.center}>
        {phase === 'locating' && (
          <>
            <View style={styles.locateWrap}>
              <Animated.View style={[styles.ripple, { transform: [{ scale: rScale }], opacity: rOpacity }]} />
              <Animated.View style={[styles.spinner, { transform: [{ rotate }] }]} />
            </View>
            <Txt variant="title" style={{ fontSize: 22 }}>
              Finding you…
            </Txt>
            <Txt style={styles.sub}>
              Checking if you're within {habit?.radius ?? 100} m of {placeName}
            </Txt>
          </>
        )}

        {phase === 'success' && (
          <>
            <Neo bg={colors.green} r={36} offset={7} style={styles.badge}>
              <Check size={66} width={3.2} />
            </Neo>
            <Txt variant="title" style={{ fontSize: 29, textAlign: 'center' }}>
              You're at the spot!
            </Txt>
            <Txt style={styles.congrats}>Congrats - you kept the promise.</Txt>
            <View style={styles.streakRow}>
              <Txt style={styles.streakText}>
                Streak is now <Txt style={styles.streakBold}>{streak} days</Txt>
              </Txt>
              <Flame size={19} color="#d1602f" />
            </View>
            <Txt style={styles.dist}>{distTxt}</Txt>
            <Button label="SEE MY STREAK" onPress={() => router.replace(`/habit/${id}`)} style={styles.cta} />
          </>
        )}

        {phase === 'fail' && (
          <>
            <Neo bg={colors.red} r={36} offset={7} style={styles.badge}>
              <XMark size={60} color={colors.surface} width={3} />
            </Neo>
            <Txt variant="title" style={{ fontSize: 26, textAlign: 'center' }}>
              {failTitle}
            </Txt>
            <Txt style={styles.failMsg}>{failMsg}</Txt>
            <Button label="TRY AGAIN" variant="light" onPress={locate} style={styles.cta} />
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
  ripple: { position: 'absolute', width: 150, height: 150, borderRadius: 75, borderWidth: 3, borderColor: colors.green },
  spinner: { width: 70, height: 70, borderRadius: 35, borderWidth: 4, borderColor: colors.ink, borderTopColor: colors.green },
  sub: { fontFamily: fonts.bodySemi, fontSize: 13, color: colors.muted2, marginTop: 8, textAlign: 'center', maxWidth: 220 },
  badge: { width: 130, height: 130, alignItems: 'center', justifyContent: 'center', marginBottom: 26 },
  congrats: { fontFamily: fonts.bodyBold, fontSize: 14, color: colors.greenDark, marginTop: 10, textAlign: 'center' },
  streakRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 },
  streakText: { fontFamily: fonts.bodySemi, fontSize: 13, color: colors.muted2 },
  streakBold: { fontFamily: fonts.bodyBold, color: colors.ink },
  dist: { fontFamily: fonts.bodySemi, fontSize: 12, color: colors.muted, marginTop: 4 },
  failMsg: { fontFamily: fonts.bodySemi, fontSize: 13, color: colors.muted2, marginTop: 10, textAlign: 'center', maxWidth: 240, lineHeight: 19 },
  cta: { marginTop: 28, width: 'auto', paddingHorizontal: 40 },
});
