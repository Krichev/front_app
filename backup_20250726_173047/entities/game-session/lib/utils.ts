// src/entities/game-session/lib/utils.ts
import type {GamePhase, GameRound, GameSession, PlayerPerformance} from '../model/types';
import {createSlice, PayloadAction} from "@reduxjs/toolkit";

interface GameSessionState {
    currentSession: GameSession | null;
    currentRounds: GameRound[];
    currentRoundIndex: number;
    timeRemaining: number;
    playerPerformances: PlayerPerformance[];
    isLoading: boolean;
    error: string | null;
}

const initialState: GameSessionState = {
    currentSession: null,
    currentRounds: [],
    currentRoundIndex: 0,
    timeRemaining: 0,
    playerPerformances: [],
    isLoading: false,
    error: null,
};

export const gameSessionSlice = createSlice({
    name: 'gameSession',
    initialState,
    reducers: {
        setCurrentSession: (state, action: PayloadAction<GameSession | null>) => {
            state.currentSession = action.payload;
        },
        updateCurrentSession: (state, action: PayloadAction<Partial<GameSession>>) => {
            if (state.currentSession) {
                state.currentSession = { ...state.currentSession, ...action.payload };
            }
        },
        setGamePhase: (state, action: PayloadAction<GamePhase>) => {
            if (state.currentSession) {
                state.currentSession.phase = action.payload;
            }
        },
        setCurrentRounds: (state, action: PayloadAction<GameRound[]>) => {
            state.currentRounds = action.payload;
        },
        updateCurrentRound: (state, action: PayloadAction<Partial<GameRound>>) => {
            const currentRound = state.currentRounds[state.currentRoundIndex];
            if (currentRound) {
                state.currentRounds[state.currentRoundIndex] = {
                    ...currentRound,
                    ...action.payload,
                };
            }
        },
        setCurrentRoundIndex: (state, action: PayloadAction<number>) => {
            state.currentRoundIndex = action.payload;
        },
        nextRound: (state) => {
            if (state.currentRoundIndex < state.currentRounds.length - 1) {
                state.currentRoundIndex += 1;
            }
        },
        setTimeRemaining: (state, action: PayloadAction<number>) => {
            state.timeRemaining = action.payload;
        },
        decrementTime: (state) => {
            if (state.timeRemaining > 0) {
                state.timeRemaining -= 1;
            }
        },
        setPlayerPerformances: (state, action: PayloadAction<PlayerPerformance[]>) => {
            state.playerPerformances = action.payload;
        },
        updateScore: (state, action: PayloadAction<{ isCorrect: boolean }>) => {
            if (state.currentSession && action.payload.isCorrect) {
                state.currentSession.correctAnswers += 1;
                state.currentSession.scorePercentage =
                    (state.currentSession.correctAnswers / state.currentSession.totalRounds) * 100;
            }
        },
        completeRound: (state) => {
            if (state.currentSession) {
                state.currentSession.completedRounds += 1;
            }
        },
        resetGameSession: (state) => {
            state.currentSession = null;
            state.currentRounds = [];
            state.currentRoundIndex = 0;
            state.timeRemaining = 0;
            state.playerPerformances = [];
        },
        setLoading: (state, action: PayloadAction<boolean>) => {
            state.isLoading = action.payload;
        },
        setError: (state, action: PayloadAction<string | null>) => {
            state.error = action.payload;
        },
    },
});

export const gameSessionActions = gameSessionSlice.actions;
export const gameSessionReducer = gameSessionSlice.reducer;

export const calculatePlayerPerformances = (rounds: GameRound[]): PlayerPerformance[] => {
    const playerStats = new Map<string, { correct: number; total: number }>();

    rounds.forEach(round => {
        if (round.playerWhoAnswered) {
            const stats = playerStats.get(round.playerWhoAnswered) || { correct: 0, total: 0 };
            stats.total += 1;
            if (round.isCorrect) {
                stats.correct += 1;
            }
            playerStats.set(round.playerWhoAnswered, stats);
        }
    });

    return Array.from(playerStats.entries()).map(([playerName, stats]) => ({
        playerName,
        correctAnswers: stats.correct,
        totalAnswers: stats.total,
        accuracy: stats.total > 0 ? (stats.correct / stats.total) * 100 : 0
    })).sort((a, b) => b.accuracy - a.accuracy);
};

export const formatGameDuration = (startTime: string, endTime: string): string => {
    const durationMs = new Date(endTime).getTime() - new Date(startTime).getTime();
    const minutes = Math.floor(durationMs / 60000);
    const seconds = Math.floor((durationMs % 60000) / 1000);

    if (minutes > 0) {
        return `${minutes}m ${seconds}s`;
    }
    return `${seconds}s`;
};

export const getScoreMessage = (score: number, total: number): string => {
    const percentage = (score / total) * 100;

    if (percentage >= 90) return 'Outstanding! Exceptional knowledge!';
    if (percentage >= 70) return 'Great job! Impressive performance!';
    if (percentage >= 50) return 'Good effort! Well done!';
    if (percentage >= 30) return 'Nice try! Keep learning!';
    return 'Don\'t give up! Every game is a learning opportunity!';
};

export const validateAnswer = (userAnswer: string, correctAnswer: string): boolean => {
    if (!userAnswer || !correctAnswer) return false;

    const normalize = (text: string) =>
        text.toLowerCase()
            .trim()
            .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()""''«»]/g, "")
            .replace(/\s{2,}/g, " ");

    const normalizedUser = normalize(userAnswer);
    const normalizedCorrect = normalize(correctAnswer);

    // Direct match
    if (normalizedUser === normalizedCorrect) return true;

    // Contains match
    if (normalizedUser.includes(normalizedCorrect) ||
        normalizedCorrect.includes(normalizedUser)) return true;

    // For short answers, use fuzzy matching
    if (normalizedCorrect.split(" ").length <= 2) {
        return calculateSimilarity(normalizedUser, normalizedCorrect) >= 0.8;
    }

    return false;
};

const calculateSimilarity = (str1: string, str2: string): number => {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;

    if (longer.length === 0) return 1.0;

    const distance = levenshteinDistance(longer, shorter);
    return (longer.length - distance) / longer.length;
};

const levenshteinDistance = (str1: string, str2: string): number => {
    const matrix = [];

    for (let i = 0; i <= str2.length; i++) {
        matrix[i] = [i];
    }

    for (let j = 0; j <= str1.length; j++) {
        matrix[0][j] = j;
    }

    for (let i = 1; i <= str2.length; i++) {
        for (let j = 1; j <= str1.length; j++) {
            if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
                matrix[i][j] = matrix[i - 1][j - 1];
            } else {
                matrix[i][j] = Math.min(
                    matrix[i - 1][j - 1] + 1, // substitution
                    matrix[i][j - 1] + 1,     // insertion
                    matrix[i - 1][j] + 1      // deletion
                );
            }
        }
    }

    return matrix[str2.length][str1.length];
};
