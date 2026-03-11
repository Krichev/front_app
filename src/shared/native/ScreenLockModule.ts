import { NativeModules, Platform } from 'react-native';

interface LockData {
  durationSeconds: number;
  reasonMessage: string;
  locale: string;
  title?: string;
  settingsLabel?: string;
}

interface IScreenLockModule {
  activateLock(lockData: LockData): Promise<void>;
  deactivateLock(): Promise<void>;
  isLockActive(): Promise<boolean>;
  checkOverlayPermission(): Promise<boolean>;
  requestOverlayPermission(): Promise<void>;
  updateLockInfo(lockData: LockData): Promise<void>;
}

const { ScreenLockModule } = NativeModules;

export default (Platform.OS === 'android' ? ScreenLockModule : null) as IScreenLockModule | null;
