// types/index.ts - Shared type definitions for the application

/**
 * Verification method types
 */
export type VerificationType = 'PHOTO' | 'LOCATION' | 'FITNESS_DATA' | 'MANUAL' | 'QUIZ';

/**
 * Verification status types
 */
export type VerificationStatus = 'PENDING' | 'COMPLETED' | 'FAILED';

/**
 * Interface for verification method
 */
export interface VerificationMethod {
    type: VerificationType;
    enabled?: boolean;
    details: {
        photoPrompt?: string;
        locationData?: {
            latitude: number;
            longitude: number;
            address: string;
            radius: number; // radius in meters
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
export type ChallengeStatus = 'OPEN' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED' | 'CANCELLED';

