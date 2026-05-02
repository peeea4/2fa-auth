import { Link } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Authenticator Codes</Text>

      <Link asChild href="/add/scan">
        <Pressable style={styles.button}>
          <Text style={styles.buttonText}>Scan QR</Text>
        </Pressable>
      </Link>

      <Link asChild href="/add/manual">
        <Pressable style={styles.button}>
          <Text style={styles.buttonText}>Enter manually</Text>
        </Pressable>
      </Link>

      <Link asChild href="/paywall">
        <Pressable style={styles.button}>
          <Text style={styles.buttonText}>Open paywall</Text>
        </Pressable>
      </Link>
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
