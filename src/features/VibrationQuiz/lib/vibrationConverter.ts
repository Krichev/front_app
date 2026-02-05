/**
 * VibrationConverter - Converts rhythm patterns to device vibrations
 *
 * This utility transforms RhythmPatternDTO (beat timing data) into
 * vibration patterns that can be played on mobile devices.
 *
 * @module features/VibrationQuiz/lib/vibrationConverter
 */

import { Vibration, Platform } from 'react-native';
import type { RhythmPatternDTO } from '../../../types/rhythmChallenge.types';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Difficulty levels affecting vibration characteristics
 */
export type VibrationDifficulty = 'EASY' | 'MEDIUM' | 'HARD';

/**
 * Configuration for vibration pattern generation
 */
export interface VibrationConfig {
    /** Difficulty level - affects speed and vibration intensity */
    difficulty: VibrationDifficulty;
    /** Override default vibration duration (ms) */
    vibrationDurationMs?: number;
    /** Override speed multiplier (1.0 = normal speed) */
    speedMultiplier?: number;
    /** Maximum pattern duration (ms) - truncate longer patterns */
    maxDurationMs?: number;
    /** Minimum interval between vibrations (ms) - prevents buzz effect */
    minIntervalMs?: number;
}

/**
 * Result of pattern conversion with metadata
 */
export interface VibrationPatternResult {
    /** The vibration pattern array [wait, vibrate, wait, vibrate, ...] */
    pattern: number[];
    /** Total duration of the pattern in milliseconds */
    totalDurationMs: number;
    /** Number of beats/vibrations in the pattern */
    beatCount: number;
    /** Effective BPM after difficulty scaling */
    effectiveBpm: number;
    /** Whether pattern was truncated due to maxDurationMs */
    wasTruncated: boolean;
    /** Original pattern metadata */
    metadata: {
        originalBpm: number;
        timeSignature: string;
        difficulty: VibrationDifficulty;
        speedMultiplier: number;
        vibrationDurationMs: number;
    };
}

/**
 * Playback state for tracking ongoing vibrations
 */
interface PlaybackState {
    isPlaying: boolean;
    startTime: number;
    timeoutIds: NodeJS.Timeout[];
    onCompleteCallback?: () => void;
    onProgressCallback?: (progress: number, beatIndex: number) => void;
}

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * Difficulty presets for vibration characteristics
 */
const DIFFICULTY_PRESETS: Record<VibrationDifficulty, {
    speedMultiplier: number;
    vibrationDurationMs: number;
    description: string;
}> = {
    EASY: {
        speedMultiplier: 0.7,      // 70% speed (slower, easier to feel)
        vibrationDurationMs: 100,   // Longer, more noticeable vibrations
        description: 'Slower tempo with stronger vibrations',
    },
    MEDIUM: {
        speedMultiplier: 1.0,      // Normal speed
        vibrationDurationMs: 60,    // Standard vibration length
        description: 'Original tempo with normal vibrations',
    },
    HARD: {
        speedMultiplier: 1.3,      // 130% speed (faster)
        vibrationDurationMs: 35,    // Shorter, subtler vibrations
        description: 'Faster tempo with subtle vibrations',
    },
};

/** Minimum safe interval to prevent continuous buzzing */
const MIN_SAFE_INTERVAL_MS = 20;

/** Default maximum pattern duration (30 seconds) */
const DEFAULT_MAX_DURATION_MS = 30000;

// ============================================================================
// PLAYBACK STATE (Module-level singleton)
// ============================================================================

let playbackState: PlaybackState = {
    isPlaying: false,
    startTime: 0,
    timeoutIds: [],
};

// ============================================================================
// CORE CONVERSION FUNCTIONS
// ============================================================================

/**
 * Converts a RhythmPatternDTO to a React Native Vibration pattern
 *
 * @param rhythmPattern - The rhythm pattern to convert
 * @param config - Configuration options for the conversion
 * @returns VibrationPatternResult with pattern and metadata
 *
 * @example
 * ```typescript
 * const result = convertToVibrationPattern(songPattern, { difficulty: 'MEDIUM' });
 * Vibration.vibrate(result.pattern, false);
 * ```
 */
export function convertToVibrationPattern(
    rhythmPattern: RhythmPatternDTO,
    config: VibrationConfig
): VibrationPatternResult {
    const {
        difficulty,
        vibrationDurationMs: customVibeDuration,
        speedMultiplier: customSpeedMultiplier,
        maxDurationMs = DEFAULT_MAX_DURATION_MS,
        minIntervalMs = MIN_SAFE_INTERVAL_MS,
    } = config;

    // Get difficulty preset values
    const preset = DIFFICULTY_PRESETS[difficulty];
    const speedMultiplier = customSpeedMultiplier ?? preset.speedMultiplier;
    const vibeDuration = customVibeDuration ?? preset.vibrationDurationMs;

    // Calculate effective BPM
    const effectiveBpm = Math.round(rhythmPattern.estimatedBpm * speedMultiplier);

    const pattern: number[] = [];
    let totalDuration = 0;
    let beatCount = 0;
    let wasTruncated = false;

    // First beat: no initial wait, just vibrate
    pattern.push(0, vibeDuration);
    totalDuration += vibeDuration;
    beatCount = 1;

    // Process intervals between beats
    const intervals = rhythmPattern.intervalsMs;

    for (let i = 0; i < intervals.length; i++) {
        // Scale the interval by speed multiplier
        const scaledInterval = Math.round(intervals[i] / speedMultiplier);

        // Calculate wait time (interval minus vibration duration)
        let waitTime = scaledInterval - vibeDuration;

        // Ensure minimum interval to prevent continuous buzz
        waitTime = Math.max(minIntervalMs, waitTime);

        // Check if adding this beat would exceed max duration
        const nextBeatDuration = waitTime + vibeDuration;
        if (totalDuration + nextBeatDuration > maxDurationMs) {
            wasTruncated = true;
            break;
        }

        pattern.push(waitTime, vibeDuration);
        totalDuration += nextBeatDuration;
        beatCount++;
    }

    return {
        pattern,
        totalDurationMs: totalDuration,
        beatCount,
        effectiveBpm,
        wasTruncated,
        metadata: {
            originalBpm: rhythmPattern.estimatedBpm,
            timeSignature: rhythmPattern.timeSignature,
            difficulty,
            speedMultiplier,
            vibrationDurationMs: vibeDuration,
        },
    };
}

/**
 * Creates a simple vibration pattern from BPM and beat count
 * Useful for generating test patterns or metronome-style vibrations
 *
 * @param bpm - Beats per minute
 * @param beatCount - Number of beats to generate
 * @param config - Configuration options
 * @returns VibrationPatternResult
 *
 * @example
 * ```typescript
 * // Create a 4-beat pattern at 120 BPM
 * const result = createSimplePattern(120, 4, { difficulty: 'MEDIUM' });
 * ```
 */
export function createSimplePattern(
    bpm: number,
    beatCount: number,
    config: VibrationConfig
): VibrationPatternResult {
    // Calculate interval from BPM (ms per beat)
    const intervalMs = Math.round(60000 / bpm);

    // Create onset times
    const onsetTimesMs: number[] = [];
    const intervalsMs: number[] = [];

    for (let i = 0; i < beatCount; i++) {
        onsetTimesMs.push(i * intervalMs);
        if (i > 0) {
            intervalsMs.push(intervalMs);
        }
    }

    // Create a synthetic RhythmPatternDTO
    const syntheticPattern: RhythmPatternDTO = {
        version: 1,
        onsetTimesMs,
        intervalsMs,
        estimatedBpm: bpm,
        timeSignature: '4/4',
        totalBeats: beatCount,
        trimmedStartMs: 0,
        trimmedEndMs: onsetTimesMs[onsetTimesMs.length - 1],
        originalDurationMs: onsetTimesMs[onsetTimesMs.length - 1],
    };

    return convertToVibrationPattern(syntheticPattern, config);
}

// ============================================================================
// PLAYBACK FUNCTIONS
// ============================================================================

/**
 * Plays a vibration pattern with callbacks for completion and progress
 *
 * @param patternResult - Result from convertToVibrationPattern
 * @param options - Playback options
 * @returns Promise that resolves when playback completes
 *
 * @example
 * ```typescript
 * const result = convertToVibrationPattern(pattern, { difficulty: 'MEDIUM' });
 *
 * await playVibrationPattern(result, {
 *   onProgress: (progress, beatIndex) => {
 *     console.log(`Beat ${beatIndex}, ${Math.round(progress * 100)}% complete`);
 *   },
 *   onComplete: () => {
 *     console.log('Vibration finished!');
 *   },
 * });
 * ```
 */
export function playVibrationPattern(
    patternResult: VibrationPatternResult,
    options?: {
        onComplete?: () => void;
        onProgress?: (progress: number, beatIndex: number) => void;
    }
): Promise<void> {
    return new Promise((resolve) => {
        // Cancel any existing playback
        cancelVibration();

        const { pattern, totalDurationMs, beatCount } = patternResult;
        const { onComplete, onProgress } = options ?? {};

        // Initialize playback state
        playbackState = {
            isPlaying: true,
            startTime: Date.now(),
            timeoutIds: [],
            onCompleteCallback: onComplete,
            onProgressCallback: onProgress,
        };

        // Platform-specific vibration handling
        if (Platform.OS === 'android') {
            // Android natively supports vibration patterns
            Vibration.vibrate(pattern, false);

            // Set up progress callbacks
            if (onProgress) {
                scheduleProgressCallbacks(pattern, beatCount);
            }
        } else {
            // iOS: Vibration.vibrate() ignores pattern arrays
            // We need to manually sequence individual vibrations
            playIOSVibrationSequence(pattern, onProgress, beatCount);
        }

        // Schedule completion callback
        const completionTimeout = setTimeout(() => {
            playbackState.isPlaying = false;

            if (onProgress) {
                onProgress(1, beatCount - 1);
            }

            if (onComplete) {
                onComplete();
            }

            resolve();
        }, totalDurationMs + 50); // Small buffer for timing

        playbackState.timeoutIds.push(completionTimeout);
    });
}

/**
 * Schedules progress callbacks during Android playback
 */
function scheduleProgressCallbacks(
    pattern: number[],
    beatCount: number
): void {
    let currentTime = 0;
    let beatIndex = 0;

    for (let i = 0; i < pattern.length; i += 2) {
        const waitTime = pattern[i];
        const vibeTime = pattern[i + 1] || 0;

        currentTime += waitTime;

        // Schedule progress callback at the start of each vibration
        const capturedBeatIndex = beatIndex;
        const capturedTime = currentTime;
        const totalDuration = pattern.reduce((sum, val) => sum + val, 0);

        const timeoutId = setTimeout(() => {
            if (playbackState.isPlaying && playbackState.onProgressCallback) {
                const progress = capturedTime / totalDuration;
                playbackState.onProgressCallback(progress, capturedBeatIndex);
            }
        }, capturedTime);

        playbackState.timeoutIds.push(timeoutId);

        currentTime += vibeTime;
        beatIndex++;
    }
}

/**
 * iOS-specific vibration sequence player
 * Since iOS ignores pattern arrays, we manually trigger each vibration
 */
function playIOSVibrationSequence(
    pattern: number[],
    onProgress?: (progress: number, beatIndex: number) => void,
    beatCount?: number
): void {
    let currentTime = 0;
    let beatIndex = 0;
    const totalDuration = pattern.reduce((sum, val) => sum + val, 0);

    for (let i = 0; i < pattern.length; i += 2) {
        const waitTime = pattern[i];
        const vibeTime = pattern[i + 1] || 0;

        currentTime += waitTime;

        // Schedule vibration
        const capturedVibeTime = vibeTime;
        const capturedBeatIndex = beatIndex;
        const capturedProgress = currentTime / totalDuration;

        const timeoutId = setTimeout(() => {
            if (playbackState.isPlaying) {
                // iOS vibrate - duration is mostly ignored, but we call it anyway
                Vibration.vibrate(capturedVibeTime);

                if (onProgress) {
                    onProgress(capturedProgress, capturedBeatIndex);
                }
            }
        }, currentTime);

        playbackState.timeoutIds.push(timeoutId);

        currentTime += vibeTime;
        beatIndex++;
    }
}

/**
 * Cancels any ongoing vibration playback
 * Safe to call even if nothing is playing
 */
export function cancelVibration(): void {
    // Cancel native vibration
    Vibration.cancel();

    // Clear all scheduled timeouts
    playbackState.timeoutIds.forEach((id) => clearTimeout(id));

    // Reset state
    playbackState = {
        isPlaying: false,
        startTime: 0,
        timeoutIds: [],
    };
}

/**
 * Checks if a vibration is currently playing
 */
export function isVibrationPlaying(): boolean {
    return playbackState.isPlaying;
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Gets the difficulty preset configuration
 *
 * @param difficulty - The difficulty level
 * @returns Preset configuration for that difficulty
 */
export function getDifficultyPreset(difficulty: VibrationDifficulty): {
    speedMultiplier: number;
    vibrationDurationMs: number;
    description: string;
} {
    return { ...DIFFICULTY_PRESETS[difficulty] };
}

/**
 * Estimates pattern duration without full conversion
 * Useful for UI display before pattern is generated
 *
 * @param rhythmPattern - The rhythm pattern
 * @param difficulty - Difficulty level
 * @returns Estimated duration in milliseconds
 */
export function estimatePatternDuration(
    rhythmPattern: RhythmPatternDTO,
    difficulty: VibrationDifficulty
): number {
    const preset = DIFFICULTY_PRESETS[difficulty];
    const totalIntervals = rhythmPattern.intervalsMs.reduce((sum, val) => sum + val, 0);
    const scaledDuration = totalIntervals / preset.speedMultiplier;
    const vibrationTime = rhythmPattern.totalBeats * preset.vibrationDurationMs;

    return Math.round(scaledDuration + vibrationTime);
}

/**
 * Validates a RhythmPatternDTO for vibration conversion
 *
 * @param pattern - The pattern to validate
 * @returns Object with isValid flag and any error messages
 */
export function validateRhythmPattern(pattern: RhythmPatternDTO): {
    isValid: boolean;
    errors: string[];
    warnings: string[];
} {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check required fields
    if (!pattern.onsetTimesMs || pattern.onsetTimesMs.length === 0) {
        errors.push('Pattern must have at least one onset time');
    }

    if (!pattern.intervalsMs) {
        errors.push('Pattern must have intervals array');
    }

    // Check consistency
    if (pattern.onsetTimesMs && pattern.intervalsMs) {
        const expectedIntervals = pattern.onsetTimesMs.length - 1;
        if (pattern.intervalsMs.length !== expectedIntervals) {
            errors.push(
                `Intervals count (${pattern.intervalsMs.length}) should be ` +
                `one less than onset count (${pattern.onsetTimesMs.length})`
            );
        }
    }

    // Check for very fast patterns
    if (pattern.estimatedBpm > 200) {
        warnings.push('Very fast BPM may result in continuous vibration feel');
    }

    // Check for very slow patterns
    if (pattern.estimatedBpm < 40) {
        warnings.push('Very slow BPM may feel like disconnected vibrations');
    }

    // Check for extremely short intervals
    const hasShortIntervals = pattern.intervalsMs?.some((i) => i < 100);
    if (hasShortIntervals) {
        warnings.push('Pattern has very short intervals that may blur together');
    }

    return {
        isValid: errors.length === 0,
        errors,
        warnings,
    };
}

/**
 * Triggers a single haptic feedback pulse
 * Useful for button presses or confirmations
 *
 * @param intensity - 'light' | 'medium' | 'heavy'
 */
export function triggerHapticPulse(
    intensity: 'light' | 'medium' | 'heavy' = 'medium'
): void {
    const durations: Record<typeof intensity, number> = {
        light: 10,
        medium: 30,
        heavy: 50,
    };

    const duration = Platform.OS === 'ios' ? durations[intensity] : durations[intensity] * 2;
    Vibration.vibrate(duration);
}

// ============================================================================
// SAMPLE PATTERNS (for testing)
// ============================================================================

/**
 * Sample rhythm patterns for testing the vibration system
 */
export const SAMPLE_PATTERNS = {
    /** Classic "We Will Rock You" stomp-stomp-clap pattern */
    weWillRockYou: {
        version: 1,
        onsetTimesMs: [0, 500, 1000, 2000, 2500, 3000, 4000],
        intervalsMs: [500, 500, 1000, 500, 500, 1000],
        estimatedBpm: 81,
        timeSignature: '4/4',
        totalBeats: 7,
        trimmedStartMs: 0,
        trimmedEndMs: 4000,
        originalDurationMs: 4000,
    } as RhythmPatternDTO,

    /** Simple 4/4 beat at 120 BPM */
    simpleFour: {
        version: 1,
        onsetTimesMs: [0, 500, 1000, 1500],
        intervalsMs: [500, 500, 500],
        estimatedBpm: 120,
        timeSignature: '4/4',
        totalBeats: 4,
        trimmedStartMs: 0,
        trimmedEndMs: 1500,
        originalDurationMs: 1500,
    } as RhythmPatternDTO,

    /** Waltz 3/4 pattern */
    waltz: {
        version: 1,
        onsetTimesMs: [0, 600, 1200, 1800, 2400, 3000],
        intervalsMs: [600, 600, 600, 600, 600],
        estimatedBpm: 100,
        timeSignature: '3/4',
        totalBeats: 6,
        trimmedStartMs: 0,
        trimmedEndMs: 3000,
        originalDurationMs: 3000,
    } as RhythmPatternDTO,

    /** Syncopated rhythm with varying intervals */
    syncopated: {
        version: 1,
        onsetTimesMs: [0, 250, 750, 1000, 1500, 1750, 2000],
        intervalsMs: [250, 500, 250, 500, 250, 250],
        estimatedBpm: 120,
        timeSignature: '4/4',
        totalBeats: 7,
        trimmedStartMs: 0,
        trimmedEndMs: 2000,
        originalDurationMs: 2000,
    } as RhythmPatternDTO,
};

// ============================================================================
// EXPORTS
// ============================================================================

export default {
    // Core functions
    convertToVibrationPattern,
    createSimplePattern,

    // Playback
    playVibrationPattern,
    cancelVibration,
    isVibrationPlaying,

    // Utilities
    getDifficultyPreset,
    estimatePatternDuration,
    validateRhythmPattern,
    triggerHapticPulse,

    // Constants
    DIFFICULTY_PRESETS,
    SAMPLE_PATTERNS,
};
