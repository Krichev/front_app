// src/entities/challenge/model/selectors.ts
import {createSelector} from '@reduxjs/toolkit';
import type {ChallengeFilters, ChallengeStatus, ChallengeType} from './types';

// Update the RootState import path to match your store configuration
import type {RootState} from '../../../app/providers/StoreProvider/store';
// Alternative import if you have an app/store.ts file:
// import type { RootState } from '../../../app/store';

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

// Add missing filters selector
export const selectFilters = createSelector(
    [selectChallengeState],
    (challengeState) => challengeState.filters || {}
);

// Add the missing selectFilteredChallenges selector
export const selectFilteredChallenges = createSelector(
    [selectChallenges, selectFilters],
    (challenges, filters: ChallengeFilters) => {
        if (!challenges) return [];

        return challenges.filter(challenge => {
            // Filter by type
            if (filters.type && challenge.type !== filters.type) {
                return false;
            }

            // Filter by status
            if (filters.status && challenge.status !== filters.status) {
                return false;
            }

            // Filter by search query
            if (filters.search) {
                const searchLower = filters.search.toLowerCase();
                const matchesTitle = challenge.title.toLowerCase().includes(searchLower);
                const matchesDescription = challenge.description.toLowerCase().includes(searchLower);
                if (!matchesTitle && !matchesDescription) {
                    return false;
                }
            }

            // Filter by visibility
            if (filters.visibility && challenge.visibility !== filters.visibility) {
                return false;
            }

            // Filter by creator
            if (filters.creatorId && challenge.creatorId !== filters.creatorId) {
                return false;
            }

            // Filter by date range
            if (filters.startDate && challenge.createdAt < filters.startDate) {
                return false;
            }

            if (filters.endDate && challenge.createdAt > filters.endDate) {
                return false;
            }

            return true;
        });
    }
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

// Additional helpful selectors
export const selectChallengeById = createSelector(
    [selectChallenges, (state: RootState, challengeId: string) => challengeId],
    (challenges, challengeId) => challenges.find(c => c.id === challengeId)
);

export const selectChallengeCount = createSelector(
    [selectFilteredChallenges],
    (challenges) => challenges.length
);

export const selectHasActiveFilters = createSelector(
    [selectFilters],
    (filters) => Object.keys(filters).some(key => filters[key as keyof ChallengeFilters])
);