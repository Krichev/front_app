import { useState, useEffect, useRef, useCallback } from 'react';
import { Animated } from 'react-native';

export type AnswerTimerPhase = 'typing' | 'completing' | 'done';

interface UseAnswerTimerOptions {
  initialTypingTime: number;
  completionTime: number;
  onAutoSubmit: () => void;
}

export function useAnswerTimer({
  initialTypingTime,
  completionTime,
  onAutoSubmit,
}: UseAnswerTimerOptions) {
  const [phase, setPhase] = useState<AnswerTimerPhase>('typing');
  const [timeLeft, setTimeLeft] = useState(initialTypingTime);
  const animation = useRef(new Animated.Value(1)).current;
  const onAutoSubmitRef = useRef(onAutoSubmit);
  const hasAutoSubmitted = useRef(false);

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
      if (!hasAutoSubmitted.current) {
        hasAutoSubmitted.current = true;
        setPhase('done');
        onAutoSubmitRef.current();
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

    Animated.timing(animation, {
      toValue: (timeLeft - 1) / currentDuration,
      duration: 1000,
      useNativeDriver: false,
    }).start();

    return () => clearInterval(interval);
  }, [timeLeft, phase, currentDuration, animation]);

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
    hasAutoSubmitted.current = false;
  }, [initialTypingTime, animation]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      hasAutoSubmitted.current = false;
    };
  }, []);

  return {
    timeLeft,
    phase,
    animation,
    startCompletionPhase,
    hasAutoSubmitted: hasAutoSubmitted.current,
    reset,
  };
}
