// src/features/game-session/model/selectors.ts
import {createSelector} from '@reduxjs/toolkit';
import type {RootState} from '../../../app/store';

// Base selectors
export const selectGameSessionState = (state: RootState) => state.gameSession;

export const selectCurrentSession = createSelector(
    [selectGameSessionState],
    (gameSessionState) => gameSessionState.currentSession
);

export const selectSessions = createSelector(
    [selectGameSessionState],
    (gameSessionState) => gameSessionState.sessions
);

export const selectIsLoading = createSelector(
    [selectGameSessionState],
    (gameSessionState) => gameSessionState.isLoading
);

export const selectError = createSelector(
    [selectGameSessionState],
    (gameSessionState) => gameSessionState.error
);

export const selectIsPaused = createSelector(
    [selectGameSessionState],
    (gameSessionState) => gameSessionState.isPaused
);

export const selectTimer = createSelector(
    [selectGameSessionState],
    (gameSessionState) => gameSessionState.timer
);

// Computed selectors
export const selectCurrentQuestion = createSelector(
    [selectCurrentSession],
    (session) => {
        if (!session) return null;
        return session.questions[session.currentQuestionIndex] || null;
    }
);

export const selectSessionProgress = createSelector(
    [selectCurrentSession],
    (session) => {
        if (!session) return { current: 0, total: 0, percentage: 0 };

        const current = session.currentQuestionIndex + 1;
        const total = session.questions.length;
        const percentage = (current / total) * 100;

        return { current, total, percentage };
    }
);

export const selectSessionStats = createSelector(
    [selectCurrentSession],
    (session) => session?.stats || null
);

export const selectIsSessionActive = createSelector(
    [selectCurrentSession],
    (session) => session?.status === 'active'
);

export const selectCanNavigate = createSelector(
    [selectCurrentSession],
    (session) => {
        if (!session) return { canPrevious: false, canNext: false };

        const canPrevious = session.currentQuestionIndex > 0;
        const canNext = session.currentQuestionIndex < session.questions.length - 1;

        return { canPrevious, canNext };
    }
);

export const selectCompletedSessions = createSelector(
    [selectSessions],
    (sessions) => sessions.filter(s => s.status === 'completed')
);

export const selectSessionsStats = createSelector(
    [selectSessions],
    (sessions) => {
        const completed = sessions.filter(s => s.status === 'completed');

        if (completed.length === 0) {
            return {
                totalSessions: 0,
                averageScore: 0,
                averageAccuracy: 0,
                bestScore: 0,
                totalTimePlayed: 0,
            };
        }

        const totalScore = completed.reduce((sum, s) => sum + s.stats.score, 0);
        const totalAccuracy = completed.reduce((sum, s) => sum + s.stats.accuracy, 0);
        const totalTime = completed.reduce((sum, s) => sum + s.stats.totalTimeSpent, 0);
        const bestScore = Math.max(...completed.map(s => s.stats.score));

        return {
            totalSessions: completed.length,
            averageScore: totalScore / completed.length,
            averageAccuracy: totalAccuracy / completed.length,
            bestScore,
            totalTimePlayed: totalTime,
        };
    }
);