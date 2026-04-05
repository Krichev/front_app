// src/entities/SoloQuestState/model/types.ts

// === Phase 1: Extended Profile ===
export type RelationshipStatus = 'SINGLE' | 'IN_RELATIONSHIP' | 'MARRIED' | 'DIVORCED' | 'WIDOWED' | 'PREFER_NOT_TO_SAY';
export type ProfileGender = 'MALE' | 'FEMALE' | 'NON_BINARY' | 'PREFER_NOT_TO_SAY';

export interface UserInterestTag {
  id: number;
  tag: string;
}

export interface UserProfileDetails {
  id: number;
  userId: number;
  dateOfBirth?: string;       // ISO date
  relationshipStatus?: RelationshipStatus;
  city?: string;
  latitude?: number;
  longitude?: number;
  aboutMe?: string;
  interests: UserInterestTag[];
  createdAt: string;
  updatedAt: string;
}

export interface UpdateProfileDetailsRequest {
  dateOfBirth?: string;
  relationshipStatus?: RelationshipStatus;
  city?: string;
  latitude?: number;
  longitude?: number;
  aboutMe?: string;
  interestTags?: string[];    // list of tag strings
}

// === Phase 2: Solo Quest Model ===
export type SoloQuestStatus = 'OPEN' | 'MATCHED' | 'COMPLETED' | 'CANCELLED' | 'EXPIRED';
export type DepositPolicy = 'APPLICANT_ONLY' | 'BOTH_PARTIES' | 'NONE';
export type TargetGender = 'MALE' | 'FEMALE' | 'ANY';

export interface SoloQuestDetails {
  id: number;
  challengeId: number;
  creatorId: number;
  creatorUsername: string;
  creatorAvatarUrl?: string;
  creatorReputationScore?: number;
  title: string;
  description: string;
  meetupLocationName: string;
  meetupLatitude: number;
  meetupLongitude: number;
  meetupDatetime: string;     // ISO datetime
  targetGender?: TargetGender;
  targetAgeMin?: number;
  targetAgeMax?: number;
  targetRelationshipStatus?: RelationshipStatus;
  requiredInterests?: string[];
  maxDistanceKm?: number;
  depositPolicy: DepositPolicy;
  stakeType?: string;         // from StakeType
  stakeAmount?: number;
  stakeCurrency?: string;     // from CurrencyType
  socialPenaltyDescription?: string;
  status: SoloQuestStatus;
  matchedUserId?: number;
  matchedUsername?: string;
  applicationCount?: number;
  distanceKm?: number;        // computed distance from requesting user
  createdAt: string;
  updatedAt: string;
}

export interface CreateSoloQuestRequest {
  title: string;
  description: string;
  meetupLocationName: string;
  meetupLatitude: number;
  meetupLongitude: number;
  meetupDatetime: string;
  targetGender?: TargetGender;
  targetAgeMin?: number;
  targetAgeMax?: number;
  targetRelationshipStatus?: RelationshipStatus;
  requiredInterests?: string[];
  maxDistanceKm?: number;
  depositPolicy: DepositPolicy;
  stakeType?: string;
  stakeAmount?: number;
  stakeCurrency?: string;
  socialPenaltyDescription?: string;
}

export interface SoloQuestFeedParams {
  page?: number;
  size?: number;
  latitude?: number;
  longitude?: number;
  maxDistanceKm?: number;
  interests?: string[];
}

// === Phase 3: Applications ===
export type SoloQuestApplicationStatus = 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'WITHDRAWN' | 'EXPIRED';

export interface SoloQuestApplication {
  id: number;
  soloQuestId: number;
  applicantId: number;
  applicantUsername: string;
  applicantAvatarUrl?: string;
  applicantAge?: number;
  applicantAboutMe?: string;
  applicantInterests?: string[];
  applicantReputationScore?: number;
  pitchMessage: string;
  creatorMessage?: string;
  applicantReply?: string;
  acceptMessage?: string;
  declineReason?: string;
  status: SoloQuestApplicationStatus;
  createdAt: string;
  updatedAt: string;
  respondedAt?: string;
  // Quest preview (for "my applications" list)
  questTitle?: string;
  questMeetupLocationName?: string;
  questMeetupDatetime?: string;
}

export interface CreateApplicationRequest {
  pitchMessage: string;       // 10-500 chars
}

export interface ApplicationActionRequest {
  message?: string;           // max 500 chars
  reason?: string;            // max 500 chars
}

// === Phase 4: Check-in ===
export interface CheckInRequest {
  latitude: number;
  longitude: number;
  accuracy: number;
}

export interface CheckInResponse {
  success: boolean;
  message: string;
  distanceMeters?: number;
}

// === Phase 5: Reputation ===
export type ReputationMarkType = 'POSITIVE' | 'NEGATIVE';
export type ReputationSource = 'SYSTEM' | 'SOLO_QUEST' | 'CREATOR' | 'PEER';

export interface ReputationMark {
  id: number;
  type: ReputationMarkType;
  label: string;
  description: string;
  source: ReputationSource;
  sourceQuestId?: number;
  sourceUserId?: number;
  weight: number;
  effectiveWeight: number;
  decayDays?: number;
  createdAt: string;
  expiresAt?: string;
  appealStatus?: 'NONE' | 'PENDING' | 'APPROVED' | 'REJECTED';
}

export interface UserReputation {
  reputationScore: number;
  marks: ReputationMark[];
}

export interface AppealRequest {
  markId: number;
  reason: string;
}
