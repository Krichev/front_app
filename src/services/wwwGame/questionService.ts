// src/services/wwwGame/questionService.ts
// UPDATED VERSION WITH AUTOMATIC TOKEN REFRESH

import NetworkConfigManager from '../../config/NetworkConfig';
import {RootState, store} from '../../app/providers/StoreProvider/store';
import {logout, setTokens} from '../../entities/AuthState/model/slice/authSlice';
import {Alert} from 'react-native';
import KeychainService from "../auth/KeychainService.ts";
import {QuestionVisibility} from "../../entities/QuizState/model/types/question.types.ts";

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
    visibility: QuestionVisibility;
    topic?: string;
    additionalInfo?: string;
}

type HeadersInit_ = Record<string, string>;

export class QuestionService {
    private static baseUrl = NetworkConfigManager.getInstance().getBaseUrl();
    private static authBaseUrl = 'http://10.0.2.2:8082/challenger/api/auth'; // Your auth endpoint
    private static cache: Map<string, any> = new Map();
    private static isRefreshing = false;
    private static refreshPromise: Promise<boolean> | null = null;

    /**
     * Get authorization header with JWT token
     */
    private static getAuthHeaders(): HeadersInit_ {
        const headers: HeadersInit_ = {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        };

        try {
            const state = store.getState() as RootState;
            const token = state.auth?.accessToken;
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }
        } catch (error) {
            console.error('❌ Error getting auth headers:', error);
        }

        return headers;
    }

    /**
     * Refresh the access token using the refresh token
     */
    private static async refreshAccessToken(): Promise<boolean> {
        // If already refreshing, wait for the existing refresh to complete
        if (this.isRefreshing && this.refreshPromise) {
            return this.refreshPromise;
        }

        this.isRefreshing = true;
        this.refreshPromise = (async () => {
            try {
                const state = store.getState() as RootState;
                const refreshToken = state.auth?.refreshToken;

                if (!refreshToken) {
                    console.log('❌ No refresh token available');
                    await this.handleLogout();
                    return false;
                }

                console.log('🔄 Attempting to refresh access token...');

                const response = await fetch(`${this.authBaseUrl}/refresh-token`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    },
                    body: JSON.stringify({refreshToken})
                });

                if (response.ok) {
                    const data = await response.json();
                    const {accessToken, refreshToken: newRefreshToken, user} = data;

                    // Store the new tokens in Keychain
                    await KeychainService.saveAuthTokens({
                        accessToken,
                        refreshToken: newRefreshToken,
                        user
                    });

                    // Update Redux state with new tokens
                    store.dispatch(setTokens({
                        accessToken,
                        refreshToken: newRefreshToken,
                        user
                    }));

                    console.log('✅ Token refreshed successfully');
                    return true;
                } else {
                    console.log('❌ Token refresh failed with status:', response.status);
                    await this.handleLogout();
                    return false;
                }
            } catch (error) {
                console.error('❌ Error refreshing token:', error);
                await this.handleLogout();
                return false;
            } finally {
                this.isRefreshing = false;
                this.refreshPromise = null;
            }
        })();

        return this.refreshPromise;
    }

    /**
     * Handle logout when refresh fails
     */
    private static async handleLogout(): Promise<void> {
        store.dispatch(logout());
        await KeychainService.deleteAuthTokens()

        Alert.alert(
            'Session Expired',
            'Your session has expired. Please log in again.',
            [{text: 'OK'}]
        );
    }

    /**
     * Enhanced fetch with automatic token refresh on 401 errors
     */
    private static async fetchWithAuth(
        url: string,
        options: RequestInit = {},
        retryCount: number = 0
    ): Promise<Response> {
        const maxRetries = 1; // Only retry once after refreshing token

        // Add auth headers
        const headers = {
            ...this.getAuthHeaders(),
            ...(options.headers || {})
        };

        const response = await fetch(url, {
            ...options,
            headers
        });

        // Handle 401 Unauthorized - Token expired
        if (response.status === 401 && retryCount < maxRetries) {
            console.log('🔑 Received 401, attempting token refresh...');

            const refreshSuccess = await this.refreshAccessToken();

            if (refreshSuccess) {
                console.log('♻️ Retrying original request with new token...');
                // Retry the original request with the new token
                return this.fetchWithAuth(url, options, retryCount + 1);
            } else {
                throw new Error('Authentication failed. Please log in again.');
            }
        }

        return response;
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
     * Advanced search using QuizQuestionSearchController.advancedSearch
     * Endpoint: GET /api/quiz/questions/search/advanced
     */
    static async advancedSearchQuestions(params: {
        keyword?: string;
        difficulty?: APIDifficulty;
        topic?: string;
        isUserCreated?: boolean;
        page?: number;
        size?: number;
    }): Promise<{ content: QuestionData[]; totalElements: number; totalPages: number }> {
        try {
            const queryParams = new URLSearchParams();

            if (params.keyword) queryParams.append('keyword', params.keyword);
            if (params.difficulty) queryParams.append('difficulty', params.difficulty);
            if (params.topic) queryParams.append('topic', params.topic);
            if (params.isUserCreated !== undefined) queryParams.append('isUserCreated', params.isUserCreated.toString());
            queryParams.append('page', (params.page ?? 0).toString());
            queryParams.append('size', (params.size ?? 20).toString());

            const url = `${this.baseUrl}/quiz-questions/search/advanced?${queryParams.toString()}`;
            const response = await this.fetchWithAuth(url, {
                method: 'GET'
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            return {
                content: data.content.map((q: any) => this.convertQuizQuestionToQuestionData(q)),
                totalElements: data.totalElements,
                totalPages: data.totalPages
            };
        } catch (error) {
            console.error('❌ Error in advanced search:', error);
            throw new Error('Failed to search questions. Please try again.');
        }
    }

    /**
     * Get all available topics
     */
    static async getAvailableTopics(): Promise<string[]> {
        try {
            const url = `${this.baseUrl}/quiz-questions/topics`;
            const response = await this.fetchWithAuth(url, {
                method: 'GET'
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            console.log(response.headers)
            const topics: string[] = await response.json();
            return topics.filter(t => t && t.trim() !== '');
        } catch (error) {
            console.error('❌ Error fetching topics:', error);
            return ['History', 'Science', 'Geography', 'Sports', 'Arts', 'Literature',
                'Technology', 'Entertainment', 'Nature', 'Culture'];
        }
    }

    /**
     * Fetch random questions
     */
    static async fetchRandomQuestions(
        count: number = 50,
        difficulty?: APIDifficulty
    ): Promise<QuestionData[]> {
        try {
            const queryParams = new URLSearchParams();
            queryParams.append('count', count.toString());
            if (difficulty) queryParams.append('difficulty', difficulty);

            const url = `${this.baseUrl}/quiz-questions/random?${queryParams.toString()}`;
            const response = await this.fetchWithAuth(url, {
                method: 'GET'
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const questions = await response.json();
            return questions.map((q: any) => this.convertQuizQuestionToQuestionData(q));
        } catch (error) {
            console.error('❌ Error fetching random questions:', error);
            throw new Error('Failed to fetch questions. Please try again.');
        }
    }

    /**
     * Get questions by difficulty
     */
    static async getQuestionsByDifficulty(
        difficulty: UIDifficulty,
        count: number = 20
    ): Promise<QuestionData[]> {
        const apiDifficulty = DIFFICULTY_MAPPING[difficulty];
        return this.fetchRandomQuestions(count, apiDifficulty);
    }

    /**
     * Create a new user question
     */
    static async createUserQuestion(question: Omit<UserQuestion, 'id'>): Promise<UserQuestion> {
        try {
            const url = `${this.baseUrl}/quiz-questions/user`;
            const response = await this.fetchWithAuth(url, {
                method: 'POST',
                body: JSON.stringify(question)
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('❌ Error creating user question:', error);
            throw new Error('Failed to create question. Please try again.');
        }
    }

    /**
     * Get user's own questions
     */
    static async getUserQuestions(): Promise<UserQuestion[]> {
        try {
            const url = `${this.baseUrl}/quiz-questions/user/my-questions`;
            const response = await this.fetchWithAuth(url, {
                method: 'GET'
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('❌ Error fetching user questions:', error);
            throw new Error('Failed to fetch your questions. Please try again.');
        }
    }

    /**
     * Update a user question
     */
    static async updateUserQuestion(id: number, question: Partial<UserQuestion>): Promise<UserQuestion> {
        try {
            const url = `${this.baseUrl}/quiz-questions/user/${id}`;
            const response = await this.fetchWithAuth(url, {
                method: 'PUT',
                body: JSON.stringify(question)
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('❌ Error updating user question:', error);
            throw new Error('Failed to update question. Please try again.');
        }
    }

    /**
     * Delete a user question
     */
    static async deleteUserQuestion(id: number): Promise<void> {
        try {
            const url = `${this.baseUrl}/quiz-questions/user/${id}`;
            const response = await this.fetchWithAuth(url, {
                method: 'DELETE'
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
        } catch (error) {
            console.error('❌ Error deleting user question:', error);
            throw new Error('Failed to delete question. Please try again.');
        }
    }
}