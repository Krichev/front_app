// src/shared/types/difficulty.ts
// Single source of truth for difficulty levels across the entire app.

/**
 * Difficulty level for questions, challenges, puzzles, and games.
 * Maps 1:1 with the backend enum.
 */
export type Difficulty = 'EASY' | 'MEDIUM' | 'HARD';

/** Ordered list of all difficulty levels — use in UI selectors and iteration. */
export const DIFFICULTY_LEVELS: readonly Difficulty[] = ['EASY', 'MEDIUM', 'HARD'] as const;

// Backward-compatible aliases — prefer `Difficulty` for new code.
export type APIDifficulty = Difficulty;
export type DifficultyLevel = Difficulty;
