import { useEffect, useRef, useState } from 'react';
import { View, Pressable, StyleSheet, TextInput, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Location from 'expo-location';
import { requestBatteryExemption } from '@/lib/battery';
import { searchPlaces, type GeoResult } from '@/lib/geocode';
import { Screen } from '@/components/Screen';
import { Txt, Field, Button, BackButton, Neo } from '@/components/ui';
import { ArrowRight, Check, Pin, Search } from '@/components/icons';
import { colors, fonts, radius, hardShadow } from '@/theme/tokens';
import { useStore } from '@/store/useStore';
import type { Place, ScheduleType } from '@/lib/types';

const DOW = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

/** Format a time field as the user types: "1057" -> "10:57". */
function maskTime(t: string): string {
  const d = t.replace(/\D/g, '').slice(0, 4);
  return d.length <= 2 ? d : `${d.slice(0, 2)}:${d.slice(2)}`;
}

export default function Setup() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const router = useRouter();
  const existing = useStore((s) => (id ? s.getHabit(id) : undefined));
  const saveHabit = useStore((s) => s.saveHabit);
  const deleteHabit = useStore((s) => s.deleteHabit);
  const archiveHabit = useStore((s) => s.archiveHabit);
  const editing = !!existing;
  const archivedNow = !!existing?.archived;

  const [name, setName] = useState(existing?.name ?? '');
  const [placeQuery, setPlaceQuery] = useState(existing?.place.name ?? '');
  const [place, setPlace] = useState<Place | null>(existing?.place ?? null);
  const [scheduleType, setScheduleType] = useState<ScheduleType>(existing?.scheduleType ?? 'specific');
  const [days, setDays] = useState<number[]>(existing?.days ?? [1, 2, 3, 4, 5]);
  const [weeklyTarget, setWeeklyTarget] = useState(existing?.weeklyTarget ?? 4);
  const [start, setStart] = useState(existing?.start ?? '06:00');
  const [end, setEnd] = useState(existing?.end ?? '09:00');
  const [radiusM, setRadiusM] = useState(String(existing?.radius ?? 100));
  const [auto, setAuto] = useState(existing?.autoCheck ?? false);
  const [reminder, setReminder] = useState(existing?.reminder ?? true);

  const [locating, setLocating] = useState(false);
  const [locError, setLocError] = useState<string | null>(null);
  const [results, setResults] = useState<GeoResult[]>([]);
  const [searching, setSearching] = useState(false);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pickedRef = useRef(false);
  const nearRef = useRef<{ lat: number; lng: number } | null>(null);

  // Rough current location once (no prompt) to bias search to nearby places.
  useEffect(() => {
    (async () => {
      try {
        const perm = await Location.getForegroundPermissionsAsync();
        if (perm.status !== 'granted') return;
        const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Low });
        nearRef.current = { lat: pos.coords.latitude, lng: pos.coords.longitude };
      } catch {}
    })();
  }, []);

  // Debounced, location-biased place search.
  useEffect(() => {
    if (pickedRef.current) {
      pickedRef.current = false;
      return;
    }
    if (searchTimer.current) clearTimeout(searchTimer.current);
    const q = placeQuery.trim();
    if (q.length < 3) {
      setResults([]);
      return;
    }
    setSearching(true);
    searchTimer.current = setTimeout(async () => {
      const r = await searchPlaces(q, nearRef.current ?? undefined);
      setResults(r);
      setSearching(false);
    }, 500);
    return () => {
      if (searchTimer.current) clearTimeout(searchTimer.current);
    };
  }, [placeQuery]);

  function pickResult(r: GeoResult) {
    pickedRef.current = true;
    setPlace({ name: r.name, lat: r.lat, lng: r.lng });
    setPlaceQuery(r.name);
    setResults([]);
    setLocError(null);
  }

  function toggleDay(i: number) {
    setDays((d) => (d.includes(i) ? d.filter((x) => x !== i) : [...d, i]));
  }

  function toggleAuto() {
    // Turning OFF is immediate.
    if (auto) {
      setAuto(false);
      return;
    }
    // Turning ON: prominent disclosure BEFORE any background-location request
    // (required by Google Play). Only enable + request perms on explicit consent.
    Alert.alert(
      'Enable background location?',
      'Kept uses your location to automatically check you in when you arrive at this spot — including in the background, even when the app is closed.\n\nYour location is used only on your device to mark this habit. It is never sent anywhere, shared, or used for ads.',
      [
        { text: 'Not now', style: 'cancel', onPress: () => setAuto(false) },
        {
          text: 'Continue',
          onPress: () => {
            setAuto(true);
            // Next: OS location prompt (via save/sync) + battery exemption.
            requestBatteryExemption();
          },
        },
      ]
    );
  }

  async function useCurrentLocation() {
    setLocating(true);
    try {
      const perm = await Location.requestForegroundPermissionsAsync();
      if (perm.status !== 'granted') return;
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      let label = 'Current location';
      try {
        const g = await Location.reverseGeocodeAsync({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        });
        if (g[0]) label = g[0].name || g[0].street || g[0].city || label;
      } catch {}
      pickedRef.current = true;
      setPlace({ name: label, lat: pos.coords.latitude, lng: pos.coords.longitude });
      setPlaceQuery(label);
      setResults([]);
      setLocError(null);
    } finally {
      setLocating(false);
    }
  }

  function save() {
    if (!place) {
      setLocError('Set the spot — tap "Use my current location".');
      return;
    }
    const finalPlace = { name: placeQuery.trim() || place.name, lat: place.lat, lng: place.lng };
    const newId = saveHabit(
      {
        name,
        place: finalPlace,
        scheduleType,
        days,
        weeklyTarget,
        start,
        end,
        radius: Number(radiusM) || 100,
        autoCheck: auto,
        reminder,
      },
      editing ? id : null
    );
    router.replace(`/habit/${newId}`);
  }

  function remove() {
    if (id) deleteHabit(id);
    router.replace('/home');
  }

  function toggleArchive() {
    if (id) archiveHabit(id, !archivedNow);
    router.replace('/home');
  }

  const specific = scheduleType === 'specific';

  return (
    <Screen scroll contentStyle={{ paddingTop: 2 }}>
      <BackButton onPress={() => (editing ? router.replace(`/habit/${id}`) : router.replace('/home'))} />
      <Txt variant="kicker" style={{ marginTop: 14 }}>
        {editing ? 'Edit habit' : 'New habit'}
      </Txt>
      <Txt variant="title" style={{ marginTop: 4 }}>
        {editing ? 'Update spot' : 'Set your spot'}
      </Txt>

      <Label>HABIT NAME</Label>
      <Field value={name} onChangeText={setName} placeholder="Morning Run" />

      <Label>LOCATION</Label>
      <Field
        value={placeQuery}
        onChangeText={(t) => {
          setPlaceQuery(t);
          setPlace(null);
        }}
        placeholder="Search a place (e.g. Gold's Gym)"
      />
      {(searching || results.length > 0) && (
        <Neo r={radius.md} offset={0} borderWidth={2.5} style={styles.results}>
          {searching && results.length === 0 ? (
            <View style={styles.result}>
              <Search size={16} color={colors.muted} />
              <Txt style={styles.resultSub}>Searching…</Txt>
            </View>
          ) : (
            results.map((r, i) => (
              <Pressable key={`${r.lat}-${r.lng}-${i}`} onPress={() => pickResult(r)} style={[styles.result, i > 0 && styles.resultDivider]}>
                <Pin size={16} color={colors.muted} />
                <View style={{ flex: 1 }}>
                  <Txt style={styles.resultName} numberOfLines={1}>{r.name}</Txt>
                  {!!r.sub && <Txt style={styles.resultSub} numberOfLines={1}>{r.sub}</Txt>}
                </View>
              </Pressable>
            ))
          )}
        </Neo>
      )}
      <Pressable onPress={useCurrentLocation} style={styles.useLoc}>
        <Pin size={15} color={colors.greenDark} width={2.4} />
        <Txt style={styles.useLocText}>{locating ? 'Getting location…' : 'Use my current location'}</Txt>
      </Pressable>
      {place ? (
        <View style={styles.picked}>
          <Check size={18} color={colors.greenDark} width={3.4} />
          <View style={{ flex: 1 }}>
            <Txt style={styles.pickedName}>Spot set</Txt>
            <Txt style={styles.pickedCoords}>
              {place.lat.toFixed(4)}, {place.lng.toFixed(4)}
            </Txt>
          </View>
        </View>
      ) : (
        <Txt style={[styles.locHint, locError ? { color: colors.red } : null]}>
          {locError ?? 'Search above, or tap “Use my current location” to pin where you are.'}
        </Txt>
      )}

      <Label>SCHEDULE</Label>
      <View style={styles.segment}>
        <Pressable
          onPress={() => setScheduleType('specific')}
          style={[styles.seg, styles.segLeft, specific ? styles.segOn : styles.segOff]}
        >
          <Txt style={[styles.segText, specific && styles.segTextOn]}>SPECIFIC DAYS</Txt>
        </Pressable>
        <Pressable
          onPress={() => setScheduleType('count')}
          style={[styles.seg, styles.segRight, !specific ? styles.segOn : styles.segOff]}
        >
          <Txt style={[styles.segText, !specific && styles.segTextOn]}>DAYS PER WEEK</Txt>
        </Pressable>
      </View>

      {specific ? (
        <>
          <View style={styles.chips}>
            {DOW.map((label, i) => {
              const on = days.includes(i);
              return (
                <Pressable
                  key={i}
                  onPress={() => toggleDay(i)}
                  style={[styles.chip, on ? styles.chipOn : styles.chipOff]}
                >
                  <Txt style={[styles.chipText, { color: on ? colors.ink : '#b3ae9b' }]}>{label}</Txt>
                </Pressable>
              );
            })}
          </View>
          <Txt style={styles.hint}>Pick the exact weekdays you'll show up.</Txt>
        </>
      ) : (
        <>
          <Neo r={radius.md} offset={3} style={styles.stepper}>
            <Pressable onPress={() => setWeeklyTarget((n) => Math.max(1, n - 1))} style={[styles.stepBtn, { backgroundColor: colors.surface }]}>
              <Txt style={styles.stepSign}>–</Txt>
            </Pressable>
            <View style={{ flex: 1, alignItems: 'center' }}>
              <Txt style={styles.stepNum}>{weeklyTarget}</Txt>
              <Txt style={styles.stepUnit}>days / week</Txt>
            </View>
            <Pressable onPress={() => setWeeklyTarget((n) => Math.min(7, n + 1))} style={[styles.stepBtn, { backgroundColor: colors.green }]}>
              <Txt style={styles.stepSign}>+</Txt>
            </Pressable>
          </Neo>
          <Txt style={styles.hint}>Any {weeklyTarget} days a week — you choose which, we just count.</Txt>
        </>
      )}

      <View style={styles.timeRow}>
        <View style={{ flex: 1 }}>
          <Label>START</Label>
          <Field
            value={start}
            onChangeText={(t) => setStart(maskTime(t))}
            placeholder="HH:MM"
            keyboardType="number-pad"
            maxLength={5}
          />
        </View>
        <View style={{ flex: 1 }}>
          <Label>END</Label>
          <Field
            value={end}
            onChangeText={(t) => setEnd(maskTime(t))}
            placeholder="HH:MM"
            keyboardType="number-pad"
            maxLength={5}
          />
        </View>
      </View>

      <Label>CHECK RADIUS</Label>
      <View style={styles.radiusRow}>
        <View style={{ width: 118 }}>
          <Field value={radiusM} onChangeText={setRadiusM} keyboardType="number-pad" placeholder="100" />
        </View>
        <Txt style={styles.radiusHint}>
          meters{'\n'}
          <Txt style={{ fontSize: 11, color: '#a09b86' }}>default 100 m</Txt>
        </Txt>
      </View>

      <Neo r={radius.md} offset={0} borderWidth={2.5} style={styles.autoCard}>
        <View style={{ flex: 1, paddingRight: 12 }}>
          <Txt style={styles.autoTitle}>Auto check-in</Txt>
          <Txt style={styles.autoDesc}>
            Track my location automatically during the window and mark the day for me. Requires always-on location.
          </Txt>
        </View>
        <Pressable onPress={toggleAuto} style={[styles.switch, auto ? styles.switchOn : styles.switchOff]}>
          <View style={styles.knob} />
        </Pressable>
      </Neo>

      <Neo r={radius.md} offset={0} borderWidth={2.5} style={styles.autoCard}>
        <View style={{ flex: 1, paddingRight: 12 }}>
          <Txt style={styles.autoTitle}>Reminder</Txt>
          <Txt style={styles.autoDesc}>Nudge me during the window so I don't forget to show up.</Txt>
        </View>
        <Pressable onPress={() => setReminder((r) => !r)} style={[styles.switch, reminder ? styles.switchOn : styles.switchOff]}>
          <View style={styles.knob} />
        </Pressable>
      </Neo>

      <Button
        label={editing ? 'SAVE CHANGES' : 'START TRACKING'}
        icon={<ArrowRight />}
        onPress={save}
        style={{ marginTop: 24 }}
      />
      {editing && (
        <>
          <Button
            label={archivedNow ? 'UNARCHIVE HABIT' : 'ARCHIVE HABIT'}
            variant="light"
            onPress={toggleArchive}
            style={{ marginTop: 11 }}
          />
          <Pressable onPress={remove} style={{ marginTop: 14, alignItems: 'center' }}>
            <Txt style={styles.delete}>Delete this habit</Txt>
          </Pressable>
        </>
      )}
    </Screen>
  );
}

function Label({ children }: { children: string }) {
  return (
    <Txt variant="label" style={{ marginTop: 20, marginBottom: 8 }}>
      {children}
    </Txt>
  );
}

const styles = StyleSheet.create({
  useLoc: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10, alignSelf: 'flex-start' },
  useLocText: { fontFamily: fonts.bodyBold, fontSize: 12.5, color: colors.greenDark },
  locHint: { fontFamily: fonts.bodySemi, fontSize: 12, color: colors.muted, marginTop: 10, lineHeight: 18 },
  results: { marginTop: 8, overflow: 'hidden' },
  result: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 11, paddingHorizontal: 14 },
  resultDivider: { borderTopWidth: 1.5, borderTopColor: '#ece8da' },
  resultName: { fontFamily: fonts.bodyBold, fontSize: 13, color: colors.ink },
  resultSub: { fontFamily: fonts.body, fontSize: 11, color: colors.muted },
  picked: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 2.5,
    borderColor: colors.ink,
    borderRadius: radius.md,
    backgroundColor: colors.greenSoft,
    paddingVertical: 11,
    paddingHorizontal: 13,
  },
  pickedName: { fontFamily: fonts.bodyBold, fontSize: 13, color: colors.ink },
  pickedCoords: { fontFamily: fonts.body, fontSize: 11, color: colors.muted2 },
  segment: { flexDirection: 'row', marginBottom: 12 },
  seg: { flex: 1, paddingVertical: 11, alignItems: 'center', borderWidth: 2, borderColor: colors.ink },
  segLeft: { borderTopLeftRadius: 12, borderBottomLeftRadius: 12, borderRightWidth: 1 },
  segRight: { borderTopRightRadius: 12, borderBottomRightRadius: 12, borderLeftWidth: 1 },
  segOn: { backgroundColor: colors.green },
  segOff: { backgroundColor: colors.surface },
  segText: { fontFamily: fonts.display, fontSize: 11, color: colors.muted, letterSpacing: 0.4 },
  segTextOn: { color: colors.ink },
  chips: { flexDirection: 'row', gap: 6 },
  chip: { flex: 1, paddingVertical: 10, alignItems: 'center', borderWidth: 2, borderColor: colors.ink, borderRadius: radius.sm },
  chipOn: { backgroundColor: colors.green, ...hardShadow(2) },
  chipOff: { backgroundColor: colors.surface },
  chipText: { fontFamily: fonts.display, fontSize: 12 },
  hint: { fontFamily: fonts.bodySemi, fontSize: 12.5, color: colors.muted, marginTop: 10 },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 10, paddingHorizontal: 14 },
  stepBtn: {
    width: 44,
    height: 44,
    borderWidth: 2,
    borderColor: colors.ink,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    ...hardShadow(2),
  },
  stepSign: { fontFamily: fonts.displayBold, fontSize: 22, color: colors.ink },
  stepNum: { fontFamily: fonts.displayBold, fontSize: 30, color: colors.ink },
  stepUnit: { fontFamily: fonts.bodyBold, fontSize: 10, color: colors.muted, marginTop: 3 },
  timeRow: { flexDirection: 'row', gap: 12 },
  radiusRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  radiusHint: { fontFamily: fonts.bodySemi, fontSize: 13, color: colors.muted2 },
  autoCard: { marginTop: 20, flexDirection: 'row', alignItems: 'center', paddingVertical: 13, paddingHorizontal: 15 },
  autoTitle: { fontFamily: fonts.displayBold, fontSize: 13, color: colors.ink },
  autoDesc: { fontFamily: fonts.bodySemi, fontSize: 11, color: colors.muted, marginTop: 3 },
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
  delete: { fontFamily: fonts.bodyBold, fontSize: 12, color: colors.red },
});
