// src/services/wwwGame/questionService.ts
// UPDATED VERSION WITH ADVANCED SEARCH METHOD

import NetworkConfigManager from '../../config/NetworkConfig';
import {RootState} from '../../app/providers/StoreProvider/store';

// Types matching backend DTOs
export type UIDifficulty = 'Easy' | 'Medium' | 'Hard';
export type APIDifficulty = 'EASY' | 'MEDIUM' | 'HARD';

export enum QuestionType {
    WHAT_WHERE_WHEN = 'WHAT_WHERE_WHEN',
    BLITZ = 'BLITZ',
    OWN_QUESTION = 'OWN_QUESTION',
    STANDARD = 'STANDARD'
}

export enum MediaType {
    IMAGE = 'IMAGE',
    AUDIO = 'AUDIO',
    VIDEO = 'VIDEO'
}

// Difficulty mapping
export const DIFFICULTY_MAPPING = {
    'Easy': 'EASY' as const,
    'Medium': 'MEDIUM' as const,
    'Hard': 'HARD' as const,
    'EASY': 'Easy' as const,
    'MEDIUM': 'Medium' as const,
    'HARD': 'Hard' as const
};

// Backend DTO interfaces
export interface QuizQuestionDTO {
    id: number;
    question: string;
    answer: string;
    difficulty: APIDifficulty;
    topic: string;
    source: string;
    authors: string;
    comments: string;
    passCriteria: string;
    additionalInfo: string;
    questionType: QuestionType;
    questionMediaUrl?: string;
    questionMediaId?: string;
    questionMediaType?: MediaType;
    questionThumbnailUrl?: string;
    usageCount: number;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

// Frontend interface for compatibility
export interface QuestionData {
    id: string;
    question: string;
    answer: string;
    difficulty?: UIDifficulty;
    source?: string;
    additionalInfo?: string;
    topic?: string;
}

export interface UserQuestion {
    id: number;
    question: string;
    answer: string;
    difficulty: APIDifficulty;
    topic?: string;
    additionalInfo?: string;
}

type HeadersInit_ = Record<string, string>;

export class QuestionService {
    private static baseUrl = NetworkConfigManager.getInstance().getBaseUrl();
    private static cache: Map<string, any> = new Map();

    /**
     * Get authorization header with JWT token
     */
    private static getAuthHeaders(store?: any): HeadersInit_ {
        const headers: HeadersInit_ = {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        };

        try {
            if (store) {
                const state = store.getState() as RootState;
                const token = state.auth?.accessToken;
                if (token) {
                    headers['Authorization'] = `Bearer ${token}`;
                }
            }
        } catch (error) {
            console.error('Error getting auth headers:', error);
        }

        return headers;
    }

    /**
     * Convert backend QuizQuestionDTO to frontend QuestionData format
     */
    private static convertQuizQuestionToQuestionData(quizQuestion: QuizQuestionDTO): QuestionData {
        return {
            id: quizQuestion.id.toString(),
            question: quizQuestion.question,
            answer: quizQuestion.answer,
            difficulty: DIFFICULTY_MAPPING[quizQuestion.difficulty],
            source: quizQuestion.source,
            additionalInfo: quizQuestion.additionalInfo,
            topic: quizQuestion.topic
        };
    }

    /**
     * NEW: Advanced search using QuizQuestionSearchController.advancedSearch
     * Endpoint: GET /api/quiz/questions/search/advanced
     */
    static async advancedSearchQuestions(params: {
        keyword?: string;
        difficulty?: APIDifficulty;
        topic?: string;
        isUserCreated?: boolean;
        page?: number;
        size?: number;
        store?: any;
    }): Promise<{
        questions: QuestionData[];
        totalElements: number;
        totalPages: number;
        currentPage: number;
    }> {
        try {
            const {
                keyword,
                difficulty,
                topic,
                isUserCreated,
                page = 0,
                size = 20,
                store
            } = params;

            // Build query parameters for advanced search
            const queryParams = new URLSearchParams();
            if (keyword && keyword.trim()) {
                queryParams.append('keyword', keyword.trim());
            }
            if (difficulty) {
                queryParams.append('difficulty', difficulty);
            }
            if (topic && topic.trim()) {
                queryParams.append('topic', topic.trim());
            }
            if (isUserCreated !== undefined) {
                queryParams.append('isUserCreated', isUserCreated.toString());
            }
            queryParams.append('page', page.toString());
            queryParams.append('size', size.toString());

            const url = `${this.baseUrl}/quiz/questions/search/advanced?${queryParams.toString()}`;
            console.log('Advanced search URL:', url);

            const response = await fetch(url, {
                method: 'GET',
                headers: this.getAuthHeaders(store)
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error('Advanced search error:', response.status, errorText);
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            console.log('Advanced search response:', data);

            // The advancedSearch endpoint returns List<QuizQuestion>, not a Page object
            // So we need to handle it differently
            if (Array.isArray(data)) {
                // Direct array response
                const questions = data.map(q => this.convertQuizQuestionToQuestionData(q));
                return {
                    questions,
                    totalElements: questions.length,
                    totalPages: 1,
                    currentPage: 0
                };
            } else if (data.content) {
                // Paginated response
                return {
                    questions: data.content.map((q: any) => this.convertQuizQuestionToQuestionData(q)),
                    totalElements: data.totalElements || data.content.length,
                    totalPages: data.totalPages || 1,
                    currentPage: data.number || 0
                };
            } else {
                // Unexpected format
                console.warn('Unexpected response format from advanced search');
                return {
                    questions: [],
                    totalElements: 0,
                    totalPages: 0,
                    currentPage: 0
                };
            }
        } catch (error) {
            console.error('Error in advanced search:', error);
            throw new Error('Failed to search questions. Please check your connection and try again.');
        }
    }

    /**
     * UPDATED: Search quiz questions with filters (kept for backward compatibility)
     * Now uses advancedSearchQuestions internally
     */
    static async searchQuestions(params: {
        keyword?: string;
        difficulty?: APIDifficulty;
        topic?: string;
        page?: number;
        size?: number;
        store?: any;
    }): Promise<{
        questions: QuestionData[];
        totalElements: number;
        totalPages: number;
        currentPage: number;
    }> {
        // Delegate to advancedSearchQuestions
        return this.advancedSearchQuestions({
            ...params,
            isUserCreated: false  // Only search app questions by default
        });
    }

    /**
     * Get available topics for filtering
     */
    static async getAvailableTopics(store?: any): Promise<string[]> {
        try {
            const response = await fetch(
                `${this.baseUrl}/quiz-questions/topics`,
                {
                    method: 'GET',
                    headers: this.getAuthHeaders(store)
                }
            );

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const topics: string[] = await response.json();
            return topics.filter(t => t && t.trim() !== '');
        } catch (error) {
            console.error('Error fetching topics:', error);
            // Return some default topics if API fails
            return ['History', 'Science', 'Geography', 'Sports', 'Arts', 'Literature',
                'Technology', 'Entertainment', 'Nature', 'Culture'];
        }
    }

    /**
     * Fetch random questions (for backward compatibility)
     */
    static async fetchRandomQuestions(
        count: number = 50,
        difficulty?: APIDifficulty,
        store?: any
    ): Promise<QuestionData[]> {
        try {
            const queryParams = new URLSearchParams();
            queryParams.append('count', count.toString());
            if (difficulty) queryParams.append('difficulty', difficulty);

            const response = await fetch(
                `${this.baseUrl}/quiz-questions/random?${queryParams.toString()}`,
                {
                    method: 'GET',
                    headers: this.getAuthHeaders(store)
                }
            );

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const questions = await response.json();
            return questions.map((q: any) => this.convertQuizQuestionToQuestionData(q));
        } catch (error) {
            console.error('Error fetching random questions:', error);
            throw new Error('Failed to fetch questions. Please try again.');
        }
    }

    /**
     * Get questions by difficulty
     */
    static async getQuestionsByDifficulty(
        difficulty: UIDifficulty,
        count: number = 20,
        store?: any
    ): Promise<QuestionData[]> {
        const apiDifficulty = DIFFICULTY_MAPPING[difficulty];
        return this.fetchRandomQuestions(count, apiDifficulty, store);
    }
}