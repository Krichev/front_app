//src/entities/challenge/lib/utils.ts =====
import {Challenge} from '../model/types';
import {ApiChallenge} from '../../ChallengeState/model/slice/challengeApi';
import {VerificationMethod} from '../../../app/types';

/**
 * Utility functions for Challenge operations
 */
export class ChallengeUtils {
    /**
     * Parse verification methods from a challenge
     */
    static getVerificationMethods(challenge: Challenge | ApiChallenge): VerificationMethod[] {
        const verificationMethodString = challenge.verificationMethod;

        if (!verificationMethodString) return [];

        try {
            const parsedData = JSON.parse(verificationMethodString);

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

    /**
     * Check if a challenge has verification methods
     */
    static hasVerificationMethods(challenge: Challenge | ApiChallenge): boolean {
        const methods = this.getVerificationMethods(challenge);
        return methods.length > 0;
    }

    /**
     * Check if the current user is the creator of the challenge
     */
    static isUserCreator(challenge: Challenge | ApiChallenge, currentUserId?: string): boolean {
        if (challenge.userIsCreator !== undefined) {
            return challenge.userIsCreator;
        }

        if (currentUserId && 'creatorId' in challenge) {
            return challenge.creatorId === currentUserId;
        }

        if (currentUserId && 'creator_id' in challenge) {
            return challenge.creator_id === currentUserId;
        }

        return false;
    }

    /**
     * Check if the current user has joined the challenge
     */
    static hasUserJoined(challenge: Challenge | ApiChallenge, currentUserId?: string): boolean {
        if (!currentUserId) return false;

        let participants: string[] = [];

        if ('participants' in challenge) {
            if (typeof challenge.participants === 'string') {
                try {
                    participants = JSON.parse(challenge.participants);
                } catch {
                    participants = challenge.participants ? [challenge.participants] : [];
                }
            } else if (Array.isArray(challenge.participants)) {
                participants = challenge.participants;
            }
        }

        return participants.includes(currentUserId);
    }

    /**
     * Get formatted participant count
     */
    static getParticipantCount(challenge: Challenge | ApiChallenge): number {
        let participants: string[] = [];

        if ('participants' in challenge) {
            if (typeof challenge.participants === 'string') {
                try {
                    participants = JSON.parse(challenge.participants);
                } catch {
                    participants = challenge.participants ? [challenge.participants] : [];
                }
            } else if (Array.isArray(challenge.participants)) {
                participants = challenge.participants;
            }
        }

        return participants.length;
    }

    /**
     * Format challenge status for display
     */
    static formatStatus(status: string): string {
        return status.replace('_', ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
    }

    /**
     * Format challenge type for display
     */
    static formatType(type: string): string {
        return type.replace('_', ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
    }

    /**
     * Check if challenge is expired
     */
    static isExpired(challenge: Challenge | ApiChallenge): boolean {
        if (!challenge.endDate) return false;
        return new Date(challenge.endDate) < new Date();
    }

    /**
     * Get time remaining for challenge
     */
    static getTimeRemaining(challenge: Challenge | ApiChallenge): string | null {
        if (!challenge.endDate) return null;

        const endDate = new Date(challenge.endDate);
        const now = new Date();
        const diffTime = endDate.getTime() - now.getTime();

        if (diffTime <= 0) return 'Expired';

        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays > 7) {
            const diffWeeks = Math.floor(diffDays / 7);
            return `${diffWeeks} week${diffWeeks !== 1 ? 's' : ''} left`;
        } else if (diffDays > 1) {
            return `${diffDays} day${diffDays !== 1 ? 's' : ''} left`;
        } else {
            const diffHours = Math.ceil(diffTime / (1000 * 60 * 60));
            return `${diffHours} hour${diffHours !== 1 ? 's' : ''} left`;
        }
    }
}

// Export individual functions for direct imports
export const {
    getVerificationMethods,
    hasVerificationMethods,
    isUserCreator,
    hasUserJoined,
    getParticipantCount,
    formatStatus,
    formatType,
    isExpired,
    getTimeRemaining,
} = ChallengeUtils;