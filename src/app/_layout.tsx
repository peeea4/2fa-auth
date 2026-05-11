import "../../global.css";

import { Stack } from "expo-router";
import { useEffect, useMemo, useRef } from "react";
import { AppState, Platform, StyleSheet } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { ThemeRoot } from "../components/theme";
import { usePremium } from "../hooks/usePremium";
import { useTheme } from "../hooks/useTheme";
import i18n from "../i18n";
import { migrateLegacyOtpMetadataIfNeeded } from "../services/migrate-legacy-otp-metadata";
import { storageService } from "../services/storage.service";
import { useAuthStore, useSettingsStore } from "../stores";

export default function RootLayout() {
  const { colors } = useTheme();
  const lock = useAuthStore((state) => state.lock);
  const isBiometricEnabled = useAuthStore((state) => state.isBiometricEnabled);
  const language = useSettingsStore((state) => state.language);
  const { canUseBiometric } = usePremium();
  const appStateRef = useRef(AppState.currentState);

  /**
   * iOS: `pageSheet` — карточка не на весь экран, контент стабильно рисуется.
   * `formSheet` + sheet/detents в связке с expo-router / RNS в этом проекте даёт пустой экран.
   */
  const addModalScreenOptions = useMemo(
    () =>
      Platform.OS === "ios"
        ? {
            presentation: "pageSheet" as const,
            contentStyle: {
              flex: 1,
              backgroundColor: colors.background,
            },
          }
        : {
            presentation: "modal" as const,
            contentStyle: {
              flex: 1,
              backgroundColor: colors.background,
            },
          },
    [colors.background],
  );

  useEffect(() => {
    void storageService.deleteLegacyAppPinHash();
  }, []);

  useEffect(() => {
    void migrateLegacyOtpMetadataIfNeeded();
  }, []);

  useEffect(() => {
    void i18n.changeLanguage(language);
  }, [language]);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextState) => {
      const previousState = appStateRef.current;
      appStateRef.current = nextState;

      if (previousState === "active" && (nextState === "inactive" || nextState === "background")) {
        if (canUseBiometric && isBiometricEnabled) {
          lock();
        }
      }
    });

    return () => {
      subscription.remove();
    };
  }, [canUseBiometric, isBiometricEnabled, lock]);

  return (
    <GestureHandlerRootView style={styles.gestureRoot}>
      <SafeAreaProvider>
        <ThemeRoot>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="onboarding/index" />
            <Stack.Screen name="lock" />
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="add" options={addModalScreenOptions} />
            <Stack.Screen name="paywall" options={{ presentation: "modal" }} />
            <Stack.Screen name="edit/[id]" options={{ presentation: "modal" }} />
            <Stack.Screen name="backup" options={{ presentation: "modal" }} />
          </Stack>
        </ThemeRoot>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  gestureRoot: {
    flex: 1,
  },
});
