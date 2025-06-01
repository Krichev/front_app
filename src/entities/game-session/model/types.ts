// src/entities/game-session/model/types.ts
export type GameType = 'WWW' | 'MULTIPLE_CHOICE' | 'TRUE_FALSE';

export type GameStatus = 'CREATED' | 'IN_PROGRESS' | 'COMPLETED' | 'ABANDONED' | 'CANCELLED';

export type GamePhase = 'waiting' | 'question' | 'discussion' | 'answer' | 'feedback' | 'results';

export interface GameSession {
    id: string;
    challengeId?: string;
    challengeTitle?: string;
    hostUserId: string;
    hostUsername: string;
    teamName: string;
    teamMembers: string[];
    gameType: GameType;
    difficulty: 'EASY' | 'MEDIUM' | 'HARD';
    roundTimeSeconds: number;
    totalRounds: number;
    completedRounds: number;
    correctAnswers: number;
    scorePercentage: number;
    enableAiHost: boolean;
    questionSource: 'app' | 'user';
    status: GameStatus;
    phase: GamePhase;
    startedAt?: string;
    completedAt?: string;
    totalDurationSeconds?: number;
    createdAt: string;
}

export interface GameRound {
    id: string;
    gameSessionId: string;
    questionId: string;
    roundNumber: number;
    question: string;
    correctAnswer: string;
    teamAnswer?: string;
    isCorrect: boolean;
    playerWhoAnswered?: string;
    discussionNotes?: string;
    roundStartedAt?: string;
    answerSubmittedAt?: string;
    discussionDurationSeconds?: number;
    totalRoundDurationSeconds?: number;
    hintUsed: boolean;
    voiceRecordingUsed: boolean;
    aiFeedback?: string;
}

export interface PlayerPerformance {
    playerName: string;
    correctAnswers: number;
    totalAnswers: number;
    accuracy: number;
}

export interface CreateGameSessionRequest {
    challengeId?: string;
    teamName: string;
    teamMembers: string[];
    gameType: GameType;
    difficulty: 'EASY' | 'MEDIUM' | 'HARD';
    roundTimeSeconds: number;
    totalRounds: number;
    enableAiHost: boolean;
    questionSource: 'app' | 'user';
    customQuestionIds?: string[];
}

export interface SubmitRoundAnswerRequest {
    roundNumber: number;
    teamAnswer: string;
    playerWhoAnswered: string;
    discussionNotes?: string;
    hintUsed?: boolean;
    voiceRecordingUsed?: boolean;
}


