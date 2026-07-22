import { useState } from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen } from '@/components/Screen';
import { Txt, Field, Button, BackButton } from '@/components/ui';
import { ArrowRight } from '@/components/icons';
import { colors, fonts } from '@/theme/tokens';
import { useStore } from '@/store/useStore';

// v1: pure UI. Fills the store user name/email, then -> Home. Real auth is v2.
export default function Signup() {
  const router = useRouter();
  const setUser = useStore((s) => s.setUser);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  function create() {
    setUser({
      name: name.trim() || 'Alex Rivera',
      email: email.trim() || 'demo@kept.app',
    });
    router.replace('/home');
  }

  return (
    <Screen contentStyle={styles.wrap}>
      <BackButton onPress={() => router.back()} />
      <View style={styles.top}>
        <Txt variant="kicker">Get started</Txt>
        <Txt variant="title" style={styles.title}>
          Create account
        </Txt>
        <View style={styles.form}>
          <Txt variant="label">NAME</Txt>
          <Field value={name} onChangeText={setName} placeholder="Alex Rivera" />
          <Txt variant="label" style={{ marginTop: 4 }}>
            EMAIL
          </Txt>
          <Field
            value={email}
            onChangeText={setEmail}
            placeholder="you@kept.app"
            autoCapitalize="none"
            keyboardType="email-address"
          />
          <Txt variant="label" style={{ marginTop: 4 }}>
            PASSWORD
          </Txt>
          <Field value={password} onChangeText={setPassword} placeholder="••••••••" secureTextEntry />
        </View>
      </View>
      <View>
        <Button label="CREATE ACCOUNT" icon={<ArrowRight />} onPress={create} />
        <Pressable onPress={() => router.replace('/')} style={styles.link}>
          <Txt style={styles.linkText}>
            Already have an account? <Txt style={styles.linkStrong}>Log in</Txt>
          </Txt>
        </Pressable>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  wrap: { justifyContent: 'space-between', paddingTop: 8 },
  top: { flex: 1, justifyContent: 'center' },
  title: { fontSize: 34, marginTop: 5 },
  form: { marginTop: 26, gap: 10 },
  link: { paddingTop: 14, alignItems: 'center' },
  linkText: { fontFamily: fonts.bodySemi, fontSize: 14, color: colors.muted },
  linkStrong: { fontFamily: fonts.bodyBold, color: colors.greenDark },
});
