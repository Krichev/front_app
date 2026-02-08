import { useState, useEffect, useCallback } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { DeviceLockService } from './DeviceLockService';

export const useDeviceLockPermissions = () => {
  const [hasOverlayPermission, setHasOverlayPermission] = useState<boolean>(false);
  const [isDeviceAdminActive, setIsDeviceAdminActive] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const checkPermissions = useCallback(async () => {
    setIsLoading(true);
    try {
      const overlay = await DeviceLockService.isOverlayPermissionGranted();
      const admin = await DeviceLockService.isDeviceAdminActive();
      setHasOverlayPermission(overlay);
      setIsDeviceAdminActive(admin);
    } catch (error) {
      console.error('[useDeviceLockPermissions] Error checking permissions:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    checkPermissions();

    // Re-check when app comes back to foreground (user might have granted permission in settings)
    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        checkPermissions();
      }
    });

    return () => {
      subscription.remove();
    };
  }, [checkPermissions]);

  const requestOverlayPermission = async () => {
    return DeviceLockService.requestOverlayPermission();
  };

  const requestDeviceAdmin = async () => {
    return DeviceLockService.requestDeviceAdmin();
  };

  return {
    hasOverlayPermission,
    isDeviceAdminActive,
    isLoading,
    checkPermissions,
    requestOverlayPermission,
    requestDeviceAdmin,
  };
};
