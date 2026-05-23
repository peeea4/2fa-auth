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

const INITIALS_PICKER_KEY = "__initials__";

type IconPickerModalProps = {
  visible: boolean;
  selectedKey: string | null;
  onSelect: (key: string | null) => void;
  onClose: () => void;
};

type PickerItem =
  | {
      kind: "initials";
      key: typeof INITIALS_PICKER_KEY;
      value: null;
      label: "";
      searchValue: "";
    }
  | {
      kind: "service";
      key: string;
      value: string;
      label: string;
      entry: ServiceIconEntry;
      searchValue: string;
    };

const INITIALS_PICKER_ITEM: PickerItem = {
  kind: "initials",
  key: INITIALS_PICKER_KEY,
  value: null,
  label: "",
  searchValue: "",
};

const COLUMN_COUNT = 5;
const SHEET_HORIZONTAL_PADDING = 20;
const GRID_COLUMN_GAP = 8;
const GRID_ROW_GAP = 8;
const ICON_CELL_RADIUS = 12;
/** Плитка пикера: заметный светло-серый на белом sheet (не путать с surface2 на фоне экрана). */
const ICON_TILE_BG = {
  light: "#F1F5F9",
  lightSelected: "#E2E8F0",
  dark: "#1C1C2E",
  darkSelected: "#26263A",
} as const;

const normalizeQuery = (value: string): string => value.trim().toLowerCase();

export function IconPickerModal({
  visible,
  selectedKey,
  onSelect,
  onClose,
}: IconPickerModalProps) {
  const { t } = useTranslation();
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const keyboardHeight = useKeyboardHeight(visible);
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const inputRef = useRef<TextInput>(null);
  const rowInnerWidth = width - SHEET_HORIZONTAL_PADDING * 2;
  const itemWidth =
    (rowInnerWidth - GRID_COLUMN_GAP * (COLUMN_COUNT - 1)) / COLUMN_COUNT;
  const itemSize = Math.floor(itemWidth);
  const iconInnerSize = Math.max(20, Math.round(itemSize * 0.56));

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
      kind: "service",
      key: entry.key,
      value: entry.key,
      label: entry.label,
      entry,
      searchValue: `${entry.label} ${entry.aliases.join(" ")}`.toLowerCase(),
    }));

    if (!normalizedQuery) {
      return [INITIALS_PICKER_ITEM, ...serviceItems];
    }

    return serviceItems.filter((item) =>
      item.searchValue.includes(normalizedQuery),
    );
  }, [debouncedQuery]);

  const renderItem = ({ item }: ListRenderItemInfo<PickerItem>) => {
    const isSelected =
      item.kind === "initials" ? selectedKey === null : item.value === selectedKey;
    const accessibilityLabel =
      item.kind === "initials" ? t("iconPickerNoIcon") : item.label;
    const tileBackground = isSelected
      ? isDark
        ? ICON_TILE_BG.darkSelected
        : ICON_TILE_BG.lightSelected
      : isDark
        ? ICON_TILE_BG.dark
        : ICON_TILE_BG.light;

    return (
      <Pressable
        accessibilityLabel={accessibilityLabel}
        accessibilityRole="button"
        onPress={() => {
          onSelect(item.kind === "initials" ? null : item.value);
          onClose();
        }}
        style={({ pressed }) => [
          styles.itemPressable,
          {
            width: itemSize,
            height: itemSize,
            opacity: pressed ? 0.75 : 1,
          },
        ]}
      >
        <View
          style={[
            styles.iconTile,
            {
              width: itemSize,
              height: itemSize,
              borderRadius: ICON_CELL_RADIUS,
              backgroundColor: tileBackground,
            },
          ]}
        >
          {item.kind === "initials" ? (
            <Text style={[styles.initialsGlyph, { color: colors.textMuted, fontSize: iconInnerSize * 0.5 }]}>
              ?
            </Text>
          ) : (
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
              size={iconInnerSize}
            />
          )}
        </View>
        {/* TEMP: подписи под иконками скрыты
        <View style={styles.itemLabelWrap}>
          <Text
            ellipsizeMode="tail"
            numberOfLines={1}
            style={[styles.itemLabel, { color: colors.text }]}
          >
            {item.label || "\u00A0"}
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
          <FlatList
            columnWrapperStyle={styles.row}
            contentContainerStyle={[
              styles.listContent,
              { paddingBottom: keyboardHeight + 8 },
            ]}
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
    justifyContent: "space-between",
    marginBottom: GRID_ROW_GAP,
  },
  itemPressable: {
    minWidth: 0,
  },
  iconTile: {
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  initialsGlyph: {
    fontWeight: "700",
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
