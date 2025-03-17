import {Alert, PermissionsAndroid, Platform} from 'react-native';
import {launchCamera} from 'react-native-image-picker';
import Geolocation from 'react-native-geolocation-service';
import {LocationData, VerificationMethod} from "../../app/types";

/**
 * Service for handling challenge verification tasks
 */
export class VerificationService {
    /**
     * Request camera permissions
     * @returns {Promise<boolean>} Whether permission was granted
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
                    message: "Camera permission is needed for this feature.",
                    buttonNeutral: "Ask Me Later",
                    buttonNegative: "Cancel",
                    buttonPositive: "OK"
                }
            );
            if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
                Alert.alert('Permission Required', 'Camera permission is needed for this feature.');
                return false;
            }
            return true;
        } catch (err) {
            console.warn(err);
            return false;
        }
    }

    /**
     * Request location permissions
     * @returns {Promise<boolean>} Whether permission was granted
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
                    message: "Location permission is required for this verification.",
                    buttonNeutral: "Ask Me Later",
                    buttonNegative: "Cancel",
                    buttonPositive: "OK"
                }
            );
            if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
                Alert.alert('Permission Denied', 'Location permission is required for this verification.');
                return false;
            }
            return true;
        } catch (err) {
            console.warn(err);
            return false;
        }
    }

    /**
     * Take a photo using the device camera
     * @returns {Promise<string|null>} The URI of the photo or null if canceled
     */
    static async takePhoto(): Promise<string | null> {
        const hasPermission = await this.requestCameraPermission();
        if (!hasPermission) return null;

        try {
            const result = await launchCamera({
                mediaType: 'photo',
                quality: 0.7,
                includeBase64: false,
                saveToPhotos: false,
            });

            if (!result.didCancel && result.assets && result.assets.length > 0) {
                const uri = result.assets[0].uri;
                return uri ?? null; // Convert undefined to null if uri is undefined
            }
            return null;
        } catch (error) {
            console.error('Error taking photo:', error);
            Alert.alert('Error', 'Failed to take photo.');
            return null;
        }
    }

    /**
     * Get the current location
     * @returns {Promise<LocationData|null>} Location data or null if failed
     */
    static async getCurrentLocation(): Promise<LocationData | null> {
        const hasPermission = await this.requestLocationPermission();
        if (!hasPermission) return null;

        return new Promise((resolve, reject) => {
            Geolocation.getCurrentPosition(
                (position) => {
                    const { latitude, longitude } = position.coords;

                    // Note: We don't have direct reverse geocoding from react-native-geolocation-service
                    // You may want to add a geocoding library like react-native-geocoding
                    // For now, we'll just use the coordinates in the address string
                    const addressString = `Lat: ${latitude.toFixed(6)}, Long: ${longitude.toFixed(6)}`;

                    resolve({
                        latitude,
                        longitude,
                        address: addressString,
                        timestamp: new Date().toISOString()
                    });
                },
                (error) => {
                    console.error('Error getting location:', error);
                    Alert.alert('Error', 'Failed to get your location: ' + error.message);
                    resolve(null);
                },
                {
                    enableHighAccuracy: true,
                    timeout: 15000,
                    maximumAge: 10000
                }
            );
        });
    }

    /**
     * Calculate distance between two coordinates using Haversine formula
     * @param {number} lat1 - Latitude of first point
     * @param {number} lon1 - Longitude of first point
     * @param {number} lat2 - Latitude of second point
     * @param {number} lon2 - Longitude of second point
     * @returns {number} Distance in meters
     */
    static calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
        const R = 6371e3; // Earth radius in meters
        const φ1 = lat1 * Math.PI / 180;
        const φ2 = lat2 * Math.PI / 180;
        const Δφ = (lat2 - lat1) * Math.PI / 180;
        const Δλ = (lon2 - lon1) * Math.PI / 180;

        const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ/2) * Math.sin(Δλ/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        const distance = R * c; // in meters

        return distance;
    }

    /**
     * Create FormData for photo upload
     * @param {string} photoUri - URI of the photo
     * @param {string} challengeId - ID of the challenge
     * @param {string} prompt - Description of what should be in the photo
     * @param {string} aiPrompt - Instructions for AI verification
     * @returns {FormData} FormData for uploading
     */
    static createPhotoFormData(photoUri: string, challengeId: string, prompt?: string, aiPrompt?: string): FormData {
        const formData = new FormData();
        formData.append('challengeId', challengeId);
        formData.append('image', {
            uri: photoUri,
            name: 'verification.jpg',
            type: 'image/jpeg',
        } as any);

        if (prompt) {
            formData.append('prompt', prompt);
        }

        if (aiPrompt) {
            formData.append('aiPrompt', aiPrompt);
        }

        return formData;
    }

    /**
     * Parse verification methods from challenge
     * @param {string} verificationMethodJson - JSON string of verification methods
     * @returns {VerificationMethod[]} Array of verification methods
     */
    static parseVerificationMethods(verificationMethodJson?: string): VerificationMethod[] {
        if (!verificationMethodJson) return [];

        try {
            const parsedData = JSON.parse(verificationMethodJson);

            // Check if the parsed data is an array
            if (Array.isArray(parsedData)) {
                return parsedData;
            }

            // If it's a single object, wrap it in an array
            if (typeof parsedData === 'object' && parsedData !== null) {
                return [parsedData];
            }

            // If it's neither an array nor an object, return an empty array
            console.error('Unexpected verification method format:', parsedData);
            return [];
        } catch (e) {
            console.error('Error parsing verification methods:', e);
            return [];
        }
    }
}