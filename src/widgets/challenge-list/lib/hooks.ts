// src/widgets/challenge-list/lib/hooks.ts
import {useCallback, useState} from 'react';
import {useDispatch, useSelector} from 'react-redux';
import {challengeActions} from '../../../entities/challenge';
import {
    selectError,
    selectFilteredChallenges,
    selectFilters,
    selectIsLoading
} from '../../../entities/challenge/model/selectors';
import {useChallengeVerification} from '../../../features/challenge-verification';
import type {ChallengeFilters} from '../../../entities/challenge/model/types';

export const useChallengeListWidget = () => {
    const dispatch = useDispatch();

    // Get filters from Redux state
    const storeFilters = useSelector(selectFilters);
    const [localFilters, setLocalFilters] = useState<ChallengeFilters>(storeFilters);

    // Challenge state
    const challenges = useSelector(selectFilteredChallenges);
    const isLoading = useSelector(selectIsLoading);
    const error = useSelector(selectError);

    // Verification
    const verification = useChallengeVerification();

    // Actions
    const refreshChallenges = useCallback(() => {
        dispatch(challengeActions.fetchChallenges(localFilters));
    }, [dispatch, localFilters]);

    const updateFilters = useCallback((newFilters: Partial<ChallengeFilters>) => {
        const updatedFilters = { ...localFilters, ...newFilters };
        setLocalFilters(updatedFilters);
        dispatch(challengeActions.setFilters(updatedFilters));
    }, [localFilters, dispatch]);

    const clearFilters = useCallback(() => {
        setLocalFilters({});
        dispatch(challengeActions.clearFilters());
    }, [dispatch]);

    const joinChallenge = useCallback((challengeId: string) => {
        // TODO: Get actual user ID from auth state
        const userId = 'current-user-id'; // Replace with actual user ID
        dispatch(challengeActions.joinChallenge({ challengeId, userId }));
    }, [dispatch]);

    const leaveChallenge = useCallback((challengeId: string) => {
        // TODO: Get actual user ID from auth state
        const userId = 'current-user-id'; // Replace with actual user ID
        dispatch(challengeActions.leaveChallenge({ challengeId, userId }));
    }, [dispatch]);

    const startVerification = useCallback((challengeId: string, methods: string[]) => {
        verification.startVerification(challengeId, methods);
    }, [verification]);

    return {
        // State
        challenges,
        isLoading,
        error,
        filters: localFilters,
        verification,

        // Actions
        refreshChallenges,
        updateFilters,
        clearFilters,
        joinChallenge,
        leaveChallenge,
        startVerification,

        // Computed
        hasFilters: Object.keys(localFilters).some(key =>
            localFilters[key as keyof ChallengeFilters] !== undefined &&
            localFilters[key as keyof ChallengeFilters] !== null &&
            localFilters[key as keyof ChallengeFilters] !== ''
        ),
        challengeCount: challenges.length,
        isEmpty: challenges.length === 0,
        hasError: !!error,
    };
};