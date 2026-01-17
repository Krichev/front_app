// src/entities/ChallengeState/model/types.ts
// Complete type definitions for Challenge entities and related types

// ============================================================================
// WWW QUIZ TYPES (EXISTING)
// ============================================================================

import {APIDifficulty} from "../../../services/wwwGame/questionService.ts";

export enum PaymentType {
    FREE = 'FREE',
    ENTRY_FEE = 'ENTRY_FEE',
    PRIZE = 'PRIZE',
    BOTH = 'BOTH'
}

export enum CurrencyType {
    USD = 'USD',
    EUR = 'EUR',
    GBP = 'GBP',
    CAD = 'CAD',
    AUD = 'AUD',
    POINTS = 'POINTS'
}

/**
 * Type definition for WWW_QUIZ quiz configuration
 */
export interface WWWQuizConfig {
    /** The game type identifier */
    gameType: 'WWW';
    /** The team name */
    teamName: string;
    /** List of team member names */
    teamMembers: string[];
    /** Difficulty level of quiz questions */
    difficulty: 'EASY' | 'MEDIUM' | 'HARD';
    /** Time allowed for discussion in seconds */
    roundTime: number;
    /** Number of questions in the quiz */
    roundCount: number;
    /** Whether AI host features are enabled */
    enableAIHost: boolean;
    /** Whether the quiz is team-based (optional) */
    teamBased?: boolean;
}

/**
 * Placeholder for other quiz types we might add in the future
 */
interface OtherQuizConfig {
    gameType: string;

    [key: string]: any;
}

/**
 * Union type to support different quiz types in the future
 */
export type QuizConfig = WWWQuizConfig | OtherQuizConfig;

/**
 * Helper function to parse quiz configuration from JSON string
 */
export function parseQuizConfig(quizConfigJson: string | undefined): QuizConfig | null {
    if (!quizConfigJson) return null;

    try {
        const config = JSON.parse(quizConfigJson);
        return config;
    } catch (e) {
        console.error('Error parsing quiz config:', e);
        return null;
    }
}

/**
 * Type guard to check if a quiz config is a WWW quiz
 */
export function isWWWQuiz(config: QuizConfig | null): config is WWWQuizConfig {
    return !!config && config.gameType === 'WWW';
}

// ============================================================================
// CHALLENGE CORE TYPES
// ============================================================================

/**
 * Main Challenge interface from API
 */
export interface ApiChallenge {
    id: string;
    title: string;
    description?: string;
    type: string;
    visibility: string;
    status: string;
    created_at: string;
    updated_at: string;
    creator_id: string;
    participants: string[] | string | null;
    reward?: string;
    penalty?: string;
    verificationMethod?: string;
    targetGroup?: string;
    frequency?: 'DAILY' | 'WEEKLY' | 'ONE_TIME';
    startDate?: string;
    endDate?: string;
    quizConfig?: string;
    userIsCreator?: boolean;
    userRole?: string;
    paymentType?: PaymentType;
    hasEntryFee?: boolean;
    entryFeeAmount?: number;
    entryFeeCurrency?: CurrencyType;
    hasPrize?: boolean;
    prizeAmount?: number;
    prizeCurrency?: CurrencyType;

    // Access control properties
    requiresApproval?: boolean;
    invitedUserIds?: number[];
}

/**
 * Request type for creating a new challenge
 */
export interface CreateChallengeRequest {
    title: string;
    description?: string;
    type: string;
    visibility: string;
    status: string;
    reward?: string;
    penalty?: string;
    verificationMethod?: string;
    verificationDetails?: Record<string, any>;
    targetGroup?: string;
    frequency?: 'DAILY' | 'WEEKLY' | 'ONE_TIME';
    startDate?: string;
    endDate?: string;
    tags?: string[];
    quizConfig?: string;
    // Payment-related properties
    paymentType?: PaymentType;
    hasEntryFee?: boolean;
    entryFeeAmount?: number;
    entryFeeCurrency?: CurrencyType;
    hasPrize?: boolean;
    prizeAmount?: number;
    prizeCurrency?: CurrencyType;
    difficulty?: APIDifficulty;
    // Access control properties
    requiresApproval?: boolean;
    invitedUserIds?: number[];
    userId: string;
}

/**
 * Parameters for fetching challenges
 */
export interface GetChallengesParams {
    page?: number;
    limit?: number;
    type?: string | null;
    visibility?: string;
    status?: string;
    creator_id?: string;
    targetGroup?: string;
    participant_id?: string | undefined;
    excludeCancelled?: boolean;
}

// ============================================================================
// ACCESS CONTROL TYPES
// ============================================================================

/**
 * User who has been granted access to a private challenge
 */
export interface ChallengeAccessUser {
    /** User ID */
    id: string;
    /** Username */
    username: string;
    /** User email */
    email: string;
    /** Timestamp when access was granted */
    grantedAt: string;
    /** ID of the user who granted the access */
    grantedBy: number;
}

/**
 * Request for granting access to users
 */
export interface GrantAccessRequest {
    challengeId: string;
    userIds: number[];
}

/**
 * Request for revoking access from a user
 */
export interface RevokeAccessRequest {
    challengeId: string;
    userId: string;
}

/**
 * Response from grant/revoke access operations
 */
export interface AccessControlResponse {
    message: string;
}

/**
 * Parameters for getting accessible challenges
 */
export interface GetAccessibleChallengesParams {
    page?: number;
    size?: number;
}

// ============================================================================
// QUIZ CHALLENGE TYPES
// ============================================================================

export type ResultSharingPolicy = 
    | 'CREATOR_ONLY' 
    | 'PARTICIPANTS_ONLY' 
    | 'ALL_PARTICIPANTS' 
    | 'PUBLIC' 
    | 'NONE';

export type ParticipantConsentStatus = 
    | 'NOT_ASKED' 
    | 'PENDING' 
    | 'GRANTED' 
    | 'DENIED';

/**
 * Extended quiz configuration with participation settings
 */
export interface QuizChallengeConfig {
    // Existing fields
    defaultDifficulty: 'EASY' | 'MEDIUM' | 'HARD';
    defaultRoundTimeSeconds: number;
    defaultTotalRounds: number;
    enableAiHost: boolean;
    questionSource: string;
    allowCustomQuestions: boolean;
    gameType: string;
    teamName: string;
    teamMembers: string[];
    teamBased?: boolean;
    
    // NEW: Participation settings
    maxParticipants?: number;           // null = unlimited
    allowOpenEnrollment?: boolean;      // default true
    enrollmentDeadline?: string;        // ISO date string
    
    // NEW: Completion settings
    individualOnly?: boolean;           // force individual completion
    maxAttempts?: number;               // default 1
    shuffleQuestions?: boolean;         // randomize per participant
    
    // NEW: Result sharing
    resultSharing?: ResultSharingPolicy;
    requireResultConsent?: boolean;     // ask before sharing with creator
}

/**
 * Participant settings for a quiz
 */
export interface QuizParticipantSettings {
    id: string;
    challengeId: string;
    userId: string;
    username?: string;
    resultConsentStatus: ParticipantConsentStatus;
    attemptsUsed: number;
    lastAttemptAt?: string;
    bestScore?: number;
}

/**
 * Request to update consent
 */
export interface UpdateConsentRequest {
    challengeId: string;
    granted: boolean;
}

/**
 * Request type for creating a quiz challenge
 */
export interface CreateQuizChallengeRequest {
    title: string;
    description: string;
    visibility: 'PUBLIC' | 'PRIVATE';
    startDate?: Date;
    endDate?: Date;
    frequency?: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'ONE_TIME';
    quizConfig: QuizChallengeConfig;
    customQuestions: any[]; // CreateQuizQuestionRequest[] from quizApi
}

// ============================================================================
// VERIFICATION TYPES
// ============================================================================

/**
 * Verification response from challenge completion
 */
export interface VerificationResponse {
    success: boolean;
    isVerified: boolean;
    message: string;
    details?: Record<string, any>;
}

/**
 * Request for photo verification
 */
export interface PhotoVerificationRequest {
    challengeId: string;
    image: any;
    prompt?: string;
    aiPrompt?: string;
}

/**
 * Request for location verification
 */
export interface LocationVerificationRequest {
    challengeId: string;
    latitude: number;
    longitude: number;
    accuracy?: number;
}

// ============================================================================
// ENUM TYPES
// ============================================================================

/**
 * Challenge visibility options
 */
export type ChallengeVisibility = 'PUBLIC' | 'PRIVATE' | 'GROUP_ONLY';

/**
 * Challenge status options
 */
export type ChallengeStatus = 'OPEN' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED' | 'CANCELLED' | 'ACTIVE' | 'DRAFT';

/**
 * Challenge type options
 */
export type ChallengeType = 'QUEST' | 'QUIZ' | 'ACTIVITY_PARTNER' | 'FITNESS_TRACKING' | 'HABIT_BUILDING';

/**
 * Challenge frequency options
 */
export type ChallengeFrequency = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'ONE_TIME';

/**
 * Verification method types
 */
export type VerificationType = 'PHOTO' | 'LOCATION' | 'QUIZ' | 'MANUAL' | 'FITNESS_API' | 'ACTIVITY';

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Helper function to check if user has access to a challenge
 */
export const hasAccessToChallenge = (
    challenge: ApiChallenge,
    userId: string,
    accessList?: ChallengeAccessUser[]
): boolean => {
    // Public challenges are accessible to everyone
    if (challenge.visibility === 'PUBLIC') {
        return true;
    }

    // Creator always has access
    if (challenge.creator_id === userId) {
        return true;
    }

    // Check if user is in the access list
    if (accessList) {
        return accessList.some(user => user.id.toString() === userId);
    }

    return false;
};

/**
 * Helper function to format challenge date
 */
export const formatChallengeDate = (dateString?: string): string => {
    if (!dateString) return 'N/A';

    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
};

/**
 * Helper function to get challenge status color
 */
export const getChallengeStatusColor = (status: string): string => {
    const statusColors: Record<string, string> = {
        OPEN: '#4CAF50',
        IN_PROGRESS: '#2196F3',
        COMPLETED: '#8BC34A',
        FAILED: '#F44336',
        CANCELLED: '#9E9E9E',
        ACTIVE: '#4CAF50',
        DRAFT: '#FFC107'
    };

    return statusColors[status.toUpperCase()] || '#9E9E9E';
};

/**
 * Helper function to get visibility icon
 */
export const getVisibilityIcon = (visibility: string): string => {
    const icons: Record<string, string> = {
        PUBLIC: '🌍',
        PRIVATE: '🔒',
        GROUP_ONLY: '👥'
    };

    return icons[visibility.toUpperCase()] || '📋';
};

/**
 * Helper function to check if a challenge is a quiz
 */
export const isChallengeQuiz = (challenge: ApiChallenge): boolean => {
    return challenge.type === 'QUIZ' || !!challenge.quizConfig;
};

/**
 * Helper function to get parsed quiz config from challenge
 */
export const getChallengeQuizConfig = (challenge: ApiChallenge): QuizConfig | null => {
    return parseQuizConfig(challenge.quizConfig);
};

/**
 * Helper function to check if challenge is WWW quiz
 */
export const isChallengeWWWQuiz = (challenge: ApiChallenge): boolean => {
    const config = parseQuizConfig(challenge.quizConfig);
    return isWWWQuiz(config);
};

// ============================================================================
// QUEST AUDIO TYPES
// ============================================================================

/**
 * Quest audio configuration
 */
export interface QuestAudioConfig {
    /** ID of the audio file in media_files table */
    audioMediaId?: number;
    /** URL to stream the audio file */
    audioUrl?: string;
    /** Audio segment start time in seconds */
    audioStartTime: number;
    /** Audio segment end time in seconds (null means full duration) */
    audioEndTime?: number;
    /** Total duration of the audio file in seconds */
    totalDuration?: number;
    /** Minimum score percentage (0-100) required to complete the quest */
    minimumScorePercentage: number;
}

// ============================================================================
// CHALLENGE AUDIO TYPES (parallel to Quest audio)
// ============================================================================

/**
 * Challenge audio configuration
 */
export interface ChallengeAudioConfig {
    /** ID of the audio file in media_files table */
    audioMediaId?: number;
    /** URL to stream the audio file */
    audioUrl?: string;
    /** Audio segment start time in seconds */
    audioStartTime: number;
    /** Audio segment end time in seconds (null means full duration) */
    audioEndTime?: number;
    /** Total duration of the audio file in seconds */
    totalDuration?: number;
    /** Minimum score percentage (0-100) required to complete the challenge */
    minimumScorePercentage: number;
}

/**
 * Request to update challenge audio configuration
 */
export interface UpdateChallengeAudioConfigRequest {
    audioMediaId?: number;
    audioStartTime?: number;
    audioEndTime?: number;
    minimumScorePercentage?: number;
}

/**
 * Response from challenge audio configuration API
 */
export interface ChallengeAudioResponse {
    audioMediaId: number;
    audioUrl: string;
    audioStartTime: number;
    audioEndTime?: number;
    totalDuration: number;
    minimumScorePercentage: number;
}

/**
 * Request to update quest audio configuration
 */
export interface UpdateQuestAudioConfigRequest {
    /** Quest ID */
    questId: number;
    /** Audio configuration */
    audioConfig: {
        audioMediaId?: number;
        audioStartTime?: number;
        audioEndTime?: number;
        minimumScorePercentage?: number;
    };
}

/**
 * Response from quest audio configuration API
 */
export interface QuestAudioResponse {
    /** ID of the audio file in media_files table */
    audioMediaId: number;
    /** URL to stream the audio file */
    audioUrl: string;
    /** Audio segment start time in seconds */
    audioStartTime: number;
    /** Audio segment end time in seconds (null means full duration) */
    audioEndTime?: number;
    /** Total duration of the audio file in seconds */
    totalDuration: number;
    /** Minimum score percentage (0-100) required to complete the quest */
    minimumScorePercentage: number;
}

/**
 * Request to upload quest audio file
 */
export interface UploadQuestAudioRequest {
    /** Quest ID */
    questId: number;
    /** Audio file to upload */
    audioFile: {
        uri: string;
        name: string;
        type: string;
    };
}

/**
 * Response from audio upload
 */
export interface UploadAudioResponse {
    /** Whether upload was successful */
    success: boolean;
    /** ID of the uploaded media file */
    mediaId: string;
    /** URL to access the media file */
    mediaUrl: string;
    /** Duration of the audio in seconds */
    duration?: number;
    /** Processing status of the media file */
    processingStatus: string;
}

// ============================================================================
// AUDIO CHALLENGE TYPES
// ============================================================================

/**
 * Types of audio-based challenges
 */
export enum AudioChallengeType {
    RHYTHM_CREATION = 'RHYTHM_CREATION',
    RHYTHM_REPEAT = 'RHYTHM_REPEAT',
    SOUND_MATCH = 'SOUND_MATCH',
    SINGING = 'SINGING'
}

/**
 * Audio challenge type metadata
 */
export interface AudioChallengeTypeInfo {
    type: AudioChallengeType;
    label: string;
    description: string;
    icon: string;
    requiresReferenceAudio: boolean;
    usesPitchScoring: boolean;
    usesRhythmScoring: boolean;
    usesVoiceScoring: boolean;
}

/**
 * Audio challenge type definitions
 */
export const AUDIO_CHALLENGE_TYPES: AudioChallengeTypeInfo[] = [
    {
        type: AudioChallengeType.RHYTHM_CREATION,
        label: 'Create Rhythm',
        description: 'Create your own rhythm pattern. Scored on consistency and creativity.',
        icon: 'music-note-plus',
        requiresReferenceAudio: false,
        usesPitchScoring: false,
        usesRhythmScoring: true,
        usesVoiceScoring: false
    },
    {
        type: AudioChallengeType.RHYTHM_REPEAT,
        label: 'Repeat Rhythm',
        description: 'Listen and repeat the rhythm pattern you hear.',
        icon: 'repeat',
        requiresReferenceAudio: true,
        usesPitchScoring: false,
        usesRhythmScoring: true,
        usesVoiceScoring: false
    },
    {
        type: AudioChallengeType.SOUND_MATCH,
        label: 'Match Sound',
        description: 'Make sounds as close as possible to the reference.',
        icon: 'waveform',
        requiresReferenceAudio: true,
        usesPitchScoring: true,
        usesRhythmScoring: false,
        usesVoiceScoring: true
    },
    {
        type: AudioChallengeType.SINGING,
        label: 'Sing Along',
        description: 'Sing the song segment and receive a karaoke-style score.',
        icon: 'microphone',
        requiresReferenceAudio: true,
        usesPitchScoring: true,
        usesRhythmScoring: true,
        usesVoiceScoring: true
    }
];

/**
 * Audio challenge configuration for question creation
 */
export interface AudioChallengeConfig {
    audioChallengeType: AudioChallengeType;
    audioReferenceMediaId?: number;
    audioSegmentStart?: number;
    audioSegmentEnd?: number;
    minimumScorePercentage: number;
    rhythmBpm?: number;
    rhythmTimeSignature?: string;
}

/**
 * Audio challenge submission
 */
export interface AudioChallengeSubmission {
    id: number;
    questionId: number;
    userId: number;
    processingStatus: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
    processingProgress: number;
    overallScore?: number;
    pitchScore?: number;
    rhythmScore?: number;
    voiceScore?: number;
    passed?: boolean;
    minimumScoreRequired: number;
    detailedMetrics?: string;
    createdAt: string;
    processedAt?: string;
}

/**
 * Create audio question request
 */
export interface CreateAudioQuestionRequest {
    question: string;
    answer?: string;
    audioChallengeType: AudioChallengeType;
    topic?: string;
    difficulty?: 'EASY' | 'MEDIUM' | 'HARD';
    visibility?: 'PUBLIC' | 'PRIVATE' | 'GROUP_ONLY';
    additionalInfo?: string;
    audioSegmentStart?: number;
    audioSegmentEnd?: number;
    minimumScorePercentage?: number;
    rhythmBpm?: number;
    rhythmTimeSignature?: string;
}