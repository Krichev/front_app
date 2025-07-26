// src/entities/verification/lib/verificationService.ts
import {Alert, PermissionsAndroid, Platform} from 'react-native';
import {ImagePickerResponse, launchCamera, MediaType} from 'react-native-image-picker';
import Geolocation from 'react-native-geolocation-service';
import {CameraResult, LocationData, VerificationMethod, VerificationResult} from '../model/types';

export class VerificationService {
    /**
     * Request camera permissions
     */
    static async requestCameraPermission(): Promise<boolean> {
        if (Platform.OS === 'ios') {
            return true; // iOS handles permissions through Info.plist
        }

        try {
            const granted = await PermissionsAndroid.request(
                PermissionsAndroid.PERMISSIONS.CAMERA,
                {
                    title: "Camera Permission",
                    message: "Camera permission is needed for verification.",
                    buttonNeutral: "Ask Me Later",
                    buttonNegative: "Cancel",
                    buttonPositive: "OK"
                }
            );

            if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
                Alert.alert('Permission Required', 'Camera permission is needed for verification.');
                return false;
            }
            return true;
        } catch (err) {
            console.warn('Camera permission error:', err);
            return false;
        }
    }

    /**
     * Request location permissions
     */
    static async requestLocationPermission(): Promise<boolean> {
        if (Platform.OS === 'ios') {
            return true; // iOS handles permissions through Info.plist
        }

        try {
            const granted = await PermissionsAndroid.request(
                PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
                {
                    title: "Location Permission",
                    message: "Location permission is required for verification.",
                    buttonNeutral: "Ask Me Later",
                    buttonNegative: "Cancel",
                    buttonPositive: "OK"
                }
            );

            if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
                Alert.alert('Permission Denied', 'Location permission is required for verification.');
                return false;
            }
            return true;
        } catch (err) {
            console.warn('Location permission error:', err);
            return false;
        }
    }

    /**
     * Request microphone permissions
     */
    static async requestMicrophonePermission(): Promise<boolean> {
        if (Platform.OS === 'ios') {
            return true;
        }

        try {
            const granted = await PermissionsAndroid.request(
                PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
                {
                    title: "Microphone Permission",
                    message: "Microphone permission is needed for audio verification.",
                    buttonNeutral: "Ask Me Later",
                    buttonNegative: "Cancel",
                    buttonPositive: "OK"
                }
            );

            return granted === PermissionsAndroid.RESULTS.GRANTED;
        } catch (err) {
            console.warn('Microphone permission error:', err);
            return false;
        }
    }

    /**
     * Capture photo for verification
     */
    static async capturePhoto(): Promise<CameraResult | null> {
        const hasPermission = await this.requestCameraPermission();
        if (!hasPermission) {
            throw new Error('Camera permission not granted');
        }

        return new Promise((resolve, reject) => {
            const options = {
                mediaType: 'photo' as MediaType,
                quality: 0.8,
                includeBase64: false,
                maxWidth: 1920,
                maxHeight: 1080,
            };

            launchCamera(options, (response: ImagePickerResponse) => {
                if (response.didCancel) {
                    resolve(null);
                    return;
                }

                if (response.errorMessage) {
                    reject(new Error(response.errorMessage));
                    return;
                }

                const asset = response.assets?.[0];
                if (asset) {
                    resolve({
                        uri: asset.uri!,
                        type: asset.type!,
                        fileName: asset.fileName!,
                        fileSize: asset.fileSize!,
                        width: asset.width,
                        height: asset.height,
                        timestamp: Date.now(),
                    });
                } else {
                    reject(new Error('No image captured'));
                }
            });
        });
    }

    /**
     * Get current location for verification
     */
    static async getCurrentLocation(): Promise<LocationData> {
        const hasPermission = await this.requestLocationPermission();
        if (!hasPermission) {
            throw new Error('Location permission not granted');
        }

        return new Promise((resolve, reject) => {
            Geolocation.getCurrentPosition(
                (position) => {
                    resolve({
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude,
                        accuracy: position.coords.accuracy,
                        altitude: position.coords.altitude || undefined,
                        heading: position.coords.heading || undefined,
                        speed: position.coords.speed || undefined,
                        timestamp: position.timestamp,
                    });
                },
                (error) => {
                    reject(new Error(`Location error: ${error.message}`));
                },
                {
                    enableHighAccuracy: true,
                    timeout: 15000,
                    maximumAge: 10000,
                }
            );
        });
    }

    /**
     * Perform verification for a challenge
     */
    static async verifyChallenge(
        challengeId: string,
        method: VerificationMethod,
        additionalData?: any
    ): Promise<VerificationResult> {
        const verificationId = `verification_${Date.now()}_${Math.random().toString(36).substring(2)}`;

        try {
            let data: any = {};
            let photos: CameraResult[] = [];
            let location: LocationData | undefined;

            switch (method) {
                case 'photo':
                    const photo = await this.capturePhoto();
                    if (photo) {
                        photos.push(photo);
                        data.photo = photo;
                    } else {
                        throw new Error('Photo capture was cancelled');
                    }
                    break;

                case 'location':
                    location = await this.getCurrentLocation();
                    data.location = location;
                    break;

                case 'manual':
                    data = additionalData || {};
                    break;

                default:
                    throw new Error(`Verification method ${method} not implemented`);
            }

            // Here you would typically send the verification data to your backend
            // For now, we'll simulate a successful verification
            await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call

            return {
                id: verificationId,
                challengeId,
                method,
                success: true,
                data,
                timestamp: Date.now(),
                location,
                photos,
                feedback: 'Verification completed successfully',
            };
        } catch (error) {
            return {
                id: verificationId,
                challengeId,
                method,
                success: false,
                data: {},
                timestamp: Date.now(),
                error: error instanceof Error ? error.message : 'Unknown verification error',
            };
        }
    }
}

// Export individual functions for cleaner imports
export const {
    requestCameraPermission,
    requestLocationPermission,
    requestMicrophonePermission,
    capturePhoto,
    getCurrentLocation,
    verifyChallenge,
} = VerificationService;