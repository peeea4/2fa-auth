import { Tabs } from 'expo-router';
import { useTranslation } from 'react-i18next';

export default function TabsLayout() {
  const { t, i18n } = useTranslation();

  return (
    <Tabs
      key={i18n.language}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t('tabCodes'),
          tabBarLabel: t('tabCodes'),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: t('settings'),
          tabBarLabel: t('settings'),
        }}
      />
    </Tabs>
  );
}
