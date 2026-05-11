import type { LucideIcon } from 'lucide-react-native';
import { Copy, QrCode, ShieldCheck, Sparkles } from 'lucide-react-native';
import { useCallback, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import Animated, {
  Extrapolation,
  interpolate,
  type SharedValue,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated';

import { useTheme } from '../../hooks/useTheme';
import { Button } from '../ui/Button';

type SlideDef = {
  key: string;
  titleKey: string;
  subtitleKey: string;
  Icon: LucideIcon;
};

const SLIDES: SlideDef[] = [
  {
    key: 'secure',
    titleKey: 'onboarding.slide1Title',
    subtitleKey: 'onboarding.slide1Subtitle',
    Icon: ShieldCheck,
  },
  {
    key: 'add',
    titleKey: 'onboarding.slide2Title',
    subtitleKey: 'onboarding.slide2Subtitle',
    Icon: QrCode,
  },
  {
    key: 'copy',
    titleKey: 'onboarding.slide3Title',
    subtitleKey: 'onboarding.slide3Subtitle',
    Icon: Copy,
  },
  {
    key: 'premium',
    titleKey: 'onboarding.slide4Title',
    subtitleKey: 'onboarding.slide4Subtitle',
    Icon: Sparkles,
  },
];

type PaginationDotProps = {
  index: number;
  scrollX: SharedValue<number>;
  slideWidth: number;
};

function PaginationDot({ index, scrollX, slideWidth }: PaginationDotProps) {
  const { colors } = useTheme();

  const animatedStyle = useAnimatedStyle(() => {
    const inputRange = [(index - 1) * slideWidth, index * slideWidth, (index + 1) * slideWidth];
    const scale = interpolate(scrollX.value, inputRange, [0.85, 1.15, 0.85], Extrapolation.CLAMP);
    const opacity = interpolate(scrollX.value, inputRange, [0.35, 1, 0.35], Extrapolation.CLAMP);
    const width = interpolate(scrollX.value, inputRange, [8, 22, 8], Extrapolation.CLAMP);

    return {
      opacity,
      width,
      transform: [{ scaleY: scale }],
    };
  });

  return (
    <Animated.View
      style={[
        styles.dot,
        { backgroundColor: colors.primary },
        animatedStyle,
      ]}
    />
  );
}

type SlidePanelProps = {
  index: number;
  slideWidth: number;
  scrollX: SharedValue<number>;
  title: string;
  subtitle: string;
  Icon: LucideIcon;
  iconColor: string;
  mutedColor: string;
  codePreview?: string;
};

function SlidePanel({
  index,
  slideWidth,
  scrollX,
  title,
  subtitle,
  Icon,
  iconColor,
  mutedColor,
  codePreview,
}: SlidePanelProps) {
  const contentStyle = useAnimatedStyle(() => {
    const inputRange = [(index - 1) * slideWidth, index * slideWidth, (index + 1) * slideWidth];
    const opacity = interpolate(scrollX.value, inputRange, [0.3, 1, 0.3], Extrapolation.CLAMP);
    const translateY = interpolate(scrollX.value, inputRange, [16, 0, 16], Extrapolation.CLAMP);

    return {
      opacity,
      transform: [{ translateY }],
    };
  });

  return (
    <View style={[styles.slide, { width: slideWidth }]}>
      <Animated.View style={[styles.slideInner, contentStyle]}>
        <View style={[styles.iconWrap, { backgroundColor: `${iconColor}18` }]}>
          <Icon color={iconColor} size={44} strokeWidth={1.75} />
        </View>
        <Text style={[styles.title, { color: iconColor }]}>{title}</Text>
        <Text style={[styles.subtitle, { color: mutedColor }]}>{subtitle}</Text>
        {codePreview ? (
          <View style={[styles.codePreviewWrap, { backgroundColor: `${iconColor}14` }]}>
            <Text style={[styles.codePreview, { color: iconColor }]}>{codePreview}</Text>
          </View>
        ) : null}
      </Animated.View>
    </View>
  );
}

type OnboardingSliderProps = {
  onComplete: () => void;
  onAddFirstAccount: () => void;
};

export function OnboardingSlider({ onComplete, onAddFirstAccount }: OnboardingSliderProps) {
  const { width: slideWidth } = useWindowDimensions();
  const { t } = useTranslation();
  const { colors } = useTheme();
  const scrollX = useSharedValue(0);
  const scrollRef = useRef<Animated.ScrollView>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const lastIndex = SLIDES.length - 1;

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollX.value = event.contentOffset.x;
    },
  });

  const onMomentumScrollEnd = useCallback(
    (event: { nativeEvent: { contentOffset: { x: number } } }) => {
      const nextIndex = Math.round(event.nativeEvent.contentOffset.x / slideWidth);
      setActiveIndex(Math.min(Math.max(nextIndex, 0), lastIndex));
    },
    [lastIndex, slideWidth],
  );

  const goToIndex = useCallback(
    (index: number) => {
      scrollRef.current?.scrollTo({ x: index * slideWidth, animated: true });
    },
    [slideWidth],
  );

  const handlePrimary = useCallback(() => {
    if (activeIndex >= lastIndex) {
      onComplete();
      return;
    }
    goToIndex(activeIndex + 1);
  }, [activeIndex, goToIndex, lastIndex, onComplete]);

  const iconTint = colors.primary;
  const muted = colors.textMuted;

  const slideNodes = useMemo(
    () =>
      SLIDES.map((slide, index) => (
        <SlidePanel
          Icon={slide.Icon}
          index={index}
          key={slide.key}
          mutedColor={muted}
          iconColor={iconTint}
          scrollX={scrollX}
          slideWidth={slideWidth}
          subtitle={t(slide.subtitleKey)}
          title={t(slide.titleKey)}
          codePreview={slide.key === 'secure' ? '248 091' : undefined}
        />
      )),
    [iconTint, muted, scrollX, slideWidth, t],
  );

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={styles.topBar}>
        <Pressable
          accessibilityRole="button"
          hitSlop={12}
          onPress={onComplete}
          style={({ pressed }) => [styles.skip, { opacity: pressed ? 0.6 : 1 }]}
        >
          <Text style={[styles.skipLabel, { color: colors.textMuted }]}>{t('onboarding.skip')}</Text>
        </Pressable>
      </View>

      <Animated.ScrollView
        contentContainerStyle={styles.scrollContent}
        decelerationRate="fast"
        horizontal
        onMomentumScrollEnd={onMomentumScrollEnd}
        onScroll={scrollHandler}
        pagingEnabled
        ref={scrollRef}
        scrollEventThrottle={16}
        showsHorizontalScrollIndicator={false}
      >
        {slideNodes}
      </Animated.ScrollView>

      <View style={styles.footer}>
        <View style={styles.dotsRow}>
          {SLIDES.map((slide, index) => (
            <PaginationDot index={index} key={slide.key} scrollX={scrollX} slideWidth={slideWidth} />
          ))}
        </View>

        <Button
          onPress={handlePrimary}
          size="lg"
          title={activeIndex >= lastIndex ? t('onboarding.getStarted') : t('onboarding.next')}
          variant="primary"
        />
        {activeIndex >= lastIndex ? (
          <Button onPress={onAddFirstAccount} size="lg" title={t('onboarding.addFirstAccount')} variant="secondary" />
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 4,
  },
  skip: {
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  skipLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  scrollContent: {
    alignItems: 'stretch',
  },
  slide: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  slideInner: {
    gap: 16,
    alignItems: 'center',
  },
  iconWrap: {
    width: 96,
    height: 96,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 17,
    lineHeight: 24,
    textAlign: 'center',
  },
  codePreviewWrap: {
    marginTop: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  codePreview: {
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: 2,
    fontVariant: ['tabular-nums'],
  },
  footer: {
    paddingHorizontal: 20,
    paddingBottom: 12,
    gap: 20,
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
});
