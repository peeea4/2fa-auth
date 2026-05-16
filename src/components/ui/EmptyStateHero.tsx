import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { DownloadCloud, Keyboard, QrCode, ShieldCheck, WifiOff } from 'lucide-react-native';
import { useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, Defs, G, LinearGradient, Path, Rect, Stop } from 'react-native-svg';

import { usePremium } from '../../hooks/usePremium';
import { useTheme } from '../../hooks/useTheme';
import { Button } from './Button';
import { PremiumBadge } from './PremiumBadge';

const ILLUSTRATION_SIZE = 200;
const RING_PERIOD_MS = 30_000;
const PULSE_DURATION_MS = 1_800;

const SHIELD_PATH =
  'M100 30 L152 52 V102 C152 132 130 156 100 168 C70 156 48 132 48 102 V52 Z';

const QR_CELLS = [
  { x: 78, y: 78, filled: true },
  { x: 92, y: 78, filled: false },
  { x: 106, y: 78, filled: true },
  { x: 78, y: 92, filled: false },
  { x: 92, y: 92, filled: true },
  { x: 106, y: 92, filled: false },
  { x: 78, y: 106, filled: true },
  { x: 92, y: 106, filled: false },
  { x: 106, y: 106, filled: true },
];

type ParticleSpec = {
  cx: number;
  cy: number;
  r: number;
  driftX: number;
  driftY: number;
  duration: number;
};

const PARTICLES: ParticleSpec[] = [
  { cx: 36, cy: 52, r: 4, driftX: 6, driftY: -8, duration: 4200 },
  { cx: 168, cy: 64, r: 3, driftX: -5, driftY: 7, duration: 3800 },
  { cx: 28, cy: 138, r: 3.5, driftX: 8, driftY: 5, duration: 5100 },
  { cx: 172, cy: 148, r: 4, driftX: -7, driftY: -6, duration: 4600 },
];

function useParticleDrift(particle: ParticleSpec) {
  const offsetX = useSharedValue(0);
  const offsetY = useSharedValue(0);

  useEffect(() => {
    offsetX.value = withRepeat(
      withSequence(
        withTiming(particle.driftX, {
          duration: particle.duration / 2,
          easing: Easing.inOut(Easing.ease),
        }),
        withTiming(0, { duration: particle.duration / 2, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      false,
    );
    offsetY.value = withRepeat(
      withSequence(
        withTiming(particle.driftY, {
          duration: particle.duration / 2,
          easing: Easing.inOut(Easing.ease),
        }),
        withTiming(0, { duration: particle.duration / 2, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      false,
    );
  }, [offsetX, offsetY, particle.driftX, particle.driftY, particle.duration]);

  return useAnimatedStyle(() => ({
    transform: [{ translateX: offsetX.value }, { translateY: offsetY.value }],
  }));
}

type FeatureKey = 'privacy' | 'offline' | 'backup';

const FEATURE_CONFIG: Record<
  FeatureKey,
  { icon: typeof ShieldCheck; titleKey: string; hintKey: string; route?: '/backup' }
> = {
  privacy: {
    icon: ShieldCheck,
    titleKey: 'emptyHero.featurePrivacyTitle',
    hintKey: 'emptyHero.featurePrivacyHint',
  },
  offline: {
    icon: WifiOff,
    titleKey: 'emptyHero.featureOfflineTitle',
    hintKey: 'emptyHero.featureOfflineHint',
  },
  backup: {
    icon: DownloadCloud,
    titleKey: 'emptyHero.featureBackupTitle',
    hintKey: 'emptyHero.featureBackupHint',
    route: '/backup',
  },
};

function HeroIllustration() {
  const { colors, isDark } = useTheme();
  const ringRotation = useSharedValue(0);
  const pulseScale = useSharedValue(1);
  const particleStyle0 = useParticleDrift(PARTICLES[0]);
  const particleStyle1 = useParticleDrift(PARTICLES[1]);
  const particleStyle2 = useParticleDrift(PARTICLES[2]);
  const particleStyle3 = useParticleDrift(PARTICLES[3]);
  const particleStyles = [particleStyle0, particleStyle1, particleStyle2, particleStyle3];

  useEffect(() => {
    ringRotation.value = withRepeat(
      withTiming(360, { duration: RING_PERIOD_MS, easing: Easing.linear }),
      -1,
      false,
    );
    pulseScale.value = withRepeat(
      withSequence(
        withTiming(1.04, { duration: PULSE_DURATION_MS / 2, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: PULSE_DURATION_MS / 2, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      false,
    );
  }, [pulseScale, ringRotation]);

  const ringStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${ringRotation.value}deg` }],
  }));

  const shieldStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));

  const ringColor = colors.primary;
  const shieldFillTop = isDark ? colors.surface2 : colors.surface;
  const shieldFillBottom = colors.primary;
  const qrFilled = colors.primary;
  const qrEmpty = isDark ? colors.border : colors.surface2;
  const particleColor = `${colors.primary}66`;

  return (
    <View style={styles.illustrationWrap}>
      {PARTICLES.map((particle, index) => (
        <Animated.View
          key={`particle-${index}`}
          style={[
            styles.particle,
            {
              left: particle.cx - particle.r,
              top: particle.cy - particle.r,
              width: particle.r * 2,
              height: particle.r * 2,
              borderRadius: particle.r,
              backgroundColor: particleColor,
            },
            particleStyles[index],
          ]}
        />
      ))}

      <Animated.View style={[styles.ringLayer, ringStyle]}>
        <Svg height={ILLUSTRATION_SIZE} viewBox="0 0 200 200" width={ILLUSTRATION_SIZE}>
          <Circle
            cx={100}
            cy={100}
            fill="none"
            r={78}
            stroke={ringColor}
            strokeDasharray="42 18"
            strokeLinecap="round"
            strokeWidth={3.5}
            opacity={0.85}
          />
        </Svg>
      </Animated.View>

      <Animated.View style={[styles.shieldLayer, shieldStyle]}>
        <Svg height={ILLUSTRATION_SIZE} viewBox="0 0 200 200" width={ILLUSTRATION_SIZE}>
          <Defs>
            <LinearGradient id="heroShieldGrad" x1="100" x2="100" y1="30" y2="168">
              <Stop offset="0" stopColor={shieldFillTop} />
              <Stop offset="1" stopColor={shieldFillBottom} stopOpacity={0.35} />
            </LinearGradient>
          </Defs>
          <G>
            <Path d={SHIELD_PATH} fill="url(#heroShieldGrad)" stroke={colors.border} strokeWidth={1.5} />
            {QR_CELLS.map((cell) => (
              <Rect
                key={`${cell.x}-${cell.y}`}
                fill={cell.filled ? qrFilled : qrEmpty}
                height={10}
                opacity={cell.filled ? 0.95 : 0.55}
                rx={2}
                width={10}
                x={cell.x}
                y={cell.y}
              />
            ))}
          </G>
        </Svg>
      </Animated.View>
    </View>
  );
}

type FeatureCardProps = {
  featureKey: FeatureKey;
  onPress?: () => void;
};

function FeatureCard({ featureKey, onPress }: FeatureCardProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const config = FEATURE_CONFIG[featureKey];
  const Icon = config.icon;

  const content = (
    <>
      <View
        style={[
          styles.featureIconWrap,
          { borderColor: colors.border, backgroundColor: colors.background },
        ]}
      >
        <Icon color={colors.primary} size={18} strokeWidth={2.2} />
      </View>
      <Text numberOfLines={2} style={[styles.featureTitle, { color: colors.text }]}>
        {t(config.titleKey)}
      </Text>
      <Text numberOfLines={3} style={[styles.featureHint, { color: colors.textMuted }]}>
        {t(config.hintKey)}
      </Text>
    </>
  );

  if (onPress) {
    return (
      <Pressable
        accessibilityRole="button"
        onPress={onPress}
        onPressIn={() => {
          void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }}
        style={({ pressed }) => [
          styles.featureCard,
          {
            borderColor: colors.border,
            backgroundColor: colors.surface,
            opacity: pressed ? 0.92 : 1,
          },
        ]}
      >
        {content}
      </Pressable>
    );
  }

  return (
    <View
      style={[
        styles.featureCard,
        { borderColor: colors.border, backgroundColor: colors.surface },
      ]}
    >
      {content}
    </View>
  );
}

export function EmptyStateHero() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { canAddCode, canScanQr } = usePremium();

  const openPaywall = useCallback(() => {
    router.push('/paywall');
  }, []);

  const handleScanQr = useCallback(() => {
    if (canScanQr) {
      router.push('/add/scan');
      return;
    }
    openPaywall();
  }, [canScanQr, openPaywall]);

  const handleManualEntry = useCallback(() => {
    if (canAddCode) {
      router.push('/add/manual');
      return;
    }
    openPaywall();
  }, [canAddCode, openPaywall]);

  const handleBackupFeature = useCallback(() => {
    router.push('/backup');
  }, []);

  return (
    <ScrollView
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
      style={styles.scroll}
    >
      <HeroIllustration />

      <Text style={[styles.heroTitle, { color: colors.text }]}>{t('emptyHero.title')}</Text>
      <Text style={[styles.heroSubtitle, { color: colors.textMuted }]}>{t('emptyHero.subtitle')}</Text>

      <View style={styles.ctaGroup}>
        <View style={styles.ctaRow}>
          <Button
            leftIcon={<QrCode color="#ffffff" size={20} strokeWidth={2.4} />}
            onPress={handleScanQr}
            size="lg"
            title={t('scanQr')}
          />
          {!canScanQr ? (
            <View style={styles.ctaBadge}>
              <PremiumBadge label={t('premium')} />
            </View>
          ) : null}
        </View>
        <View style={styles.ctaRow}>
          <Button
            leftIcon={<Keyboard color={colors.text} size={20} strokeWidth={2.4} />}
            onPress={handleManualEntry}
            size="lg"
            title={t('manualEntry')}
            variant="secondary"
          />
          {!canAddCode ? (
            <View style={styles.ctaBadge}>
              <PremiumBadge label={t('premium')} />
            </View>
          ) : null}
        </View>
      </View>

      <View style={styles.featureRow}>
        <FeatureCard featureKey="privacy" />
        <FeatureCard featureKey="offline" />
        <FeatureCard featureKey="backup" onPress={handleBackupFeature} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: 'center',
    paddingTop: 8,
    paddingBottom: 28,
    gap: 12,
  },
  illustrationWrap: {
    width: ILLUSTRATION_SIZE,
    height: ILLUSTRATION_SIZE,
    marginBottom: 4,
  },
  ringLayer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shieldLayer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  particle: {
    position: 'absolute',
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    paddingHorizontal: 8,
  },
  heroSubtitle: {
    fontSize: 16,
    lineHeight: 23,
    textAlign: 'center',
    paddingHorizontal: 12,
    marginBottom: 4,
  },
  ctaGroup: {
    width: '100%',
    gap: 10,
    marginTop: 4,
  },
  ctaRow: {
    width: '100%',
    position: 'relative',
  },
  ctaBadge: {
    position: 'absolute',
    top: 10,
    right: 12,
  },
  featureRow: {
    width: '100%',
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  featureCard: {
    flex: 1,
    minWidth: 0,
    borderWidth: 1,
    borderRadius: 14,
    padding: 10,
    gap: 6,
    alignItems: 'flex-start',
  },
  featureIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureTitle: {
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 16,
  },
  featureHint: {
    fontSize: 11,
    lineHeight: 15,
  },
});
