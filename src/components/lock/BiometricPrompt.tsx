import { Fingerprint } from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { useTheme } from '../../hooks/useTheme';
import { Button } from '../ui';

type BiometricPromptProps = {
  isAvailable: boolean;
  isLoading?: boolean;
  onPress: () => void;
};

export function BiometricPrompt({ isAvailable, isLoading = false, onPress }: BiometricPromptProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();

  if (!isAvailable) return null;

  return (
    <View style={[styles.container, { borderColor: colors.border, backgroundColor: colors.surface }]}>
      <Fingerprint color={colors.primary} size={20} />
      <Text style={[styles.text, { color: colors.text }]}>{t('lock.deviceAuthCardHint')}</Text>
      <Button
        title={isLoading ? t('checking') : t('lock.deviceAuthButton')}
        onPress={onPress}
        disabled={isLoading}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
    gap: 10,
    alignItems: 'center',
  },
  text: {
    fontSize: 15,
    fontWeight: '500',
    textAlign: 'center',
  },
});
