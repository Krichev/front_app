// src/features/WWWGame/hooks/useVideoPreloader.ts
import { useEffect, useRef } from 'react';
import { Image } from 'react-native';
import { QuizRound, QuizQuestion } from '../../../entities/QuizState/model/slice/quizApi';
import { MediaSourceType } from '../../../entities/QuizState/model/types/question.types';
import { extractYouTubeVideoId } from '../../../utils/youtubeUtils';
import MediaUrlService from '../../../services/media/MediaUrlService';

/**
 * Preloads video/audio content for the NEXT round while the current round is active.
 * 
 * Strategy:
 * - YouTube: Prefetch maxresdefault thumbnail (warms DNS + CDN cache)
 * - Uploaded: HEAD request to authenticated proxy URL (warms proxy cache + triggers any lazy transcoding)
 * - External URL: HEAD request to warm CDN cache
 * 
 * All prefetch operations are fire-and-forget — failures are logged but never block gameplay.
 */
export function useVideoPreloader(
    rounds: QuizRound[] | undefined,
    currentRoundIndex: number,
    isGameActive: boolean,
) {
    const prefetchedRoundsRef = useRef<Set<string>>(new Set());
    const abortControllerRef = useRef<AbortController | null>(null);

    useEffect(() => {
        if (!isGameActive || !rounds || rounds.length === 0) return;

        // currentRoundIndex is 1-based from state.currentRound
        // rounds is 0-indexed array
        // So current round index in array is currentRoundIndex - 1
        // Next rounds are currentRoundIndex, currentRoundIndex + 1
        const indicesToPrefetch = [currentRoundIndex, currentRoundIndex + 1]
            .filter(i => i < rounds.length && i >= 0);

        for (const idx of indicesToPrefetch) {
            const round = rounds[idx];
            if (!round || prefetchedRoundsRef.current.has(round.id)) continue;

            const q = round.question;
            const mediaType = (q.questionMediaType || q.questionType || '').toUpperCase();
            
            // Only prefetch for VIDEO and AUDIO questions
            if (!['VIDEO', 'AUDIO'].includes(mediaType)) continue;

            const mediaSourceType = q.mediaSourceType || MediaSourceType.UPLOADED;

            // Mark as prefetched immediately to avoid duplicate attempts
            prefetchedRoundsRef.current.add(round.id);

            if (mediaSourceType === MediaSourceType.YOUTUBE) {
                prefetchYouTube(q);
            } else if (mediaSourceType === MediaSourceType.EXTERNAL_URL) {
                prefetchExternalUrl(q.externalMediaUrl);
            } else {
                // UPLOADED — prefetch via authenticated proxy
                prefetchUploadedMedia(q);
            }
        }
    }, [rounds, currentRoundIndex, isGameActive]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            abortControllerRef.current?.abort();
            prefetchedRoundsRef.current.clear();
        };
    }, []);
}

// ─── Prefetch strategies ──────────────────────────────────────────────

function prefetchYouTube(question: QuizQuestion): void {
    try {
        const videoId = question.externalMediaId
            || extractYouTubeVideoId(question.externalMediaUrl || '');
        
        if (!videoId) return;

        // Prefetch high-quality thumbnail — this warms YouTube CDN + DNS
        const thumbnailUrl = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
        Image.prefetch(thumbnailUrl).catch(() => {
            // Fallback to hqdefault
            Image.prefetch(`https://img.youtube.com/vi/${videoId}/hqdefault.jpg`).catch(() => {});
        });

        console.log(`🎬 [Preloader] YouTube thumbnail prefetched: ${videoId}`);
    } catch (err) {
        console.warn('🎬 [Preloader] YouTube prefetch failed silently:', err);
    }
}

function prefetchExternalUrl(url?: string): void {
    if (!url) return;
    
    try {
        // HEAD request warms CDN cache without downloading full video
        fetch(url, { method: 'HEAD' })
            .then(() => console.log(`🎬 [Preloader] External URL warmed: ${url.substring(0, 60)}`))
            .catch(() => {});
    } catch (err) {
        console.warn('🎬 [Preloader] External URL prefetch failed silently:', err);
    }
}

function prefetchUploadedMedia(question: QuizQuestion): void {
    try {
        const mediaService = MediaUrlService.getInstance();
        let proxyUrl: string | null = null;

        if (question.id) {
            proxyUrl = mediaService.getQuestionMediaUrl(question.id);
        } else if (question.questionMediaId) {
            proxyUrl = mediaService.getMediaByIdUrl(question.questionMediaId);
        }

        if (!proxyUrl) return;

        const headers = mediaService.getAuthHeaders();

        // HEAD request with auth headers — warms the proxy + MinIO cache
        fetch(proxyUrl, { 
            method: 'HEAD',
            headers: headers as Record<string, string>,
        })
            .then(() => console.log(`🎬 [Preloader] Uploaded media proxy warmed: Q${question.id}`))
            .catch(() => {});
    } catch (err) {
        console.warn('🎬 [Preloader] Uploaded media prefetch failed silently:', err);
    }
}
