// src/shared/lib/permissions/usePermissions.ts
import {useCallback, useEffect, useState} from 'react';
import {PermissionsAndroid, Platform} from 'react-native';

type PermissionType = 'camera' | 'location' | 'microphone' | 'storage';
type PermissionStatus = 'granted' | 'denied' | 'blocked' | 'limited' | 'unavailable';

interface PermissionState {
    [key: string]: PermissionStatus;
}

export const usePermissions = (permissions: PermissionType[] = []) => {
    const [permissionStatus, setPermissionStatus] = useState<PermissionState>({});
    const [isLoading, setIsLoading] = useState(false);

    const checkPermissions = useCallback(async () => {
        if (Platform.OS === 'ios') {
            // iOS permissions are handled differently
            const status: PermissionState = {};
            permissions.forEach(permission => {
                status[permission] = 'granted'; // Simplified for this example
            });
            setPermissionStatus(status);
            return status;
        }

        const androidPermissions: { [key in PermissionType]: string } = {
            camera: PermissionsAndroid.PERMISSIONS.CAMERA,
            location: PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
            microphone: PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
            storage: PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
        };

        const status: PermissionState = {};

        for (const permission of permissions) {
            try {
                const result = await PermissionsAndroid.check(androidPermissions[permission]);
                status[permission] = result ? 'granted' : 'denied';
            } catch (error) {
                status[permission] = 'unavailable';
            }
        }

        setPermissionStatus(status);
        return status;
    }, [permissions]);

    const requestPermissions = useCallback(async () => {
        if (Platform.OS === 'ios') {
            return permissionStatus;
        }

        setIsLoading(true);

        const androidPermissions: { [key in PermissionType]: string } = {
            camera: PermissionsAndroid.PERMISSIONS.CAMERA,
            location: PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
            microphone: PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
            storage: PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
        };

        try {
            const permissionsToRequest = permissions.map(p => androidPermissions[p]);
            const results = await PermissionsAndroid.requestMultiple(permissionsToRequest);

            const status: PermissionState = {};
            permissions.forEach(permission => {
                const result = results[androidPermissions[permission]];
                status[permission] = result === 'granted' ? 'granted' : 'denied';
            });

            setPermissionStatus(status);
            return status;
        } catch (error) {
            console.error('Error requesting permissions:', error);
            return permissionStatus;
        } finally {
            setIsLoading(false);
        }
    }, [permissions, permissionStatus]);

    useEffect(() => {
        if (permissions.length > 0) {
            checkPermissions();
        }
    }, [checkPermissions, permissions]);

    return {
        permissionStatus,
        isLoading,
        checkPermissions,
        requestPermissions,
        hasPermission: (permission: PermissionType) => permissionStatus[permission] === 'granted',
        allPermissionsGranted: permissions.every(p => permissionStatus[p] === 'granted'),
    };
};
