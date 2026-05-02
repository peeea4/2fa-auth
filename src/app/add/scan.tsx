import { StyleSheet, Text, View } from 'react-native';

export default function ScanQrScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Scan QR</Text>
      <Text style={styles.caption}>QR scanner screen placeholder.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
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
});
