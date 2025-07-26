// src/shared/lib/hooks/useTimer.ts
import {useCallback, useEffect, useRef, useState} from 'react';

interface UseTimerOptions {
    initialTime?: number;
    interval?: number;
    onTick?: (time: number) => void;
    onComplete?: () => void;
}

export const useTimer = (options: UseTimerOptions = {}) => {
    const {
        initialTime = 0,
        interval = 1000,
        onTick,
        onComplete,
    } = options;

    const [time, setTime] = useState(initialTime);
    const [isRunning, setIsRunning] = useState(false);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    const start = useCallback(() => {
        setIsRunning(true);
    }, []);

    const pause = useCallback(() => {
        setIsRunning(false);
    }, []);

    const reset = useCallback(() => {
        setTime(initialTime);
        setIsRunning(false);
    }, [initialTime]);

    const stop = useCallback(() => {
        setTime(initialTime);
        setIsRunning(false);
    }, [initialTime]);

    useEffect(() => {
        if (isRunning) {
            intervalRef.current = setInterval(() => {
                setTime(prevTime => {
                    const newTime = prevTime - 1;
                    onTick?.(newTime);

                    if (newTime <= 0) {
                        setIsRunning(false);
                        onComplete?.();
                        return 0;
                    }

                    return newTime;
                });
            }, interval);
        } else {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
        }

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, [isRunning, interval, onTick, onComplete]);

    return {
        time,
        isRunning,
        start,
        pause,
        reset,
        stop,
        setTime,
    };
};
