import * as Crypto from 'expo-crypto';
import { CameraView, useCameraPermissions, type BarcodeScanningResult } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { X } from 'lucide-react-native';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Alert,
  Dimensions,
  Linking,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '../../components/ui/Button';
import { usePremium } from '../../hooks/usePremium';
import { useTheme } from '../../hooks/useTheme';
import { matchIssuerToIcon } from '../../services/icon-matching.service';
import { otpService, type ParsedOtpAuthUri } from '../../services/otp.service';
import { storageService } from '../../services/storage.service';
import { useOtpStore } from '../../stores';

function createEntryId(): string {
  const bytes = Crypto.getRandomBytes(16);
  const hex = Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`;
}

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

const CUTOUT_TOLERANCE_PX = 6;
const MIN_BBOX_OVERLAP_RATIO = 0.7;

type CutoutLayout = {
  cutoutTop: number;
  cutoutSize: number;
  cutoutLeft: number;
  header: number;
};

type BarcodeRect = {
  left: number;
  top: number;
  right: number;
  bottom: number;
  area: number;
  centerX: number;
  centerY: number;
};

function rectFromCornerPoints(points: { x: number; y: number }[]): BarcodeRect | null {
  if (!points.length) {
    return null;
  }
  let minX = points[0].x;
  let maxX = points[0].x;
  let minY = points[0].y;
  let maxY = points[0].y;
  for (let i = 1; i < points.length; i += 1) {
    const { x, y } = points[i];
    minX = Math.min(minX, x);
    maxX = Math.max(maxX, x);
    minY = Math.min(minY, y);
    maxY = Math.max(maxY, y);
  }
  const width = maxX - minX;
  const height = maxY - minY;
  if (width <= 0 || height <= 0) {
    return null;
  }
  return {
    left: minX,
    top: minY,
    right: maxX,
    bottom: maxY,
    area: width * height,
    centerX: (minX + maxX) / 2,
    centerY: (minY + maxY) / 2,
  };
}

function rectFromBounds(bounds: BarcodeScanningResult['bounds']): BarcodeRect | null {
  const w = bounds.size?.width ?? 0;
  const h = bounds.size?.height ?? 0;
  if (w <= 0 || h <= 0) {
    return null;
  }
  const left = bounds.origin.x;
  const top = bounds.origin.y;
  return {
    left,
    top,
    right: left + w,
    bottom: top + h,
    area: w * h,
    centerX: left + w / 2,
    centerY: top + h / 2,
  };
}

function getBarcodeRect(result: BarcodeScanningResult): BarcodeRect | null {
  const fromCorners = result.cornerPoints?.length ? rectFromCornerPoints(result.cornerPoints) : null;
  if (fromCorners) {
    return fromCorners;
  }
  return rectFromBounds(result.bounds);
}

function intersectionArea(a: BarcodeRect, cut: CutoutLayout): number {
  const cutL = cut.cutoutLeft;
  const cutT = cut.cutoutTop;
  const cutR = cut.cutoutLeft + cut.cutoutSize;
  const cutB = cut.cutoutTop + cut.cutoutSize;
  const ix0 = Math.max(a.left, cutL);
  const iy0 = Math.max(a.top, cutT);
  const ix1 = Math.min(a.right, cutR);
  const iy1 = Math.min(a.bottom, cutB);
  if (ix1 <= ix0 || iy1 <= iy0) {
    return 0;
  }
  return (ix1 - ix0) * (iy1 - iy0);
}

/** Center inside cutout (± tolerance); ≥70% of barcode bbox area overlaps strict cutout. */
function isInsideCutout(result: BarcodeScanningResult, cut: CutoutLayout): boolean {
  const rect = getBarcodeRect(result);
  if (!rect || rect.area <= 0) {
    return true;
  }
  const tol = CUTOUT_TOLERANCE_PX;
  const cxOk =
    rect.centerX >= cut.cutoutLeft - tol &&
    rect.centerX <= cut.cutoutLeft + cut.cutoutSize + tol &&
    rect.centerY >= cut.cutoutTop - tol &&
    rect.centerY <= cut.cutoutTop + cut.cutoutSize + tol;
  if (!cxOk) {
    return false;
  }
  const overlap = intersectionArea(rect, cut);
  return overlap / rect.area >= MIN_BBOX_OVERLAP_RATIO;
}

export default function ScanQrScreen() {
  const { t } = useTranslation();
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const upsertEntry = useOtpStore((state) => state.upsertEntry);
  const { canScanQr, canAddCode, syncSubscriptionStatus } = usePremium();
  const [permission, requestPermission] = useCameraPermissions();
  const handledRef = useRef(false);
  const [scanError, setScanError] = useState<string | null>(null);

  const cutoutLayout = useMemo(() => {
    const header = insets.top + 44;
    const gap = 20;
    const cutoutTop = header + gap;
    const cutoutSize = Math.min(SCREEN_W - 48, Math.min(280, SCREEN_H * 0.38));
    const cutoutLeft = (SCREEN_W - cutoutSize) / 2;
    return { cutoutTop, cutoutSize, cutoutLeft, header };
  }, [insets.top]);

  const frameAccent = useSharedValue(0);
  const warningColorShared = useSharedValue(colors.warning);

  useEffect(() => {
    warningColorShared.value = colors.warning;
  }, [colors.warning, warningColorShared]);

  const pulseFrameOutOfBounds = useCallback(() => {
    frameAccent.value = withSequence(
      withTiming(1, { duration: 100 }),
      withTiming(0, { duration: 100 }),
    );
  }, [frameAccent]);

  const frameAnimatedStyle = useAnimatedStyle(() => ({
    borderColor: interpolateColor(frameAccent.value, [0, 1], [FRAME, warningColorShared.value]),
  }));

  useEffect(() => {
    void syncSubscriptionStatus();
  }, [syncSubscriptionStatus]);

  const handleClose = useCallback(() => {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.dismissTo('/(tabs)');
  }, []);

  const persistParsed = useCallback(
    async (parsed: ParsedOtpAuthUri) => {
      if (!otpService.validateTotpSetup(parsed.secret, parsed.algorithm, parsed.digits, parsed.period)) {
        setScanError(t('scanInvalidQr'));
        handledRef.current = false;
        return;
      }

      const id = createEntryId();
      const matchedIcon = matchIssuerToIcon(parsed.issuer);
      await storageService.setOtpSecret(id, parsed.secret);
      upsertEntry({
        id,
        issuer: parsed.issuer,
        account: parsed.account,
        algorithm: parsed.algorithm,
        digits: parsed.digits,
        period: 30,
        type: 'totp',
        counter: undefined,
        iconKey: matchedIcon?.key,
        iconSource: matchedIcon ? 'service' : 'initials',
        color: matchedIcon ? `#${matchedIcon.hex}` : undefined,
        createdAt: Date.now(),
      });
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.dismissTo('/(tabs)');
    },
    [t, upsertEntry],
  );

  const onBarcodeScanned = useCallback(
    (result: BarcodeScanningResult) => {
      if (handledRef.current) {
        return;
      }

      if (!isInsideCutout(result, cutoutLayout)) {
        pulseFrameOutOfBounds();
        return;
      }

      const raw = result.data.trim();
      if (!raw.toLowerCase().startsWith('otpauth://')) {
        return;
      }

      setScanError(null);

      try {
        const parsed = otpService.parseOtpAuthUri(raw);
        if (!canAddCode) {
          handledRef.current = true;
          Alert.alert(t('scanLimitTitle'), t('scanLimitMessage'), [
            { text: t('cancel'), style: 'cancel', onPress: () => (handledRef.current = false) },
            { text: t('upgrade'), onPress: () => router.push('/paywall') },
          ]);
          return;
        }

        handledRef.current = true;
        void persistParsed(parsed).catch(() => {
          handledRef.current = false;
          setScanError(t('errorSaveFailed'));
        });
      } catch {
        setScanError(t('scanInvalidQr'));
      }
    },
    [canAddCode, cutoutLayout, persistParsed, pulseFrameOutOfBounds, t],
  );

  if (!canScanQr) {
    return (
      <View style={[styles.gateRoot, { backgroundColor: colors.background, paddingTop: insets.top + 12 }]}>
        <StatusBar style={isDark ? 'light' : 'dark'} />
        <View style={styles.gateHeader}>
          <Pressable accessibilityRole="button" hitSlop={12} onPress={handleClose} style={styles.iconBtn}>
            <X color={colors.text} size={26} strokeWidth={2.2} />
          </Pressable>
        </View>
        <View style={styles.gateBody}>
          <Text style={[styles.gateTitle, { color: colors.text }]}>{t('scanPremiumGateTitle')}</Text>
          <Text style={[styles.gateSubtitle, { color: colors.textMuted }]}>{t('scanPremiumGateBody')}</Text>
          <Button onPress={() => router.push('/paywall')} title={t('upgrade')} />
        </View>
      </View>
    );
  }

  if (!permission?.granted) {
    const denied = permission?.status === 'denied' && !permission.canAskAgain;
    return (
      <View style={[styles.gateRoot, { backgroundColor: colors.background, paddingTop: insets.top + 12 }]}>
        <StatusBar style={isDark ? 'light' : 'dark'} />
        <View style={styles.gateHeader}>
          <Pressable accessibilityRole="button" hitSlop={12} onPress={handleClose} style={styles.iconBtn}>
            <X color={colors.text} size={26} strokeWidth={2.2} />
          </Pressable>
        </View>
        <View style={styles.gateBody}>
          <Text style={[styles.gateTitle, { color: colors.text }]}>{t('scanCameraPermissionTitle')}</Text>
          <Text style={[styles.gateSubtitle, { color: colors.textMuted }]}>{t('scanCameraPermissionBody')}</Text>
          {denied ? (
            <Button onPress={() => void Linking.openSettings()} title={t('scanOpenSettings')} />
          ) : (
            <Button onPress={() => void requestPermission()} title={t('scanGrantCamera')} />
          )}
        </View>
      </View>
    );
  }

  const { cutoutTop, cutoutSize, cutoutLeft, header } = cutoutLayout;

  return (
    <View style={styles.cameraRoot}>
      <StatusBar style="light" />
      <CameraView
        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
        facing="back"
        onBarcodeScanned={onBarcodeScanned}
        style={StyleSheet.absoluteFill}
      />

      <View pointerEvents="box-none" style={StyleSheet.absoluteFill}>
        <View style={{ height: cutoutTop, backgroundColor: OVERLAY }} />
        <View style={{ flexDirection: 'row', height: cutoutSize }}>
          <View style={{ flex: 1, backgroundColor: OVERLAY }} />
          <View style={{ width: cutoutSize }} />
          <View style={{ flex: 1, backgroundColor: OVERLAY }} />
        </View>
        <View style={{ flex: 1, backgroundColor: OVERLAY }} />
      </View>

      <Animated.View
        pointerEvents="none"
        style={[
          styles.cutoutFrame,
          {
            top: cutoutTop,
            left: cutoutLeft,
            width: cutoutSize,
            height: cutoutSize,
          },
          frameAnimatedStyle,
        ]}
      />

      <View pointerEvents="box-none" style={[styles.topBar, { paddingTop: insets.top, height: header }]}>
        <Pressable
          accessibilityLabel={t('close')}
          accessibilityRole="button"
          hitSlop={14}
          onPress={handleClose}
          style={styles.closeFab}
        >
          <X color="#FFFFFF" size={24} strokeWidth={2.2} />
        </Pressable>
      </View>

      <View
        pointerEvents="none"
        style={[styles.hintWrap, { bottom: insets.bottom + 28 }]}
      >
        {scanError ? (
          <Text style={styles.hintError}>{scanError}</Text>
        ) : (
          <Text style={styles.hint}>{t('scanAlignHint')}</Text>
        )}
      </View>
    </View>
  );
}

const OVERLAY = 'rgba(0,0,0,0.55)';
const FRAME = 'rgba(255,255,255,0.95)';

const styles = StyleSheet.create({
  cameraRoot: {
    flex: 1,
    backgroundColor: '#000000',
  },
  gateRoot: {
    flex: 1,
  },
  gateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  iconBtn: {
    padding: 8,
  },
  gateBody: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
    gap: 16,
  },
  gateTitle: {
    fontSize: 22,
    fontWeight: '700',
  },
  gateSubtitle: {
    fontSize: 16,
    lineHeight: 22,
  },
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  closeFab: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cutoutFrame: {
    position: 'absolute',
    borderWidth: 2,
    borderRadius: 16,
  },
  hintWrap: {
    position: 'absolute',
    left: 24,
    right: 24,
    alignItems: 'center',
  },
  hint: {
    color: 'rgba(255,255,255,0.92)',
    fontSize: 15,
    fontWeight: '500',
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  hintError: {
    color: '#FECACA',
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
  },
});
