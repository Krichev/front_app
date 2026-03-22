import { useState, useEffect, useCallback, useRef } from 'react';
import { Animated } from 'react-native';

interface UseCountdownTimerOptions {
  duration: number;
  onComplete: () => void;
  autoStart?: boolean;
}

export function useCountdownTimer({ duration, onComplete, autoStart = false }: UseCountdownTimerOptions) {
  const [timeLeft, setTimeLeft] = useState(duration);
  const [isRunning, setIsRunning] = useState(autoStart);
  const animation = useRef(new Animated.Value(1)).current;
  const onCompleteRef = useRef(onComplete);
  const hasCompletedRef = useRef(false);
  // Track the effective duration after reset() so animation ratio is correct
  const activeDurationRef = useRef(duration);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    // Guard: already completed this cycle
    if (hasCompletedRef.current) return;

    // Time expired — fire onComplete regardless of isRunning
    // This fixes the race where an external pause() sets isRunning=false
    // in the same frame that timeLeft reaches 0.
    if (timeLeft <= 0) {
      hasCompletedRef.current = true;
      setIsRunning(false);
      console.log('⏰ [useCountdownTimer] timeLeft reached 0, firing onComplete');
      onCompleteRef.current();
      return;
    }

    // Not running — don't tick
    if (!isRunning) return;

    const interval = setInterval(() => {
      setTimeLeft(prev => {
        const next = prev - 1;
        if (next <= 0) {
          clearInterval(interval);
        }
        return next;
      });
    }, 1000);

    Animated.timing(animation, {
      toValue: (timeLeft - 1) / activeDurationRef.current,
      duration: 1000,
      useNativeDriver: false,
    }).start();

    return () => clearInterval(interval);
  }, [timeLeft, isRunning, animation]);

  const start = useCallback(() => {
    setIsRunning(true);
  }, []);

  const pause = useCallback(() => {
    setIsRunning(false);
  }, []);

  const reset = useCallback((newDuration?: number) => {
    const d = newDuration ?? duration;
    setTimeLeft(d);
    activeDurationRef.current = d;
    animation.setValue(1);
    hasCompletedRef.current = false; // Allow onComplete to fire again after reset
  }, [duration, animation]);

  return { timeLeft, isRunning, animation, start, pause, reset };
}
