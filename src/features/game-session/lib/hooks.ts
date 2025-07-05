// src/features/game-session/lib/hooks.ts
import {useEffect, useRef} from 'react';
import {useAppDispatch, useAppSelector} from '../../../app/store/hooks';
import {gameSessionActions} from '../model/slice';
import {selectCurrentSession, selectTimer} from '../model/selectors';

/**
 * Hook for managing game session timer
 */
export const useGameTimer = () => {
    const dispatch = useAppDispatch();
    const timer = useAppSelector(selectTimer);
    const currentSession = useAppSelector(selectCurrentSession);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        if (timer.isRunning && currentSession?.config.timeLimit) {
            intervalRef.current = setInterval(() => {
                dispatch(gameSessionActions.updateTimer(timer.timeRemaining - 1));
            }, 1000);
        } else if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, [timer.isRunning, timer.timeRemaining, dispatch, currentSession]);

    return {
        timeRemaining: timer.timeRemaining,
        isRunning: timer.isRunning,
        formatTime: (seconds: number) => {
            const mins = Math.floor(seconds / 60);
            const secs = seconds % 60;
            return `${mins}:${secs.toString().padStart(2, '0')}`;
        },
    };
};

/**
 * Hook for managing question timing
 */
export const useQuestionTimer = () => {
    const timer = useAppSelector(selectTimer);

    const getQuestionTime = () => {
        return Date.now() - timer.questionStartTime;
    };

    return { getQuestionTime };
};
