import {Challenge} from '../../entities/ChallengeState/model/slice/challengeApi';
import {VerificationMethod} from '../../app/types';

/**
 * Service for handling challenge-related operations
 */
export class ChallengeService {
    /**
     * Parse verification methods from challenge
     * @param {Challenge|null|undefined} challenge - Challenge object
     * @returns {VerificationMethod[]} Array of verification methods
     */
    static getVerificationMethods(challenge?: Challenge | null): VerificationMethod[] {
        if (!challenge?.verificationMethod) return [];

        try {
            const parsedData = JSON.parse(challenge.verificationMethod);

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
     * Check if the challenge is a daily challenge
     * @param {Challenge|null|undefined} challenge - Challenge object
     * @returns {boolean} Whether it's a daily challenge
     */
    static isDailyChallenge(challenge?: Challenge | null): boolean {
        return challenge?.type === 'HABIT_BUILDING' || challenge?.frequency === 'DAILY';
    }

    /**
     * Check if the challenge has verification methods
     * @param {Challenge|null|undefined} challenge - Challenge object
     * @returns {boolean} Whether the challenge has verification methods
     */
    static hasVerificationMethods(challenge?: Challenge | null): boolean {
        const methods = this.getVerificationMethods(challenge);
        return methods.length > 0;
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
     * @param {Challenge} challenge - Challenge object
     * @returns {string} Remaining time string
     */
    static getRemainingTime(challenge: Challenge): string {
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
     * Calculate challenge progress
     * @param {Challenge} challenge - Challenge object
     * @param {number} completedTasks - Number of completed tasks
     * @param {number} totalTasks - Total number of tasks
     * @returns {number} Progress percentage (0-100)
     */
    static calculateProgress(challenge: Challenge, completedTasks: number, totalTasks: number): number {
        if (totalTasks === 0) return 0;

        // For daily challenges, calculate based on days
        if (this.isDailyChallenge(challenge) && challenge.startDate && challenge.endDate) {
            const startDate = new Date(challenge.startDate);
            const endDate = new Date(challenge.endDate);
            const today = new Date();

            // Calculate total days and days elapsed
            const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
            const daysElapsed = Math.ceil((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

            // Calculate expected completed tasks based on days elapsed
            const expectedCompleted = Math.min(daysElapsed, totalDays);

            // Calculate progress
            if (completedTasks >= expectedCompleted) {
                // On track or ahead
                return Math.min(Math.round((daysElapsed / totalDays) * 100), 100);
            } else {
                // Behind schedule
                return Math.min(Math.round((completedTasks / totalDays) * 100), 100);
            }
        }

        // For non-daily challenges, calculate based on completed/total
        return Math.min(Math.round((completedTasks / totalTasks) * 100), 100);
    }

    /**
     * Check if the user has completed today's verification
     * @param {Challenge} challenge - Challenge object
     * @param {Array} verificationHistory - History of verifications
     * @returns {boolean} Whether today's verification is completed
     */
    static isTodayVerified(challenge: Challenge, verificationHistory: any[]): boolean {
        if (!verificationHistory || verificationHistory.length === 0) return false;

        // Get today's date (without time)
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Check if there's a verification for today
        return verificationHistory.some(verification => {
            const verificationDate = new Date(verification.completionDate);
            verificationDate.setHours(0, 0, 0, 0);

            return verificationDate.getTime() === today.getTime() &&
                verification.status === 'VERIFIED';
        });
    }

    /**
     * Get challenge streak (consecutive days verified)
     * @param {Array} verificationHistory - History of verifications
     * @returns {number} Current streak
     */
    static getCurrentStreak(verificationHistory: any[]): number {
        if (!verificationHistory || verificationHistory.length === 0) return 0;

        // Sort by date (newest first)
        const sortedHistory = [...verificationHistory].sort((a, b) =>
            new Date(b.completionDate).getTime() - new Date(a.completionDate).getTime()
        );

        let streak = 0;
        let currentDate = new Date();
        currentDate.setHours(0, 0, 0, 0);

        // Check if today is verified
        const todayVerified = sortedHistory.some(verification => {
            const verificationDate = new Date(verification.completionDate);
            verificationDate.setHours(0, 0, 0, 0);

            return verificationDate.getTime() === currentDate.getTime() &&
                verification.status === 'VERIFIED';
        });

        if (todayVerified) {
            streak = 1;
        } else {
            // Check if yesterday was verified
            currentDate.setDate(currentDate.getDate() - 1);
        }

        // Loop through sorted history to find consecutive days
        for (let i = 0; i < sortedHistory.length; i++) {
            const verification = sortedHistory[i];
            const verificationDate = new Date(verification.completionDate);
            verificationDate.setHours(0, 0, 0, 0);

            // Check if this verification is for the expected date
            if (verificationDate.getTime() === currentDate.getTime() &&
                verification.status === 'VERIFIED') {
                // If it's verified, increment streak and move to the next expected date
                if (streak > 0 || todayVerified) {
                    streak++;
                }
                currentDate.setDate(currentDate.getDate() - 1);
            } else if (verificationDate.getTime() < currentDate.getTime()) {
                // If we found a gap (missed day), break the streak
                break;
            }
        }

        return streak;
    }

    /**
     * Format challenge type for display
     * @param {string} type - Challenge type
     * @returns {string} Formatted type string
     */
    static formatChallengeType(type: string): string {
        if (!type) return '';

        // Replace underscores with spaces and capitalize each word
        return type
            .replace(/_/g, ' ')
            .toLowerCase()
            .replace(/\b\w/g, (char) => char.toUpperCase());
    }

    /**
     * Get challenge status color
     * @param {string} status - Challenge status
     * @returns {string} Color hex code
     */
    static getStatusColor(status: string): string {
        switch (status?.toUpperCase()) {
            case 'OPEN':
                return '#4CAF50';  // Green
            case 'IN_PROGRESS':
                return '#2196F3';  // Blue
            case 'COMPLETED':
                return '#9C27B0';  // Purple
            case 'FAILED':
                return '#F44336';  // Red
            case 'CANCELLED':
                return '#9E9E9E';  // Grey
            default:
                return '#757575';  // Dark Grey
        }
    }
}