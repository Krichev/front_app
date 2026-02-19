// src/entities/ChallengeState/model/types/challenge.types.ts
import { PaymentType, CurrencyType } from '../types';

// Re-export types for convenience from the model source of truth
export type {
    ApiChallenge,
    ChallengeAccessUser,
    CreateChallengeRequest,
    CreateQuizChallengeRequest,
    GetChallengesParams,
    LocationVerificationRequest,
    PhotoVerificationRequest,
    VerificationResponse,
    QuizChallengeConfig,
} from '../types';

export {
    PaymentType,
    CurrencyType,
};

// Quest is now an alias for Challenge
// This maintains backward compatibility with UI code
export type { ApiChallenge as Quest } from '../types';
export type { ApiChallenge as QuestDTO } from '../types';

// For clarity in UI code
export interface QuestListItem {
    // Any quest-specific display properties
    displayType?: 'quiz' | 'audio' | 'standard';
}
