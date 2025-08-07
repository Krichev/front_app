import {ApiChallenge} from '../../entities/ChallengeState/model/slice/challengeApi';
import {getVerificationMethods, VerificationMethod} from '../../app/types';

/**
 * Service for handling challenge-related operations
 * UPDATED to work with new backend verification structure
 */
export class ChallengeService {
    /**
     * Parse verification methods from challenge
     * @param {ApiChallenge|null|undefined} challenge - Challenge object
     * @returns {VerificationMethod[]} Array of verification methods
     */
    static getVerificationMethods(challenge?: ApiChallenge | null): VerificationMethod[] {
        if (!challenge?.verificationMethod) return [];

        // Use the updated helper function from types
        return getVerificationMethods(challenge.verificationMethod);
    }

    /**
     * Get the primary verification method (first one) from challenge
     * @param {ApiChallenge|null|undefined} challenge - Challenge object
     * @returns {VerificationMethod|null} Primary verification method
     */
    static getPrimaryVerificationMethod(challenge?: ApiChallenge | null): VerificationMethod | null {
        const methods = this.getVerificationMethods(challenge);
        return methods.length > 0 ? methods[0] : null;
    }

    /**
     * Check if the challenge is a daily challenge
     * @param {ApiChallenge|null|undefined} challenge - Challenge object
     * @returns {boolean} Whether it's a daily challenge
     */
    static isDailyChallenge(challenge?: ApiChallenge | null): boolean {
        return challenge?.type === 'HABIT_BUILDING' || challenge?.frequency === 'DAILY';
    }

    /**
     * Check if the challenge has verification methods
     * @param {ApiChallenge|null|undefined} challenge - Challenge object
     * @returns {boolean} Whether the challenge has verification methods
     */
    static hasVerificationMethods(challenge?: ApiChallenge | null): boolean {
        const methods = this.getVerificationMethods(challenge);
        return methods.length > 0;
    }

    /**
     * Check if challenge has photo verification
     * @param {ApiChallenge|null|undefined} challenge - Challenge object
     * @returns {boolean} Whether it has photo verification
     */
    static hasPhotoVerification(challenge?: ApiChallenge | null): boolean {
        const methods = this.getVerificationMethods(challenge);
        return methods.some(method => method.type === 'PHOTO');
    }

    /**
     * Check if challenge has location verification
     * @param {ApiChallenge|null|undefined} challenge - Challenge object
     * @returns {boolean} Whether it has location verification
     */
    static hasLocationVerification(challenge?: ApiChallenge | null): boolean {
        const methods = this.getVerificationMethods(challenge);
        return methods.some(method => method.type === 'LOCATION');
    }

    /**
     * Get photo verification details
     * @param {ApiChallenge|null|undefined} challenge - Challenge object
     * @returns {object|null} Photo verification details
     */
    static getPhotoVerificationDetails(challenge?: ApiChallenge | null): {
        description: string;
        requiresComparison: boolean;
        verificationMode: string;
    } | null {
        const methods = this.getVerificationMethods(challenge);
        const photoMethod = methods.find(method => method.type === 'PHOTO');

        if (!photoMethod) return null;

        return {
            description: photoMethod.details.description || photoMethod.details.photoPrompt || 'Take a photo to verify completion',
            requiresComparison: photoMethod.details.requiresComparison || false,
            verificationMode: photoMethod.details.verificationMode || 'standard'
        };
    }

    /**
     * Get location verification details
     * @param {ApiChallenge|null|undefined} challenge - Challenge object
     * @returns {object|null} Location verification details
     */
    static getLocationVerificationDetails(challenge?: ApiChallenge | null): {
        latitude: number;
        longitude: number;
        radius: number;
        locationName: string;
    } | null {
        const methods = this.getVerificationMethods(challenge);
        const locationMethod = methods.find(method => method.type === 'LOCATION');

        if (!locationMethod) return null;

        const details = locationMethod.details;

        return {
            latitude: details.latitude || details.locationData?.latitude || 0,
            longitude: details.longitude || details.locationData?.longitude || 0,
            radius: details.radius || details.locationData?.radius || 100,
            locationName: details.locationName || details.locationData?.address || ''
        };
    }

    /**
     * Format date to a readable string
     * @param {string} dateString - ISO date string
     * @returns {string} Formatted date string
     */
    static formatDate(dateString: string): string {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    }

    /**
     * Get remaining time for challenge completion
     * @param {ApiChallenge} challenge - Challenge object
     * @returns {string} Remaining time string
     */
    static getRemainingTime(challenge: ApiChallenge): string {
        if (!challenge.endDate) return 'No end date';

        const endDate = new Date(challenge.endDate);
        const now = new Date();

        // If end date is in the past
        if (endDate < now) {
            return 'Expired';
        }

        const diffTime = Math.abs(endDate.getTime() - now.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays > 30) {
            const diffMonths = Math.floor(diffDays / 30);
            return `${diffMonths} month${diffMonths !== 1 ? 's' : ''} left`;
        } else if (diffDays > 1) {
            return `${diffDays} day${diffDays !== 1 ? 's' : ''} left`;
        } else {
            const diffHours = Math.ceil(diffTime / (1000 * 60 * 60));
            return `${diffHours} hour${diffHours !== 1 ? 's' : ''} left`;
        }
    }

    /**
     * Get challenge status color
     * @param {string} status - Challenge status
     * @returns {string} Color code
     */
    static getStatusColor(status: string): string {
        switch (status?.toUpperCase()) {
            case 'ACTIVE':
            case 'IN_PROGRESS':
                return '#4CAF50';
            case 'COMPLETED':
                return '#2196F3';
            case 'FAILED':
            case 'CANCELLED':
                return '#F44336';
            case 'DRAFT':
                return '#FF9800';
            default:
                return '#757575';
        }
    }

    /**
     * Get verification type display name
     * @param {string} type - Verification type
     * @returns {string} Display name
     */
    static getVerificationTypeDisplayName(type: string): string {
        switch (type?.toUpperCase()) {
            case 'PHOTO':
                return 'Photo Verification';
            case 'LOCATION':
                return 'Location Check-in';
            case 'QUIZ':
                return 'Quiz';
            case 'MANUAL':
                return 'Manual Verification';
            case 'FITNESS_API':
                return 'Fitness Tracker';
            case 'ACTIVITY':
                return 'Activity Tracking';
            default:
                return type;
        }
    }
}