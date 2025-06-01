// src/entities/challenge/index.ts
export {challengeApi} from './api';
export {challengeSlice, challengeActions} from './model';
export type {
    Challenge,
    ChallengeType,
    ChallengeStatus,
    VerificationMethod,
    QuizConfig,
} from './model/types';
export {ChallengeCard} from './ui/challenge-card';
export {ChallengeStatusBadge} from './ui/challenge-status-badge';

// Re-export API hooks
export {
    useGetChallengesQuery,
    useGetChallengeByIdQuery,
    useCreateChallengeMutation,
    useUpdateChallengeMutation,
    useDeleteChallengeMutation,
    useJoinChallengeMutation,
} from './api';