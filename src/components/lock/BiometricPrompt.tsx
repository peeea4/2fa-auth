import { Fingerprint } from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';

import { useTheme } from '../../hooks/useTheme';
import { Button } from '../ui';

type BiometricPromptProps = {
  isAvailable: boolean;
  isLoading?: boolean;
  onPress: () => void;
};

export function BiometricPrompt({ isAvailable, isLoading = false, onPress }: BiometricPromptProps) {
  const { colors } = useTheme();

  if (!isAvailable) return null;

  return (
    <View style={[styles.container, { borderColor: colors.border, backgroundColor: colors.surface }]}>
      <Fingerprint color={colors.primary} size={20} />
      <Text style={[styles.text, { color: colors.text }]}>Unlock with Face ID / Touch ID</Text>
      <Button title={isLoading ? 'Checking...' : 'Use biometrics'} onPress={onPress} disabled={isLoading} />
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
