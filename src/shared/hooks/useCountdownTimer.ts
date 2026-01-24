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
  
  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

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

    Animated.timing(animation, {
      toValue: timeLeft / duration,
      duration: 1000,
      useNativeDriver: false,
    }).start();

    return () => clearInterval(interval);
  }, [timeLeft, isRunning, duration, animation]);

  const start = useCallback(() => setIsRunning(true), []);
  const pause = useCallback(() => setIsRunning(false), []);
  const reset = useCallback((newDuration?: number) => {
    setTimeLeft(newDuration ?? duration);
    animation.setValue(1);
  }, [duration, animation]);

  return { timeLeft, isRunning, animation, start, pause, reset };
}
