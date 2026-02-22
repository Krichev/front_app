import { QuizQuestion } from '../../../entities/QuizState/model/slice/quizApi';

export type DifficultyFilter = 'All' | 'EASY' | 'MEDIUM' | 'HARD';

export const DIFFICULTY_OPTIONS: readonly DifficultyFilter[] = ['All', 'EASY' , 'MEDIUM' , 'HARD'] as const;

export const MAX_SELECTION_COUNT = 15;
export const DEFAULT_QUESTION_COUNT = 20;
export const MAX_RECENT_SEARCHES = 5;

// Default recent searches (placeholder until AsyncStorage integration)
export const DEFAULT_RECENT_SEARCHES = ['History', 'Science', 'Literature', 'Geography', 'Sports'];
