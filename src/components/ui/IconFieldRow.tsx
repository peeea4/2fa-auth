import { ChevronRight } from 'lucide-react-native';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { REGISTRY_BY_KEY } from '../../constants/service-registry';
import { useTheme } from '../../hooks/useTheme';
import type { OtpEntry } from '../../types';
import { ServiceIcon } from '../icons/ServiceIcon';

const ICON_SIZE = 28;
const ICON_BOX_SIZE = 40;

type IconFieldRowProps = {
  entry: OtpEntry;
  label?: string;
  onPress: () => void;
};

function resolveIconValueLabel(entry: OtpEntry, t: (key: string) => string): string {
  const isService =
    entry.iconSource === 'service' || (!entry.iconSource && Boolean(entry.iconKey));

  if (isService && entry.iconKey) {
    return REGISTRY_BY_KEY[entry.iconKey]?.label ?? entry.iconKey;
  }

  const issuerName = entry.issuer.trim();
  if (issuerName) {
    return issuerName;
  }

  return t('iconValueInitials');
}

export function IconFieldRow({ entry, label, onPress }: IconFieldRowProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const valueLabel = useMemo(() => resolveIconValueLabel(entry, t), [entry, t]);

  return (
    <View style={styles.wrapper}>
      {label ? <Text style={[styles.label, { color: colors.text }]}>{label}</Text> : null}
      <Pressable
        accessibilityLabel={t('changeIcon')}
        accessibilityRole="button"
        onPress={onPress}
        style={({ pressed }) => [
          styles.touchable,
          {
            backgroundColor: colors.surface2,
            opacity: pressed ? 0.88 : 1,
          },
        ]}
      >
        <View style={styles.row}>
          <View
            style={[
              styles.iconBox,
              { borderColor: colors.border, backgroundColor: colors.surface },
            ]}
          >
            <ServiceIcon entry={entry} size={ICON_SIZE} />
          </View>
          <Text
            numberOfLines={1}
            style={[styles.value, { color: colors.text }]}
            {...(Platform.OS === 'android' ? { includeFontPadding: false } : {})}
          >
            {valueLabel}
          </Text>
          <View style={styles.chevron}>
            <ChevronRight color={colors.textMuted} size={20} strokeWidth={2.25} />
          </View>
        </View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: 6,
    width: '100%',
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
  },
  touchable: {
    width: '100%',
    borderRadius: 12,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    minHeight: 52,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 12,
  },
  iconBox: {
    width: ICON_BOX_SIZE,
    height: ICON_BOX_SIZE,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  value: {
    flex: 1,
    flexShrink: 1,
    minWidth: 0,
    fontSize: 16,
    fontWeight: '500',
  },
  chevron: {
    flexShrink: 0,
    width: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
