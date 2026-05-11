import * as Haptics from 'expo-haptics';
import { Copy } from 'lucide-react-native';
import { useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Platform, Pressable, StyleSheet, Text, ToastAndroid, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { useOtpTimer } from '../../hooks/useOtpTimer';
import { useTheme } from '../../hooks/useTheme';
import { otpService } from '../../services/otp.service';
import type { OtpDigits, OtpEntry } from '../../types';
import { copyTextToClipboard } from '../../utils/copy-to-clipboard';
import { ServiceIcon } from '../icons/ServiceIcon';
import { CountdownBar } from './CountdownBar';

const formatDisplayCode = (code: string, digits: OtpDigits): string => {
  if (digits === 6) {
    return `${code.slice(0, 3)} ${code.slice(3)}`;
  }
  return `${code.slice(0, 4)} ${code.slice(4)}`;
};

type OtpCardProps = {
  entry: OtpEntry;
  secret: string | null;
  onLongPress?: () => void;
};

export function OtpCard({ entry, secret, onLongPress }: OtpCardProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { timeLeft, currentSlot } = useOtpTimer({ period: 30 });
  const copiedOpacity = useSharedValue(0);

  const code = useMemo(() => {
    // Recompute TOTP when the active time slot changes.
    void currentSlot;
    if (!secret) {
      return '';
    }
    return otpService.generateToken({
      secret,
      type: 'totp',
      algorithm: entry.algorithm,
      digits: entry.digits,
      period: 30,
    });
  }, [currentSlot, entry.algorithm, entry.digits, secret]);

  const displayCode = useMemo(() => {
    if (!secret) {
      return entry.digits === 6 ? '••• •••' : '•••• ••••';
    }
    return formatDisplayCode(code, entry.digits);
  }, [code, entry.digits, secret]);

  const accent = entry.color ?? colors.primary;

  const copiedBadgeStyle = useAnimatedStyle(() => ({
    opacity: copiedOpacity.value,
  }));

  const showCopiedFeedback = useCallback(() => {
    copiedOpacity.value = withSequence(
      withTiming(1, { duration: 120 }),
      withDelay(950, withTiming(0, { duration: 240 })),
    );
  }, [copiedOpacity]);

  const handleCopy = useCallback(async () => {
    if (!secret) {
      return;
    }

    const copied = await copyTextToClipboard(code);
    if (!copied) {
      return;
    }

    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    if (Platform.OS === 'android') {
      ToastAndroid.show(t('copied'), ToastAndroid.SHORT);
    } else {
      showCopiedFeedback();
    }
  }, [code, secret, showCopiedFeedback, t]);

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
        },
      ]}
    >
      <Pressable
        accessibilityRole="button"
        delayLongPress={180}
        onLongPress={onLongPress}
        style={({ pressed }) => [styles.cardPressable, pressed && styles.cardPressed]}
      >
        <View style={[styles.accent, { backgroundColor: accent }]} />

        <View style={styles.body}>
          <View style={styles.header}>
            <View style={styles.headerRow}>
              <ServiceIcon entry={entry} size={32} />
              <View style={styles.headerText}>
                <Text numberOfLines={1} style={[styles.issuer, { color: colors.text }]}>
                  {entry.issuer || t('title')}
                </Text>
                <Text numberOfLines={1} style={[styles.account, { color: colors.textMuted }]}>
                  {entry.account}
                </Text>
              </View>
              <Pressable
                accessibilityHint={t('otpCard.copyHint')}
                accessibilityLabel={t('otpCard.copyLabel')}
                accessibilityRole="button"
                disabled={!secret}
                hitSlop={8}
                onPress={() => {
                  void handleCopy();
                }}
                style={({ pressed }) => [
                  styles.copyButton,
                  {
                    borderColor: colors.border,
                    backgroundColor: colors.background,
                    opacity: !secret ? 0.5 : pressed ? 0.78 : 1,
                  },
                ]}
              >
                <Copy color={colors.text} size={16} strokeWidth={2.2} />
              </Pressable>
            </View>
          </View>

          <View style={styles.codeBlock}>
            <Text
              selectable={false}
              style={[
                styles.code,
                {
                  color: colors.text,
                  opacity: !secret ? 0.55 : 1,
                },
              ]}
            >
              {displayCode}
            </Text>
            {Platform.OS !== 'android' ? (
              <Animated.View
                pointerEvents="none"
                style={[styles.copiedBadge, { backgroundColor: colors.primary }, copiedBadgeStyle]}
              >
                <Text style={styles.copiedText}>
                  {t('copied')}!
                </Text>
              </Animated.View>
            ) : null}
          </View>

          <CountdownBar fillColor={colors.primary} period={30} timeLeft={timeLeft} trackColor={colors.border} />
        </View>
      </Pressable>
    </View>
  );
}

const monoFont = Platform.select({
  ios: 'Menlo',
  default: 'monospace',
});

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  cardPressable: {
    flexDirection: 'row',
    flex: 1,
    alignSelf: 'stretch',
  },
  cardPressed: {
    opacity: 0.96,
  },
  accent: {
    width: 4,
  },
  body: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 14,
    gap: 12,
  },
  header: {
    gap: 2,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerText: {
    flex: 1,
    minWidth: 0,
  },
  copyButton: {
    width: 32,
    height: 32,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  issuer: {
    fontSize: 17,
    fontWeight: '600',
  },
  account: {
    fontSize: 14,
  },
  codeBlock: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  code: {
    fontSize: 30,
    letterSpacing: 2,
    fontVariant: ['tabular-nums'],
    fontFamily: monoFont,
    fontWeight: '600',
  },
  copiedBadge: {
    position: 'absolute',
    top: -4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  copiedText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
});
