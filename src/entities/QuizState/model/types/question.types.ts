// src/entities/QuizState/model/types/question.types.ts

export enum QuestionVisibility {
    PRIVATE = 'PRIVATE',
    FRIENDS_FAMILY = 'FRIENDS_FAMILY',
    QUIZ_ONLY = 'QUIZ_ONLY',
    PENDING_PUBLIC = 'PENDING_PUBLIC',
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
    COLLEAGUE = 'COLLEAGUE',
    CLASSMATE = 'CLASSMATE',
    FRIEND = 'FRIEND',
    CLOSE_FRIEND = 'CLOSE_FRIEND',
    FAMILY_PARENT = 'FAMILY_PARENT',
    FAMILY_SIBLING = 'FAMILY_SIBLING',
    FAMILY_EXTENDED = 'FAMILY_EXTENDED',
    PARTNER = 'PARTNER',
    ACQUAINTANCE = 'ACQUAINTANCE',
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
    nickname?: string;
    notes?: string;
    isFavorite: boolean;
    createdAt: string;
}

export interface ContactGroup {
    id: string;
    name: string;
    color?: string;
    icon?: string;
    memberCount: number;
}

export interface UserSearchResult {
    id: string;
    username: string;
    avatar?: string;
    bio?: string;
    mutualConnectionsCount: number;
    connectionStatus?: 'NONE' | 'PENDING_SENT' | 'PENDING_RECEIVED' | 'CONNECTED';
}

export interface CreateRelationshipRequest {
    relatedUserId: string | number;
    relationshipType: RelationshipType;
    nickname?: string;
}

export interface UpdateRelationshipRequest {
    relationshipType?: RelationshipType;
    nickname?: string;
    notes?: string;
    isFavorite?: boolean;
}

export interface UserPrivacySettings {
    allowRequestsFrom: string;
    showConnections: boolean;
    showMutualConnections: boolean;
}

export interface UserSuggestion {
    id: string;
    username: string;
    avatar?: string;
    mutualConnectionsCount: number;
}

export interface MutualConnection {
    id: string;
    username: string;
    avatar?: string;
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