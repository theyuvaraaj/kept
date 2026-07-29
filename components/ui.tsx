import React from 'react';
import {
  Text,
  View,
  Pressable,
  TextInput,
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

const styles = StyleSheet.create({
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
