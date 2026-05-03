import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

export default function ScanQrScreen() {
  const { t } = useTranslation();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t('scanQr')}</Text>
      <Text style={styles.caption}>{t('scanQrCaption')}</Text>
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
