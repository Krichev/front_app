// src/features/WWWGame/hooks/useMediaPreloader.ts
import { useEffect, useRef, useState, useCallback } from 'react';
import MediaUrlService from '../../../services/media/MediaUrlService';
import { QuizRound } from '../../../entities/QuizState/model/slice/quizApi';

/**
 * Status of media preloading per question
 */
export type PreloadStatus = 'idle' | 'loading' | 'ready' | 'error';

interface UseMediaPreloaderReturn {
  /** Map of question ID to its preload status */
  preloadStatuses: Record<number, PreloadStatus>;
  /** Whether the first question with media is preloaded and ready */
  isFirstMediaQuestionReady: boolean;
  /** Overall progress of preloading (0 to 1) */
  preloadProgress: number;
  /** Whether there are any questions that can be preloaded */
  hasMediaQuestions: boolean;
}

const PRELOAD_CHUNK_SIZE = 'bytes=0-524287'; // 512 KB
const MAX_CONCURRENT_FETCHES = 3;
const MAX_PRELOAD_QUESTIONS = 3;

/**
 * Hook to preload media for upcoming questions in a quiz session.
 * Identifies uploaded VIDEO/AUDIO questions and fetches the first chunk
 * to warm the connection and start buffering.
 */
export const useMediaPreloader = (rounds: QuizRound[]): UseMediaPreloaderReturn => {
  const [preloadStatuses, setPreloadStatuses] = useState<Record<number, PreloadStatus>>({});
  const [preloadProgress, setPreloadProgress] = useState(0);
  
  const abortControllers = useRef<Map<number, AbortController>>(new Map());
  const pendingQueue = useRef<number[]>([]);
  const activeFetchesCount = useRef(0);
  const mediaQuestionsRef = useRef<number[]>([]);

  const mediaService = MediaUrlService.getInstance();

  /**
   * Updates the status for a specific question and recalculates overall progress
   */
  const updateStatus = useCallback((questionId: number, status: PreloadStatus) => {
    console.log(`🎬 [MediaPreloader] Question ${questionId}: ${status}`);
    
    setPreloadStatuses(prev => {
      const next = { ...prev, [questionId]: status };
      
      // Calculate overall progress based on media questions we've identified
      if (mediaQuestionsRef.current.length > 0) {
        const readyCount = Object.values(next).filter(s => s === 'ready' || s === 'error').length;
        const totalToPreload = Math.min(mediaQuestionsRef.current.length, MAX_PRELOAD_QUESTIONS);
        setPreloadProgress(readyCount / totalToPreload);
      }
      
      return next;
    });
  }, []);

  /**
   * Initiates a prefetch for a single question media
   */
  const prefetchMedia = useCallback(async (questionId: number) => {
    const url = mediaService.getQuestionMediaUrl(questionId);
    const headers = {
      ...mediaService.getAuthHeaders(),
      'Range': PRELOAD_CHUNK_SIZE,
    };

    const controller = new AbortController();
    abortControllers.current.set(questionId, controller);
    activeFetchesCount.current++;
    
    updateStatus(questionId, 'loading');

    try {
      const response = await fetch(url, {
        headers,
        signal: controller.signal,
      });

      // 200 OK or 206 Partial Content (expected for Range)
      if (response.ok || response.status === 206) {
        updateStatus(questionId, 'ready');
      } else {
        updateStatus(questionId, 'error');
        console.warn(`🎬 [MediaPreloader] Failed to preload question ${questionId}: ${response.status}`);
      }
    } catch (error: any) {
      if (error.name === 'AbortError') {
        // Silently handle aborts
      } else {
        updateStatus(questionId, 'error');
        console.warn(`🎬 [MediaPreloader] Error preloading question ${questionId}:`, error);
      }
    } finally {
      abortControllers.current.delete(questionId);
      activeFetchesCount.current--;
      
      // Process next in queue
      processQueue();
    }
  }, [mediaService, updateStatus]);

  /**
   * Processes the next items in the pending queue up to concurrency limit
   */
  const processQueue = useCallback(() => {
    while (activeFetchesCount.current < MAX_CONCURRENT_FETCHES && pendingQueue.current.length > 0) {
      const questionId = pendingQueue.current.shift();
      if (questionId !== undefined) {
        prefetchMedia(questionId);
      }
    }
  }, [prefetchMedia]);

  useEffect(() => {
    if (!rounds || rounds.length === 0) return;

    // Identify questions that need preloading
    const mediaQuestionIds = rounds
      .map(r => r.question)
      .filter(q => {
        const mediaType = q.questionMediaType || q.questionType;
        const isUploaded = !q.mediaSourceType || q.mediaSourceType === 'UPLOADED';
        const hasMediaId = !!q.questionMediaId;
        const isAudioOrVideo = ['VIDEO', 'AUDIO'].includes(mediaType as string);
        
        return isUploaded && hasMediaId && isAudioOrVideo;
      })
      .map(q => q.id);

    mediaQuestionsRef.current = mediaQuestionIds;

    if (mediaQuestionIds.length === 0) return;

    // We only want to preload up to a certain number of upcoming questions
    const toPreload = mediaQuestionIds.slice(0, MAX_PRELOAD_QUESTIONS);
    
    console.log('🎬 [MediaPreloader] Starting preload for questions:', toPreload);

    // Add to queue
    pendingQueue.current = toPreload;
    processQueue();

    return () => {
      // Cleanup: Abort all pending requests on unmount or rounds change
      const count = abortControllers.current.size;
      if (count > 0) {
        console.log(`🎬 [MediaPreloader] Cleanup: aborting ${count} pending requests`);
        abortControllers.current.forEach(controller => controller.abort());
        abortControllers.current.clear();
      }
      pendingQueue.current = [];
      activeFetchesCount.current = 0;
    };
  }, [rounds, processQueue]);

  // Derived returns
  const hasMediaQuestions = mediaQuestionsRef.current.length > 0;
  const firstMediaQuestionId = mediaQuestionsRef.current[0];
  const isFirstMediaQuestionReady = firstMediaQuestionId 
    ? preloadStatuses[firstMediaQuestionId] === 'ready' || preloadStatuses[firstMediaQuestionId] === 'error'
    : true;

  return {
    preloadStatuses,
    isFirstMediaQuestionReady,
    preloadProgress,
    hasMediaQuestions,
  };
};
