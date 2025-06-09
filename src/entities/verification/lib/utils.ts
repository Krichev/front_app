// src/entities/verification/lib/utils.ts
import {CameraResult, LocationData, VerificationResult} from '../model/types';

export const formatLocationData = (location: LocationData): string => {
    const { latitude, longitude, accuracy } = location;
    return `${latitude.toFixed(6)}, ${longitude.toFixed(6)} (±${accuracy.toFixed(0)}m)`;
};

export const formatVerificationResult = (result: VerificationResult): string => {
    const timestamp = new Date(result.timestamp).toLocaleString();
    const status = result.success ? '✅ Success' : '❌ Failed';

    return `${status} - ${result.method} verification at ${timestamp}`;
};

export const validateVerificationData = (data: any, method: string): boolean => {
    switch (method) {
        case 'photo':
            return !!(data.photo && data.photo.uri);
        case 'location':
            return !!(data.location && data.location.latitude && data.location.longitude);
        case 'manual':
            return true; // Manual verification is always valid if submitted
        default:
            return false;
    }
};

export const calculateDistance = (
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
): number => {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
};

export const isLocationWithinRadius = (
    userLocation: LocationData,
    targetLocation: { latitude: number; longitude: number },
    radiusKm: number
): boolean => {
    const distance = calculateDistance(
        userLocation.latitude,
        userLocation.longitude,
        targetLocation.latitude,
        targetLocation.longitude
    );
    return distance <= radiusKm;
};

export const getLocationAccuracyLabel = (accuracy: number): string => {
    if (accuracy <= 5) return 'Excellent';
    if (accuracy <= 10) return 'Good';
    if (accuracy <= 20) return 'Fair';
    return 'Poor';
};

export const compressImageData = (photo: CameraResult): Partial<CameraResult> => {
    // Return only essential data for storage/transmission
    return {
        uri: photo.uri,
        type: photo.type,
        fileName: photo.fileName,
        fileSize: photo.fileSize,
        timestamp: photo.timestamp,
    };
};

export const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const validateImageDimensions = (
    photo: CameraResult,
    minWidth: number = 200,
    minHeight: number = 200
): boolean => {
    return !!(photo.width && photo.height &&
        photo.width >= minWidth && photo.height >= minHeight);
};

export const sanitizeVerificationData = (data: any): any => {
    // Remove sensitive or unnecessary data before storing/transmitting
    const sanitized = { ...data };

    // Remove base64 data if present
    if (sanitized.base64) {
        delete sanitized.base64;
    }

    // Remove personal information
    if (sanitized.personalInfo) {
        delete sanitized.personalInfo;
    }

    return sanitized;
};