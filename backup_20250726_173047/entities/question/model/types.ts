// src/entities/question/model/types.ts

/**
 * Question difficulty levels
 */
export type QuestionDifficulty = 'Easy' | 'Medium' | 'Hard';

/**
 * Question source formats
 */
export type QuestionSourceFormat = 'xml' | 'json' | 'api' | 'csv' | 'txt';

/**
 * Main question interface
 */
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
    updatedAt?: string;
}

/**
 * Extended question data with additional metadata
 */
export interface QuestionData extends Question {
    category?: string;
    hints?: string[];
    alternativeAnswers?: string[];
    tags?: string[];
    imageUrl?: string;
    audioUrl?: string;
    explanation?: string;
    references?: string[];
    estimatedTime?: number; // in seconds
    points?: number;
    isActive?: boolean;
}

/**
 * User-created question interface
 */
export interface UserQuestion extends Question {
    isUserCreated: true;
    creatorId: string;
    isPublic?: boolean;
    likes?: number;
    reports?: number;
    moderationStatus?: 'pending' | 'approved' | 'rejected';
}

/**
 * Parsed question from external sources
 */
export interface ParsedQuestion {
    id: string;
    question: string;
    answer: string;
    source: string;
    additionalInfo: string;
    topic: string;
    difficulty?: QuestionDifficulty;
    category?: string;
    rawData?: Record<string, any>;
}

/**
 * Question source configuration
 */
export interface QuestionSource {
    id: string;
    name: string;
    url: string;
    format: QuestionSourceFormat;
    category: string;
    isActive: boolean;
    lastSync?: string;
    totalQuestions?: number;
    syncInterval?: number; // in minutes
    apiKey?: string;
    headers?: Record<string, string>;
    mapping?: QuestionSourceMapping;
}

/**
 * Mapping for question source fields
 */
export interface QuestionSourceMapping {
    question: string;
    answer: string;
    difficulty?: string;
    topic?: string;
    category?: string;
    additionalInfo?: string;
    hints?: string;
    tags?: string;
}

/**
 * Question category
 */
export interface QuestionCategory {
    id: string;
    name: string;
    description: string;
    color: string;
    icon: string;
    parentId?: string;
    order?: number;
    isActive?: boolean;
    questionCount?: number;
}

/**
 * Question state for Redux store
 */
export interface QuestionState {
    questions: QuestionData[];
    currentQuestion: QuestionData | null;
    selectedQuestions: QuestionData[];
    isLoading: boolean;
    error: string | null;
    sources: QuestionSource[];
    categories: QuestionCategory[];
    difficulty: QuestionDifficulty | null;
    selectedCategory: string | null;
    filters: QuestionFilters;
    searchQuery: string;
    totalCount: number;
    hasNextPage: boolean;
    currentPage: number;
}

/**
 * Answer validation result
 */
export interface AnswerValidationResult {
    isCorrect: boolean;
    similarity: number;
    normalizedUserAnswer: string;
    normalizedCorrectAnswer: string;
    feedback?: string;
    suggestions?: string[];
    partialCredit?: number; // 0-1 scale
    timeSpent?: number; // in seconds
    attempts?: number;
}

/**
 * Question analysis result
 */
export interface QuestionAnalysis {
    mentionedCorrectAnswer: boolean;
    potentialAnswers: string[];
    confidence: number;
    suggestions: string[];
    complexity: 'low' | 'medium' | 'high';
    keyPhrases: string[];
    sentiment?: 'positive' | 'negative' | 'neutral';
}

/**
 * Create question request
 */
export interface CreateQuestionRequest {
    question: string;
    answer: string;
    difficulty: QuestionDifficulty;
    topic?: string;
    source?: string;
    additionalInfo?: string;
    category?: string;
    hints?: string[];
    alternativeAnswers?: string[];
    tags?: string[];
    isPublic?: boolean;
    estimatedTime?: number;
    points?: number;
}

/**
 * Update question request
 */
export interface UpdateQuestionRequest {
    id: string;
    question?: string;
    answer?: string;
    difficulty?: QuestionDifficulty;
    topic?: string;
    source?: string;
    additionalInfo?: string;
    category?: string;
    hints?: string[];
    alternativeAnswers?: string[];
    tags?: string[];
    isPublic?: boolean;
    estimatedTime?: number;
    points?: number;
    isActive?: boolean;
}

/**
 * Question filters for searching and filtering
 */
export interface QuestionFilters {
    difficulty?: QuestionDifficulty[];
    topic?: string[];
    category?: string[];
    tags?: string[];
    isUserCreated?: boolean;
    creatorId?: string;
    source?: string[];
    search?: string;
    dateFrom?: string;
    dateTo?: string;
    minUsageCount?: number;
    maxUsageCount?: number;
    hasHints?: boolean;
    hasAlternativeAnswers?: boolean;
    isActive?: boolean;
    limit?: number;
    offset?: number;
    sortBy?: QuestionSortField;
    sortOrder?: 'asc' | 'desc';
}

/**
 * Question sort fields
 */
export type QuestionSortField =
    | 'createdAt'
    | 'updatedAt'
    | 'lastUsed'
    | 'usageCount'
    | 'difficulty'
    | 'topic'
    | 'category'
    | 'question'
    | 'likes'
    | 'points';

/**
 * Question statistics
 */
export interface QuestionStatistics {
    totalQuestions: number;
    byDifficulty: Record<QuestionDifficulty, number>;
    byCategory: Record<string, number>;
    byTopic: Record<string, number>;
    userCreated: number;
    averageUsageCount: number;
    mostUsedQuestion: QuestionData | null;
    recentlyAdded: QuestionData[];
}

/**
 * Question search result
 */
export interface QuestionSearchResult {
    questions: QuestionData[];
    totalCount: number;
    facets: {
        difficulties: Array<{ value: QuestionDifficulty; count: number }>;
        categories: Array<{ value: string; count: number }>;
        topics: Array<{ value: string; count: number }>;
        sources: Array<{ value: string; count: number }>;
    };
    suggestions: string[];
}

/**
 * Question import/export interfaces
 */
export interface QuestionImportRequest {
    questions: CreateQuestionRequest[];
    sourceId?: string;
    overwriteExisting?: boolean;
    validateBeforeImport?: boolean;
}

export interface QuestionImportResult {
    imported: number;
    skipped: number;
    errors: Array<{
        question: CreateQuestionRequest;
        error: string;
    }>;
    warnings: string[];
}

export interface QuestionExportRequest {
    filters?: QuestionFilters;
    format: 'json' | 'csv' | 'xml';
    includeMetadata?: boolean;
    includeStatistics?: boolean;
}

/**
 * Question validation rules
 */
export interface QuestionValidationRules {
    minQuestionLength: number;
    maxQuestionLength: number;
    minAnswerLength: number;
    maxAnswerLength: number;
    allowEmptyTopic: boolean;
    allowEmptyCategory: boolean;
    requireDifficulty: boolean;
    maxHints: number;
    maxAlternativeAnswers: number;
    maxTags: number;
    bannedWords: string[];
    requiredFields: (keyof CreateQuestionRequest)[];
}

/**
 * Question performance metrics
 */
export interface QuestionPerformance {
    questionId: string;
    totalAttempts: number;
    correctAttempts: number;
    averageTime: number;
    averageSimilarity: number;
    successRate: number;
    difficultyRating: number;
    userFeedback: Array<{
        userId: string;
        rating: number;
        comment?: string;
        timestamp: string;
    }>;
}

/**
 * Question recommendation
 */
export interface QuestionRecommendation {
    question: QuestionData;
    reason: string;
    score: number;
    factors: Array<{
        name: string;
        value: number;
        weight: number;
    }>;
}