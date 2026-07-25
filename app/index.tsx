import { useState } from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { useRouter, Redirect } from 'expo-router';
import { Screen } from '@/components/Screen';
import { Txt, Field, Button, Neo } from '@/components/ui';
import { Pin, ArrowRight } from '@/components/icons';
import { colors, fonts } from '@/theme/tokens';
import { useStore } from '@/store/useStore';

// v1: pure UI. Any credentials -> Home. Real auth is v2.
export default function Login() {
  const router = useRouter();
  const onboarded = useStore((s) => s.onboarded);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);

  if (!onboarded) return <Redirect href="/onboarding" />;

  return (
    <Screen contentStyle={styles.wrap}>
      <View style={styles.top}>
        <Neo bg={colors.green} r={20} offset={4} style={styles.logo}>
          <Pin size={32} width={2.2} />
        </Neo>
        <Txt variant="display" style={styles.word}>
          Kept.
        </Txt>
        <Txt variant="body" style={styles.tagline}>
          Show up at your spots. Build the streaks. Don't break the chain.
        </Txt>

        <View style={styles.form}>
          <Txt variant="label">EMAIL</Txt>
          <Field
            value={email}
            onChangeText={setEmail}
            placeholder="demo@kept.app"
            autoCapitalize="none"
            keyboardType="email-address"
          />
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
      </View>

      <View>
        <Button label="LOG IN" icon={<ArrowRight />} onPress={() => router.replace('/home')} />
        <Pressable onPress={() => router.push('/signup')} style={styles.link}>
          <Txt variant="body" style={styles.linkText}>
            New here? <Txt style={styles.linkStrong}>Create an account</Txt>
          </Txt>
        </Pressable>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  wrap: { justifyContent: 'space-between', paddingTop: 20 },
  top: { flex: 1, justifyContent: 'center' },
  logo: { width: 66, height: 66, alignItems: 'center', justifyContent: 'center', marginBottom: 22 },
  word: { fontSize: 54, lineHeight: 54 },
  tagline: { marginTop: 12, maxWidth: 220 },
  form: { marginTop: 30, gap: 10 },
  pwLabelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 },
  showBtn: { fontFamily: fonts.bodyBold, fontSize: 11, color: colors.greenDark, letterSpacing: 0.5 },
  link: { paddingTop: 14, alignItems: 'center' },
  linkText: { fontFamily: fonts.bodySemi, fontSize: 14, color: colors.muted },
  linkStrong: { fontFamily: fonts.bodyBold, color: colors.greenDark },
});
