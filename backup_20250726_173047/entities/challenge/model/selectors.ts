// ============================================================================
// src/entities/challenge/model/selectors.ts
import {createSelector} from '@reduxjs/toolkit';
import type {RootState} from '../../../app/store';
import type {ChallengeStatus, ChallengeType} from './types';

// Base selectors
export const selectChallengeState = (state: RootState) => state.challenge;

export const selectChallenges = createSelector(
    [selectChallengeState],
    (challengeState) => challengeState.challenges
);

export const selectCurrentChallenge = createSelector(
    [selectChallengeState],
    (challengeState) => challengeState.currentChallenge
);

export const selectMyParticipations = createSelector(
    [selectChallengeState],
    (challengeState) => challengeState.myParticipations
);

export const selectIsLoading = createSelector(
    [selectChallengeState],
    (challengeState) => challengeState.isLoading
);

export const selectError = createSelector(
    [selectChallengeState],
    (challengeState) => challengeState.error
);

// Computed selectors
export const selectChallengesByStatus = createSelector(
    [selectChallenges, (state: RootState, status: ChallengeStatus) => status],
    (challenges, status) => challenges.filter(c => c.status === status)
);

export const selectChallengesByType = createSelector(
    [selectChallenges, (state: RootState, type: ChallengeType) => type],
    (challenges, type) => challenges.filter(c => c.type === type)
);

export const selectActiveChallenges = createSelector(
    [selectChallenges],
    (challenges) => challenges.filter(c => c.status === 'active')
);

export const selectMyChallenges = createSelector(
    [selectChallenges, (state: RootState, userId: string) => userId],
    (challenges, userId) => challenges.filter(c => c.creatorId === userId)
);

export const selectJoinedChallenges = createSelector(
    [selectChallenges, (state: RootState, userId: string) => userId],
    (challenges, userId) => challenges.filter(c =>
        c.participants.includes(userId) && c.creatorId !== userId
    )
);

export const selectChallengeById = createSelector(
    [selectChallenges, (state: RootState, challengeId: string) => challengeId],
    (challenges, challengeId) => challenges.find(c => c.id === challengeId)
);

export const selectChallengeStats = createSelector(
    [selectChallenges],
    (challenges) => {
        const total = challenges.length;
        const byStatus = challenges.reduce((acc, c) => {
            acc[c.status] = (acc[c.status] || 0) + 1;
            return acc;
        }, {} as Record<ChallengeStatus, number>);

        const byType = challenges.reduce((acc, c) => {
            acc[c.type] = (acc[c.type] || 0) + 1;
            return acc;
        }, {} as Record<ChallengeType, number>);

        return { total, byStatus, byType };
    }
);

export const selectMyParticipationStatus = createSelector(
    [selectMyParticipations, (state: RootState, challengeId: string) => challengeId],
    (participations, challengeId) => participations.find(p => p.challengeId === challengeId)
);