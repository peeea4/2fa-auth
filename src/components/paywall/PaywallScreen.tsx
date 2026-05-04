import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { X } from 'lucide-react-native';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { AdaptyError, type AdaptyPaywallProduct } from 'react-native-adapty';
import { SafeAreaView } from 'react-native-safe-area-context';

import { usePremium } from '../../hooks/usePremium';
import { useTheme } from '../../hooks/useTheme';
import { adaptyService } from '../../services/adapty.service';
import { usePremiumStore } from '../../stores';
import { Button } from '../ui/Button';

function formatProductPrice(product: AdaptyPaywallProduct): string {
  const p = product.price;
  if (!p) {
    return '';
  }
  if (p.localizedString) {
    return p.localizedString;
  }
  if (p.amount != null) {
    const sym = p.currencySymbol ?? '';
    return `${sym}${p.amount}`;
  }
  return '';
}

function errorMessage(error: unknown): string {
  if (error instanceof AdaptyError) {
    return error.localizedDescription || error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}

export function PaywallScreen() {
  const { t } = useTranslation();
  const { colors, isDark } = useTheme();
  const setPremium = usePremiumStore((state) => state.setPremium);
  const { restorePurchases, isRestoringPurchases } = usePremium();

  const [products, setProducts] = useState<AdaptyPaywallProduct[]>([]);
  const [selectedVendorId, setSelectedVendorId] = useState<string | null>(null);
  const [loadState, setLoadState] = useState<'idle' | 'loading' | 'error' | 'ready'>('idle');
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isPurchasing, setIsPurchasing] = useState(false);

  const selectedProduct = useMemo(
    () => products.find((p) => p.vendorProductId === selectedVendorId) ?? null,
    [products, selectedVendorId],
  );

  const dismiss = useCallback(() => {
    router.dismissTo('/(tabs)');
  }, []);

  const loadPaywall = useCallback(async () => {
    setLoadState('loading');
    setLoadError(null);
    try {
      const { paywall, products: nextProducts } = await adaptyService.getPaywallData();
      await adaptyService.logPaywallShown(paywall);
      setProducts(nextProducts);
      setSelectedVendorId(nextProducts[0]?.vendorProductId ?? null);
      setLoadState('ready');
    } catch (err) {
      setLoadError(errorMessage(err));
      setLoadState('error');
    }
  }, []);

  useEffect(() => {
    void loadPaywall();
  }, [loadPaywall]);

  const handleRestore = useCallback(async () => {
    try {
      const next = await restorePurchases();
      if (next.isPremium) {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert(t('paywall.restoreSuccessTitle'), t('paywall.restoreSuccessBody'), [
          { text: t('done'), onPress: dismiss },
        ]);
      } else {
        Alert.alert(t('paywall.restoreEmptyTitle'), t('paywall.restoreEmptyBody'), [{ text: t('close') }]);
      }
    } catch (err) {
      Alert.alert(t('paywall.errorTitle'), errorMessage(err), [{ text: t('close') }]);
    }
  }, [dismiss, restorePurchases, t]);

  const handleSubscribe = useCallback(async () => {
    if (!selectedProduct) {
      return;
    }
    setIsPurchasing(true);
    try {
      const outcome = await adaptyService.purchaseProduct(selectedProduct);
      if (outcome.kind === 'success') {
        setPremium(outcome.premium);
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        dismiss();
        return;
      }
      if (outcome.kind === 'pending') {
        Alert.alert(t('paywall.pendingTitle'), t('paywall.pendingBody'), [{ text: t('close') }]);
        return;
      }
    } catch (err) {
      Alert.alert(t('paywall.errorTitle'), errorMessage(err), [{ text: t('close') }]);
    } finally {
      setIsPurchasing(false);
    }
  }, [dismiss, selectedProduct, setPremium, t]);

  const subscribeTitle = useMemo(() => {
    const price = selectedProduct ? formatProductPrice(selectedProduct) : '';
    if (price) {
      return t('paywall.subscribeWithPrice', { price });
    }
    return t('paywall.subscribe');
  }, [selectedProduct, t]);

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={[styles.safe, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <View style={styles.headerSpacer} />
        <Text style={[styles.headerTitle, { color: colors.text }]}>{t('paywall.title')}</Text>
        <Pressable
          accessibilityLabel={t('close')}
          accessibilityRole="button"
          hitSlop={12}
          onPress={dismiss}
          style={styles.closeBtn}
        >
          <X color={colors.text} size={24} strokeWidth={2} />
        </Pressable>
      </View>

      {loadState === 'loading' || loadState === 'idle' ? (
        <View style={styles.centered}>
          <ActivityIndicator color={colors.primary} size="large" />
          <Text style={[styles.muted, { color: colors.textMuted }]}>{t('paywall.loadingPlans')}</Text>
        </View>
      ) : null}

      {loadState === 'error' ? (
        <View style={styles.centered}>
          <Text style={[styles.errorText, { color: colors.danger }]}>{loadError ?? t('paywall.loadError')}</Text>
          <View style={styles.retryWrap}>
            <Button disabled={isPurchasing} onPress={() => void loadPaywall()} title={t('paywall.retry')} variant="secondary" />
          </View>
        </View>
      ) : null}

      {loadState === 'ready' ? (
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <Text style={[styles.subtitle, { color: colors.textMuted }]}>{t('paywall.subtitle')}</Text>

          {products.length === 0 ? (
            <Text style={[styles.muted, { color: colors.textMuted }]}>{t('paywall.noProducts')}</Text>
          ) : (
            <View style={styles.cards}>
              {products.map((product) => {
                const selected = product.vendorProductId === selectedVendorId;
                return (
                  <Pressable
                    key={product.vendorProductId}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                    onPress={() => setSelectedVendorId(product.vendorProductId)}
                    style={[
                      styles.card,
                      {
                        borderColor: selected ? colors.primary : colors.border,
                        backgroundColor: selected ? (isDark ? 'rgba(96,165,250,0.12)' : 'rgba(37,99,235,0.06)') : colors.surface,
                      },
                    ]}
                  >
                    <View style={styles.cardHeader}>
                      <Text style={[styles.cardTitle, { color: colors.text }]}>{product.localizedTitle}</Text>
                      <Text style={[styles.cardPrice, { color: colors.primary }]}>{formatProductPrice(product)}</Text>
                    </View>
                    {product.localizedDescription ? (
                      <Text style={[styles.cardDesc, { color: colors.textMuted }]} numberOfLines={4}>
                        {product.localizedDescription}
                      </Text>
                    ) : null}
                    {product.subscription?.localizedSubscriptionPeriod ? (
                      <Text style={[styles.period, { color: colors.textMuted }]}>
                        {product.subscription.localizedSubscriptionPeriod}
                      </Text>
                    ) : null}
                  </Pressable>
                );
              })}
            </View>
          )}

          <View style={styles.actions}>
            <Button
              disabled={!selectedProduct || isPurchasing || isRestoringPurchases || products.length === 0}
              onPress={() => void handleSubscribe()}
              title={subscribeTitle}
            />
            <Button
              disabled={isPurchasing || isRestoringPurchases}
              onPress={() => void handleRestore()}
              title={isRestoringPurchases ? t('checking') : t('paywall.restore')}
              variant="secondary"
            />
          </View>

          <Text style={[styles.legal, { color: colors.textMuted }]}>{t('paywall.legalHint')}</Text>
        </ScrollView>
      ) : null}

      {isPurchasing ? (
        <View style={[styles.purchaseOverlay, { backgroundColor: isDark ? 'rgba(2,6,23,0.45)' : 'rgba(248,250,252,0.65)' }]}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingBottom: 8,
    minHeight: 44,
  },
  headerSpacer: {
    width: 40,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 17,
    fontWeight: '600',
  },
  closeBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 16,
  },
  muted: {
    fontSize: 15,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 15,
    textAlign: 'center',
  },
  retryWrap: {
    width: '100%',
    maxWidth: 280,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 32,
    gap: 16,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
  },
  cards: {
    gap: 12,
  },
  card: {
    borderRadius: 14,
    borderWidth: 2,
    padding: 16,
    gap: 8,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  cardTitle: {
    flex: 1,
    fontSize: 17,
    fontWeight: '600',
  },
  cardPrice: {
    fontSize: 17,
    fontWeight: '700',
  },
  cardDesc: {
    fontSize: 14,
    lineHeight: 20,
  },
  period: {
    fontSize: 13,
    fontWeight: '500',
  },
  actions: {
    gap: 12,
    marginTop: 8,
  },
  legal: {
    fontSize: 12,
    lineHeight: 18,
    marginTop: 8,
  },
  purchaseOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
