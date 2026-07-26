import { useState } from 'react';
import { View, Pressable, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen } from '@/components/Screen';
import { Txt, Field, Button, BackButton, Neo } from '@/components/ui';
import { colors, fonts, radius } from '@/theme/tokens';
import { useStore } from '@/store/useStore';
import { updatePassword, deleteAccount, signOut } from '@/lib/auth';

export default function Account() {
  const router = useRouter();
  const session = useStore((s) => s.session);
  const [pw, setPw] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  if (!session) {
    // Not signed in — nothing to manage.
    router.replace('/profile');
    return null;
  }

  async function changePw() {
    setErr(null);
    setMsg(null);
    if (pw.length < 6) {
      setErr('Password must be at least 6 characters.');
      return;
    }
    setBusy(true);
    try {
      await updatePassword(pw);
      setPw('');
      setMsg('Password updated.');
    } catch (e: any) {
      setErr(e?.message ?? 'Could not update password.');
    } finally {
      setBusy(false);
    }
  }

  function confirmDelete() {
    Alert.alert(
      'Delete account?',
      'This permanently deletes your account and all cloud data. Habits on this device stay until you reset. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteAccount();
              router.replace('/profile');
            } catch (e: any) {
              // Function may not be deployed yet — fall back to sign-out + notice.
              await signOut().catch(() => {});
              Alert.alert('Signed out', 'Account deletion needs the server function. Signed you out for now.');
              router.replace('/profile');
            }
          },
        },
      ]
    );
  }

  return (
    <Screen scroll contentStyle={{ paddingTop: 6 }}>
      <View style={styles.header}>
        <BackButton onPress={() => router.replace('/profile')} />
        <Txt variant="kicker">Account</Txt>
      </View>

      <Neo r={radius.md} offset={0} borderWidth={2.5} style={styles.card}>
        <View style={{ flex: 1 }}>
          <Txt style={styles.title}>Signed in as</Txt>
          <Txt style={styles.email}>{session.user?.email}</Txt>
        </View>
        <Pressable onPress={() => { signOut(); router.replace('/profile'); }}>
          <Txt style={styles.signOut}>Sign out</Txt>
        </Pressable>
      </Neo>

      <Txt variant="label" style={{ marginTop: 22, marginBottom: 10 }}>
        CHANGE PASSWORD
      </Txt>
      <View style={styles.pwLabelRow}>
        <Txt variant="label">NEW PASSWORD</Txt>
        <Pressable onPress={() => setShowPw((v) => !v)} hitSlop={8}>
          <Txt style={styles.showBtn}>{showPw ? 'HIDE' : 'SHOW'}</Txt>
        </Pressable>
      </View>
      <Field value={pw} onChangeText={setPw} placeholder="••••••••" secureTextEntry={!showPw} autoCapitalize="none" />
      {err && <Txt style={[styles.note, { color: colors.red }]}>{err}</Txt>}
      {msg && <Txt style={[styles.note, { color: colors.greenDark }]}>{msg}</Txt>}
      <Button label={busy ? 'SAVING…' : 'UPDATE PASSWORD'} variant="light" onPress={busy ? undefined : changePw} style={{ marginTop: 14 }} />

      <Txt variant="label" style={{ marginTop: 28, marginBottom: 10 }}>
        DANGER ZONE
      </Txt>
      <Button label="DELETE ACCOUNT" variant="danger" onPress={confirmDelete} />
      <Txt style={styles.dangerNote}>Permanently deletes your account + cloud data.</Txt>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  card: { marginTop: 22, paddingVertical: 14, paddingHorizontal: 15, flexDirection: 'row', alignItems: 'center' },
  signOut: { fontFamily: fonts.bodyBold, fontSize: 13, color: colors.red },
  title: { fontFamily: fonts.bodySemi, fontSize: 11, color: colors.muted, letterSpacing: 0.5 },
  email: { fontFamily: fonts.displayBold, fontSize: 16, color: colors.ink, marginTop: 3 },
  pwLabelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  showBtn: { fontFamily: fonts.bodyBold, fontSize: 11, color: colors.greenDark, letterSpacing: 0.5 },
  note: { fontFamily: fonts.bodySemi, fontSize: 12.5, marginTop: 12, lineHeight: 18 },
  dangerNote: { fontFamily: fonts.bodySemi, fontSize: 11.5, color: colors.muted, marginTop: 10 },
});
