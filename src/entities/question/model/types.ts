// src/entities/question/model/types.ts
export type QuestionDifficulty = 'Easy' | 'Medium' | 'Hard';

export interface QuestionData {
    id: string;
    question: string;
    answer: string;
    source?: string;
    additionalInfo?: string;
    topic?: string;
    difficulty?: QuestionDifficulty;
    category?: string;
    hints?: string[];
    alternativeAnswers?: string[];
}

export interface ParsedQuestion {
    id: string;
    question: string;
    answer: string;
    source: string;
    additionalInfo: string;
    topic: string;
}

export interface QuestionSource {
    id: string;
    name: string;
    url: string;
    format: 'xml' | 'json' | 'api';
    category: string;
    isActive: boolean;
}

export interface QuestionCategory {
    id: string;
    name: string;
    description: string;
    color: string;
    icon: string;
}

export interface QuestionState {
    questions: QuestionData[];
    currentQuestion: QuestionData | null;
    isLoading: boolean;
    error: string | null;
    sources: QuestionSource[];
    categories: QuestionCategory[];
    difficulty: QuestionDifficulty | null;
    selectedCategory: string | null;
}

export interface AnswerValidationResult {
    isCorrect: boolean;
    similarity: number;
    normalizedUserAnswer: string;
    normalizedCorrectAnswer: string;
    feedback?: string;
}

export interface QuestionAnalysis {
    mentionedCorrectAnswer: boolean;
    potentialAnswers: string[];
    confidence: number;
    suggestions: string[];
}