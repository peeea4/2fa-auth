import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Platform, StyleSheet, Text, View } from 'react-native';

import { useOtpTimer } from '../../hooks/useOtpTimer';
import { useTheme } from '../../hooks/useTheme';
import { otpService } from '../../services/otp.service';
import type { OtpDigits, OtpEntry } from '../../types';
import { ServiceIcon } from '../icons/ServiceIcon';

const formatDisplayCode = (code: string, digits: OtpDigits): string => {
  if (digits === 6) {
    return `${code.slice(0, 3)} ${code.slice(3)}`;
  }
  return `${code.slice(0, 4)} ${code.slice(4)}`;
};

function normalizeSecretInput(value: string): string {
  return value.replace(/\s/g, '').trim();
}

type OtpCardPreviewProps = {
  entry: OtpEntry;
  /** Raw secret from the form; shown as dots until valid. */
  secretDraft: string;
  /** Edit screen: use stored secret when the draft is empty so the preview stays live. */
  backingSecret?: string | null;
};

export function OtpCardPreview({ entry, secretDraft, backingSecret }: OtpCardPreviewProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { currentSlot } = useOtpTimer({ period: 30 });

  const normalizedDraft = useMemo(() => normalizeSecretInput(secretDraft), [secretDraft]);
  const normalizedBacking = useMemo(
    () => (backingSecret ? normalizeSecretInput(backingSecret) : ''),
    [backingSecret],
  );

  const normalizedSecret = normalizedDraft || normalizedBacking;

  const secretValid = useMemo(
    () =>
      Boolean(normalizedSecret) &&
      otpService.validateTotpSetup(normalizedSecret, entry.algorithm, entry.digits, 30),
    [entry.algorithm, entry.digits, normalizedSecret],
  );

  const code = useMemo(() => {
    void currentSlot;
    if (!secretValid || !normalizedSecret) {
      return '';
    }
    return otpService.generateToken({
      secret: normalizedSecret,
      type: 'totp',
      algorithm: entry.algorithm,
      digits: entry.digits,
      period: 30,
    });
  }, [currentSlot, entry.algorithm, entry.digits, normalizedSecret, secretValid]);

  const displayCode = useMemo(() => {
    if (!secretValid) {
      return entry.digits === 6 ? '••• •••' : '•••• ••••';
    }
    return formatDisplayCode(code, entry.digits);
  }, [code, entry.digits, secretValid]);

  const accent = entry.color ?? colors.primary;

  return (
    <View
      accessibilityRole="image"
      accessibilityLabel={t('formPreviewA11yLabel')}
      style={[
        styles.card,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
        },
      ]}
    >
      <View style={[styles.accent, { backgroundColor: accent }]} />
      <View style={styles.body}>
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
        </View>
        <View style={styles.codeBlock}>
          <Text
            allowFontScaling={false}
            selectable={false}
            style={[
              styles.code,
              {
                color: colors.text,
                opacity: secretValid ? 1 : 0.55,
              },
            ]}
          >
            {displayCode}
          </Text>
        </View>
      </View>
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
    flexDirection: 'row',
    alignSelf: 'stretch',
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
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerText: {
    flex: 1,
    minWidth: 0,
  },
  issuer: {
    fontSize: 17,
    fontWeight: '600',
  },
  account: {
    fontSize: 14,
  },
  codeBlock: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  code: {
    fontSize: 28,
    letterSpacing: 2,
    fontVariant: ['tabular-nums'],
    fontFamily: monoFont,
    fontWeight: '600',
  },
});
