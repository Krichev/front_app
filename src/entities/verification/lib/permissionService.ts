// src/entities/verification/lib/permissionService.ts
import {Alert, Linking, PermissionsAndroid, Platform} from 'react-native';
import {PermissionState, PermissionStatus} from '../model/types';

export class PermissionService {
    /**
     * Check the current status of a specific permission
     */
    static async checkPermissionStatus(permission: keyof PermissionState): Promise<PermissionStatus> {
        if (Platform.OS === 'ios') {
            // On iOS, we assume permissions are handled through Info.plist
            // In a real app, you'd use a library like react-native-permissions
            return 'granted';
        }

        try {
            let androidPermission: string;

            switch (permission) {
                case 'camera':
                    androidPermission = PermissionsAndroid.PERMISSIONS.CAMERA;
                    break;
                case 'location':
                    androidPermission = PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION;
                    break;
                case 'microphone':
                    androidPermission = PermissionsAndroid.PERMISSIONS.RECORD_AUDIO;
                    break;
                case 'storage':
                    androidPermission = PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE;
                    break;
                default:
                    return 'unavailable';
            }

            const result = await PermissionsAndroid.check(androidPermission);
            return result ? 'granted' : 'denied';
        } catch (error) {
            console.error('Error checking permission status:', error);
            return 'unavailable';
        }
    }

    /**
     * Check all permission statuses
     */
    static async checkAllPermissions(): Promise<PermissionState> {
        const [camera, location, microphone, storage] = await Promise.all([
            this.checkPermissionStatus('camera'),
            this.checkPermissionStatus('location'),
            this.checkPermissionStatus('microphone'),
            this.checkPermissionStatus('storage'),
        ]);

        return { camera, location, microphone, storage };
    }

    /**
     * Request all necessary permissions
     */
    static async requestAllPermissions(): Promise<PermissionState> {
        if (Platform.OS === 'ios') {
            // On iOS, permissions are requested when needed
            return {
                camera: 'granted',
                location: 'granted',
                microphone: 'granted',
                storage: 'granted',
            };
        }

        try {
            const results = await PermissionsAndroid.requestMultiple([
                PermissionsAndroid.PERMISSIONS.CAMERA,
                PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
                PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
                PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
            ]);

            return {
                camera: results[PermissionsAndroid.PERMISSIONS.CAMERA] === 'granted' ? 'granted' : 'denied',
                location: results[PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION] === 'granted' ? 'granted' : 'denied',
                microphone: results[PermissionsAndroid.PERMISSIONS.RECORD_AUDIO] === 'granted' ? 'granted' : 'denied',
                storage: results[PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE] === 'granted' ? 'granted' : 'denied',
            };
        } catch (error) {
            console.error('Error requesting permissions:', error);
            return {
                camera: 'unavailable',
                location: 'unavailable',
                microphone: 'unavailable',
                storage: 'unavailable',
            };
        }
    }

    /**
     * Open app settings for manual permission management
     */
    static async openAppSettings(): Promise<void> {
        try {
            await Linking.openSettings();
        } catch (error) {
            Alert.alert(
                'Settings Unavailable',
                'Unable to open app settings. Please manually enable permissions in your device settings.'
            );
        }
    }

    /**
     * Show permission rationale to user
     */
    static showPermissionRationale(permission: keyof PermissionState): Promise<boolean> {
        return new Promise((resolve) => {
            const messages = {
                camera: 'Camera access is needed to capture verification photos for challenges.',
                location: 'Location access is needed to verify your presence at challenge locations.',
                microphone: 'Microphone access is needed for audio verification features.',
                storage: 'Storage access is needed to save verification media.',
            };

            Alert.alert(
                'Permission Required',
                messages[permission],
                [
                    { text: 'Cancel', onPress: () => resolve(false) },
                    { text: 'Grant Permission', onPress: () => resolve(true) },
                ]
            );
        });
    }
}

// Export individual functions for cleaner imports
export const {
    checkPermissionStatus,
    checkAllPermissions,
    requestAllPermissions,
    openAppSettings,
    showPermissionRationale,
} = PermissionService;
