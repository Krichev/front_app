import { useState, useMemo, useCallback } from 'react';
import { useGetUserQuizSessionsQuery } from '../../../entities/QuizState/model/slice/quizApi';
import type { QuizSession } from '../../../entities/QuizState/model/slice/quizApi';

export type StatusFilter = 'ALL' | 'COMPLETED' | 'IN_PROGRESS' | 'PAUSED' | 'ABANDONED' | 'CANCELLED';
export type DifficultyFilter = 'ALL' | 'EASY' | 'MEDIUM' | 'HARD';
export type GameModeFilter = 'ALL' | 'STANDARD' | 'BRAIN_RING' | 'BLITZ';

export function useGameHistory() {
    const { data: sessions, isLoading, isError, refetch, isFetching } = useGetUserQuizSessionsQuery({ limit: 100 });

    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedQuery, setDebouncedQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
    const [difficultyFilter, setDifficultyFilter] = useState<DifficultyFilter>('ALL');
    const [gameModeFilter, setGameModeFilter] = useState<GameModeFilter>('ALL');

    // Debounce search
    const [debounceTimer, setDebounceTimer] = useState<ReturnType<typeof setTimeout> | null>(null);

    const handleSearchChange = useCallback((text: string) => {
        setSearchQuery(text);
        if (debounceTimer) clearTimeout(debounceTimer);
        const timer = setTimeout(() => setDebouncedQuery(text), 300);
        setDebounceTimer(timer);
    }, [debounceTimer]);

    const clearSearch = useCallback(() => {
        setSearchQuery('');
        setDebouncedQuery('');
    }, []);

    const clearAllFilters = useCallback(() => {
        setStatusFilter('ALL');
        setDifficultyFilter('ALL');
        setGameModeFilter('ALL');
        clearSearch();
    }, [clearSearch]);

    const hasActiveFilters = statusFilter !== 'ALL' || difficultyFilter !== 'ALL' || gameModeFilter !== 'ALL' || debouncedQuery.length > 0;

    const filteredSessions = useMemo(() => {
        if (!sessions) return [];

        let result = [...sessions];

        // Status filter
        if (statusFilter !== 'ALL') {
            result = result.filter(s => s.status === statusFilter);
        }

        // Difficulty filter
        if (difficultyFilter !== 'ALL') {
            result = result.filter(s => s.difficulty === difficultyFilter);
        }

        // Game mode filter
        if (gameModeFilter !== 'ALL') {
            result = result.filter(s => s.gameMode === gameModeFilter);
        }

        // Text search (case-insensitive across multiple fields)
        if (debouncedQuery.trim().length > 0) {
            const query = debouncedQuery.toLowerCase().trim();
            result = result.filter(s => {
                const searchableFields = [
                    s.challengeTitle,
                    s.teamName,
                    s.hostUsername,
                    ...(s.teamMembers || []),
                ].filter(Boolean);

                return searchableFields.some(field =>
                    field.toLowerCase().includes(query)
                );
            });
        }

        // Sort by most recent first
        result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

        return result;
    }, [sessions, statusFilter, difficultyFilter, gameModeFilter, debouncedQuery]);

    return {
        // Data
        sessions: filteredSessions,
        totalCount: sessions?.length ?? 0,
        filteredCount: filteredSessions.length,
        isLoading,
        isError,
        isFetching,

        // Search
        searchQuery,
        handleSearchChange,
        clearSearch,

        // Filters
        statusFilter,
        setStatusFilter,
        difficultyFilter,
        setDifficultyFilter,
        gameModeFilter,
        setGameModeFilter,
        hasActiveFilters,
        clearAllFilters,

        // Actions
        refetch,
    };
}
