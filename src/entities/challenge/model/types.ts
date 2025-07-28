// src/entities/challenge/model/types.ts
export type ChallengeStatus = 'active' | 'completed' | 'failed' | 'pending';
export type ChallengeType = 'QUEST' | 'QUIZ' | 'ACTIVITY_PARTNER' | 'FITNESS_TRACKING' | 'HABIT_BUILDING';

export interface ChallengeReward {
    type: 'points' | 'badge' | 'item';
    value: number | string;
    description?: string;
}

export interface QuizConfig {
    questionCount: number;
    timeLimit?: number;
    difficulty?: 'easy' | 'medium' | 'hard';
    categories?: string[];
    passingScore?: number;
}

export interface Challenge {
    id: string;
    title: string;
    description: string;
    creatorId: string;
    participants: string[];
    rewards: ChallengeReward[];
    status: ChallengeStatus;
    type: ChallengeType;
    visibility: 'public' | 'private' | 'friends';
    createdAt: string;
    updatedAt: string;
    startDate?: string;
    endDate?: string;
    verificationMethod?: string;
    quizConfig?: QuizConfig;
    metadata?: Record<string, any>;
}

export interface ChallengeParticipant {
    userId: string;
    challengeId: string;
    joinedAt: string;
    status: 'active' | 'completed' | 'dropped';
    progress?: number;
    score?: number;
}

// Add the missing ChallengeFilters interface
export interface ChallengeFilters {
    type?: string | null;
    status?: string | null;
    search?: string;
    visibility?: 'public' | 'private' | 'friends';
    creatorId?: string;
    startDate?: string;
    endDate?: string;
}

export interface ChallengeState {
    challenges: Challenge[];
    currentChallenge: Challenge | null;
    myParticipations: ChallengeParticipant[];
    isLoading: boolean;
    error: string | null;
    filters: ChallengeFilters; // Add filters to state
}