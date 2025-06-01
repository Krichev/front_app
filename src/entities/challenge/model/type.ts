// src/entities/challenge/model/types.ts

export type ChallengeType =
    | 'QUEST'
    | 'QUIZ'
    | 'ACTIVITY_PARTNER'
    | 'FITNESS_TRACKING'
    | 'HABIT_BUILDING';

export type ChallengeStatus =
    | 'OPEN'
    | 'IN_PROGRESS'
    | 'COMPLETED'
    | 'FAILED'
    | 'CANCELLED';

export type ChallengeVisibility =
    | 'PUBLIC'
    | 'PRIVATE'
    | 'GROUP_ONLY';

export type ChallengeFrequency =
    | 'DAILY'
    | 'WEEKLY'
    | 'ONE_TIME';

export type VerificationType =
    | 'PHOTO'
    | 'LOCATION'
    | 'FITNESS_DATA'
    | 'MANUAL'
    | 'QUIZ';

export interface VerificationMethod {
    type: VerificationType;
    enabled?: boolean;
    details: {
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
    status?: 'PENDING' | 'COMPLETED' | 'FAILED';
    result?: any;
}

export interface QuizConfig {
    gameType: 'WWW' | 'MULTIPLE_CHOICE' | 'TRUE_FALSE';
    teamName?: string;
    teamMembers?: string[];
    difficulty: 'Easy' | 'Medium' | 'Hard';
    roundTime: number;
    roundCount: number;
    enableAIHost: boolean;
    teamBased?: boolean;
    questionSource?: 'app' | 'user';
    customQuestionIds?: string[];
}

export interface Challenge {
    id: string;
    title: string;
    description?: string;
    type: ChallengeType;
    visibility: ChallengeVisibility;
    status: ChallengeStatus;
    frequency?: ChallengeFrequency;

    // Metadata
    createdAt: string;
    updatedAt: string;
    creatorId: string;

    // Participation
    participants: string[];
    maxParticipants?: number;

    // Timing
    startDate?: string;
    endDate?: string;

    // Rewards
    reward?: string;
    penalty?: string;

    // Verification
    verificationMethod?: VerificationMethod[];

    // Quiz specific
    quizConfig?: QuizConfig;

    // User context
    userIsCreator?: boolean;
    userRole?: 'CREATOR' | 'PARTICIPANT' | 'MODERATOR';
    userProgress?: ChallengeProgress;
}

export interface ChallengeProgress {
    completedTasks: number;
    totalTasks: number;
    percentage: number;
    streak: number;
    lastActivity?: string;
    verificationHistory: VerificationRecord[];
}

export interface VerificationRecord {
    id: string;
    challengeId: string;
    userId: string;
    type: VerificationType;
    status: 'PENDING' | 'VERIFIED' | 'REJECTED';
    submittedAt: string;
    verifiedAt?: string;
    data: any;
    feedback?: string;
}

export interface CreateChallengeRequest {
    title: string;
    description?: string;
    type: ChallengeType;
    visibility: ChallengeVisibility;
    frequency?: ChallengeFrequency;
    reward?: string;
    penalty?: string;
    verificationMethod?: VerificationMethod[];
    targetGroup?: string;
    startDate?: Date;
    endDate?: Date;
    quizConfig?: QuizConfig;
    maxParticipants?: number;
}

export interface ChallengeFilters {
    type?: ChallengeType;
    status?: ChallengeStatus;
    visibility?: ChallengeVisibility;
    creatorId?: string;
    participantId?: string;
    search?: string;
    page?: number;
    limit?: number;
}