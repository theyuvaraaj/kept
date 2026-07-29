import React from 'react';
import {
  Text,
  View,
  Pressable,
  TextInput,
  Modal,
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

/* ---------------- Themed time picker ---------------- */

const clamp = (v: number, max: number) => ((v % (max + 1)) + (max + 1)) % (max + 1);

function HoldButton({ onStep, children }: { onStep: () => void; children: React.ReactNode }) {
  const timer = React.useRef<ReturnType<typeof setInterval> | null>(null);
  const stop = () => {
    if (timer.current) clearInterval(timer.current);
    timer.current = null;
  };
  return (
    <Pressable
      onPressIn={() => {
        onStep();
        timer.current = setInterval(onStep, 110);
      }}
      onPressOut={stop}
      style={({ pressed }) => [styles.tpStep, { transform: [{ translateY: pressed ? 1 : 0 }] }]}
    >
      {children}
    </Pressable>
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
  const [h, setH] = React.useState(6);
  const [m, setM] = React.useState(0);
  React.useEffect(() => {
    if (!visible) return;
    const [hh, mm] = (value || '06:00').split(':').map(Number);
    setH(clamp(hh || 0, 23));
    setM(clamp(mm || 0, 59));
  }, [visible, value]);
  const pad = (n: number) => String(n).padStart(2, '0');

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent onRequestClose={onCancel}>
      <Pressable style={styles.overlay} onPress={onCancel}>
        <Pressable style={{ width: '100%', maxWidth: 380 }} onPress={() => {}}>
          <Neo r={radius.lg} offset={5} style={styles.dialog}>
            <Text style={styles.dialogTitle}>{title}</Text>
            <View style={styles.tpRow}>
              <View style={styles.tpCol}>
                <HoldButton onStep={() => setH((v) => clamp(v + 1, 23))}>
                  <Text style={styles.tpSign}>+</Text>
                </HoldButton>
                <Text style={styles.tpNum}>{pad(h)}</Text>
                <HoldButton onStep={() => setH((v) => clamp(v - 1, 23))}>
                  <Text style={styles.tpSign}>–</Text>
                </HoldButton>
                <Text style={styles.tpUnit}>HOUR</Text>
              </View>
              <Text style={styles.tpColon}>:</Text>
              <View style={styles.tpCol}>
                <HoldButton onStep={() => setM((v) => clamp(v + 1, 59))}>
                  <Text style={styles.tpSign}>+</Text>
                </HoldButton>
                <Text style={styles.tpNum}>{pad(m)}</Text>
                <HoldButton onStep={() => setM((v) => clamp(v - 1, 59))}>
                  <Text style={styles.tpSign}>–</Text>
                </HoldButton>
                <Text style={styles.tpUnit}>MIN</Text>
              </View>
            </View>
            <Text style={styles.tpHint}>24-hour · hold + or – to move fast</Text>
            <View style={styles.dialogRow}>
              <Button label="Cancel" variant="light" onPress={onCancel} style={{ flex: 1 }} />
              <Button label="Set" variant="primary" onPress={() => onDone(`${pad(h)}:${pad(m)}`)} style={{ flex: 1 }} />
            </View>
          </Neo>
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
  tpRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 14, marginTop: 18 },
  tpCol: { alignItems: 'center' },
  tpStep: {
    width: 62,
    height: 42,
    borderWidth: 2.5,
    borderColor: colors.ink,
    borderRadius: radius.sm,
    backgroundColor: colors.green,
    alignItems: 'center',
    justifyContent: 'center',
    ...hardShadow(2),
  },
  tpSign: { fontFamily: fonts.displayBold, fontSize: 24, color: colors.ink, lineHeight: 28 },
  tpNum: { fontFamily: fonts.displayBold, fontSize: 46, color: colors.ink, marginVertical: 8 },
  tpUnit: { fontFamily: fonts.display, fontSize: 10, color: colors.muted, letterSpacing: 1.5, marginTop: 4 },
  tpColon: { fontFamily: fonts.displayBold, fontSize: 40, color: colors.ink, marginBottom: 22 },
  tpHint: { fontFamily: fonts.bodySemi, fontSize: 12, color: colors.muted, textAlign: 'center', marginTop: 18 },
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
