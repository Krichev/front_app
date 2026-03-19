// src/features/WWWGame/hooks/useVideoPreloader.ts
import { useEffect, useRef, useCallback } from 'react';
import { QuizQuestion } from '../../../entities/QuizState/model/slice/quizApi';
import { MediaSourceType } from '../../../entities/QuizState/model/types/question.types';
import { extractYouTubeVideoId } from '../../../utils/youtubeUtils';
import MediaUrlService from '../../../services/media/MediaUrlService';

interface PreloadResult {
    questionId: number | string;
    success: boolean;
    durationMs: number;
    type: 'youtube' | 'uploaded' | 'external' | 'none';
    error?: string;
}

/**
 * Hook that pre-warms the next question's video content.
 *
 * For YouTube: We can't truly preload an iframe, but we pre-fetch the
 * thumbnail and oEmbed metadata to prime DNS + CDN caches.
 *
 * For uploaded/proxy videos: We issue a HEAD request with auth headers
 * to prime the server-side cache and establish the TCP connection.
 *
 * For external URLs: We issue a HEAD request to prime the CDN.
 */
export function useVideoPreloader(
    currentRoundIndex: number,
    rounds: Array<{ question: QuizQuestion }> | undefined,
) {
    const preloadedRef = useRef<Set<string | number>>(new Set());
    const abortControllerRef = useRef<AbortController | null>(null);

    const preloadQuestion = useCallback(async (question: QuizQuestion): Promise<PreloadResult> => {
        const startTime = Date.now();
        const questionId = question.id;

        // Already preloaded
        if (preloadedRef.current.has(questionId)) {
            if (__DEV__) console.log('📦 [VideoPreloader] Already preloaded, skipping:', questionId);
            return { questionId, success: true, durationMs: 0, type: 'none' };
        }

        const mediaSourceType = question.mediaSourceType || MediaSourceType.UPLOADED;
        const mediaType = (question.questionMediaType || question.questionType || '').toUpperCase();

        // Only preload video/audio
        if (!['VIDEO', 'AUDIO'].includes(mediaType)) {
            if (__DEV__) console.log('📦 [VideoPreloader] Not a video/audio question, skipping:', { questionId, mediaType });
            return { questionId, success: true, durationMs: 0, type: 'none' };
        }

        if (__DEV__) console.log('📦 [VideoPreloader] Starting preload for question:', { questionId, mediaSourceType, mediaType });

        try {
            abortControllerRef.current = new AbortController();
            const signal = abortControllerRef.current.signal;

            if (mediaSourceType === MediaSourceType.YOUTUBE) {
                // Pre-fetch YouTube thumbnail to prime DNS/CDN
                const videoId = question.externalMediaId || extractYouTubeVideoId(question.externalMediaUrl || '');
                if (videoId) {
                    const thumbUrl = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
                    if (__DEV__) console.log('📦 [VideoPreloader] Pre-fetching YouTube thumbnail:', thumbUrl);
                    await fetch(thumbUrl, { method: 'GET', signal });
                    // Also pre-fetch oEmbed for metadata warm-up
                    const oEmbedUrl = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`;
                    await fetch(oEmbedUrl, { method: 'GET', signal }).catch(() => {});
                }
                preloadedRef.current.add(questionId);
                const durationMs = Date.now() - startTime;
                if (__DEV__) console.log('📦 [VideoPreloader] YouTube preload complete:', { questionId, durationMs });
                return { questionId, success: true, durationMs, type: 'youtube' };

            } else if (mediaSourceType === MediaSourceType.EXTERNAL_URL) {
                const url = question.externalMediaUrl || question.questionMediaUrl;
                if (url) {
                    if (__DEV__) console.log('📦 [VideoPreloader] HEAD request for external URL:', url.substring(0, 80));
                    await fetch(url, { method: 'HEAD', signal });
                }
                preloadedRef.current.add(questionId);
                const durationMs = Date.now() - startTime;
                if (__DEV__) console.log('📦 [VideoPreloader] External URL preload complete:', { questionId, durationMs });
                return { questionId, success: true, durationMs, type: 'external' };

            } else {
                // UPLOADED — use proxy with auth
                if (question.questionMediaId) {
                    const mediaService = MediaUrlService.getInstance();
                    const proxyUrl = mediaService.getQuestionMediaUrl(Number(questionId));
                    const headers = mediaService.getAuthHeaders();
                    if (__DEV__) console.log('📦 [VideoPreloader] HEAD request for uploaded media:', proxyUrl.substring(0, 80));
                    await fetch(proxyUrl, {
                        method: 'HEAD',
                        headers,
                        signal,
                    });
                }
                preloadedRef.current.add(questionId);
                const durationMs = Date.now() - startTime;
                if (__DEV__) console.log('📦 [VideoPreloader] Uploaded media preload complete:', { questionId, durationMs });
                return { questionId, success: true, durationMs, type: 'uploaded' };
            }

        } catch (error: any) {
            if (error.name === 'AbortError') {
                if (__DEV__) console.log('📦 [VideoPreloader] Preload aborted for:', questionId);
                return { questionId, success: false, durationMs: Date.now() - startTime, type: 'none', error: 'aborted' };
            }
            if (__DEV__) console.warn('📦 [VideoPreloader] Preload failed for:', questionId, error.message);
            return { questionId, success: false, durationMs: Date.now() - startTime, type: 'none', error: error.message };
        }
    }, []);

    // When currentRoundIndex changes, preload the NEXT round's question
    useEffect(() => {
        if (!rounds || rounds.length === 0) {
            if (__DEV__) console.log('📦 [VideoPreloader] No rounds available');
            return;
        }

        const nextIndex = currentRoundIndex + 1;
        if (nextIndex >= rounds.length) {
            if (__DEV__) console.log('📦 [VideoPreloader] No next round to preload (last round)');
            return;
        }

        const nextQuestion = rounds[nextIndex]?.question;
        if (!nextQuestion) {
            if (__DEV__) console.log('📦 [VideoPreloader] Next round has no question');
            return;
        }

        if (__DEV__) console.log('📦 [VideoPreloader] Round changed to', currentRoundIndex, '→ preloading round', nextIndex);

        preloadQuestion(nextQuestion);

        return () => {
            // Abort in-flight preload if round changes again quickly
            abortControllerRef.current?.abort();
        };
    }, [currentRoundIndex, rounds, preloadQuestion]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            abortControllerRef.current?.abort();
        };
    }, []);

    return {
        preloadQuestion,
        preloadedIds: preloadedRef.current,
    };
}
