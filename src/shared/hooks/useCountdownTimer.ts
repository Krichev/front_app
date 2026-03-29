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
  // Track the effective duration for animation calculations.
  // Updated when reset(newDuration) is called, so animation denominator stays correct.
  const effectiveDurationRef = useRef(duration);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  // Keep effectiveDurationRef in sync if the prop changes and no explicit reset has occurred
  useEffect(() => {
    effectiveDurationRef.current = duration;
  }, [duration]);

  useEffect(() => {
    if (!isRunning || timeLeft <= 0) {
      if (timeLeft <= 0 && isRunning) {
        setIsRunning(false);
        onCompleteRef.current();
      }
      return;
    }

    const interval = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);

    // Use effectiveDurationRef so animation targets are correct after reset(newDuration)
    const currentDuration = effectiveDurationRef.current;
    if (currentDuration > 0) {
      Animated.timing(animation, {
        toValue: (timeLeft - 1) / currentDuration,
        duration: 1000,
        useNativeDriver: false,
      }).start();
    }

    return () => clearInterval(interval);
  }, [timeLeft, isRunning, animation]);
  // NOTE: removed `duration` from deps — we use effectiveDurationRef instead,
  // which prevents the effect from re-running when the prop changes.

  const start = useCallback(() => setIsRunning(true), []);
  const pause = useCallback(() => setIsRunning(false), []);

  // Stable reset: uses refs instead of closure over `duration`,
  // so the callback identity never changes.
  const reset = useCallback((newDuration?: number) => {
    const d = newDuration ?? effectiveDurationRef.current;
    effectiveDurationRef.current = d;
    setTimeLeft(d);
    animation.setValue(1);
  }, [animation]);
  // `animation` is from useRef — stable. So `reset` reference is stable forever.

  return { timeLeft, isRunning, animation, start, pause, reset };
}
