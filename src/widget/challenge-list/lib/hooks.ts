// src/widgets/challenge-list/lib/hooks.ts
import {useCallback, useState} from 'react';
import {useDispatch, useSelector} from 'react-redux';
import {challengeActions, challengeSelectors} from '../../../entities/challenge';
import {useChallengeVerification} from '../../../features/challenge-verification';
import {ChallengeFilters} from "../../../entities/challenge/model/type.ts";

export const useChallengeListWidget = () => {
    const dispatch = useDispatch();
    const [filters, setFilters] = useState<ChallengeFilters>({});

    // Challenge state
    const challenges = useSelector(challengeSelectors.selectFilteredChallenges);
    const isLoading = useSelector(challengeSelectors.selectIsLoading);
    const error = useSelector(challengeSelectors.selectError);

    // Verification
    const verification = useChallengeVerification();

    // Actions
    const refreshChallenges = useCallback(() => {
        dispatch(challengeActions.fetchChallenges(filters));
    }, [dispatch, filters]);

    const updateFilters = useCallback((newFilters: Partial<ChallengeFilters>) => {
        const updatedFilters = { ...filters, ...newFilters };
        setFilters(updatedFilters);
        dispatch(challengeActions.setFilters(updatedFilters));
    }, [filters, dispatch]);

    const joinChallenge = useCallback((challengeId: string) => {
        dispatch(challengeActions.joinChallenge(challengeId));
    }, [dispatch]);

    const startVerification = useCallback((challengeId: string, methods: string[]) => {
        verification.startVerification(challengeId, methods);
    }, [verification]);

    return {
        // State
        challenges,
        isLoading,
        error,
        filters,
        verification,

        // Actions
        refreshChallenges,
        updateFilters,
        joinChallenge,
        startVerification,

        // Computed
        hasFilters: Object.keys(filters).some(key => filters[key as keyof ChallengeFilters]),
        challengeCount: challenges.length,
    };
};
