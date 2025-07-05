// src/features/game-session/model/types.ts
import type {QuestionData} from '../../../entities/question';

export type GameSessionStatus = 'idle' | 'active' | 'paused' | 'completed' | 'failed';
export type GameMode = 'single' | 'multiplayer' | 'challenge' | 'practice';

export interface GameSessionConfig {
    mode: GameMode;
    timeLimit?: number;
    questionCount: number;
    difficulty?: 'easy' | 'medium' | 'hard';
    categories?: string[];
    allowPause: boolean;
    showHints: boolean;
}

export interface GameSessionStats {
    totalQuestions: number;
    answeredQuestions: number;
    correctAnswers: number;
    incorrectAnswers: number;
    skippedQuestions: number;
    averageTimePerQuestion: number;
    totalTimeSpent: number;
    accuracy: number;
    score: number;
}

export interface GameSession {
    id: string;
    userId: string;
    challengeId?: string;
    config: GameSessionConfig;
    status: GameSessionStatus;
    questions: QuestionData[];
    currentQuestionIndex: number;
    answers: Record<string, string>; // questionId -> userAnswer
    timeRemaining?: number;
    startTime: string;
    endTime?: string;
    stats: GameSessionStats;
    metadata?: Record<string, any>;
}

export interface GameSessionState {
    currentSession: GameSession | null;
    sessions: GameSession[];
    isLoading: boolean;
    error: string | null;
    isPaused: boolean;
    timer: {
        isRunning: boolean;
        timeRemaining: number;
        questionStartTime: number;
    };
}