import { Platform } from 'react-native';

/**
 * Copies text without a static `expo-clipboard` import so the OTP list can load
 * when the dev client was built before `expo-clipboard` was added (rebuild fixes native copy).
 */
export async function copyTextToClipboard(text: string): Promise<boolean> {
  if (Platform.OS === 'web') {
    try {
      const nav = globalThis.navigator;
      if (nav?.clipboard?.writeText) {
        await nav.clipboard.writeText(text);
        return true;
      }
    } catch {
      return false;
    }
    return false;
  }

  try {
    const { setStringAsync } = await import('expo-clipboard');
    await setStringAsync(text);
    return true;
  } catch {
    return false;
  }
}
