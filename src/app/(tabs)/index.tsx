import { Link } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

export default function HomeScreen() {
  const { t, i18n } = useTranslation();

  return (
    <View key={i18n.language} style={styles.container}>
      <Text style={styles.title}>{t('homeHeading')}</Text>

      <Link asChild href="/add/scan">
        <Pressable style={styles.button}>
          <Text style={styles.buttonText}>{t('scanQr')}</Text>
        </Pressable>
      </Link>

      <Link asChild href="/add/manual">
        <Pressable style={styles.button}>
          <Text style={styles.buttonText}>{t('manualEntry')}</Text>
        </Pressable>
      </Link>

      <Link asChild href="/paywall">
        <Pressable style={styles.button}>
          <Text style={styles.buttonText}>{t('openPaywall')}</Text>
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
