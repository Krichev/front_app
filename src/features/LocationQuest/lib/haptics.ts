import ReactNativeHapticFeedback, { HapticFeedbackTypes } from 'react-native-haptic-feedback';
import { Platform, Vibration } from 'react-native';

const hapticOptions = {
  enableVibrateFallback: true,
  ignoreAndroidSystemSettings: false,
};

export const triggerHaptic = (type: HapticFeedbackTypes = HapticFeedbackTypes.impactMedium) => {
  try {
    ReactNativeHapticFeedback.trigger(type, hapticOptions);
  } catch (error) {
    Vibration.vibrate(Platform.OS === 'ios' ? 10 : 50);
  }
};
