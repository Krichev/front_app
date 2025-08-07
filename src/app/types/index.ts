// types/index.ts - Shared type definitions for the application

/**
 * Verification method types - UPDATED to match backend enum
 */
export type VerificationType = 'PHOTO' | 'LOCATION' | 'QUIZ' | 'MANUAL' | 'FITNESS_API' | 'ACTIVITY';

/**
 * Verification status types
 */
export type VerificationStatus = 'PENDING' | 'COMPLETED' | 'FAILED';

/**
 * Interface for verification method - UPDATED structure
 * This is now used for displaying/parsing verification data from challenges
 */
export interface VerificationMethod {
    type: VerificationType;
    enabled?: boolean;
    details: {
        // Photo verification details
        description?: string;
        requiresComparison?: boolean;
        verificationMode?: 'standard' | 'selfie' | 'comparison';

        // Location verification details
        latitude?: number;
        longitude?: number;
        radius?: number;
        locationName?: string;

        // Legacy fields for backward compatibility
        photoPrompt?: string;
        locationData?: {
            latitude: number;
            longitude: number;
            address: string;
            radius: number;
        };
        requiredItems?: string[];
        aiPrompt?: string;

        [key: string]: any;
    };
    status?: VerificationStatus;
    result?: any;
}

/**
 * Interface for location data
 */
export interface LocationData {
    latitude: number;
    longitude: number;
    address: string;
    timestamp: string;
}

/**
 * Challenge frequency types
 */
export type ChallengeFrequency = 'DAILY' | 'WEEKLY' | 'ONE_TIME';

/**
 * Challenge type definition
 */
export type ChallengeType = 'QUEST' | 'QUIZ' | 'ACTIVITY_PARTNER' | 'FITNESS_TRACKING' | 'HABIT_BUILDING';

/**
 * Challenge visibility options
 */
export type ChallengeVisibility = 'PUBLIC' | 'PRIVATE' | 'GROUP_ONLY';

/**
 * Challenge status options
 */
export type ChallengeStatus = 'OPEN' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED' | 'CANCELLED' | 'ACTIVE' | 'DRAFT';

/**
 * Verification details for photo verification
 */
export interface PhotoVerificationDetails {
    description: string;
    requiresComparison?: boolean;
    verificationMode?: 'standard' | 'selfie' | 'comparison';
}

/**
 * Verification details for location verification
 */
export interface LocationVerificationDetails {
    latitude: number;
    longitude: number;
    radius?: number;
    locationName?: string;
}

/**
 * Union type for all verification details
 */
export type VerificationDetails = PhotoVerificationDetails | LocationVerificationDetails | Record<string, any>;

/**
 * Helper function to parse verification method from API challenge data
 * UPDATED to handle both old array format and new single method format
 */
export function parseVerificationMethod(verificationMethodJson?: string): VerificationMethod | null {
    if (!verificationMethodJson) return null;

    try {
        const parsed = JSON.parse(verificationMethodJson);

        // Handle array format (legacy)
        if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed[0]; // Return first method for backward compatibility
        }

        // Handle single object format
        if (typeof parsed === 'object' && parsed.type) {
            return parsed;
        }

        return null;
    } catch (e) {
        console.error('Error parsing verification method:', e);
        return null;
    }
}

/**
 * Helper function to get verification methods array from challenge
 * UPDATED to handle both formats
 */
export function getVerificationMethods(verificationMethodJson?: string): VerificationMethod[] {
    if (!verificationMethodJson) return [];

    try {
        const parsed = JSON.parse(verificationMethodJson);

        // Handle array format
        if (Array.isArray(parsed)) {
            return parsed;
        }

        // Handle single object format - wrap in array
        if (typeof parsed === 'object' && parsed.type) {
            return [parsed];
        }

        return [];
    } catch (e) {
        console.error('Error parsing verification methods:', e);
        return [];
    }
}

/**
 * Helper function to check if challenge has photo verification
 */
export function hasPhotoVerification(verificationMethodJson?: string): boolean {
    const methods = getVerificationMethods(verificationMethodJson);
    return methods.some(method => method.type === 'PHOTO');
}

/**
 * Helper function to check if challenge has location verification
 */
export function hasLocationVerification(verificationMethodJson?: string): boolean {
    const methods = getVerificationMethods(verificationMethodJson);
    return methods.some(method => method.type === 'LOCATION');
}

/**
 * Helper function to get photo verification details
 */
export function getPhotoVerificationDetails(verificationMethodJson?: string): PhotoVerificationDetails | null {
    const methods = getVerificationMethods(verificationMethodJson);
    const photoMethod = methods.find(method => method.type === 'PHOTO');

    if (!photoMethod) return null;

    return {
        description: photoMethod.details.description || photoMethod.details.photoPrompt || '',
        requiresComparison: photoMethod.details.requiresComparison || false,
        verificationMode: photoMethod.details.verificationMode || 'standard'
    };
}

/**
 * Helper function to get location verification details
 */
export function getLocationVerificationDetails(verificationMethodJson?: string): LocationVerificationDetails | null {
    const methods = getVerificationMethods(verificationMethodJson);
    const locationMethod = methods.find(method => method.type === 'LOCATION');

    if (!locationMethod) return null;

    // Handle both new format and legacy format
    const details = locationMethod.details;

    return {
        latitude: details.latitude || details.locationData?.latitude || 0,
        longitude: details.longitude || details.locationData?.longitude || 0,
        radius: details.radius || details.locationData?.radius || 100,
        locationName: details.locationName || details.locationData?.address || ''
    };
}