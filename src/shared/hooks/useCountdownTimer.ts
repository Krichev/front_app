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
  // Track effective duration so animation ratio is always correct after reset(newDuration)
  const effectiveDurationRef = useRef(duration);
  const animation = useRef(new Animated.Value(1)).current;
  const onCompleteRef = useRef(onComplete);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  // Keep effectiveDurationRef in sync if the prop changes
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

    // Use effectiveDurationRef so the bar is correct after reset(newDuration)
    const currentDuration = effectiveDurationRef.current;
    Animated.timing(animation, {
      toValue: currentDuration > 0 ? timeLeft / currentDuration : 0,
      duration: 1000,
      useNativeDriver: false,
    }).start();

    return () => clearInterval(interval);
  }, [timeLeft, isRunning, animation]);

  const start = useCallback(() => setIsRunning(true), []);
  const pause = useCallback(() => setIsRunning(false), []);
  const reset = useCallback((newDuration?: number) => {
    const d = newDuration ?? duration;
    effectiveDurationRef.current = d;
    setTimeLeft(d);
    animation.setValue(1);
  }, [duration, animation]);

  return { timeLeft, isRunning, animation, start, pause, reset };
}
