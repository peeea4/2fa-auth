import LottieView from 'lottie-react-native';
import { Platform, StyleSheet } from 'react-native';

const homeEmptySource = require('../../../assets/lottie/home-empty.json');

type HomeEmptyLottieProps = {
  size?: number;
};

export function HomeEmptyLottie({ size = 200 }: HomeEmptyLottieProps) {
  if (Platform.OS === 'web') {
    return null;
  }

  return (
    <LottieView
      autoPlay
      loop
      source={homeEmptySource}
      style={[styles.animation, { width: size, height: size }]}
    />
  );
}

const styles = StyleSheet.create({
  animation: {
    alignSelf: 'center',
  },
});
