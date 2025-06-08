// src/entities/question/model/types.ts

export type QuestionDifficulty = 'Easy' | 'Medium' | 'Hard';

export interface Question {
    id: string;
    question: string;
    answer: string;
    difficulty: QuestionDifficulty;
    topic?: string;
    source?: string;
    additionalInfo?: string;
    isUserCreated: boolean;
    creatorId?: string;
    externalId?: string;
    usageCount: number;
    createdAt: string;
    lastUsed?: string;
}

export interface UserQuestion extends Question {
    isUserCreated: true;
    creatorId: string;
}

export interface CreateQuestionRequest {
    question: string;
    answer: string;
    difficulty: QuestionDifficulty;
    topic?: string;
    source?: string;
    additionalInfo?: string;
}

export interface UpdateQuestionRequest {
    id: string;
    question?: string;
    answer?: string;
    difficulty?: QuestionDifficulty;
    topic?: string;
    source?: string;
    additionalInfo?: string;
}

export interface QuestionFilters {
    difficulty?: QuestionDifficulty;
    topic?: string;
    isUserCreated?: boolean;
    creatorId?: string;
    search?: string;
    limit?: number;
    offset?: number;
}