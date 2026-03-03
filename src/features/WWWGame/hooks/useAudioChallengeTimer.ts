import { useState, useEffect, useRef, useCallback } from 'react';
import { Animated } from 'react-native';

interface UseAudioChallengeTimerOptions {
  duration: number;
  onAutoSubmit: () => void;
}

export function useAudioChallengeTimer({
  duration,
  onAutoSubmit,
}: UseAudioChallengeTimerOptions) {
  const [timeLeft, setTimeLeft] = useState(duration);
  const [isRunning, setIsRunning] = useState(false);
  const animation = useRef(new Animated.Value(1)).current;
  const onAutoSubmitRef = useRef(onAutoSubmit);
  const hasAutoSubmitted = useRef(false);

  // Update ref to avoid stale closures
  useEffect(() => {
    onAutoSubmitRef.current = onAutoSubmit;
  }, [onAutoSubmit]);

  useEffect(() => {
    if (!isRunning || timeLeft <= 0) {
      return;
    }

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          if (!hasAutoSubmitted.current) {
            hasAutoSubmitted.current = true;
            setIsRunning(false);
            onAutoSubmitRef.current();
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Sync animation
    Animated.timing(animation, {
      toValue: (timeLeft - 1) / duration,
      duration: 1000,
      useNativeDriver: false,
    }).start();

    return () => clearInterval(interval);
  }, [timeLeft, isRunning, duration, animation]);

  const start = useCallback(() => {
    setIsRunning(true);
    hasAutoSubmitted.current = false;
  }, []);

  const pause = useCallback(() => {
    setIsRunning(false);
  }, []);

  const reset = useCallback((newDuration?: number) => {
    const d = newDuration ?? duration;
    setTimeLeft(d);
    setIsRunning(false);
    animation.setValue(1);
    hasAutoSubmitted.current = false;
  }, [duration, animation]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      hasAutoSubmitted.current = false;
    };
  }, []);

  return {
    timeLeft,
    isRunning,
    animation,
    start,
    pause,
    reset,
  };
}
