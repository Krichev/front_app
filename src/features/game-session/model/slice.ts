// src/features/game-session/model/slice.ts
import {createSlice, PayloadAction} from '@reduxjs/toolkit';
import type {GameSession, GameSessionConfig, GameSessionState} from './types';
import type {QuestionData} from '../../../entities/question';

const initialState: GameSessionState = {
    currentSession: null,
    sessions: [],
    isLoading: false,
    error: null,
    isPaused: false,
    timer: {
        isRunning: false,
        timeRemaining: 0,
        questionStartTime: 0,
    },
};

export const gameSessionSlice = createSlice({
    name: 'gameSession',
    initialState,
    reducers: {
        // Session lifecycle
        startSession: (state, action: PayloadAction<{
            userId: string;
            config: GameSessionConfig;
            questions: QuestionData[];
            challengeId?: string;
        }>) => {
            const { userId, config, questions, challengeId } = action.payload;
            const now = new Date().toISOString();

            const newSession: GameSession = {
                id: `session_${Date.now()}`,
                userId,
                challengeId,
                config,
                status: 'active',
                questions,
                currentQuestionIndex: 0,
                answers: {},
                timeRemaining: config.timeLimit,
                startTime: now,
                stats: {
                    totalQuestions: questions.length,
                    answeredQuestions: 0,
                    correctAnswers: 0,
                    incorrectAnswers: 0,
                    skippedQuestions: 0,
                    averageTimePerQuestion: 0,
                    totalTimeSpent: 0,
                    accuracy: 0,
                    score: 0,
                },
            };

            state.currentSession = newSession;
            state.isPaused = false;
            state.timer.isRunning = true;
            state.timer.timeRemaining = config.timeLimit || 0;
            state.timer.questionStartTime = Date.now();
        },

        pauseSession: (state) => {
            if (state.currentSession && state.currentSession.status === 'active') {
                state.currentSession.status = 'paused';
                state.isPaused = true;
                state.timer.isRunning = false;
            }
        },

        resumeSession: (state) => {
            if (state.currentSession && state.currentSession.status === 'paused') {
                state.currentSession.status = 'active';
                state.isPaused = false;
                state.timer.isRunning = true;
                state.timer.questionStartTime = Date.now();
            }
        },

        endSession: (state, action: PayloadAction<{ reason: 'completed' | 'failed' | 'timeout' }>) => {
            if (state.currentSession) {
                state.currentSession.status = action.payload.reason === 'completed' ? 'completed' : 'failed';
                state.currentSession.endTime = new Date().toISOString();
                state.timer.isRunning = false;
                state.isPaused = false;

                // Add to sessions history
                state.sessions.push(state.currentSession);
            }
        },

        // Question navigation
        answerQuestion: (state, action: PayloadAction<{
            questionId: string;
            answer: string;
            isCorrect: boolean;
            timeSpent: number;
        }>) => {
            if (!state.currentSession) return;

            const { questionId, answer, isCorrect, timeSpent } = action.payload;

            // Record answer
            state.currentSession.answers[questionId] = answer;

            // Update stats
            state.currentSession.stats.answeredQuestions++;
            if (isCorrect) {
                state.currentSession.stats.correctAnswers++;
            } else {
                state.currentSession.stats.incorrectAnswers++;
            }

            // Update timing stats
            state.currentSession.stats.totalTimeSpent += timeSpent;
            state.currentSession.stats.averageTimePerQuestion =
                state.currentSession.stats.totalTimeSpent / state.currentSession.stats.answeredQuestions;

            // Update accuracy
            state.currentSession.stats.accuracy =
                (state.currentSession.stats.correctAnswers / state.currentSession.stats.answeredQuestions) * 100;

            // Calculate score (you can customize this formula)
            state.currentSession.stats.score =
                state.currentSession.stats.correctAnswers * 10 -
                state.currentSession.stats.incorrectAnswers * 2;
        },

        skipQuestion: (state, action: PayloadAction<{ questionId: string }>) => {
            if (!state.currentSession) return;

            state.currentSession.stats.skippedQuestions++;
            // Move to next question in the UI layer
        },

        nextQuestion: (state) => {
            if (!state.currentSession) return;

            if (state.currentSession.currentQuestionIndex < state.currentSession.questions.length - 1) {
                state.currentSession.currentQuestionIndex++;
                state.timer.questionStartTime = Date.now();
            } else {
                // Session completed
                state.currentSession.status = 'completed';
                state.currentSession.endTime = new Date().toISOString();
                state.timer.isRunning = false;
                state.sessions.push(state.currentSession);
            }
        },

        previousQuestion: (state) => {
            if (!state.currentSession) return;

            if (state.currentSession.currentQuestionIndex > 0) {
                state.currentSession.currentQuestionIndex--;
                state.timer.questionStartTime = Date.now();
            }
        },

        // Timer management
        updateTimer: (state, action: PayloadAction<number>) => {
            if (state.timer.isRunning && state.currentSession?.config.timeLimit) {
                state.timer.timeRemaining = action.payload;
                state.currentSession.timeRemaining = action.payload;

                if (action.payload <= 0) {
                    // Time's up
                    state.currentSession.status = 'failed';
                    state.currentSession.endTime = new Date().toISOString();
                    state.timer.isRunning = false;
                    state.sessions.push(state.currentSession);
                }
            }
        },

        // Session management
        loadSessions: (state, action: PayloadAction<GameSession[]>) => {
            state.sessions = action.payload;
        },

        setCurrentSession: (state, action: PayloadAction<GameSession | null>) => {
            state.currentSession = action.payload;
            if (action.payload) {
                state.timer.isRunning = action.payload.status === 'active';
                state.timer.timeRemaining = action.payload.timeRemaining || 0;
                state.isPaused = action.payload.status === 'paused';
            }
        },

        // Error and loading states
        setLoading: (state, action: PayloadAction<boolean>) => {
            state.isLoading = action.payload;
            if (action.payload) {
                state.error = null;
            }
        },

        setError: (state, action: PayloadAction<string>) => {
            state.error = action.payload;
            state.isLoading = false;
        },

        clearError: (state) => {
            state.error = null;
        },

        reset: () => initialState,
    },
});

export const gameSessionActions = gameSessionSlice.actions;