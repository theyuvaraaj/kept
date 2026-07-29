import { useState } from 'react';
import { View, TextInput, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen } from '@/components/Screen';
import { Txt, Neo, Button, BackButton } from '@/components/ui';
import { Check } from '@/components/icons';
import { colors, fonts, radius } from '@/theme/tokens';
import { useStore } from '@/store/useStore';
import { supabase, hasSupabase } from '@/lib/supabase';

export default function Feedback() {
  const router = useRouter();
  const session = useStore((s) => s.session);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function submit() {
    const message = text.trim();
    setErr(null);
    if (message.length < 4) {
      setErr('A few more words and I can actually act on it.');
      return;
    }
    if (!hasSupabase) {
      setErr('No connection to send this right now — try again when you’re online.');
      return;
    }
    setBusy(true);
    try {
      const { error } = await supabase.from('feedback').insert({
        message,
        email: session?.user?.email ?? null,
      });
      if (error) throw error;
      setSent(true);
      setText('');
    } catch (e: any) {
      setErr(e?.message ?? 'Could not send that. Try again in a bit.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen scroll contentStyle={{ paddingTop: 6 }}>
      <View style={styles.header}>
        <BackButton onPress={() => router.replace('/profile')} />
        <Txt variant="kicker">Feedback</Txt>
      </View>

      {sent ? (
        <View style={styles.doneWrap}>
          <Neo bg={colors.green} r={24} offset={5} style={styles.doneBadge}>
            <Check size={54} width={3} />
          </Neo>
          <Txt variant="title" style={{ fontSize: 26, textAlign: 'center', marginTop: 22 }}>
            Got it. 💚
          </Txt>
          <Txt style={styles.doneBody}>
            You’re officially on the roadmap. I read this within the week — if it’s a bug, it’s already
            annoying me too.
          </Txt>
          <Button
            label="SEND ANOTHER"
            variant="light"
            onPress={() => setSent(false)}
            style={{ marginTop: 26 }}
          />
          <Button label="BACK TO KEPT" variant="dark" onPress={() => router.replace('/home')} style={{ marginTop: 11 }} />
        </View>
      ) : (
        <>
          <Txt variant="title" style={{ fontSize: 30, marginTop: 10 }}>
            Talk to the dev
          </Txt>

          <Neo r={radius.lg} offset={4} bg={colors.greenSoft} style={styles.note}>
            <Txt style={styles.noteText}>
              Real human here 👋 One person builds Kept — and I read <Txt style={styles.noteStrong}>every single</Txt>{' '}
              note, every week. No bots, no black hole, no “we value your feedback” form that goes nowhere.
              {'\n\n'}
              Found a bug? Hate a button? Got a wild idea? Tell me. The next update is basically your wishlist.
            </Txt>
          </Neo>

          <Txt variant="label" style={{ marginTop: 22, marginBottom: 8 }}>
            YOUR MESSAGE
          </Txt>
          <TextInput
            value={text}
            onChangeText={setText}
            placeholder="Type anything — the good, the bad, the ‘why is this button here’…"
            placeholderTextColor={colors.muted}
            multiline
            textAlignVertical="top"
            style={styles.input}
          />
          {err && <Txt style={styles.err}>{err}</Txt>}

          <Button
            label={busy ? 'SENDING…' : 'SEND IT'}
            icon={busy ? <ActivityIndicator color={colors.ink} /> : undefined}
            onPress={busy ? undefined : submit}
            style={{ marginTop: 16 }}
          />
          <Txt style={styles.foot}>
            {session?.user?.email
              ? `Sent as ${session.user.email} so I can reply if you want one.`
              : 'Sent anonymously.'}
          </Txt>
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  note: { marginTop: 16, padding: 16 },
  noteText: { fontFamily: fonts.bodySemi, fontSize: 13.5, color: colors.ink, lineHeight: 21 },
  noteStrong: { fontFamily: fonts.displayBold, color: colors.greenDark },
  input: {
    minHeight: 150,
    borderWidth: 2.5,
    borderColor: colors.ink,
    borderRadius: radius.md,
    padding: 15,
    fontFamily: fonts.bodySemi,
    fontSize: 14,
    color: colors.ink,
    backgroundColor: colors.surface,
    lineHeight: 20,
  },
  err: { fontFamily: fonts.bodySemi, fontSize: 12.5, color: colors.red, marginTop: 10 },
  foot: { fontFamily: fonts.bodySemi, fontSize: 11.5, color: colors.muted, marginTop: 12, textAlign: 'center' },
  doneWrap: { alignItems: 'center', marginTop: 60 },
  doneBadge: { width: 108, height: 108, alignItems: 'center', justifyContent: 'center' },
  doneBody: {
    fontFamily: fonts.bodySemi,
    fontSize: 14,
    color: colors.muted2,
    textAlign: 'center',
    marginTop: 12,
    maxWidth: 300,
    lineHeight: 21,
  },
});
