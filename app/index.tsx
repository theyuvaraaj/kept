import { Redirect } from 'expo-router';
import { useStore } from '@/store/useStore';

// App entry. Local-first: no login gate. Onboard once, then straight to Home.
// Cloud sign-in (for sync) is optional, via Profile → Sign in to sync.
export default function Index() {
  const onboarded = useStore((s) => s.onboarded);
  return <Redirect href={onboarded ? '/home' : '/onboarding'} />;
}
