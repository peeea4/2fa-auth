import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Input } from '../ui/Input';
import { SectionHeader } from '../ui/SectionHeader';
import { useTheme } from '../../hooks/useTheme';
import type { OtpAlgorithm, OtpDigits } from '../../types';

const ALGORITHMS: OtpAlgorithm[] = ['SHA1', 'SHA256', 'SHA512'];
const DIGITS_OPTIONS: OtpDigits[] = [6, 8];

type OtpAdvancedSectionProps = {
  algorithm: OtpAlgorithm;
  digits: OtpDigits;
  onAlgorithmChange: (value: OtpAlgorithm) => void;
  onDigitsChange: (value: OtpDigits) => void;
  secret?: string;
  onSecretChange?: (value: string) => void;
  secretError?: string;
  secretHint?: string;
  showSecretField?: boolean;
};

export function OtpAdvancedSection({
  algorithm,
  digits,
  onAlgorithmChange,
  onDigitsChange,
  secret = '',
  onSecretChange,
  secretError,
  secretHint,
  showSecretField = false,
}: OtpAdvancedSectionProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();

  return (
    <>
      <SectionHeader title={t('formSectionAdvanced')} />
      <Text style={[styles.groupLabel, { color: colors.text }]}>{t('fieldAlgorithm')}</Text>
      <View style={styles.segmentRow}>
        {ALGORITHMS.map((value) => {
          const selected = algorithm === value;
          return (
            <Pressable
              key={value}
              onPress={() => onAlgorithmChange(value)}
              style={[
                styles.segment,
                {
                  borderColor: selected ? colors.primary : colors.border,
                  backgroundColor: selected ? colors.surface : colors.background,
                },
              ]}
            >
              <Text style={[styles.segmentText, { color: selected ? colors.primary : colors.text }]}>{value}</Text>
            </Pressable>
          );
        })}
      </View>
      <Text style={[styles.groupLabel, { color: colors.text }]}>{t('fieldDigits')}</Text>
      <View style={styles.segmentRow}>
        {DIGITS_OPTIONS.map((value) => {
          const selected = digits === value;
          return (
            <Pressable
              key={value}
              onPress={() => onDigitsChange(value)}
              style={[
                styles.segment,
                {
                  borderColor: selected ? colors.primary : colors.border,
                  backgroundColor: selected ? colors.surface : colors.background,
                },
              ]}
            >
              <Text style={[styles.segmentText, { color: selected ? colors.primary : colors.text }]}>
                {String(value)}
              </Text>
            </Pressable>
          );
        })}
      </View>
      {showSecretField && onSecretChange ? (
        <Input
          autoCapitalize="characters"
          autoCorrect={false}
          error={secretError}
          hint={secretHint}
          label={t('fieldSecret')}
          onChangeText={onSecretChange}
          placeholder={t('fieldSecretPlaceholder')}
          value={secret}
          variant="filled"
        />
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  groupLabel: {
    fontSize: 15,
    fontWeight: '600',
    marginTop: 4,
  },
  segmentRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  segment: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  segmentText: {
    fontSize: 15,
    fontWeight: '600',
  },
});
