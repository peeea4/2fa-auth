import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
  type ListRenderItemInfo,
} from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { SERVICE_REGISTRY, type ServiceIconEntry } from '../../constants/service-registry';
import { useTheme } from '../../hooks/useTheme';
import { ServiceIcon } from './ServiceIcon';

type IconPickerModalProps = {
  visible: boolean;
  selectedKey: string | null;
  onSelect: (key: string | null) => void;
  onClose: () => void;
};

type PickerItem =
  {
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

export function IconPickerModal({ visible, selectedKey, onSelect, onClose }: IconPickerModalProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const translateY = useSharedValue(420);
  const overlayOpacity = useSharedValue(0);
  const availableGridWidth = width - SHEET_HORIZONTAL_PADDING * 2 - GRID_COLUMN_GAP * (COLUMN_COUNT - 1);
  const itemWidth = Math.floor(availableGridWidth / COLUMN_COUNT);
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

    setQuery('');
    setDebouncedQuery('');
  }, [visible]);

  useEffect(() => {
    translateY.value = withTiming(visible ? 0 : 420, { duration: 220 });
    overlayOpacity.value = withTiming(visible ? 1 : 0, { duration: 220 });
  }, [overlayOpacity, translateY, visible]);

  const overlayStyle = useAnimatedStyle(() => ({
    opacity: overlayOpacity.value * 0.35,
  }));

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const items = useMemo<PickerItem[]>(() => {
    const normalizedQuery = normalizeQuery(debouncedQuery);
    const serviceItems: PickerItem[] = SERVICE_REGISTRY.map((entry) => ({
      key: entry.key,
      value: entry.key,
      label: entry.label,
      entry,
      searchValue: `${entry.label} ${entry.aliases.join(' ')}`.toLowerCase(),
    }));

    if (!normalizedQuery) {
      return serviceItems;
    }

    return serviceItems.filter((item) => item.searchValue.includes(normalizedQuery));
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
        style={({ pressed }) => [
          styles.itemCell,
          {
            borderColor: isSelected ? colors.primary : 'transparent',
            backgroundColor: colors.background,
            opacity: pressed ? 0.75 : 1,
            width: itemWidth,
            height: itemHeight,
          },
        ]}
      >
        <View style={styles.iconContainer}>
          <View style={styles.iconWrap}>
            <ServiceIcon
              entry={{
                id: `icon-picker-${item.entry.key}`,
                issuer: item.entry.label,
                account: item.entry.label,
                algorithm: 'SHA1',
                digits: 6,
                period: 30,
                createdAt: 0,
                iconKey: item.entry.key,
                iconSource: 'service',
              }}
              size={30}
            />
          </View>
        </View>
        <Text numberOfLines={1} style={[styles.itemLabel, { color: colors.text }]}>
          {item.label}
        </Text>
      </Pressable>
    );
  };

  return (
    <Modal animationType="none" transparent visible={visible} onRequestClose={onClose}>
      <View style={styles.root}>
        <Animated.View style={[styles.overlay, overlayStyle]}>
          <Pressable style={styles.overlayPressable} onPress={onClose} />
        </Animated.View>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={0}
          style={styles.keyboardAvoiding}
        >
          <Animated.View
            style={[
              styles.sheet,
              sheetStyle,
              {
                backgroundColor: colors.surface,
                paddingBottom: Math.max(insets.bottom, 16),
              },
            ]}
          >
            <View style={[styles.handle, { backgroundColor: colors.border }]} />
            <Text style={[styles.title, { color: colors.text }]}>{t('iconPickerTitle')}</Text>
            <TextInput
              autoCapitalize="none"
              autoCorrect={false}
              autoFocus
              onChangeText={setQuery}
              placeholder={t('iconPickerSearch')}
              placeholderTextColor={colors.textMuted}
              style={[
                styles.searchInput,
                { borderColor: colors.border, color: colors.text, backgroundColor: colors.background },
              ]}
              value={query}
            />
            <Pressable
              accessibilityLabel={t('iconPickerNoIcon')}
              accessibilityRole="button"
              onPress={() => {
                onSelect(null);
                onClose();
              }}
              style={({ pressed }) => [
                styles.noIconRow,
                {
                  borderColor: selectedKey === null ? colors.primary : colors.border,
                  backgroundColor: colors.background,
                  opacity: pressed ? 0.75 : 1,
                },
              ]}
            >
              <View style={[styles.noIconWrap, { borderColor: colors.border, backgroundColor: colors.surface }]}>
                <Text style={[styles.noIconGlyph, { color: colors.textMuted }]}>X</Text>
              </View>
              <Text style={[styles.noIconLabel, { color: colors.text }]}>{t('iconPickerNoIcon')}</Text>
            </Pressable>

            <FlatList
              columnWrapperStyle={styles.row}
              contentContainerStyle={styles.listContent}
              data={items}
              keyExtractor={(item) => item.key}
              keyboardShouldPersistTaps="handled"
              numColumns={COLUMN_COUNT}
              renderItem={renderItem}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={
                <Text style={[styles.emptyText, { color: colors.textMuted }]}>{t('iconPickerNoMatch')}</Text>
              }
            />
          </Animated.View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000000',
  },
  overlayPressable: {
    flex: 1,
  },
  keyboardAvoiding: {
    flex: 1,
    width: '100%',
    justifyContent: 'flex-end',
  },
  sheet: {
    maxHeight: '80%',
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    paddingHorizontal: SHEET_HORIZONTAL_PADDING,
    paddingTop: 10,
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    marginBottom: 14,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
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
    rowGap: GRID_ROW_GAP,
  },
  row: {
    columnGap: GRID_COLUMN_GAP,
  },
  itemCell: {
    borderRadius: 12,
    borderWidth: 2,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  iconContainer: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrap: {
    width: 38,
    height: 38,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
    gap: 10,
  },
  noIconWrap: {
    width: 30,
    height: 30,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noIconGlyph: {
    fontSize: 16,
    fontWeight: '700',
  },
  noIconLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  itemLabel: {
    fontSize: 10,
    fontWeight: '500',
    textAlign: 'center',
    width: '90%',
    lineHeight: 12,
  },
  emptyText: {
    textAlign: 'center',
    paddingVertical: 20,
    fontSize: 14,
  },
});
