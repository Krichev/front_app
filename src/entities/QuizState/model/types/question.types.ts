// src/entities/QuizState/model/types/question.types.ts

export enum QuestionVisibility {
    PRIVATE = 'PRIVATE',
    FRIENDS_FAMILY = 'FRIENDS_FAMILY',
    QUIZ_ONLY = 'QUIZ_ONLY',
    PUBLIC = 'PUBLIC'
}

export interface CreateQuizQuestionRequest {
    question: string;
    answer: string;
    difficulty?: 'EASY' | 'MEDIUM' | 'HARD';
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
}

export interface UpdateQuestionVisibilityRequest {
    visibility: QuestionVisibility;
    originalQuizId?: number;
}

export interface QuestionSearchParams {
    keyword?: string;
    difficulty?: 'EASY' | 'MEDIUM' | 'HARD';
    topic?: string;
    quizId?: number;
    page?: number;
    size?: number;
}

// Relationship types
export enum RelationshipType {
    FRIEND = 'FRIEND',
    FAMILY = 'FAMILY',
    BLOCKED = 'BLOCKED'
}

export enum RelationshipStatus {
    PENDING = 'PENDING',
    ACCEPTED = 'ACCEPTED',
    REJECTED = 'REJECTED'
}

export interface UserRelationship {
    id: string;
    userId: string;
    relatedUserId: string;
    relatedUserUsername: string;
    relatedUserAvatar?: string;
    relationshipType: RelationshipType;
    status: RelationshipStatus;
    createdAt: string;
}

export interface CreateRelationshipRequest {
    relatedUserId: number;
    relationshipType: RelationshipType;
}

// Helper functions
export const getVisibilityLabel = (visibility: QuestionVisibility): string => {
    switch (visibility) {
        case QuestionVisibility.PRIVATE:
            return 'Only Me';
        case QuestionVisibility.FRIENDS_FAMILY:
            return 'Friends & Family';
        case QuestionVisibility.QUIZ_ONLY:
            return 'This Quiz Only';
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