// src/shared/lib/hooks/useAsyncState.ts
import {useCallback, useState} from 'react';

interface AsyncState<T> {
    data: T | null;
    loading: boolean;
    error: string | null;
}

export const useAsyncState = <T>() => {
    const [state, setState] = useState<AsyncState<T>>({
        data: null,
        loading: false,
        error: null,
    });

    const execute = useCallback(async (asyncFunction: () => Promise<T>) => {
        setState(prev => ({ ...prev, loading: true, error: null }));

        try {
            const data = await asyncFunction();
            setState({ data, loading: false, error: null });
            return data;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'An error occurred';
            setState(prev => ({ ...prev, loading: false, error: errorMessage }));
            throw error;
        }
    }, []);

    const reset = useCallback(() => {
        setState({ data: null, loading: false, error: null });
    }, []);

    return {
        ...state,
        execute,
        reset,
    };
};