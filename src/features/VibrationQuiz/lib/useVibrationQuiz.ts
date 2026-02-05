/**
 * useVibrationQuiz - React hook for managing vibration quiz gameplay
 *
 * Provides state management, vibration playback control, and game logic
 * for the Vibration Song Quiz feature.
 *
 * @module features/VibrationQuiz/lib/useVibrationQuiz
 */

import { useCallback, useEffect, useMemo, useReducer, useRef } from 'react';
import {
    convertToVibrationPattern,
    playVibrationPattern,
    cancelVibration,
    triggerHapticPulse,
    type VibrationPatternResult,
} from './vibrationConverter';
import {
    type VibrationQuizState,
    type VibrationQuizAction,
    type VibrationQuizPhase,
    type VibrationSongQuestion,
    type AnswerOption,
    type RoundResult,
    type GameConfig,
    type GameStatistics,
    calculateGameStatistics,
    calculateRoundPoints,
    DEFAULT_SCORING,
} from '../model/types';

// ============================================================================
// INITIAL STATE
// ============================================================================

const createInitialState = (): VibrationQuizState => ({
    phase: 'SETUP',
    config: {
        difficulty: 'MEDIUM',
        questionCount: 5,
        maxReplaysPerQuestion: 3,
        guessTimeLimitSeconds: 30,
        categories: [],
        enableHints: true,
    },
    questions: [],
    currentQuestionIndex: 0,
    currentAnswerOptions: [],
    currentSelectedAnswer: null,
    currentResult: null,
    roundResults: [],
    totalScore: 0,
    currentReplaysUsed: 0,
    maxReplays: 3,
    isVibrating: false,
    vibrationProgress: 0,
    currentBeatIndex: 0,
    guessTimeRemaining: null,
    error: null,
    questionStartTime: null,
});

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Shuffles an array using Fisher-Yates algorithm
 */
function shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

/**
 * Creates shuffled answer options from a question
 */
function createAnswerOptions(question: VibrationSongQuestion): AnswerOption[] {
    const allAnswers = [
        { title: question.songTitle, isCorrect: true },
        ...question.wrongAnswers.map((title) => ({ title, isCorrect: false })),
    ];

    const shuffled = shuffleArray(allAnswers);

    return shuffled.map((answer, index) => ({
        ...answer,
        displayIndex: index,
    }));
}

// ============================================================================
// REDUCER
// ============================================================================

function vibrationQuizReducer(
    state: VibrationQuizState,
    action: VibrationQuizAction
): VibrationQuizState {
    switch (action.type) {
        case 'START_GAME': {
            const { config, questions } = action.payload;
            const firstQuestion = questions[0];

            return {
                ...createInitialState(),
                phase: 'READY',
                config,
                questions,
                currentAnswerOptions: firstQuestion ? createAnswerOptions(firstQuestion) : [],
                maxReplays: config.maxReplaysPerQuestion ?? 3,
                guessTimeRemaining: config.guessTimeLimitSeconds ?? null,
            };
        }

        case 'START_VIBRATION':
            return {
                ...state,
                phase: 'VIBRATING',
                isVibrating: true,
                vibrationProgress: 0,
                currentBeatIndex: 0,
                questionStartTime: state.questionStartTime ?? Date.now(),
            };

        case 'VIBRATION_PROGRESS':
            return {
                ...state,
                vibrationProgress: action.payload.progress,
                currentBeatIndex: action.payload.beatIndex,
            };

        case 'VIBRATION_COMPLETE':
            return {
                ...state,
                phase: 'GUESSING',
                isVibrating: false,
                vibrationProgress: 1,
                guessTimeRemaining: state.config.guessTimeLimitSeconds ?? null,
            };

        case 'USE_REPLAY':
            if (state.currentReplaysUsed >= state.maxReplays) {
                return state;
            }
            return {
                ...state,
                phase: 'READY',
                currentReplaysUsed: state.currentReplaysUsed + 1,
            };

        case 'SELECT_ANSWER':
            return {
                ...state,
                currentSelectedAnswer: action.payload.answer,
            };

        case 'SUBMIT_ANSWER': {
            const currentQuestion = state.questions[state.currentQuestionIndex];
            if (!currentQuestion || state.phase !== 'GUESSING') {
                return state;
            }

            const isCorrect = state.currentSelectedAnswer === currentQuestion.songTitle;
            const responseTimeMs = state.questionStartTime
                ? Date.now() - state.questionStartTime
                : 0;

            const pointsEarned = calculateRoundPoints(
                isCorrect,
                responseTimeMs,
                state.currentReplaysUsed,
                state.config.guessTimeLimitSeconds ?? 0,
                DEFAULT_SCORING
            );

            const roundResult: RoundResult = {
                question: currentQuestion,
                selectedAnswer: state.currentSelectedAnswer,
                isCorrect,
                responseTimeMs,
                replaysUsed: state.currentReplaysUsed,
                pointsEarned,
            };

            return {
                ...state,
                phase: 'FEEDBACK',
                currentResult: isCorrect ? 'correct' : 'incorrect',
                roundResults: [...state.roundResults, roundResult],
                totalScore: state.totalScore + pointsEarned,
            };
        }

        case 'NEXT_QUESTION': {
            const nextIndex = state.currentQuestionIndex + 1;

            // Check if game is complete
            if (nextIndex >= state.questions.length) {
                return {
                    ...state,
                    phase: 'RESULTS',
                };
            }

            const nextQuestion = state.questions[nextIndex];

            return {
                ...state,
                phase: 'READY',
                currentQuestionIndex: nextIndex,
                currentAnswerOptions: createAnswerOptions(nextQuestion),
                currentSelectedAnswer: null,
                currentResult: null,
                currentReplaysUsed: 0,
                vibrationProgress: 0,
                currentBeatIndex: 0,
                questionStartTime: null,
                guessTimeRemaining: state.config.guessTimeLimitSeconds ?? null,
            };
        }

        case 'FINISH_GAME':
            return {
                ...state,
                phase: 'RESULTS',
            };

        case 'RESET_GAME':
            return createInitialState();

        case 'SET_ERROR':
            return {
                ...state,
                error: action.payload.error,
                isVibrating: false,
            };

        case 'CLEAR_ERROR':
            return {
                ...state,
                error: null,
            };

        case 'TICK_TIMER': {
            if (state.guessTimeRemaining === null || state.phase !== 'GUESSING') {
                return state;
            }

            const newTime = state.guessTimeRemaining - 1;

            if (newTime <= 0) {
                // Time's up - auto-submit with no answer
                const currentQuestion = state.questions[state.currentQuestionIndex];
                const responseTimeMs = (state.config.guessTimeLimitSeconds ?? 0) * 1000;

                const roundResult: RoundResult = {
                    question: currentQuestion,
                    selectedAnswer: null,
                    isCorrect: false,
                    responseTimeMs,
                    replaysUsed: state.currentReplaysUsed,
                    pointsEarned: 0,
                };

                return {
                    ...state,
                    phase: 'FEEDBACK',
                    currentResult: 'incorrect',
                    roundResults: [...state.roundResults, roundResult],
                    guessTimeRemaining: 0,
                };
            }

            return {
                ...state,
                guessTimeRemaining: newTime,
            };
        }

        default:
            return state;
    }
}

// ============================================================================
// HOOK
// ============================================================================

export interface UseVibrationQuizOptions {
    /** Called when game completes */
    onGameComplete?: (statistics: GameStatistics) => void;
    /** Called on each correct answer */
    onCorrectAnswer?: () => void;
    /** Called on each wrong answer */
    onWrongAnswer?: () => void;
}

export interface UseVibrationQuizReturn {
    // State
    state: VibrationQuizState;
    phase: VibrationQuizPhase;
    currentQuestion: VibrationSongQuestion | null;
    answerOptions: AnswerOption[];
    isGameActive: boolean;
    canReplay: boolean;
    replaysRemaining: number;

    // Computed values
    progress: {
        current: number;
        total: number;
        percentage: number;
    };
    statistics: GameStatistics | null;

    // Actions
    startGame: (config: GameConfig, questions: VibrationSongQuestion[]) => void;
    playVibration: () => Promise<void>;
    stopVibration: () => void;
    useReplay: () => void;
    selectAnswer: (answer: string) => void;
    submitAnswer: () => void;
    nextQuestion: () => void;
    resetGame: () => void;
    clearError: () => void;
}

/**
 * Main hook for managing Vibration Quiz gameplay
 *
 * @example
 * ```tsx
 * const {
 *   state,
 *   currentQuestion,
 *   playVibration,
 *   selectAnswer,
 *   submitAnswer,
 * } = useVibrationQuiz({
 *   onGameComplete: (stats) => console.log('Game over!', stats),
 * });
 * ```
 */
export function useVibrationQuiz(
    options: UseVibrationQuizOptions = {}
): UseVibrationQuizReturn {
    const { onGameComplete, onCorrectAnswer, onWrongAnswer } = options;

    const [state, dispatch] = useReducer(vibrationQuizReducer, undefined, createInitialState);

    // Timer ref for guess countdown
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    // Vibration pattern cache
    const patternCacheRef = useRef<Map<string, VibrationPatternResult>>(new Map());

    // ========================================================================
    // COMPUTED VALUES
    // ========================================================================

    const currentQuestion = useMemo(() => {
        return state.questions[state.currentQuestionIndex] ?? null;
    }, [state.questions, state.currentQuestionIndex]);

    const isGameActive = useMemo(() => {
        return state.phase !== 'SETUP' && state.phase !== 'RESULTS';
    }, [state.phase]);

    const canReplay = useMemo(() => {
        return (
            state.currentReplaysUsed < state.maxReplays &&
            (state.phase === 'GUESSING' || state.phase === 'READY') &&
            !state.isVibrating
        );
    }, [state.currentReplaysUsed, state.maxReplays, state.phase, state.isVibrating]);

    const replaysRemaining = useMemo(() => {
        return Math.max(0, state.maxReplays - state.currentReplaysUsed);
    }, [state.maxReplays, state.currentReplaysUsed]);

    const progress = useMemo(() => {
        const current = state.currentQuestionIndex + 1;
        const total = state.questions.length;
        const percentage = total > 0 ? Math.round((current / total) * 100) : 0;
        return { current, total, percentage };
    }, [state.currentQuestionIndex, state.questions.length]);

    const statistics = useMemo(() => {
        if (state.phase !== 'RESULTS' || state.roundResults.length === 0) {
            return null;
        }
        return calculateGameStatistics(state.roundResults, state.config);
    }, [state.phase, state.roundResults, state.config]);

    // ========================================================================
    // EFFECTS
    // ========================================================================

    // Timer for guess countdown
    useEffect(() => {
        if (state.phase === 'GUESSING' && state.guessTimeRemaining !== null && state.guessTimeRemaining > 0) {
            timerRef.current = setInterval(() => {
                dispatch({ type: 'TICK_TIMER' });
            }, 1000);

            return () => {
                if (timerRef.current) {
                    clearInterval(timerRef.current);
                    timerRef.current = null;
                }
            };
        }
    }, [state.phase, state.guessTimeRemaining]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            cancelVibration();
            if (timerRef.current) {
                clearInterval(timerRef.current);
            }
        };
    }, []);

    // Callbacks for game events
    useEffect(() => {
        if (state.currentResult === 'correct' && onCorrectAnswer) {
            onCorrectAnswer();
        } else if (state.currentResult === 'incorrect' && onWrongAnswer) {
            onWrongAnswer();
        }
    }, [state.currentResult, onCorrectAnswer, onWrongAnswer]);

    useEffect(() => {
        if (state.phase === 'RESULTS' && statistics && onGameComplete) {
            onGameComplete(statistics);
        }
    }, [state.phase, statistics, onGameComplete]);

    // ========================================================================
    // ACTIONS
    // ========================================================================

    const startGame = useCallback((config: GameConfig, questions: VibrationSongQuestion[]) => {
        if (questions.length === 0) {
            dispatch({ type: 'SET_ERROR', payload: { error: 'No questions provided' } });
            return;
        }

        // Clear pattern cache
        patternCacheRef.current.clear();

        dispatch({ type: 'START_GAME', payload: { config, questions } });
    }, []);

    const playVibration = useCallback(async () => {
        if (!currentQuestion || state.isVibrating) {
            return;
        }

        dispatch({ type: 'START_VIBRATION' });

        try {
            // Check cache for converted pattern
            const cacheKey = currentQuestion.id;
            let patternResult = patternCacheRef.current.get(cacheKey);

            if (!patternResult) {
                patternResult = convertToVibrationPattern(currentQuestion.rhythmPattern, {
                    difficulty: state.config.difficulty,
                });
                patternCacheRef.current.set(cacheKey, patternResult);
            }

            await playVibrationPattern(patternResult, {
                onProgress: (progress, beatIndex) => {
                    dispatch({
                        type: 'VIBRATION_PROGRESS',
                        payload: { progress, beatIndex },
                    });
                },
                onComplete: () => {
                    dispatch({ type: 'VIBRATION_COMPLETE' });
                },
            });
        } catch (error) {
            console.error('Vibration playback error:', error);
            dispatch({
                type: 'SET_ERROR',
                payload: { error: 'Failed to play vibration pattern' },
            });
        }
    }, [currentQuestion, state.isVibrating, state.config.difficulty]);

    const stopVibration = useCallback(() => {
        cancelVibration();
        if (state.isVibrating) {
            dispatch({ type: 'VIBRATION_COMPLETE' });
        }
    }, [state.isVibrating]);

    const useReplay = useCallback(() => {
        if (!canReplay) {
            return;
        }
        triggerHapticPulse('light');
        dispatch({ type: 'USE_REPLAY' });
    }, [canReplay]);

    const selectAnswer = useCallback((answer: string) => {
        if (state.phase !== 'GUESSING') {
            return;
        }
        triggerHapticPulse('light');
        dispatch({ type: 'SELECT_ANSWER', payload: { answer } });
    }, [state.phase]);

    const submitAnswer = useCallback(() => {
        if (state.phase !== 'GUESSING' || state.currentSelectedAnswer === null) {
            return;
        }
        triggerHapticPulse('medium');
        dispatch({ type: 'SUBMIT_ANSWER' });
    }, [state.phase, state.currentSelectedAnswer]);

    const nextQuestion = useCallback(() => {
        if (state.phase !== 'FEEDBACK') {
            return;
        }
        dispatch({ type: 'NEXT_QUESTION' });
    }, [state.phase]);

    const resetGame = useCallback(() => {
        cancelVibration();
        patternCacheRef.current.clear();
        dispatch({ type: 'RESET_GAME' });
    }, []);

    const clearError = useCallback(() => {
        dispatch({ type: 'CLEAR_ERROR' });
    }, []);

    // ========================================================================
    // RETURN
    // ========================================================================

    return {
        // State
        state,
        phase: state.phase,
        currentQuestion,
        answerOptions: state.currentAnswerOptions,
        isGameActive,
        canReplay,
        replaysRemaining,

        // Computed
        progress,
        statistics,

        // Actions
        startGame,
        playVibration,
        stopVibration,
        useReplay,
        selectAnswer,
        submitAnswer,
        nextQuestion,
        resetGame,
        clearError,
    };
}

export default useVibrationQuiz;
