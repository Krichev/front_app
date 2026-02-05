/**
 * VibrationQuiz Feature - "Feel the Beat" Game Mode
 *
 * A quiz game where users guess songs based on their rhythm patterns
 * played through device vibrations.
 *
 * @module features/VibrationQuiz
 *
 * @example
 * ```tsx
 * import {
 *   useVibrationQuiz,
 *   convertToVibrationPattern,
 *   getRandomSongs,
 *   SAMPLE_SONGS,
 * } from '@/features/VibrationQuiz';
 *
 * function VibrationQuizScreen() {
 *   const {
 *     state,
 *     currentQuestion,
 *     playVibration,
 *     selectAnswer,
 *     submitAnswer,
 *   } = useVibrationQuiz();
 *
 *   // ... component logic
 * }
 * ```
 */

// ============================================================================
// TYPES
// ============================================================================

export type {
    // Core game types
    VibrationDifficulty,
    VibrationQuizPhase,
    VibrationSongQuestion,
    AnswerOption,
    RoundResult,
    GameConfig,
    VibrationQuizState,
    VibrationQuizAction,

    // Scoring
    ScoringConfig,
    GameStatistics,

    // Re-exported rhythm types
    RhythmPatternDTO,
} from './model/types';

export {
    // Scoring helpers
    DEFAULT_SCORING,
    calculateGameStatistics,
    calculateRoundPoints,
} from './model/types';

// ============================================================================
// VIBRATION CONVERTER
// ============================================================================

export {
    // Core conversion
    convertToVibrationPattern,
    createSimplePattern,

    // Playback control
    playVibrationPattern,
    cancelVibration,
    isVibrationPlaying,

    // Utilities
    getDifficultyPreset,
    estimatePatternDuration,
    validateRhythmPattern,
    triggerHapticPulse,

    // Sample patterns for testing
    SAMPLE_PATTERNS,

    // Default export
    default as VibrationConverter,
} from './lib/vibrationConverter';

export type {
    VibrationConfig,
    VibrationPatternResult,
} from './lib/vibrationConverter';

// ============================================================================
// REACT HOOK
// ============================================================================

export {
    useVibrationQuiz,
    default as useVibrationQuizDefault,
} from './lib/useVibrationQuiz';

export type {
    UseVibrationQuizOptions,
    UseVibrationQuizReturn,
} from './lib/useVibrationQuiz';

// ============================================================================
// SAMPLE DATA
// ============================================================================

export {
    SAMPLE_SONGS,
    getSongsByDifficulty,
    getSongsByCategory,
    getCategories,
    getRandomSongs,
    default as sampleSongsData,
} from './data/sampleSongs';
