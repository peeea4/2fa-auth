import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useSettingsStore } from '../../stores';

export default function OnboardingScreen() {
  const setOnboardingCompleted = useSettingsStore((state) => state.setOnboardingCompleted);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome to 2FA Authenticator</Text>
      <Text style={styles.caption}>Quick onboarding placeholder screen.</Text>
      <Pressable onPress={() => setOnboardingCompleted(true)} style={styles.button}>
        <Text style={styles.buttonText}>Continue</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    textAlign: 'center',
  },
  caption: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
  },
  button: {
    minWidth: 220,
    borderRadius: 10,
    backgroundColor: '#111827',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    textAlign: 'center',
  },
});
