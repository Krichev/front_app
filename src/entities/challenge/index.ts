// src/entities/challenge/index.ts
// Public API for the challenge entity

// Re-export types
export type {
    Challenge,
    ChallengeStatus,
    ChallengeType,
    ChallengeReward,
    QuizConfig,
    ChallengeParticipant,
    ChallengeState,
} from './model/types';

// Re-export slice actions and reducer
export { challengeSlice, challengeActions } from './model/slice';

// Re-export selectors
export * from './model/selectors';

// Re-export API
export { challengeApi } from './api';
export * from './api';