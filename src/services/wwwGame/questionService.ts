// src/services/wwwGame/questionService.ts
// COMPLETE FILE WITH ALL SEARCH METHODS

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
export interface TournamentQuestionSummaryDTO {
    id: number;
    quizQuestionId: number;
    tournamentId: number;
    tournamentTitle: string;
    displayOrder: number;
    questionPreview: string;
    difficulty: APIDifficulty;
    topic: string;
    questionType: QuestionType;
    hasMedia: boolean;
    points: number;
    isBonusQuestion: boolean;
    isMandatory: boolean;
    isActive: boolean;
    rating: number;
    hasCustomizations: boolean;
    enteredDate: string;
    updatedAt: string;
}

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

export interface TournamentQuestionDetailDTO {
    id: number;
    tournamentId: number;
    tournamentTitle: string;
    displayOrder: number;
    legacyQuestionNum: number;
    quizQuestionId: number;
    effectiveQuestion: string;
    effectiveAnswer: string;
    effectiveSources: string;
    bankQuestion: QuizQuestionDTO;
    customQuestion?: string;
    customAnswer?: string;
    customSources?: string;
    tournamentType: string;
    topicNum: number;
    notices: string;
    images: string;
    rating: number;
    points: number;
    timeLimitSeconds: number;
    isBonusQuestion: boolean;
    isMandatory: boolean;
    isActive: boolean;
    hasCustomQuestion: boolean;
    hasCustomAnswer: boolean;
    hasCustomSources: boolean;
    hasAnyCustomizations: boolean;
    hasMedia: boolean;
    enteredDate: string;
    updatedAt: string;
    addedBy: number;
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

export interface AddQuestionToTournamentRequest {
    tournamentTitle: string;
    quizQuestionId: number;
    points?: number;
}

export interface UpdateTournamentQuestionRequest {
    customQuestion?: string;
    customAnswer?: string;
    points?: number;
}

export interface TournamentQuestionStatsDTO {
    tournamentId: number;
    tournamentTitle: string;
    totalQuestions: number;
    activeQuestions: number;
    inactiveQuestions: number;
    bonusQuestions: number;
    mandatoryQuestions: number;
    questionsWithCustomizations: number;
    questionsWithMedia: number;
    totalPoints: number;
    averagePoints: number;
    minPoints: number;
    maxPoints: number;
    difficultyDistribution: Record<APIDifficulty, number>;
    questionTypeDistribution: Record<QuestionType, number>;
    topicDistribution: Record<string, number>;
    averageRating: number;
    questionsWithRating: number;
}

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

    // ==================== NEW SEARCH METHODS ====================

    /**
     * Search quiz questions with filters
     * This is the main method for searching questions
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
        try {
            const {
                keyword = '',
                difficulty,
                topic = '',
                page = 0,
                size = 50,
                store
            } = params;

            // Build query parameters
            const queryParams = new URLSearchParams();
            if (keyword) queryParams.append('keyword', keyword);
            if (difficulty) queryParams.append('difficulty', difficulty);
            if (topic) queryParams.append('topic', topic);
            queryParams.append('page', page.toString());
            queryParams.append('size', size.toString());

            const response = await fetch(
                `${this.baseUrl}/quiz-questions/search?${queryParams.toString()}`,
                {
                    method: 'GET',
                    headers: this.getAuthHeaders(store)
                }
            );

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            // Convert backend response to frontend format
            return {
                questions: data.content.map((q: any) => this.convertQuizQuestionToQuestionData(q)),
                totalElements: data.totalElements,
                totalPages: data.totalPages,
                currentPage: data.number
            };
        } catch (error) {
            console.error('Error searching questions:', error);
            throw new Error('Failed to search questions. Please try again.');
        }
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
            return ['History', 'Science', 'Geography', 'Sports', 'Arts', 'Literature'];
        }
    }

    /**
     * Get question statistics for filtering
     */
    static async getQuestionStats(store?: any): Promise<{
        totalQuestions: number;
        byDifficulty: Record<APIDifficulty, number>;
        byTopic: Record<string, number>;
    }> {
        try {
            const response = await fetch(
                `${this.baseUrl}/quiz-questions/stats`,
                {
                    method: 'GET',
                    headers: this.getAuthHeaders(store)
                }
            );

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Error fetching question stats:', error);
            return {
                totalQuestions: 0,
                byDifficulty: { EASY: 0, MEDIUM: 0, HARD: 0 },
                byTopic: {}
            };
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

    // ==================== CONVERTER METHODS ====================

    /**
     * Convert QuizQuestionDTO to QuestionData
     */
    private static convertQuizQuestionToQuestionData(dto: QuizQuestionDTO): QuestionData {
        return {
            id: dto.id.toString(),
            question: dto.question,
            answer: dto.answer,
            difficulty: this.convertToUIDifficulty(dto.difficulty),
            topic: dto.topic,
            source: dto.source,
            additionalInfo: dto.additionalInfo
        };
    }

    /**
     * Convert TournamentQuestionDetailDTO to QuestionData
     */
    private static convertDTOToQuestionData(dto: TournamentQuestionDetailDTO): QuestionData {
        return {
            id: dto.id.toString(),
            question: dto.effectiveQuestion,
            answer: dto.effectiveAnswer,
            difficulty: this.convertToUIDifficulty(dto.bankQuestion.difficulty),
            topic: dto.bankQuestion.topic,
            source: dto.effectiveSources || dto.bankQuestion.source,
            additionalInfo: dto.bankQuestion.additionalInfo
        };
    }

    /**
     * Convert API difficulty to UI difficulty
     */
    private static convertToUIDifficulty(apiDifficulty: APIDifficulty): UIDifficulty {
        const mapping: Record<APIDifficulty, UIDifficulty> = {
            'EASY': 'Easy',
            'MEDIUM': 'Medium',
            'HARD': 'Hard'
        };
        return mapping[apiDifficulty] || 'Medium';
    }

    /**
     * Convert UI difficulty to API difficulty
     */
    static convertToAPIDifficulty(uiDifficulty: UIDifficulty): APIDifficulty {
        const mapping: Record<UIDifficulty, APIDifficulty> = {
            'Easy': 'EASY',
            'Medium': 'MEDIUM',
            'Hard': 'HARD'
        };
        return mapping[uiDifficulty] || 'MEDIUM';
    }

    // ==================== TOURNAMENT METHODS (EXISTING) ====================

    /**
     * Get all questions for a tournament
     */
    static async getTournamentQuestions(
        tournamentId: number,
        store?: any
    ): Promise<TournamentQuestionSummaryDTO[]> {
        const cacheKey = `tournament_${tournamentId}_questions`;

        if (this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey);
        }

        try {
            const response = await fetch(
                `${this.baseUrl}/tournaments/${tournamentId}/questions`,
                {
                    method: 'GET',
                    headers: this.getAuthHeaders(store)
                }
            );

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const questions: TournamentQuestionSummaryDTO[] = await response.json();
            this.cache.set(cacheKey, questions);

            return questions;
        } catch (error) {
            console.error('Error fetching tournament questions:', error);
            throw error;
        }
    }

    /**
     * Get single question details
     */
    static async getQuestionDetail(
        tournamentId: number,
        questionId: number,
        store?: any
    ): Promise<TournamentQuestionDetailDTO> {
        try {
            const response = await fetch(
                `${this.baseUrl}/tournaments/${tournamentId}/questions/${questionId}`,
                {
                    method: 'GET',
                    headers: this.getAuthHeaders(store)
                }
            );

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Error fetching question detail:', error);
            throw error;
        }
    }

    /**
     * Get questions by difficulty for game play
     */
    static async getQuestionsByDifficulty(
        tournamentId: number,
        difficulty: UIDifficulty | APIDifficulty,
        count: number = 10,
        store?: any
    ): Promise<QuestionData[]> {
        try {
            const questions = await this.getTournamentQuestions(tournamentId, store);

            // Convert difficulty to API format
            const apiDifficulty = typeof difficulty === 'string' &&
            ['Easy', 'Medium', 'Hard'].includes(difficulty)
                ? this.convertToAPIDifficulty(difficulty as UIDifficulty)
                : difficulty as APIDifficulty;

            // Filter by difficulty and active status
            const filteredQuestions = questions.filter(q =>
                q.difficulty === apiDifficulty && q.isActive
            );

            // Shuffle and limit
            const shuffled = filteredQuestions.sort(() => Math.random() - 0.5);
            const limited = shuffled.slice(0, count);

            // Get detailed data for each question
            const detailedQuestions = await Promise.all(
                limited.map(q => this.getQuestionDetail(tournamentId, q.id, store))
            );

            return detailedQuestions.map(dto => this.convertDTOToQuestionData(dto));
        } catch (error) {
            console.error('Error fetching questions by difficulty:', error);
            throw error;
        }
    }

    /**
     * Add question to tournament
     */
    static async addQuestionToTournament(
        tournamentId: number,
        request: AddQuestionToTournamentRequest,
        store?: any
    ): Promise<TournamentQuestionDetailDTO> {
        try {
            const response = await fetch(
                `${this.baseUrl}/tournaments/${tournamentId}/questions`,
                {
                    method: 'POST',
                    headers: this.getAuthHeaders(store),
                    body: JSON.stringify(request)
                }
            );

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            // Clear cache
            this.cache.delete(`tournament_${tournamentId}_questions`);

            return await response.json();
        } catch (error) {
            console.error('Error adding question to tournament:', error);
            throw error;
        }
    }

    /**
     * Update tournament question
     */
    static async updateTournamentQuestion(
        tournamentId: number,
        questionId: number,
        request: UpdateTournamentQuestionRequest,
        store?: any
    ): Promise<TournamentQuestionDetailDTO> {
        try {
            const response = await fetch(
                `${this.baseUrl}/tournaments/${tournamentId}/questions/${questionId}`,
                {
                    method: 'PUT',
                    headers: this.getAuthHeaders(store),
                    body: JSON.stringify(request)
                }
            );

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            // Clear cache
            this.cache.delete(`tournament_${tournamentId}_questions`);

            return await response.json();
        } catch (error) {
            console.error('Error updating tournament question:', error);
            throw error;
        }
    }

    /**
     * Delete question from tournament
     */
    static async deleteQuestion(
        tournamentId: number,
        questionId: number,
        store?: any
    ): Promise<void> {
        try {
            const response = await fetch(
                `${this.baseUrl}/tournaments/${tournamentId}/questions/${questionId}`,
                {
                    method: 'DELETE',
                    headers: this.getAuthHeaders(store)
                }
            );

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            // Clear cache
            this.cache.delete(`tournament_${tournamentId}_questions`);
        } catch (error) {
            console.error('Error deleting question:', error);
            throw error;
        }
    }

    /**
     * Get tournament question statistics
     */
    static async getTournamentStatistics(
        tournamentId: number,
        store?: any
    ): Promise<TournamentQuestionStatsDTO> {
        try {
            const response = await fetch(
                `${this.baseUrl}/tournaments/${tournamentId}/questions/stats`,
                {
                    method: 'GET',
                    headers: this.getAuthHeaders(store)
                }
            );

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Error fetching tournament statistics:', error);
            throw error;
        }
    }

    /**
     * Reorder questions in tournament
     */
    static async reorderQuestions(
        tournamentId: number,
        questionIds: number[],
        store?: any
    ): Promise<void> {
        try {
            const response = await fetch(
                `${this.baseUrl}/tournaments/${tournamentId}/questions/reorder`,
                {
                    method: 'PUT',
                    headers: this.getAuthHeaders(store),
                    body: JSON.stringify({ questionIds })
                }
            );

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            // Clear cache
            this.cache.delete(`tournament_${tournamentId}_questions`);
        } catch (error) {
            console.error('Error reordering questions:', error);
            throw error;
        }
    }

    /**
     * Clear all cached data
     */
    static clearCache(): void {
        this.cache.clear();
    }

    /**
     * Initialize service
     */
    static initialize(): void {
        this.clearCache();
        console.log('Question Service initialized with backend integration');
    }
}

// User questions methods (if you need them)
export const getUserQuestions = async (): Promise<UserQuestion[]> => {
    // Implement if needed
    return [];
};

export const createUserQuestion = async (question: Partial<UserQuestion>): Promise<UserQuestion> => {
    // Implement if needed
    return {} as UserQuestion;
};

export const updateUserQuestion = async (id: number, question: Partial<UserQuestion>): Promise<UserQuestion> => {
    // Implement if needed
    return {} as UserQuestion;
};

export const deleteUserQuestion = async (id: number): Promise<void> => {
    // Implement if needed
};