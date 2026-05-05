import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import { Plus } from "lucide-react-native";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Alert,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

import { OtpList } from "../../components/otp";
import { Button } from "../../components/ui/Button";
import { EmptyState } from "../../components/ui/EmptyState";
import { usePremium } from "../../hooks/usePremium";
import { useTheme } from "../../hooks/useTheme";
import { storageService } from "../../services/storage.service";
import { useOtpStore } from "../../stores";
import type { OtpEntry } from "../../types";

/** Тень «парящего» FAB: лёгкое свечение primary + глубина. */
function fabIosShadow(primary: string) {
  return {
    shadowColor: primary,
    shadowOffset: { width: 0, height: 12 } as const,
    shadowOpacity: 0.42,
    shadowRadius: 22,
  };
}

export default function HomeScreen() {
  const { t, i18n } = useTranslation();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const entries = useOtpStore((state) => state.entries);
  const removeEntry = useOtpStore((state) => state.removeEntry);
  const { premium } = usePremium();

  const [search, setSearch] = useState("");
  const [secretsById, setSecretsById] = useState<Record<string, string | null>>(
    {},
  );

  useEffect(() => {
    let cancelled = false;

    const loadSecrets = async () => {
      const next: Record<string, string | null> = {};
      for (const entry of entries) {
        next[entry.id] = await storageService.getOtpSecret(entry.id);
      }
      if (!cancelled) {
        setSecretsById(next);
      }
    };

    void loadSecrets();

    return () => {
      cancelled = true;
    };
  }, [entries]);

  const sortedFiltered = useMemo(() => {
    const sorted = [...entries].sort((a, b) => b.createdAt - a.createdAt);
    const q = search.trim().toLowerCase();
    if (!q) {
      return sorted;
    }
    return sorted.filter(
      (e) =>
        e.issuer.toLowerCase().includes(q) ||
        e.account.toLowerCase().includes(q) ||
        e.id.toLowerCase().includes(q),
    );
  }, [entries, search]);

  const openPaywall = useCallback(() => {
    router.push("/paywall");
  }, []);

  const confirmDeleteEntry = useCallback(
    (entry: OtpEntry) => {
      Alert.alert(t("deleteConfirmTitle"), t("deleteConfirmMessage"), [
        { text: t("cancel"), style: "cancel" },
        {
          text: t("delete"),
          style: "destructive",
          onPress: async () => {
            await storageService.deleteOtpSecret(entry.id);
            removeEntry(entry.id);
          },
        },
      ]);
    },
    [removeEntry, t],
  );

  const handleEditEntry = useCallback((entry: OtpEntry) => {
    router.push(`/edit/${entry.id}`);
  }, []);

  return (
    <SafeAreaView
      edges={["top", "left", "right"]}
      key={i18n.language}
      style={[styles.safe, { backgroundColor: colors.background }]}
    >
      <View style={styles.contentRoot}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>
            {t("homeHeading")}
          </Text>
          <TextInput
            accessibilityLabel={t("search")}
            autoCapitalize="none"
            autoCorrect={false}
            clearButtonMode="while-editing"
            onChangeText={setSearch}
            placeholder={t("search")}
            placeholderTextColor={colors.textMuted}
            style={[
              styles.search,
              {
                color: colors.text,
                borderColor: colors.border,
                backgroundColor: colors.surface,
              },
            ]}
            value={search}
          />
        </View>

        <View style={styles.body}>
          {sortedFiltered.length === 0 ? (
            <EmptyState
              action={
                <Button
                  leftIcon={
                    <Plus color="#ffffff" size={20} strokeWidth={2.5} />
                  }
                  onPress={() => router.push("/add")}
                  size="lg"
                  title={t("add")}
                />
              }
              description={
                entries.length === 0
                  ? t("emptySubtitle")
                  : t("emptySearchSubtitle")
              }
              title={
                entries.length === 0 ? t("emptyTitle") : t("emptySearchTitle")
              }
            />
          ) : (
            <OtpList
              entries={sortedFiltered}
              isPremium={premium.isPremium}
              listBottomInset={tabBarHeight + 100}
              onDeleteEntry={confirmDeleteEntry}
              onEditEntry={handleEditEntry}
              onLockedCardPress={openPaywall}
              secretsById={secretsById}
            />
          )}
        </View>

        {!!sortedFiltered.length && (
          <View
            collapsable={false}
            style={[
              styles.fabShell,
              {
                position: "absolute",
                bottom: 18 + insets.bottom,
                right: 16 + insets.right,
                zIndex: 20,
                backgroundColor: colors.primary,
                borderWidth: 1,
                borderColor: "rgba(255,255,255,0.32)",
                ...(Platform.OS === "ios" ? fabIosShadow(colors.primary) : {}),
              },
            ]}
          >
            <Pressable
              accessibilityLabel={t("add")}
              accessibilityRole="button"
              onPress={() => router.push("/add")}
              onPressIn={() => {
                void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }}
              style={({ pressed }) => [
                pressed && {
                  opacity: 0.92,
                  transform: [{ scale: 0.94 }, { translateY: 1 }],
                },
              ]}
            >
              <Plus color="#ffffff" size={44} />
            </Pressable>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  contentRoot: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 12,
    gap: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
  },
  search: {
    minHeight: 44,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    fontSize: 16,
  },
  body: {
    flex: 1,
    paddingHorizontal: 20,
  },
  fabShell: {
    borderRadius: 32,
    overflow: "visible",
    padding: 6,
  },
  fabHit: {
    alignItems: "center",
    justifyContent: "center",
  },
  fabIconCenter: {
    alignItems: "center",
    justifyContent: "center",
  },
});
