import React from 'react';
import {
  Text,
  View,
  Pressable,
  TextInput,
  Modal,
  ScrollView,
  StyleSheet,
  type TextProps,
  type ViewStyle,
  type StyleProp,
  type TextStyle,
  type TextInputProps,
} from 'react-native';
import { colors, fonts, radius, hardShadow } from '@/theme/tokens';
import { ArrowLeft, Eye, EyeOff } from './icons';

/* ---------------- Text ---------------- */

type TxtVariant = 'display' | 'title' | 'big' | 'kicker' | 'label' | 'body' | 'bodyBold';

const txtStyles: Record<TxtVariant, TextStyle> = {
  display: { fontFamily: fonts.displayBold, fontSize: 40, color: colors.ink, letterSpacing: -0.4 },
  title: { fontFamily: fonts.displayBold, fontSize: 26, color: colors.ink },
  big: { fontFamily: fonts.displayBold, fontSize: 21, color: colors.ink },
  kicker: {
    fontFamily: fonts.display,
    fontSize: 12.5,
    color: colors.muted,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  label: { fontFamily: fonts.display, fontSize: 12, color: colors.muted, letterSpacing: 1.2 },
  body: { fontFamily: fonts.body, fontSize: 14, color: colors.muted2 },
  bodyBold: { fontFamily: fonts.bodyBold, fontSize: 14, color: colors.ink },
};

export function Txt({
  variant = 'body',
  style,
  children,
  ...rest
}: TextProps & { variant?: TxtVariant; style?: StyleProp<TextStyle> }) {
  return (
    <Text style={[txtStyles[variant], style]} {...rest}>
      {children}
    </Text>
  );
}

/* ---------------- Neo box (hard shadow) ---------------- */

export function Neo({
  children,
  bg = colors.surface,
  r = radius.lg,
  offset = 4,
  borderWidth = 2.5,
  style,
}: {
  children?: React.ReactNode;
  bg?: string;
  r?: number;
  offset?: number;
  borderWidth?: number;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View
      style={[
        {
          backgroundColor: bg,
          borderColor: colors.ink,
          borderWidth,
          borderRadius: r,
          ...hardShadow(offset),
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

/* ---------------- Button ---------------- */

type BtnVariant = 'primary' | 'dark' | 'light' | 'danger';

export function Button({
  label,
  onPress,
  variant = 'primary',
  icon,
  style,
}: {
  label: string;
  onPress?: () => void;
  variant?: BtnVariant;
  icon?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  const bg =
    variant === 'primary'
      ? colors.green
      : variant === 'dark'
        ? colors.ink
        : variant === 'danger'
          ? colors.red
          : colors.surface;
  const fg = variant === 'dark' || variant === 'danger' ? colors.surface : colors.ink;
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.btn,
        { backgroundColor: bg, transform: [{ translateY: pressed ? 2 : 0 }] },
        style,
      ]}
    >
      <Text style={[styles.btnText, { color: fg }]}>{label}</Text>
      {icon}
    </Pressable>
  );
}

export function BackButton({ label = 'BACK', onPress }: { label?: string; onPress?: () => void }) {
  return (
    <Pressable onPress={onPress} style={styles.back}>
      <ArrowLeft size={13} />
      <Text style={styles.backText}>{label}</Text>
    </Pressable>
  );
}

/* ---------------- Progress bar ---------------- */

export function Bar({ pct, color = colors.green }: { pct: number; color?: string }) {
  return (
    <View style={styles.barTrack}>
      <View style={{ height: '100%', width: `${Math.max(0, Math.min(100, pct))}%`, backgroundColor: color }} />
    </View>
  );
}

/* ---------------- Text input ---------------- */

export function Field(props: TextInputProps) {
  return <TextInput placeholderTextColor={colors.muted} style={styles.field} {...props} />;
}

/** Password input with an inline eye toggle. */
export function PasswordField(props: TextInputProps) {
  const [show, setShow] = React.useState(false);
  return (
    <View style={{ position: 'relative', justifyContent: 'center' }}>
      <TextInput
        placeholderTextColor={colors.muted}
        secureTextEntry={!show}
        autoCapitalize="none"
        style={[styles.field, { paddingRight: 46 }]}
        {...props}
      />
      <Pressable
        onPress={() => setShow((s) => !s)}
        hitSlop={10}
        style={{ position: 'absolute', right: 12, height: '100%', justifyContent: 'center' }}
      >
        {show ? <EyeOff size={20} /> : <Eye size={20} />}
      </Pressable>
    </View>
  );
}

/* ---------------- Themed confirm dialog ---------------- */

export function ConfirmModal({
  visible,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  danger = false,
  onConfirm,
  onCancel,
}: {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent onRequestClose={onCancel}>
      <Pressable style={styles.overlay} onPress={onCancel}>
        <Pressable style={{ width: '100%', maxWidth: 380 }} onPress={() => {}}>
          <Neo r={radius.lg} offset={5} style={styles.dialog}>
            <Text style={styles.dialogTitle}>{title}</Text>
            <Text style={styles.dialogMsg}>{message}</Text>
            <View style={styles.dialogRow}>
              <Button label={cancelLabel} variant="light" onPress={onCancel} style={{ flex: 1 }} />
              <Button
                label={confirmLabel}
                variant={danger ? 'danger' : 'primary'}
                onPress={onConfirm}
                style={{ flex: 1 }}
              />
            </View>
          </Neo>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

/* ---------------- Themed time picker (scroll wheels) ---------------- */

const WHEEL_ITEM = 46;
const WHEEL_VISIBLE = 5; // odd → a true centre row
const WHEEL_H = WHEEL_ITEM * WHEEL_VISIBLE;
const PAD_ROWS = (WHEEL_VISIBLE - 1) / 2;
const pad2 = (n: number) => String(n).padStart(2, '0');

// One scrollable column. You drag; the value under the fixed centre band is the
// selection — your finger is on the rows below it, never over the chosen number.
function WheelColumn({ count, value, onChange }: { count: number; value: number; onChange: (v: number) => void }) {
  const ref = React.useRef<ScrollView>(null);
  React.useEffect(() => {
    // Land on the initial value (component remounts fresh each open).
    const t = setTimeout(() => ref.current?.scrollTo({ y: value * WHEEL_ITEM, animated: false }), 0);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  // Just read the resting row — snapToInterval already handles the visual snap,
  // so we avoid a scrollTo that would fight momentum and cut flicks short.
  const read = (y: number) => {
    const i = Math.max(0, Math.min(count - 1, Math.round(y / WHEEL_ITEM)));
    if (i !== value) onChange(i);
  };
  return (
    <ScrollView
      ref={ref}
      style={{ width: 66, height: WHEEL_H }}
      showsVerticalScrollIndicator={false}
      snapToInterval={WHEEL_ITEM}
      decelerationRate="fast"
      contentOffset={{ x: 0, y: value * WHEEL_ITEM }}
      contentContainerStyle={{ paddingVertical: WHEEL_ITEM * PAD_ROWS }}
      onMomentumScrollEnd={(e) => read(e.nativeEvent.contentOffset.y)}
      onScrollEndDrag={(e) => read(e.nativeEvent.contentOffset.y)}
    >
      {Array.from({ length: count }, (_, i) => (
        <View key={i} style={styles.wheelItem}>
          <Text style={[styles.wheelNum, i === value && styles.wheelNumOn]}>{pad2(i)}</Text>
        </View>
      ))}
    </ScrollView>
  );
}

function TimeWheels({
  initial,
  title,
  onDone,
  onCancel,
}: {
  initial: string;
  title: string;
  onDone: (v: string) => void;
  onCancel: () => void;
}) {
  const [ih, im] = (initial || '06:00').split(':').map((n) => parseInt(n, 10) || 0);
  const [h, setH] = React.useState(Math.min(23, Math.max(0, ih)));
  const [m, setM] = React.useState(Math.min(59, Math.max(0, im)));
  return (
    <Neo r={radius.lg} offset={5} style={styles.dialog}>
      <Text style={styles.dialogTitle}>{title}</Text>
      <Text style={styles.tpHint}>Scroll to your time · 24-hour</Text>
      <View style={styles.wheelBox}>
        <View style={styles.wheelBand} pointerEvents="none" />
        <View style={styles.wheelRow}>
          <WheelColumn count={24} value={h} onChange={setH} />
          <View style={styles.wheelColonWrap}>
            <Text style={styles.wheelColon}>:</Text>
          </View>
          <WheelColumn count={60} value={m} onChange={setM} />
        </View>
      </View>
      <View style={styles.wheelLabels}>
        <Text style={styles.wheelLabel}>HOUR</Text>
        <Text style={styles.wheelLabel}>MIN</Text>
      </View>
      <View style={styles.dialogRow}>
        <Button label="Cancel" variant="light" onPress={onCancel} style={{ flex: 1 }} />
        <Button label="Set" variant="primary" onPress={() => onDone(`${pad2(h)}:${pad2(m)}`)} style={{ flex: 1 }} />
      </View>
    </Neo>
  );
}

export function TimePickerModal({
  visible,
  value,
  title,
  onDone,
  onCancel,
}: {
  visible: boolean;
  value: string;
  title: string;
  onDone: (v: string) => void;
  onCancel: () => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent onRequestClose={onCancel}>
      <Pressable style={styles.overlay} onPress={onCancel}>
        <Pressable style={{ width: '100%', maxWidth: 380 }} onPress={() => {}}>
          {/* Mount fresh each open so the wheels initialise to `value`. */}
          {visible && <TimeWheels initial={value} title={title} onDone={onDone} onCancel={onCancel} />}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(28,32,20,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 26,
  },
  dialog: { padding: 20 },
  dialogTitle: { fontFamily: fonts.displayBold, fontSize: 20, color: colors.ink },
  dialogMsg: { fontFamily: fonts.bodySemi, fontSize: 13.5, color: colors.muted2, marginTop: 10, lineHeight: 20 },
  dialogRow: { flexDirection: 'row', gap: 10, marginTop: 22 },
  tpHint: { fontFamily: fonts.bodySemi, fontSize: 12, color: colors.muted, textAlign: 'center', marginTop: 6 },
  wheelBox: {
    marginTop: 14,
    height: WHEEL_H,
    borderWidth: 2.5,
    borderColor: colors.ink,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    overflow: 'hidden',
    position: 'relative',
  },
  // Fixed centre band — whatever number rests here is the selection.
  wheelBand: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: WHEEL_ITEM * PAD_ROWS,
    height: WHEEL_ITEM,
    backgroundColor: colors.greenSoft,
    borderTopWidth: 2.5,
    borderBottomWidth: 2.5,
    borderColor: colors.ink,
  },
  wheelRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, height: WHEEL_H },
  wheelItem: { height: WHEEL_ITEM, alignItems: 'center', justifyContent: 'center' },
  wheelNum: { fontFamily: fonts.displayBold, fontSize: 26, color: colors.muted, opacity: 0.55 },
  wheelNumOn: { color: colors.ink, opacity: 1 },
  wheelColonWrap: { height: WHEEL_H, justifyContent: 'center' },
  wheelColon: { fontFamily: fonts.displayBold, fontSize: 30, color: colors.ink },
  wheelLabels: { flexDirection: 'row', justifyContent: 'center', gap: 58, marginTop: 8 },
  wheelLabel: { fontFamily: fonts.display, fontSize: 10, color: colors.muted, letterSpacing: 1.5 },
  btn: {
    width: '100%',
    borderWidth: 2.5,
    borderColor: colors.ink,
    borderRadius: radius.md,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    ...hardShadow(4),
  },
  btnText: { fontFamily: fonts.displayBold, fontSize: 16 },
  back: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 2,
    borderColor: colors.ink,
    borderRadius: radius.sm,
    backgroundColor: colors.surface,
    paddingVertical: 7,
    paddingHorizontal: 13,
    ...hardShadow(2),
  },
  backText: { fontFamily: fonts.display, fontSize: 11, color: colors.ink },
  barTrack: {
    flex: 1,
    height: 8,
    borderWidth: 1.5,
    borderColor: colors.ink,
    borderRadius: 6,
    backgroundColor: colors.creamDeep,
    overflow: 'hidden',
  },
  field: {
    borderWidth: 2.5,
    borderColor: colors.ink,
    borderRadius: radius.md,
    paddingVertical: 13,
    paddingHorizontal: 15,
    fontFamily: fonts.bodySemi,
    fontSize: 14,
    color: colors.ink,
    backgroundColor: colors.surface,
  },
});
