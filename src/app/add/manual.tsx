import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

export default function ManualEntryScreen() {
  const handleDone = () => {
    router.dismissTo('/(tabs)');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Manual Entry</Text>
      <Text style={styles.caption}>Manual OTP entry placeholder modal.</Text>
      <Pressable style={styles.button} onPress={handleDone}>
        <Text style={styles.buttonText}>Done</Text>
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
    backgroundColor: '#ffffff',
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
  },
  caption: {
    fontSize: 16,
    color: '#6b7280',
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
