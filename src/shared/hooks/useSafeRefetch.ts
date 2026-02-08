import { useCallback } from 'react';

/**
 * Creates a safe refetch function that only calls refetch if the query was started
 */
export function useSafeRefetch(
    refetch: () => any,
    isUninitialized: boolean
) {
    return useCallback(() => {
        if (!isUninitialized) {
            return refetch();
        }
        return Promise.resolve();
    }, [refetch, isUninitialized]);
}
