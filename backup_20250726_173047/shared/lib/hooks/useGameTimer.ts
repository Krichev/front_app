// src/shared/lib/hooks/useGameTimer.ts
import {useCallback, useEffect, useRef, useState} from 'react'

interface UseGameTimerOptions {
    initialTime: number
    onTimeUp?: () => void
    autoStart?: boolean
}

export const useGameTimer = ({
                                 initialTime,
                                 onTimeUp,
                                 autoStart = false
                             }: UseGameTimerOptions) => {
    const [timeRemaining, setTimeRemaining] = useState(initialTime)
    const [isRunning, setIsRunning] = useState(autoStart)
    const intervalRef = useRef<NodeJS.Timeout | null>(null)

    const start = useCallback(() => {
        setIsRunning(true)
    }, [])

    const stop = useCallback(() => {
        setIsRunning(false)
    }, [])

    const reset = useCallback((newTime?: number) => {
        setTimeRemaining(newTime ?? initialTime)
        setIsRunning(false)
    }, [initialTime])

    const addTime = useCallback((seconds: number) => {
        setTimeRemaining(prev => Math.max(0, prev + seconds))
    }, [])

    useEffect(() => {
        if (isRunning && timeRemaining > 0) {
            intervalRef.current = setInterval(() => {
                setTimeRemaining(prev => {
                    if (prev <= 1) {
                        setIsRunning(false)
                        onTimeUp?.()
                        return 0
                    }
                    return prev - 1
                })
            }, 1000)
        } else {
            if (intervalRef.current) {
                clearInterval(intervalRef.current)
                intervalRef.current = null
            }
        }

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current)
            }
        }
    }, [isRunning, timeRemaining, onTimeUp])

    return {
        timeRemaining,
        isRunning,
        start,
        stop,
        reset,
        addTime,
        progress: initialTime > 0 ? timeRemaining / initialTime : 0
    }
}