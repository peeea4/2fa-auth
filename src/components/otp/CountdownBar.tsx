import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

type CountdownBarProps = {
  period: number;
  timeLeft: number;
  trackColor: string;
  fillColor: string;
};

export function CountdownBar({ period, timeLeft, trackColor, fillColor }: CountdownBarProps) {
  const trackWidth = useSharedValue(0);
  const fillRatio = useSharedValue(Math.min(1, Math.max(0, timeLeft / period)));

  useEffect(() => {
    fillRatio.value = withTiming(Math.min(1, Math.max(0, timeLeft / period)), { duration: 380 });
  }, [fillRatio, period, timeLeft]);

  const fillStyle = useAnimatedStyle(() => ({
    width: fillRatio.value * trackWidth.value,
  }));

  return (
    <View
      onLayout={(event) => {
        trackWidth.value = event.nativeEvent.layout.width;
      }}
      style={[styles.track, { backgroundColor: trackColor }]}
    >
      <Animated.View style={[styles.fill, { backgroundColor: fillColor }, fillStyle]} />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 2,
  },
});
