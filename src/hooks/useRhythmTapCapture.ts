// src/hooks/useRhythmTapCapture.ts
import { useCallback, useRef, useState } from 'react';
import { RhythmChallengeState, RhythmChallengePhase } from '../types/rhythmChallenge.types';

interface UseRhythmTapCaptureOptions {
    maxDuration?: number; // milliseconds
    maxTaps?: number;
    minTapInterval?: number; // debounce in milliseconds
}

interface UseRhythmTapCaptureReturn {
    tapTimestamps: number[];
    isCapturing: boolean;
    startCapture: () => void;
    stopCapture: () => number[];
    recordTap: () => void;
    resetCapture: () => void;
    duration: number;
    tapCount: number;
}

/**
 * Hook for capturing tap timestamps with high precision
 * Uses performance.now() for millisecond accuracy
 */
export const useRhythmTapCapture = (
    options: UseRhythmTapCaptureOptions = {}
): UseRhythmTapCaptureReturn => {
    const {
        maxDuration = 30000, // 30 seconds default
        maxTaps = 100,
        minTapInterval = 50, // 50ms debounce
    } = options;
    
    const [tapTimestamps, setTapTimestamps] = useState<number[]>([]);
    const [isCapturing, setIsCapturing] = useState(false);
    const [duration, setDuration] = useState(0);
    
    const startTimeRef = useRef<number | null>(null);
    const lastTapTimeRef = useRef<number>(0);
    const durationTimerRef = useRef<NodeJS.Timeout | null>(null);
    const maxDurationTimerRef = useRef<NodeJS.Timeout | null>(null);
    
    const startCapture = useCallback(() => {
        console.log('🎵 Starting tap capture');
        
        // Reset state
        setTapTimestamps([]);
        setDuration(0);
        startTimeRef.current = null;
        lastTapTimeRef.current = 0;
        setIsCapturing(true);
        
        // Duration update timer
        durationTimerRef.current = setInterval(() => {
            if (startTimeRef.current !== null) {
                setDuration(performance.now() - startTimeRef.current);
            }
        }, 100);
        
        // Auto-stop after max duration
        maxDurationTimerRef.current = setTimeout(() => {
            console.log('⏱️ Max duration reached, stopping capture');
            stopCapture();
        }, maxDuration);
    }, [maxDuration]);
    
    const stopCapture = useCallback((): number[] => {
        console.log('🛑 Stopping tap capture');
        
        setIsCapturing(false);
        
        // Clear timers
        if (durationTimerRef.current) {
            clearInterval(durationTimerRef.current);
            durationTimerRef.current = null;
        }
        if (maxDurationTimerRef.current) {
            clearTimeout(maxDurationTimerRef.current);
            maxDurationTimerRef.current = null;
        }
        
        // Return normalized timestamps (first tap = 0)
        const normalizedTimestamps = tapTimestamps.length > 0
            ? tapTimestamps.map(t => t - tapTimestamps[0])
            : [];
        
        console.log(`📊 Captured ${normalizedTimestamps.length} taps:`, normalizedTimestamps);
        
        return normalizedTimestamps;
    }, [tapTimestamps]);
    
    const recordTap = useCallback(() => {
        if (!isCapturing) return;
        
        const now = performance.now();
        
        // Initialize start time on first tap
        if (startTimeRef.current === null) {
            startTimeRef.current = now;
            console.log('🎯 First tap recorded, starting timer');
        }
        
        // Debounce check
        if (now - lastTapTimeRef.current < minTapInterval) {
            console.log('⚡ Tap debounced (too fast)');
            return;
        }
        
        // Max taps check
        if (tapTimestamps.length >= maxTaps) {
            console.log('📈 Max taps reached');
            return;
        }
        
        lastTapTimeRef.current = now;
        const relativeTime = now - startTimeRef.current;
        
        setTapTimestamps(prev => [...prev, relativeTime]);
        
        console.log(`👆 Tap ${tapTimestamps.length + 1}: ${relativeTime.toFixed(1)}ms`);
    }, [isCapturing, tapTimestamps.length, maxTaps, minTapInterval]);
    
    const resetCapture = useCallback(() => {
        console.log('🔄 Resetting tap capture');
        
        setTapTimestamps([]);
        setDuration(0);
        setIsCapturing(false);
        startTimeRef.current = null;
        lastTapTimeRef.current = 0;
        
        if (durationTimerRef.current) {
            clearInterval(durationTimerRef.current);
            durationTimerRef.current = null;
        }
        if (maxDurationTimerRef.current) {
            clearTimeout(maxDurationTimerRef.current);
            maxDurationTimerRef.current = null;
        }
    }, []);
    
    return {
        tapTimestamps,
        isCapturing,
        startCapture,
        stopCapture,
        recordTap,
        resetCapture,
        duration,
        tapCount: tapTimestamps.length,
    };
};

export default useRhythmTapCapture;
