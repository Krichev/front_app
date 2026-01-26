import { useCallback } from 'react';

export const useReadingTime = () => {
  const calculateReadingTime = useCallback((questionText: string): number => {
    if (!questionText) return 5;
    const wordCount = questionText.trim().split(/\s+/).length;
    const readingTimeSeconds = Math.ceil((wordCount / 200) * 60); // 200 WPM
    return Math.max(5, Math.min(20, readingTimeSeconds)); // Clamp 5-20 seconds
  }, []);

  return { calculateReadingTime };
};
