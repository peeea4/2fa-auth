import { ImageOff } from "lucide-react-native";
import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
  type ListRenderItemInfo,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
  SERVICE_REGISTRY,
  type ServiceIconEntry,
} from "../../constants/service-registry";
import { useKeyboardHeight, useTheme } from "../../hooks";
import { ServiceIcon } from "./ServiceIcon";

type IconPickerModalProps = {
  visible: boolean;
  selectedKey: string | null;
  onSelect: (key: string | null) => void;
  onClose: () => void;
};

type PickerItem = {
  key: string;
  value: string;
  label: string;
  entry: ServiceIconEntry;
  searchValue: string;
};

const COLUMN_COUNT = 5;
const SHEET_HORIZONTAL_PADDING = 20;
const GRID_COLUMN_GAP = 8;
const GRID_ROW_GAP = 8;

const normalizeQuery = (value: string): string => value.trim().toLowerCase();

export function IconPickerModal({
  visible,
  selectedKey,
  onSelect,
  onClose,
}: IconPickerModalProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const keyboardHeight = useKeyboardHeight(visible);
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const inputRef = useRef<TextInput>(null);
  const rowInnerWidth = width - SHEET_HORIZONTAL_PADDING * 2;
  const itemWidth =
    (rowInnerWidth - GRID_COLUMN_GAP * (COLUMN_COUNT - 1)) / COLUMN_COUNT;
  const itemHeight = itemWidth + 12;

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setDebouncedQuery(query);
    }, 150);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [query]);

  useEffect(() => {
    if (!visible) {
      return;
    }

    setQuery("");
    setDebouncedQuery("");
  }, [visible]);

  useEffect(() => {
    if (!visible) {
      return;
    }

    const focusTimeoutId = setTimeout(() => {
      inputRef.current?.focus();
    }, 280);

    return () => {
      clearTimeout(focusTimeoutId);
    };
  }, [visible]);

  const items = useMemo<PickerItem[]>(() => {
    const normalizedQuery = normalizeQuery(debouncedQuery);
    const serviceItems: PickerItem[] = SERVICE_REGISTRY.map((entry) => ({
      key: entry.key,
      value: entry.key,
      label: entry.label,
      entry,
      searchValue: `${entry.label} ${entry.aliases.join(" ")}`.toLowerCase(),
    }));

    if (!normalizedQuery) {
      return serviceItems;
    }

    return serviceItems.filter((item) =>
      item.searchValue.includes(normalizedQuery),
    );
  }, [debouncedQuery]);

  const renderItem = ({ item }: ListRenderItemInfo<PickerItem>) => {
    const isSelected = item.value === selectedKey;

    return (
      <Pressable
        accessibilityLabel={item.label}
        accessibilityRole="button"
        onPress={() => {
          onSelect(item.value);
          onClose();
        }}
        // style={({ pressed }) => [
          // styles.itemCell,
          // {
            // width: itemWidth,
            // height: itemHeight,

            // borderColor: isSelected ? colors.primary : "transparent",
            // backgroundColor: colors.background,
            // opacity: pressed ? 0.75 : 1,
          // },
        // ]}
      >
        <View style={styles.iconContainer}>
          <View style={styles.iconWrap}>
            <ServiceIcon
              entry={{
                id: `icon-picker-${item.entry.key}`,
                issuer: item.entry.label,
                account: item.entry.label,
                algorithm: "SHA1",
                digits: 6,
                period: 30,
                createdAt: 0,
                iconKey: item.entry.key,
                iconSource: "service",
              }}
              size={30}
            />
          </View>
        </View>
        {/*
        <View style={styles.itemLabelWrap}>
          <Text
            ellipsizeMode="tail"
            numberOfLines={1}
            style={[styles.itemLabel, { color: colors.text }]}
          >
            {item.label}
          </Text>
        </View>
        */}
      </Pressable>
    );
  };

  return (
    <Modal
      animationType="slide"
      presentationStyle="overFullScreen"
      transparent
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.root}>
        <Pressable style={styles.overlayPressable} onPress={onClose} />
        <View
          style={[
            styles.sheet,
            {
              backgroundColor: colors.surface,
              paddingBottom: Math.max(insets.bottom, 16),
            },
          ]}
        >
          <Text style={[styles.title, { color: colors.text }]}>
            {t("iconPickerTitle")}
          </Text>
          <TextInput
            ref={inputRef}
            autoCapitalize="none"
            autoCorrect={false}
            onChangeText={setQuery}
            placeholder={t("iconPickerSearch")}
            placeholderTextColor={colors.textMuted}
            style={[
              styles.searchInput,
              {
                borderColor: colors.border,
                color: colors.text,
                backgroundColor: colors.background,
              },
            ]}
            value={query}
          />
          <Pressable
            accessibilityLabel={t("iconPickerNoIcon")}
            accessibilityRole="button"
            onPress={() => {
              onSelect(null);
              onClose();
            }}
            style={({ pressed }) => [
              styles.noIconRow,
              {
                borderColor:
                  selectedKey === null ? colors.primary : colors.border,
                backgroundColor: colors.background,
                opacity: pressed ? 0.75 : 1,
              },
            ]}
          >
            <View
              style={[
                styles.noIconIconBox,
                { borderColor: colors.border, backgroundColor: colors.surface },
              ]}
            >
              <ImageOff color={colors.textMuted} size={22} strokeWidth={2} />
            </View>
            <Text
              numberOfLines={1}
              style={[styles.noIconLabel, { color: colors.text, flex: 1 }]}
            >
              {t("iconPickerNoIcon")}
            </Text>
          </Pressable>

          <FlatList
            // columnWrapperStyle={styles.row}
            // contentContainerStyle={[
              // styles.listContent,
              // { paddingBottom: keyboardHeight + 8 },
            // ]}
            data={items}
            keyExtractor={(item) => item.key}
            keyboardShouldPersistTaps="handled"
            numColumns={COLUMN_COUNT}
            renderItem={renderItem}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <Text style={[styles.emptyText, { color: colors.textMuted }]}>
                {t("iconPickerNoMatch")}
              </Text>
            }
          />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: "flex-end",
  },
  overlayPressable: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.35)",
  },
  sheet: {
    width: "100%",
    maxHeight: "80%",
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    paddingHorizontal: SHEET_HORIZONTAL_PADDING,
    paddingTop: 24,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 12,
    marginTop: 4,
  },
  searchInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    marginBottom: 12,
  },
  listContent: {
    paddingBottom: 8,
  },
  row: {
    flexDirection: "row",
    width: "100%",
    gap: GRID_COLUMN_GAP,
    marginBottom: GRID_ROW_GAP,
  },
  itemCell: {
    borderRadius: 12,
    borderWidth: 2,
    paddingVertical: 8,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    minWidth: 0,
    overflow: "hidden",
  },
  iconContainer: {
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  iconWrap: {
    width: 38,
    height: 38,
    alignItems: "center",
    justifyContent: "center",
  },
  noIconRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 2,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 12,
    gap: 12,
  },
  noIconIconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  noIconLabel: {
    fontSize: 15,
    fontWeight: "600",
  },
  itemLabelWrap: {
    width: "100%",
    minWidth: 0,
    paddingHorizontal: 2,
    alignItems: "center",
  },
  itemLabel: {
    fontSize: 10,
    fontWeight: "500",
    textAlign: "center",
    lineHeight: 12,
    width: "100%",
  },
  emptyText: {
    textAlign: "center",
    paddingVertical: 20,
    fontSize: 14,
  },
});
