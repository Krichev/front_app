/**
 * Type definitions for the Vibration Song Quiz feature
 *
 * @module features/VibrationQuiz/model/types
 */

import type { RhythmPatternDTO } from '../../../types/rhythmChallenge.types';

// Re-export for convenience (also defined locally in vibrationConverter for standalone use)
export type { RhythmPatternDTO };

// ============================================================================
// GAME TYPES
// ============================================================================

/**
 * Difficulty levels for the vibration quiz
 */
export type VibrationDifficulty = 'EASY' | 'MEDIUM' | 'HARD';

/**
 * Game phases for the state machine
 */
export type VibrationQuizPhase =
    | 'SETUP'       // Selecting difficulty, preparing game
    | 'READY'       // Ready to start vibration
    | 'VIBRATING'   // Playing vibration pattern
    | 'GUESSING'    // User selecting answer
    | 'FEEDBACK'    // Showing correct/incorrect
    | 'RESULTS';    // Final score screen

/**
 * A single song question in the quiz
 */
export interface VibrationSongQuestion {
    /** Unique identifier */
    id: string;

    /** The correct song title (answer) */
    songTitle: string;

    /** Artist name */
    artist: string;

    /** The rhythm pattern extracted from the song */
    rhythmPattern: RhythmPatternDTO;

    /** Difficulty classification */
    difficulty: VibrationDifficulty;

    /** Music category (e.g., "Pop", "Rock", "Classical") */
    category?: string;

    /** Three wrong answer options */
    wrongAnswers: [string, string, string];

    /** Optional hint shown after failed attempt */
    hint?: string;

    /** Year the song was released (optional, for hint) */
    year?: number;

    /** Duration of the song excerpt in ms */
    excerptDurationMs?: number;
}

/**
 * Answer option displayed to the user
 */
export interface AnswerOption {
    /** The song title */
    title: string;

    /** Whether this is the correct answer */
    isCorrect: boolean;

    /** Display order (for consistent shuffling) */
    displayIndex: number;
}

/**
 * Result of a single round
 */
export interface RoundResult {
    /** The question that was asked */
    question: VibrationSongQuestion;

    /** User's selected answer (null if time ran out) */
    selectedAnswer: string | null;

    /** Whether the answer was correct */
    isCorrect: boolean;

    /** Time taken to answer in milliseconds */
    responseTimeMs: number;

    /** Number of times pattern was replayed */
    replaysUsed: number;

    /** Points earned for this round */
    pointsEarned: number;
}

/**
 * Configuration for starting a new game
 */
export interface GameConfig {
    /** Difficulty level */
    difficulty: VibrationDifficulty;

    /** Number of questions/rounds */
    questionCount: number;

    /** Maximum replays per question (default: 3) */
    maxReplaysPerQuestion?: number;

    /** Time limit for guessing in seconds (0 = no limit) */
    guessTimeLimitSeconds?: number;

    /** Categories to include (empty = all) */
    categories?: string[];

    /** Enable hints after wrong answer */
    enableHints?: boolean;
}

/**
 * Full game state
 */
export interface VibrationQuizState {
    /** Current game phase */
    phase: VibrationQuizPhase;

    /** Game configuration */
    config: GameConfig;

    /** All questions for this game */
    questions: VibrationSongQuestion[];

    /** Current question index (0-based) */
    currentQuestionIndex: number;

    /** Shuffled answer options for current question */
    currentAnswerOptions: AnswerOption[];

    /** User's selected answer for current question */
    currentSelectedAnswer: string | null;

    /** Current question result (set after answer submitted) */
    currentResult: 'correct' | 'incorrect' | null;

    /** Results from all completed rounds */
    roundResults: RoundResult[];

    /** Total score */
    totalScore: number;

    /** Replays used for current question */
    currentReplaysUsed: number;

    /** Max replays allowed */
    maxReplays: number;

    /** Whether vibration is currently playing */
    isVibrating: boolean;

    /** Progress through current vibration (0-1) */
    vibrationProgress: number;

    /** Current beat index during vibration */
    currentBeatIndex: number;

    /** Remaining time for guessing (seconds, null if no limit) */
    guessTimeRemaining: number | null;

    /** Error message if something went wrong */
    error: string | null;

    /** Timestamp when current question started */
    questionStartTime: number | null;
}

// ============================================================================
// ACTION TYPES (for reducer pattern)
// ============================================================================

export type VibrationQuizAction =
    | { type: 'START_GAME'; payload: { config: GameConfig; questions: VibrationSongQuestion[] } }
    | { type: 'START_VIBRATION' }
    | { type: 'VIBRATION_PROGRESS'; payload: { progress: number; beatIndex: number } }
    | { type: 'VIBRATION_COMPLETE' }
    | { type: 'USE_REPLAY' }
    | { type: 'SELECT_ANSWER'; payload: { answer: string } }
    | { type: 'SUBMIT_ANSWER' }
    | { type: 'NEXT_QUESTION' }
    | { type: 'FINISH_GAME' }
    | { type: 'RESET_GAME' }
    | { type: 'SET_ERROR'; payload: { error: string } }
    | { type: 'CLEAR_ERROR' }
    | { type: 'TICK_TIMER' };

// ============================================================================
// SCORE CALCULATION
// ============================================================================

/**
 * Scoring configuration
 */
export interface ScoringConfig {
    /** Base points for correct answer */
    basePoints: number;

    /** Bonus for fast answers (multiplier) */
    speedBonusMultiplier: number;

    /** Penalty per replay used (subtracted from base) */
    replayPenalty: number;

    /** Minimum points for correct answer */
    minimumPoints: number;
}

/**
 * Default scoring configuration
 */
export const DEFAULT_SCORING: ScoringConfig = {
    basePoints: 100,
    speedBonusMultiplier: 0.5, // Up to 50% bonus for fast answers
    replayPenalty: 15,
    minimumPoints: 25,
};

// ============================================================================
// UTILITY TYPES
// ============================================================================

/**
 * Statistics for end-of-game display
 */
export interface GameStatistics {
    /** Total questions answered */
    totalQuestions: number;

    /** Number of correct answers */
    correctAnswers: number;

    /** Accuracy percentage */
    accuracyPercent: number;

    /** Total score */
    totalScore: number;

    /** Average response time (ms) */
    averageResponseTimeMs: number;

    /** Fastest correct answer (ms) */
    fastestResponseMs: number | null;

    /** Total replays used */
    totalReplaysUsed: number;

    /** Perfect rounds (correct without replays) */
    perfectRounds: number;

    /** Difficulty played */
    difficulty: VibrationDifficulty;

    /** Categories present in quiz */
    categories: string[];
}

/**
 * Calculate game statistics from round results
 */
export function calculateGameStatistics(
    results: RoundResult[],
    config: GameConfig
): GameStatistics {
    const correctResults = results.filter((r) => r.isCorrect);
    const responseTimes = correctResults.map((r) => r.responseTimeMs);

    const categories = [...new Set(results.map((r) => r.question.category).filter(Boolean))] as string[];

    return {
        totalQuestions: results.length,
        correctAnswers: correctResults.length,
        accuracyPercent: results.length > 0
            ? Math.round((correctResults.length / results.length) * 100)
            : 0,
        totalScore: results.reduce((sum, r) => sum + r.pointsEarned, 0),
        averageResponseTimeMs: responseTimes.length > 0
            ? Math.round(responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length)
            : 0,
        fastestResponseMs: responseTimes.length > 0
            ? Math.min(...responseTimes)
            : null,
        totalReplaysUsed: results.reduce((sum, r) => sum + r.replaysUsed, 0),
        perfectRounds: results.filter((r) => r.isCorrect && r.replaysUsed === 0).length,
        difficulty: config.difficulty,
        categories,
    };
}

/**
 * Calculate points for a round
 */
export function calculateRoundPoints(
    isCorrect: boolean,
    responseTimeMs: number,
    replaysUsed: number,
    guessTimeLimitSeconds: number,
    scoring: ScoringConfig = DEFAULT_SCORING
): number {
    if (!isCorrect) {
        return 0;
    }

    let points = scoring.basePoints;

    // Deduct for replays
    points -= replaysUsed * scoring.replayPenalty;

    // Speed bonus (if time limit is set)
    if (guessTimeLimitSeconds > 0) {
        const timeLimitMs = guessTimeLimitSeconds * 1000;
        const timeRatio = 1 - (responseTimeMs / timeLimitMs);
        const speedBonus = Math.max(0, timeRatio) * scoring.basePoints * scoring.speedBonusMultiplier;
        points += Math.round(speedBonus);
    }

    // Ensure minimum points
    return Math.max(scoring.minimumPoints, Math.round(points));
}
