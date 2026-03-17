// src/entities/QuizState/model/types/question.types.ts

import { LocalizedString } from '../../../../shared/types/localized';
import { Difficulty } from '../../../../shared/types/difficulty';

export enum QuestionVisibility {
    PRIVATE = 'PRIVATE',
    FRIENDS_FAMILY = 'FRIENDS_FAMILY',
    QUIZ_ONLY = 'QUIZ_ONLY',
    PENDING_PUBLIC = 'PENDING_PUBLIC',
    PUBLIC = 'PUBLIC'
}

export enum MediaSourceType {
    UPLOADED = 'UPLOADED',
    EXTERNAL_URL = 'EXTERNAL_URL',
    YOUTUBE = 'YOUTUBE',
    VIMEO = 'VIMEO',
    SOUNDCLOUD = 'SOUNDCLOUD'
}

export interface CreateQuizQuestionRequest {
    question: string;
    answer: string;
    difficulty?: Difficulty;
    topic?: string;
    source?: string;
    additionalInfo?: string;
    visibility: QuestionVisibility;
    originalQuizId?: number;
    // Media fields - for questions with images/videos/audio
    questionType?: string; // QuestionType enum value
    questionMediaId?: string;
    questionMediaUrl?: string;
    questionMediaType?: string; // MediaType enum value
    
    // External Media Support
    mediaSourceType?: MediaSourceType;
    externalMediaUrl?: string;
    questionVideoStartTime?: number;
    questionVideoEndTime?: number;
    answerMediaUrl?: string;
    answerVideoStartTime?: number;
    answerVideoEndTime?: number;
    answerTextVerification?: string;
    timeLimitSeconds?: number;
    acceptSimilarAnswers?: boolean;

    // New localized fields (optional for backward compatibility)
    questionLocalized?: LocalizedString;
    answerLocalized?: LocalizedString;
    additionalInfoLocalized?: LocalizedString;
    }
export interface UpdateQuestionVisibilityRequest {
    visibility: QuestionVisibility;
    originalQuizId?: number;
}

export interface QuestionSearchParams {
    keyword?: string;
    difficulty?: Difficulty;
    topic?: string;
    quizId?: number;
    page?: number;
    size?: number;
}

// Re-export relationship types for backward compatibility during migration
export {
    RelationshipType,
    RelationshipStatus
} from '../../../ContactState/model/types';

export type {
    UserRelationship,
    ContactGroup,
    UserSearchResult,
    CreateRelationshipRequest,
    UpdateRelationshipRequest,
    UserPrivacySettings,
    UserSuggestion,
    MutualConnection
} from '../../../ContactState/model/types';

// Helper functions
export const getVisibilityLabel = (visibility: QuestionVisibility): string => {
    switch (visibility) {
        case QuestionVisibility.PRIVATE:
            return 'Only Me';
        case QuestionVisibility.FRIENDS_FAMILY:
            return 'Friends & Family';
        case QuestionVisibility.QUIZ_ONLY:
            return 'This Quiz Only';
        case QuestionVisibility.PENDING_PUBLIC:
            return 'Public (Pending Review)';
        case QuestionVisibility.PUBLIC:
            return 'Everyone (Public)';
        default:
            return visibility;
    }
};

export const getVisibilityDescription = (visibility: QuestionVisibility): string => {
    switch (visibility) {
        case QuestionVisibility.PRIVATE:
            return 'Only you can see and use this question';
        case QuestionVisibility.FRIENDS_FAMILY:
            return 'You and your friends/family can use this question';
        case QuestionVisibility.QUIZ_ONLY:
            return 'Only accessible in the quiz where it was added';
        case QuestionVisibility.PENDING_PUBLIC:
            return 'Submitted for public access - awaiting moderator review';
        case QuestionVisibility.PUBLIC:
            return 'Everyone can find and use this question';
        default:
            return '';
    }
};

export const getVisibilityIcon = (visibility: QuestionVisibility): string => {
    switch (visibility) {
        case QuestionVisibility.PRIVATE:
            return '🔒';
        case QuestionVisibility.FRIENDS_FAMILY:
            return '👥';
        case QuestionVisibility.QUIZ_ONLY:
            return '🎯';
        case QuestionVisibility.PUBLIC:
            return '🌍';
        default:
            return '❓';
    }
};
