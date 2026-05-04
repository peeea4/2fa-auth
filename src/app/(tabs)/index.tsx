import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { router } from 'expo-router';
import { Plus } from 'lucide-react-native';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { OtpList } from '../../components/otp';
import { Button } from '../../components/ui/Button';
import { EmptyState } from '../../components/ui/EmptyState';
import { Sheet } from '../../components/ui/Sheet';
import { usePremium } from '../../hooks/usePremium';
import { useTheme } from '../../hooks/useTheme';
import { storageService } from '../../services/storage.service';
import { useOtpStore } from '../../stores';
import type { OtpEntry } from '../../types';

export default function HomeScreen() {
  const { t, i18n } = useTranslation();
  const { colors } = useTheme();
  const tabBarHeight = useBottomTabBarHeight();
  const entries = useOtpStore((state) => state.entries);
  const removeEntry = useOtpStore((state) => state.removeEntry);
  const { canAddCode, canScanQr, premium } = usePremium();

  const [search, setSearch] = useState('');
  const [addMenuOpen, setAddMenuOpen] = useState(false);
  const [entryForActions, setEntryForActions] = useState<OtpEntry | null>(null);
  const [secretsById, setSecretsById] = useState<Record<string, string | null>>({});

  useEffect(() => {
    let cancelled = false;

    const loadSecrets = async () => {
      const next: Record<string, string | null> = {};
      for (const entry of entries) {
        next[entry.id] = await storageService.getOtpSecret(entry.id);
      }
      if (!cancelled) {
        setSecretsById(next);
      }
    };

    void loadSecrets();

    return () => {
      cancelled = true;
    };
  }, [entries]);

  const sortedFiltered = useMemo(() => {
    const sorted = [...entries].sort((a, b) => b.createdAt - a.createdAt);
    const q = search.trim().toLowerCase();
    if (!q) {
      return sorted;
    }
    return sorted.filter(
      (e) => e.issuer.toLowerCase().includes(q) || e.account.toLowerCase().includes(q) || e.id.toLowerCase().includes(q),
    );
  }, [entries, search]);

  const openPaywall = useCallback(() => {
    setAddMenuOpen(false);
    router.push('/paywall');
  }, []);

  const handleScanQr = useCallback(() => {
    setAddMenuOpen(false);
    if (canScanQr) {
      router.push('/add/scan');
      return;
    }
    openPaywall();
  }, [canScanQr, openPaywall]);

  const handleManualEntry = useCallback(() => {
    setAddMenuOpen(false);
    if (canAddCode) {
      router.push('/add/manual');
      return;
    }
    openPaywall();
  }, [canAddCode, openPaywall]);

  const confirmDeleteEntry = useCallback(
    (entry: OtpEntry) => {
      Alert.alert(t('deleteConfirmTitle'), t('deleteConfirmMessage'), [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('delete'),
          style: 'destructive',
          onPress: async () => {
            await storageService.deleteOtpSecret(entry.id);
            removeEntry(entry.id);
          },
        },
      ]);
    },
    [removeEntry, t],
  );

  const handleLongPressEntry = useCallback((entry: OtpEntry) => {
    setEntryForActions(entry);
  }, []);

  return (
    <SafeAreaView edges={['top', 'left', 'right']} key={i18n.language} style={[styles.safe, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>{t('homeHeading')}</Text>
        <TextInput
          accessibilityLabel={t('search')}
          autoCapitalize="none"
          autoCorrect={false}
          clearButtonMode="while-editing"
          onChangeText={setSearch}
          placeholder={t('search')}
          placeholderTextColor={colors.textMuted}
          style={[
            styles.search,
            {
              color: colors.text,
              borderColor: colors.border,
              backgroundColor: colors.surface,
            },
          ]}
          value={search}
        />
      </View>

      <View style={styles.body}>
        {sortedFiltered.length === 0 ? (
          <EmptyState
            action={<Button onPress={() => setAddMenuOpen(true)} title={t('add')} />}
            description={entries.length === 0 ? t('emptySubtitle') : t('emptySearchSubtitle')}
            title={entries.length === 0 ? t('emptyTitle') : t('emptySearchTitle')}
          />
        ) : (
          <OtpList
            entries={sortedFiltered}
            isPremium={premium.isPremium}
            listBottomInset={tabBarHeight + 88}
            onLockedCardPress={openPaywall}
            onLongPressEntry={handleLongPressEntry}
            secretsById={secretsById}
          />
        )}
      </View>

      <Pressable
        accessibilityLabel={t('add')}
        accessibilityRole="button"
        onPress={() => setAddMenuOpen(true)}
        style={({ pressed }) => [
          styles.fab,
          {
            backgroundColor: colors.primary,
            opacity: pressed ? 0.9 : 1,
            bottom: tabBarHeight + 16,
          },
        ]}
      >
        <Plus color="#ffffff" size={28} strokeWidth={2.5} />
      </Pressable>

      <Sheet onClose={() => setEntryForActions(null)} visible={entryForActions !== null}>
        <Text numberOfLines={2} style={[styles.sheetTitle, { color: colors.text }]}>
          {entryForActions ? entryForActions.issuer || entryForActions.account : ''}
        </Text>
        <Text style={[styles.sheetSubtitle, { color: colors.textMuted }]}>
          {entryForActions?.account && entryForActions.issuer ? entryForActions.account : null}
        </Text>
        <View style={styles.sheetRows}>
          <Pressable
            onPress={() => {
              const target = entryForActions;
              setEntryForActions(null);
              if (target) {
                router.push(`/edit/${target.id}`);
              }
            }}
            style={({ pressed }) => [styles.sheetRow, { opacity: pressed ? 0.75 : 1, borderColor: colors.border }]}
          >
            <Text style={[styles.sheetRowTitle, { color: colors.text }]}>{t('edit')}</Text>
          </Pressable>
          <Pressable
            onPress={() => {
              const target = entryForActions;
              setEntryForActions(null);
              if (target) {
                confirmDeleteEntry(target);
              }
            }}
            style={({ pressed }) => [styles.sheetRow, { opacity: pressed ? 0.75 : 1, borderColor: colors.danger }]}
          >
            <Text style={[styles.sheetRowTitle, { color: colors.danger }]}>{t('delete')}</Text>
          </Pressable>
        </View>
      </Sheet>

      <Sheet onClose={() => setAddMenuOpen(false)} visible={addMenuOpen}>
        <Text style={[styles.sheetTitle, { color: colors.text }]}>{t('addSheetTitle')}</Text>
        <View style={styles.sheetRows}>
          <Pressable
            onPress={handleScanQr}
            style={({ pressed }) => [styles.sheetRow, { opacity: pressed ? 0.75 : 1, borderColor: colors.border }]}
          >
            <Text style={[styles.sheetRowTitle, { color: colors.text }]}>{t('scanQr')}</Text>
            {!canScanQr ? <Text style={[styles.sheetRowHint, { color: colors.textMuted }]}>{t('scanQrPremiumHint')}</Text> : null}
          </Pressable>
          <Pressable
            onPress={handleManualEntry}
            style={({ pressed }) => [styles.sheetRow, { opacity: pressed ? 0.75 : 1, borderColor: colors.border }]}
          >
            <Text style={[styles.sheetRowTitle, { color: colors.text }]}>{t('manualEntry')}</Text>
            {!canAddCode ? <Text style={[styles.sheetRowHint, { color: colors.textMuted }]}>{t('addCodeLimitHint')}</Text> : null}
          </Pressable>
        </View>
      </Sheet>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 12,
    gap: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
  },
  search: {
    minHeight: 44,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    fontSize: 16,
  },
  body: {
    flex: 1,
    paddingHorizontal: 20,
  },
  fab: {
    position: 'absolute',
    right: 22,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.22,
    shadowRadius: 6,
    elevation: 6,
  },
  sheetTitle: {
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 4,
  },
  sheetSubtitle: {
    fontSize: 14,
    marginTop: -4,
    marginBottom: 4,
  },
  sheetRows: {
    gap: 10,
  },
  sheetRow: {
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 14,
    gap: 4,
  },
  sheetRowTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  sheetRowHint: {
    fontSize: 13,
  },
});
