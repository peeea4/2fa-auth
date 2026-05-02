import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useAuthStore } from '../stores';

export default function LockScreen() {
  const router = useRouter();
  const isLocked = useAuthStore((state) => state.isLocked);
  const unlock = useAuthStore((state) => state.unlock);

  useEffect(() => {
    if (!isLocked) {
      router.replace('/(tabs)');
    }
  }, [isLocked, router]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>App Locked</Text>
      <Pressable onPress={unlock} style={styles.button}>
        <Text style={styles.buttonText}>Unlock</Text>
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
    marginBottom: 8,
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
