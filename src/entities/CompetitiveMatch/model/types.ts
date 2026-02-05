// src/entities/CompetitiveMatch/model/types.ts
import {AudioChallengeType} from '../../../types/audioChallenge.types';

// Enums
export type CompetitiveMatchStatus = 
  | 'WAITING_FOR_OPPONENT' | 'READY' | 'IN_PROGRESS' 
  | 'ROUND_COMPLETE' | 'COMPLETED' | 'CANCELLED' | 'EXPIRED' | 'PAUSED' | 'ABANDONED';

export type CompetitiveMatchType = 'FRIEND_CHALLENGE' | 'RANDOM_MATCHMAKING';
export type CompetitiveRoundStatus = 
  | 'PENDING' | 'PLAYER1_PERFORMING' | 'PLAYER2_PERFORMING' | 'SCORING' | 'COMPLETED';
export type MatchmakingStatus = 'QUEUED' | 'MATCHED' | 'EXPIRED' | 'CANCELLED';

// Core Types
export interface PlayerInfo {
  id: number;
  username: string;
  avatarUrl?: string;
}

export interface QuestionInfo {
    id: number;
    question: string;
    questionMediaUrl?: string;
    rhythmBpm?: number;
    rhythmTimeSignature?: string;
    audioChallengeType?: AudioChallengeType;
}

export interface CompetitiveMatchRound {
  id: number;
  matchId: number;
  roundNumber: number;
  status: CompetitiveRoundStatus;
  question?: QuestionInfo;
  
  // Player 1
  player1Score?: number;
  player1PitchScore?: number;
  player1RhythmScore?: number;
  player1VoiceScore?: number;
  player1Submitted?: boolean;
  player1SubmittedAt?: string;
  
  // Player 2
  player2Score?: number;
  player2PitchScore?: number;
  player2RhythmScore?: number;
  player2VoiceScore?: number;
  player2Submitted?: boolean;
  player2SubmittedAt?: string;
  
  winnerId?: number;
  startedAt?: string;
  completedAt?: string;
}

export interface CompetitiveMatch {
  id: number;
  matchType: CompetitiveMatchType;
  status: CompetitiveMatchStatus;
  player1Id: number;
  player1Username: string;
  player1AvatarUrl?: string;
  player2Id?: number;
  player2Username?: string;
  player2AvatarUrl?: string;
  winnerId?: number;
  winnerUsername?: string;
  totalRounds: number;
  currentRound: number;
  player1TotalScore: number;
  player2TotalScore: number;
  player1RoundsWon: number;
  player2RoundsWon: number;
  audioChallengeType: AudioChallengeType;
  wagerId?: number;
  expiresAt?: string;
  startedAt?: string;
  completedAt?: string;
}

export interface CompetitiveMatchDetail extends CompetitiveMatch {
    rounds: CompetitiveMatchRound[];
    metadata?: string;
    // Wager info might be nested or separate
}

export interface MatchmakingStatusResponse {
  status: MatchmakingStatus;
  queuePosition?: number;
  estimatedWaitSeconds?: number;
  matchId?: number; // Should be returned if status is MATCHED
  queuedAt?: string;
  audioChallengeType?: AudioChallengeType;
  preferredRounds?: number;
}

export interface CompetitiveMatchInvitation {
  id: number;
  matchId: number;
  inviterId: number;
  inviterUsername: string;
  inviterAvatarUrl?: string;
  inviteeId: number;
  status: string;
  message?: string;
  expiresAt: string;
  createdAt: string;
  totalRounds: number;
  audioChallengeType: AudioChallengeType;
}

export interface MatchResult {
    matchId: number;
    winnerId?: number;
    winnerUsername?: string;
    isDraw?: boolean;
    player1TotalScore: number;
    player2TotalScore: number;
    player1RoundsWon: number;
    player2RoundsWon: number;
    completedAt: string;
    totalDurationSeconds?: number;
    amountWon?: number;
    currency?: string;
}

// Request types
export interface CreateFriendChallengeRequest {
  inviteeId: number;
  totalRounds: number;
  audioChallengeType: AudioChallengeType;
  wagerId?: number;
  message?: string;
}

export interface JoinMatchmakingRequest {
  audioChallengeType: AudioChallengeType;
  preferredRounds: number;
}

export interface RespondToInvitationRequest {
  invitationId: number;
  accepted: boolean;
}

export interface SubmitPerformanceRequest {
  matchId: number;
  roundId: number;
  audioFilePath: string; // Used for passing logic, but API uses Multipart
}
