import { useState } from 'react';
import { View, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen } from '@/components/Screen';
import { Txt, Field, Button, BackButton } from '@/components/ui';
import { ArrowRight } from '@/components/icons';
import { colors, fonts } from '@/theme/tokens';
import { signIn, signUp, sendPasswordReset } from '@/lib/auth';

// Real email+password auth for cloud sync (v2). Optional — the app works fully
// without signing in.
export default function Auth() {
  const router = useRouter();
  const [mode, setMode] = useState<'in' | 'up'>('in');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [showPw, setShowPw] = useState(false);

  async function submit() {
    setErr(null);
    setMsg(null);
    if (!email.trim() || password.length < 6) {
      setErr('Enter an email and a password of at least 6 characters.');
      return;
    }
    setBusy(true);
    try {
      if (mode === 'up') {
        const data = await signUp(email, password);
        if (data.session) {
          router.replace('/profile'); // confirmation off → signed in immediately
        } else {
          // Email confirmation is on → user must confirm, then sign in.
          setMsg('Account created. Confirm via the email we sent, then sign in.');
          setMode('in');
        }
      } else {
        await signIn(email, password);
        router.replace('/profile'); // session set → _layout runs the sync
      }
    } catch (e: any) {
      setErr(e?.message ?? 'Something went wrong. Try again.');
    } finally {
      setBusy(false);
    }
  }

  async function reset() {
    setErr(null);
    setMsg(null);
    if (!email.trim()) {
      setErr('Enter your email first, then tap reset.');
      return;
    }
    try {
      await sendPasswordReset(email);
      setMsg('Password reset email sent.');
    } catch (e: any) {
      setErr(e?.message ?? 'Could not send reset email.');
    }
  }

  return (
    <Screen contentStyle={styles.wrap}>
      <BackButton onPress={() => router.back()} />
      <View style={styles.top}>
        <Txt variant="kicker">Cloud sync</Txt>
        <Txt variant="title" style={{ fontSize: 32, marginTop: 5 }}>
          {mode === 'in' ? 'Sign in' : 'Create account'}
        </Txt>
        <Txt style={styles.sub}>
          Back up your habits and sync across devices. Optional — Kept works without it.
        </Txt>

        <View style={styles.form}>
          <Txt variant="label">EMAIL</Txt>
          <Field value={email} onChangeText={setEmail} placeholder="you@example.com" autoCapitalize="none" keyboardType="email-address" />
          <View style={styles.pwLabelRow}>
            <Txt variant="label">PASSWORD</Txt>
            <Pressable onPress={() => setShowPw((v) => !v)} hitSlop={8}>
              <Txt style={styles.showBtn}>{showPw ? 'HIDE' : 'SHOW'}</Txt>
            </Pressable>
          </View>
          <Field
            value={password}
            onChangeText={setPassword}
            placeholder="••••••••"
            secureTextEntry={!showPw}
            autoCapitalize="none"
          />
        </View>

        {err && <Txt style={[styles.note, { color: colors.red }]}>{err}</Txt>}
        {msg && <Txt style={[styles.note, { color: colors.greenDark }]}>{msg}</Txt>}

        <Pressable onPress={() => setMode(mode === 'in' ? 'up' : 'in')} style={styles.link}>
          <Txt style={styles.linkText}>
            {mode === 'in' ? 'New here? ' : 'Have an account? '}
            <Txt style={styles.linkStrong}>{mode === 'in' ? 'Create an account' : 'Sign in'}</Txt>
          </Txt>
        </Pressable>
        {mode === 'in' && (
          <Pressable onPress={reset} style={{ alignItems: 'center', paddingTop: 6 }}>
            <Txt style={styles.reset}>Forgot password?</Txt>
          </Pressable>
        )}
      </View>

      <Button
        label={busy ? 'PLEASE WAIT…' : mode === 'in' ? 'SIGN IN' : 'CREATE ACCOUNT'}
        icon={busy ? <ActivityIndicator color={colors.ink} /> : <ArrowRight />}
        onPress={busy ? undefined : submit}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  wrap: { justifyContent: 'space-between', paddingTop: 8 },
  top: { flex: 1, justifyContent: 'center' },
  sub: { fontFamily: fonts.bodySemi, fontSize: 13, color: colors.muted2, marginTop: 10, maxWidth: 300, lineHeight: 19 },
  form: { marginTop: 26, gap: 10 },
  pwLabelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 },
  showBtn: { fontFamily: fonts.bodyBold, fontSize: 11, color: colors.greenDark, letterSpacing: 0.5 },
  note: { fontFamily: fonts.bodySemi, fontSize: 12.5, marginTop: 14, lineHeight: 18 },
  link: { paddingTop: 16, alignItems: 'center' },
  linkText: { fontFamily: fonts.bodySemi, fontSize: 14, color: colors.muted },
  linkStrong: { fontFamily: fonts.bodyBold, color: colors.greenDark },
  reset: { fontFamily: fonts.bodySemi, fontSize: 12.5, color: colors.muted },
});
