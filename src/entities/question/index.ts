// ============================================================================
// src/entities/question/index.ts
// Public API for the question entity

// Re-export types
export type {
    QuestionData,
    QuestionDifficulty,
    QuestionCategory,
    QuestionSource,
    QuestionState,
} from './model/types';

// Re-export slice actions and reducer
export { questionSlice, questionActions } from './model/slice';

// Re-export selectors
export * from './model/selectors';

// Re-export API
export { questionApi } from './api';
export * from './api';

// Re-export shared API service for direct use if needed
export { QuestionApiService } from '../../shared/api/question/service';