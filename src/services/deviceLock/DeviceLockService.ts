import { NativeModules, NativeEventEmitter, Platform } from 'react-native';

export interface LockConfig {
  lockType: 'overlay' | 'hard' | 'both';
  resetTime: string; // ISO timestamp
  penaltyId?: number;
  assignedByUserId?: number;
  assignedByUsername?: string;
  lockReason: 'screen_time_expired' | 'penalty' | 'parental';
  screenTimeMinutes?: number;
  allowEmergencyBypass: boolean;
  maxEmergencyBypasses: number;
  accountType: 'adult' | 'child';
  escalateAfterDismissAttempts?: number; // default 3
}

export interface LockScreenData {
  resetTime?: string;
  pendingPenaltyCount?: number;
  unlockableMinutes?: number;
  customMessage?: string;
}

export interface LockStatus {
  isActive: boolean;
  lockType: 'overlay' | 'hard' | 'none';
  activeSince?: string;
  emergencyBypassesUsed: number;
  emergencyBypassesRemaining: number;
}

const { DeviceLockModule } = NativeModules;
const eventEmitter = new NativeEventEmitter(DeviceLockModule);

class DeviceLockServiceClass {
  async activateLock(config: LockConfig): Promise<void> {
    if (Platform.OS !== 'android') {
      console.warn('[DeviceLock] Only Android supported currently');
      return;
    }
    return DeviceLockModule.activateLock(config);
  }

  async deactivateLock(): Promise<void> {
    if (Platform.OS !== 'android') return;
    return DeviceLockModule.deactivateLock();
  }

  async escalateToHardLock(): Promise<void> {
    if (Platform.OS !== 'android') return;
    return DeviceLockModule.escalateToHardLock();
  }

  async isOverlayPermissionGranted(): Promise<boolean> {
    if (Platform.OS !== 'android') return false;
    return DeviceLockModule.isOverlayPermissionGranted();
  }

  async requestOverlayPermission(): Promise<boolean> {
    if (Platform.OS !== 'android') return false;
    return DeviceLockModule.requestOverlayPermission();
  }

  async isDeviceAdminActive(): Promise<boolean> {
    if (Platform.OS !== 'android') return false;
    return DeviceLockModule.isDeviceAdminActive();
  }

  async requestDeviceAdmin(): Promise<boolean> {
    if (Platform.OS !== 'android') return false;
    return DeviceLockModule.requestDeviceAdmin();
  }

  updateLockScreenData(data: LockScreenData): void {
    if (Platform.OS !== 'android') return;
    DeviceLockModule.updateLockScreenData(data);
  }

  async getLockStatus(): Promise<LockStatus> {
    if (Platform.OS !== 'android') {
      return { isActive: false, lockType: 'none', emergencyBypassesUsed: 0, emergencyBypassesRemaining: 3 };
    }
    return DeviceLockModule.getLockStatus();
  }

  // Event listeners
  onUnlockRequested(callback: () => void) {
    return eventEmitter.addListener('onUnlockRequested', callback);
  }

  onEmergencyBypassUsed(callback: (data: { remainingBypasses: number }) => void) {
    return eventEmitter.addListener('onEmergencyBypassUsed', callback);
  }

  onLockDismissAttempt(callback: (data: { attemptCount: number }) => void) {
    return eventEmitter.addListener('onLockDismissAttempt', callback);
  }
}

export const DeviceLockService = new DeviceLockServiceClass();
