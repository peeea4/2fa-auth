import { router } from 'expo-router';
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { useTheme } from '../hooks/useTheme';
import { exportService } from '../services/export.service';
import { storageService } from '../services/storage.service';
import { useOtpStore } from '../stores';

export default function BackupScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const entries = useOtpStore((state) => state.entries);
  const setEntries = useOtpStore((state) => state.setEntries);
  const [password, setPassword] = useState('');
  const [backupText, setBackupText] = useState('');
  const [isBusy, setIsBusy] = useState(false);

  const handleExport = useCallback(async () => {
    if (password.trim().length < 6) {
      Alert.alert(t('backup.passwordTitle'), t('backup.passwordHint'));
      return;
    }
    setIsBusy(true);
    try {
      const secretsById: Record<string, string | null> = {};
      for (const entry of entries) {
        secretsById[entry.id] = await storageService.getOtpSecret(entry.id);
      }
      const encrypted = await exportService.exportEncrypted(entries, secretsById, password);
      setBackupText(encrypted);
      Alert.alert(t('backup.exportDoneTitle'), t('backup.exportDoneBody'));
    } catch {
      Alert.alert(t('backup.errorTitle'), t('backup.errorBody'));
    } finally {
      setIsBusy(false);
    }
  }, [entries, password, t]);

  const handleImport = useCallback(async () => {
    if (!backupText.trim()) {
      Alert.alert(t('backup.importEmptyTitle'), t('backup.importEmptyBody'));
      return;
    }
    setIsBusy(true);
    try {
      const imported = await exportService.importEncrypted(backupText.trim(), password);
      for (const item of imported) {
        await storageService.setOtpSecret(item.id, item.secret);
      }
      setEntries(imported.map(({ secret: _secret, ...entry }) => entry));
      Alert.alert(t('backup.importDoneTitle'), t('backup.importDoneBody', { count: imported.length }));
    } catch {
      Alert.alert(t('backup.errorTitle'), t('backup.errorBody'));
    } finally {
      setIsBusy(false);
    }
  }, [backupText, password, setEntries, t]);

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={[styles.safe, { backgroundColor: colors.background }]}>
      <View style={[styles.toolbar, { borderBottomColor: colors.border }]}>
        <Pressable accessibilityRole="button" hitSlop={12} onPress={() => router.back()}>
          <Text style={[styles.toolbarBtn, { color: colors.primary }]}>{t('close')}</Text>
        </Pressable>
        <Text style={[styles.toolbarTitle, { color: colors.text }]}>{t('backup.title')}</Text>
        <View style={styles.toolbarSpacer} />
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={[styles.description, { color: colors.textMuted }]}>{t('backup.description')}</Text>
        <Input
          autoCapitalize="none"
          autoCorrect={false}
          hint={t('backup.passwordHint')}
          label={t('backup.passwordLabel')}
          onChangeText={setPassword}
          secureTextEntry
          value={password}
        />
        <View style={styles.actionsRow}>
          <Button disabled={isBusy} onPress={() => void handleExport()} title={t('backup.exportCta')} variant="secondary" />
          <Button disabled={isBusy} onPress={() => void handleImport()} title={t('backup.importCta')} />
        </View>
        <Input
          autoCapitalize="none"
          autoCorrect={false}
          hint={t('backup.payloadHint')}
          label={t('backup.payloadLabel')}
          multiline
          numberOfLines={10}
          onChangeText={setBackupText}
          style={styles.payloadInput}
          value={backupText}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingTop: 14,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  toolbarBtn: { fontSize: 17, fontWeight: '600', paddingHorizontal: 8 },
  toolbarTitle: { fontSize: 17, fontWeight: '700' },
  toolbarSpacer: { width: 64 },
  content: { padding: 20, gap: 14 },
  description: { fontSize: 14, lineHeight: 20 },
  actionsRow: { gap: 10 },
  payloadInput: { minHeight: 220, textAlignVertical: 'top' },
});
