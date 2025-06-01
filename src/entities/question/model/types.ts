// src/entities/question/model/types.ts
export interface Question {
    id: string;
    question: string;
    answer: string;
    difficulty: 'EASY' | 'MEDIUM' | 'HARD';
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

export interface CreateQuestionRequest {
    question: string;
    answer: string;
    difficulty: 'EASY' | 'MEDIUM' | 'HARD';
    topic?: string;
    source?: string;
    additionalInfo?: string;
}

export interface QuestionFilters {
    difficulty?: 'EASY' | 'MEDIUM' | 'HARD';
    topic?: string;
    isUserCreated?: boolean;
    search?: string;
    limit?: number;
}



