// src/entities/challenge/index.ts
// Public API for the challenge entity

// Re-export types
export type {
    Challenge,
    ChallengeStatus,
    ChallengeType,
    ChallengeReward,
    ChallengeFilters, // Add the missing export
    QuizConfig,
    ChallengeParticipant,
    ChallengeState,
} from './model/types';

// Re-export slice actions and reducer
export { challengeSlice, challengeActions } from './model/slice';

// Re-export selectors with named exports for better tree-shaking
export {
    selectChallengeState,
    selectChallenges,
    selectCurrentChallenge,
    selectMyParticipations,
    selectIsLoading,
    selectError,
    selectFilters,
    selectFilteredChallenges, // Add the missing export
    selectChallengesByStatus,
    selectChallengesByType,
    selectActiveChallenges,
    selectMyChallenges,
    selectJoinedChallenges,
    selectChallengeById,
    selectChallengeCount,
    selectHasActiveFilters,
} from './model/selectors';

// Re-export API
export { challengeApi } from './api';
export * from './api';

// Create a namespace export for selectors (backward compatibility)
import * as challengeSelectors from './model/selectors';

export { challengeSelectors };