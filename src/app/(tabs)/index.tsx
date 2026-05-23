import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import { Plus } from "lucide-react-native";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Alert,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { HomeEmptyLottie } from "../../components/lottie";
import { OtpList } from "../../components/otp";
import { Button } from "../../components/ui/Button";
import { EmptyState } from "../../components/ui/EmptyState";
import { useFirstRunHint } from "../../hooks/useFirstRunHint";
import { usePremium } from "../../hooks/usePremium";
import { useTheme } from "../../hooks/useTheme";
import { storageService } from "../../services/storage.service";
import { useOtpStore } from "../../stores";
import type { OtpEntry } from "../../types";

export default function HomeScreen() {
  const { t, i18n } = useTranslation();
  const { colors } = useTheme();
  const tabBarHeight = useBottomTabBarHeight();
  const entries = useOtpStore((state) => state.entries);
  const removeEntry = useOtpStore((state) => state.removeEntry);
  const reorderEntries = useOtpStore((state) => state.reorderEntries);
  const { premium } = usePremium();
  const { showHint: showSwipeCoachMark, dismissHint: dismissSwipeCoachMark } = useFirstRunHint(
    entries.length === 1,
  );

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
    const q = search.trim().toLowerCase();
    const filtered = !q
      ? entries
      : entries.filter(
          (e) =>
            e.issuer.toLowerCase().includes(q) ||
            e.account.toLowerCase().includes(q) ||
            (e.group ?? "").toLowerCase().includes(q) ||
            e.id.toLowerCase().includes(q),
        );

    return [...filtered].sort((a, b) => {
      const groupA = (a.group ?? "").trim().toLowerCase();
      const groupB = (b.group ?? "").trim().toLowerCase();
      if (groupA !== groupB) {
        return groupA.localeCompare(groupB);
      }
      return a.createdAt - b.createdAt;
    });
  }, [entries, search]);

  const hasGroups = useMemo(
    () => sortedFiltered.some((entry) => Boolean(entry.group?.trim())),
    [sortedFiltered],
  );

  const isDragEnabled = search.trim().length === 0 && !hasGroups;

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
          <View style={styles.headerRow}>
            <Text
              numberOfLines={1}
              style={[styles.title, { color: colors.text }]}
            >
              {t("homeHeading")}
            </Text>
            <Pressable
              accessibilityLabel={t("add")}
              accessibilityRole="button"
              hitSlop={12}
              onPress={() => router.push("/add")}
              onPressIn={() => {
                void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }}
              style={({ pressed }) => [
                styles.headerAddButton,
                {
                  backgroundColor: colors.primary,
                  borderColor: "rgba(255,255,255,0.55)",
                  opacity: pressed ? 0.92 : 1,
                  shadowColor: colors.primary,
                  shadowOpacity: pressed ? 0.32 : 0.48,
                  shadowRadius: pressed ? 8 : 12,
                  shadowOffset: { width: 0, height: pressed ? 2 : 4 },
                  elevation: pressed ? 3 : 6,
                  transform: [{ scale: pressed ? 0.96 : 1 }],
                },
              ]}
            >
              <Plus color="#ffffff" size={24} strokeWidth={2.8} />
            </Pressable>
          </View>
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
              icon={entries.length === 0 ? <HomeEmptyLottie /> : undefined}
              title={
                entries.length === 0 ? t("emptyTitle") : t("emptySearchTitle")
              }
            />
          ) : (
            <OtpList
              entries={sortedFiltered}
              grouped={hasGroups}
              isDragEnabled={isDragEnabled}
              isPremium={premium.isPremium}
              listBottomInset={tabBarHeight + 20}
              onDeleteEntry={confirmDeleteEntry}
              onDismissSwipeCoachMark={dismissSwipeCoachMark}
              onEditEntry={handleEditEntry}
              onLockedCardPress={openPaywall}
              onReorderEntries={reorderEntries}
              secretsById={secretsById}
              showSwipeCoachMark={showSwipeCoachMark}
            />
          )}
        </View>
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
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  title: {
    flex: 1,
    fontSize: 28,
    fontWeight: "700",
  },
  headerAddButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
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
});
