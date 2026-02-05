import { StakeType, CurrencyType } from '../../WagerState/model/types';

// Enums
export type Gender = 'MALE' | 'FEMALE' | 'OTHER' | 'PREFER_NOT_TO_SAY';
export type InvitationPreference = 'ANYONE' | 'FRIENDS_ONLY' | 'FAMILY_ONLY' | 'FRIENDS_AND_FAMILY' | 'NOBODY';
export type GenderPreference = 'ANY_GENDER' | 'MALE_ONLY' | 'FEMALE_ONLY';
export type QuestInvitationStatus = 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'EXPIRED' | 'NEGOTIATING' | 'CANCELLED';
export type NegotiationStatus = 'PROPOSED' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED';
export type InvitationResponse = 'ACCEPT' | 'DECLINE' | 'NEGOTIATE';

// DTOs
export interface InvitationNegotiationDTO {
    id: number;
    invitationId: number;
    proposerId: number;
    proposerUsername: string;
    isProposerInviter: boolean;
    counterStakeType: StakeType;
    counterStakeAmount: number;
    counterStakeCurrency?: CurrencyType;
    counterScreenTimeMinutes?: number;
    counterSocialPenaltyDescription?: string;
    status: NegotiationStatus;
    message?: string;
    createdAt: string;
    respondedAt?: string;
}

export interface QuestInvitationDTO {
    id: number;
    questId: number;
    questTitle: string;
    inviterId: number;
    inviterUsername: string;
    inviteeId: number;
    inviteeUsername: string;
    stakeType: StakeType;
    stakeAmount: number;
    stakeCurrency?: CurrencyType;
    screenTimeMinutes?: number;
    socialPenaltyDescription?: string;
    status: QuestInvitationStatus;
    message?: string;
    expiresAt: string;
    createdAt: string;
    respondedAt?: string;
    currentNegotiation?: InvitationNegotiationDTO;
    isExpired: boolean;
    canNegotiate: boolean;
    timeRemainingSeconds?: number;
}

export interface InvitationSummaryDTO {
    id: number;
    questId: number;
    questTitle: string;
    otherPartyUsername: string; // inviter or invitee depending on context
    stakeType: StakeType;
    stakeAmount: number;
    status: QuestInvitationStatus;
    expiresAt: string;
    hasActiveNegotiation: boolean;
}

export interface UserInvitationPreferencesDTO {
    userId: number;
    questInvitationPreference: InvitationPreference;
    genderPreferenceForInvites: GenderPreference;
}

// Request types
export interface CreateQuestInvitationRequest {
    questId: number;
    inviteeId: number;
    stakeType: StakeType;
    stakeAmount: number;
    stakeCurrency?: CurrencyType;
    screenTimeMinutes?: number;
    socialPenaltyDescription?: string;
    message?: string;
    expiresAt: string; // ISO date string
}

export interface RespondToInvitationRequest {
    response: InvitationResponse;
    message?: string;
}

export interface CreateCounterOfferRequest {
    stakeType: StakeType;
    stakeAmount: number;
    stakeCurrency?: CurrencyType;
    screenTimeMinutes?: number;
    socialPenaltyDescription?: string;
    message?: string;
}

export interface RespondToCounterOfferRequest {
    accepted: boolean;
    message?: string;
}

export interface UpdateInvitationPreferencesRequest {
    questInvitationPreference: InvitationPreference;
    genderPreferenceForInvites: GenderPreference;
}

export interface UpdateUserGenderRequest {
    gender: Gender;
}
