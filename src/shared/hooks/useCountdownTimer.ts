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
  const activeDurationRef = useRef(duration);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    if (!isRunning || timeLeft <= 0) {
      if (timeLeft <= 0 && isRunning && !hasCompletedRef.current) {
        hasCompletedRef.current = true;
        setIsRunning(false);
        console.log('⏰ [Timer] Time expired, firing onComplete');
        onCompleteRef.current();
      }
      return;
    }

    const interval = setInterval(() => {
      setTimeLeft(prev => {
        const next = prev - 1;
        if (next <= 0) {
          clearInterval(interval);
        }
        return next;
      });
    }, 1000);

    // Use activeDurationRef for correct animation ratio after reset
    Animated.timing(animation, {
      toValue: (timeLeft - 1) / activeDurationRef.current,
      duration: 1000,
      useNativeDriver: false,
    }).start();

    return () => clearInterval(interval);
  }, [timeLeft, isRunning, animation]);

  const start = useCallback(() => {
    console.log('⏰ [Timer] start() called');
    setIsRunning(true);
  }, []);

  const pause = useCallback(() => {
    console.log('⏰ [Timer] pause() called');
    setIsRunning(false);
  }, []);

  const reset = useCallback((newDuration?: number) => {
    const d = newDuration ?? duration;
    console.log('⏰ [Timer] reset() called with duration:', d);
    setTimeLeft(d);
    activeDurationRef.current = d;
    animation.setValue(1);
    hasCompletedRef.current = false; // Allow onComplete to fire again after reset
  }, [duration, animation]);

  return { timeLeft, isRunning, animation, start, pause, reset };
}
