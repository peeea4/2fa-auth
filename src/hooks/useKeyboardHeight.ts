import { useEffect, useState } from 'react';
import { Keyboard, Platform, type EmitterSubscription } from 'react-native';

export function useKeyboardHeight(enabled = true): number {
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    if (!enabled) {
      setKeyboardHeight(0);
      return;
    }

    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const subscriptions: EmitterSubscription[] = [
      Keyboard.addListener(showEvent, (event) => {
        setKeyboardHeight(event.endCoordinates?.height ?? 0);
      }),
      Keyboard.addListener(hideEvent, () => {
        setKeyboardHeight(0);
      }),
    ];

    return () => {
      subscriptions.forEach((subscription) => subscription.remove());
    };
  }, [enabled]);

  return keyboardHeight;
}
