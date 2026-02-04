import { CurrencyType } from '../../ChallengeState/model/types';

export type StakeType = 'POINTS' | 'SCREEN_TIME' | 'MONEY' | 'SOCIAL_QUEST';
export type WagerType = 'HEAD_TO_HEAD' | 'GROUP_POT' | 'SIDE_BET';
export type WagerStatus = 'PROPOSED' | 'ACCEPTED' | 'ACTIVE' | 'SETTLED' | 'CANCELLED' | 'EXPIRED';
export type ParticipantWagerStatus = 'INVITED' | 'ACCEPTED' | 'DECLINED' | 'WON' | 'LOST' | 'DRAW';
export type PenaltyType = 'SCREEN_TIME_LOCK' | 'SOCIAL_TASK' | 'POINT_DEDUCTION' | 'PROFILE_CHANGE' | 'CUSTOM_QUEST';
export type PenaltyStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'VERIFIED' | 'EXPIRED' | 'APPEALED' | 'WAIVED';
export type PenaltyVerificationMethod = 'SELF_REPORT' | 'PEER_REVIEW' | 'AI_VERIFICATION' | 'PHOTO_PROOF';
export type SettlementType = 'WINNER_TAKES_ALL' | 'PROPORTIONAL' | 'DRAW_REFUND';

export interface WagerParticipant {
    id: number;
    userId: number;
    username: string;
    status: ParticipantWagerStatus;
    stakeEscrowed: boolean;
    amountWon?: number;
    amountLost?: number;
    quizScore?: number;
    joinedAt: string;
    settledAt?: string;
}

export interface Wager {
    id: number;
    challengeId: number;
    quizSessionId?: number;
    creatorId: number;
    creatorUsername: string;
    wagerType: WagerType;
    stakeType: StakeType;
    stakeAmount: number;
    stakeCurrency?: CurrencyType;
    status: WagerStatus;
    minParticipants: number;
    maxParticipants?: number;
    socialPenaltyDescription?: string;
    screenTimeMinutes?: number;
    expiresAt: string;
    settledAt?: string;
    createdAt: string;
    participants: WagerParticipant[];
}

export interface WagerOutcome {
    id: number;
    wagerId: number;
    winnerId?: number;
    winnerUsername?: string;
    loserId?: number;
    loserUsername?: string;
    settlementType: SettlementType;
    amountDistributed: number;
    penaltyAssigned: boolean;
    notes?: string;
    settledAt: string;
}

export interface CreateWagerRequest {
    challengeId: number;
    quizSessionId?: number;
    wagerType: WagerType;
    stakeType: StakeType;
    stakeAmount: number;
    stakeCurrency?: CurrencyType;
    screenTimeMinutes?: number;
    socialPenaltyDescription?: string;
    invitedUserIds?: number[];
    expiresAt: string;
    minParticipants?: number;
    maxParticipants?: number;
}

export interface Penalty {
    id: number;
    wagerId?: number;
    challengeId?: number;
    assignedToUserId: number;
    assignedToUsername: string;
    assignedByUserId: number;
    assignedByUsername: string;
    penaltyType: PenaltyType;
    description: string;
    status: PenaltyStatus;
    dueDate: string;
    completedAt?: string;
    verificationMethod: PenaltyVerificationMethod;
    verifiedByUserId?: number;
    verifiedAt?: string;
    proofDescription?: string;
    proofMediaUrl?: string;
    screenTimeMinutes?: number;
    pointAmount?: number;
    appealReason?: string;
    appealedAt?: string;
    escalationApplied: boolean;
    createdAt: string;
}

export interface PenaltyProof {
    id: number;
    penaltyId: number;
    submittedByUserId: number;
    submittedByUsername: string;
    mediaUrl?: string;
    textProof?: string;
    submittedAt: string;
    reviewedAt?: string;
    reviewedByUserId?: number;
    approved?: boolean;
    reviewNotes?: string;
}

export interface PenaltySummary {
    pendingCount: number;
    inProgressCount: number;
    completedCount: number;
    verifiedCount: number;
    overdueCount: number;
}

export interface ScreenTimeBudget {
    id: number;
    userId: number;
    dailyBudgetMinutes: number;
    availableMinutes: number;
    lockedMinutes: number;
    lostMinutes: number;
    totalWonMinutes: number;
    totalLostMinutes: number;
    lastResetDate: string;
    createdAt: string;
    updatedAt: string;
}

export interface SyncTimeRequest {
    usedMinutes: number;
    clientTimestamp: string;
}

export interface ScreenTimeStatus {
    isLocked: boolean;
    availableMinutes: number;
    lockedMinutes: number;
    lockExpiresAt?: string;
    dailyBudgetMinutes: number;
    lastResetDate: string;
}

export interface SubmitProofRequest {
    description?: string;
    file?: any; // Handled via FormData
}

export interface VerifyPenaltyRequest {
    approved: boolean;
    notes: string;
}

export interface AppealPenaltyRequest {
    reason: string;
}
