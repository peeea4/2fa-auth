import { Tabs } from 'expo-router';
import { KeyRound, Settings } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';

import { useTheme } from '../../hooks/useTheme';

export default function TabsLayout() {
  const { t, i18n } = useTranslation();
  const { colors } = useTheme();

  return (
    <Tabs
      key={i18n.language}
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t('tabCodes'),
          tabBarLabel: t('tabCodes'),
          tabBarIcon: ({ color, size }) => (
            <KeyRound color={color} size={size} strokeWidth={2.25} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: t('settings'),
          tabBarLabel: t('settings'),
          tabBarIcon: ({ color, size }) => (
            <Settings color={color} size={size} strokeWidth={2.25} />
          ),
        }}
      />
    </Tabs>
  );
}
