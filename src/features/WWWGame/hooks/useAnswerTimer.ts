import { useState, useEffect, useRef, useCallback } from 'react';
import { Animated } from 'react-native';

export type AnswerTimerPhase = 'typing' | 'completing' | 'done';

interface UseAnswerTimerOptions {
  initialTypingTime: number;
  completionTime: number;
  onAutoSubmit: () => void | Promise<void>;
}

export function useAnswerTimer({
  initialTypingTime,
  completionTime,
  onAutoSubmit,
}: UseAnswerTimerOptions) {
  const [phase, setPhase] = useState<AnswerTimerPhase>('typing');
  const [timeLeft, setTimeLeft] = useState(initialTypingTime);
  const [hasAutoSubmitted, setHasAutoSubmitted] = useState(false);
  const animation = useRef(new Animated.Value(1)).current;
  const onAutoSubmitRef = useRef(onAutoSubmit);

  // Update ref to avoid stale closures
  useEffect(() => {
    onAutoSubmitRef.current = onAutoSubmit;
  }, [onAutoSubmit]);

  // Current duration based on phase
  const currentDuration = phase === 'typing' ? initialTypingTime : completionTime;

  useEffect(() => {
    if (phase === 'done') {
      return;
    }

    if (timeLeft <= 0) {
      if (!hasAutoSubmitted) {
        setHasAutoSubmitted(true);
        setPhase('done');
        // Call auto-submit, handling both sync and async callbacks.
        // If the callback throws/rejects, reset hasAutoSubmitted so the
        // user can still manually submit.
        try {
          const result = onAutoSubmitRef.current();
          if (result && typeof result.catch === 'function') {
            result.catch(() => {
              console.warn('[AnswerTimer] Auto-submit failed, re-enabling manual submit');
              setHasAutoSubmitted(false);
            });
          }
        } catch (e) {
          console.warn('[AnswerTimer] Auto-submit threw, re-enabling manual submit');
          setHasAutoSubmitted(false);
        }
      }
      return;
    }

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    if (currentDuration > 0) {
      Animated.timing(animation, {
        toValue: (timeLeft - 1) / currentDuration,
        duration: 1000,
        useNativeDriver: false,
      }).start();
    }

    return () => clearInterval(interval);
  }, [timeLeft, phase, currentDuration, animation, hasAutoSubmitted]);

  const startCompletionPhase = useCallback(() => {
    if (phase === 'typing') {
      setPhase('completing');
      setTimeLeft(completionTime);
      animation.setValue(1);
    }
  }, [phase, completionTime, animation]);

  const reset = useCallback(() => {
    setPhase('typing');
    setTimeLeft(initialTypingTime);
    animation.setValue(1);
    setHasAutoSubmitted(false);
  }, [initialTypingTime, animation]);

  return {
    timeLeft,
    phase,
    animation,
    startCompletionPhase,
    hasAutoSubmitted,
    reset,
  };
}
