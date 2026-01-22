// src/types/rhythmChallenge.types.ts

/**
 * Rhythm pattern extracted from reference audio
 * Stored in question's audioChallengeConfig
 */
export interface RhythmPatternDTO {
    version: number;
    onsetTimesMs: number[];
    intervalsMs: number[];
    estimatedBpm: number;
    timeSignature: string;
    totalBeats: number;
    trimmedStartMs: number;
    trimmedEndMs: number;
    originalDurationMs: number;
    silenceThresholdDb?: number;
    minOnsetIntervalMs?: number;
}

/**
 * Result from rhythm scoring API
 */
export interface RhythmScoringResult {
    overallScore: number;
    perBeatScores: number[];
    timingErrorsMs: number[];
    absoluteErrorsMs: number[];
    perfectBeats: number;
    goodBeats: number;
    missedBeats: number;
    averageErrorMs: number;
    maxErrorMs: number;
    consistencyScore: number;
    feedback: string;
    passed: boolean;
    minimumScoreRequired: number | null;
}

/**
 * Request to score rhythm taps
 */
export interface ScoreRhythmTapsRequest {
    questionId: number;
    referencePattern: RhythmPatternDTO;
    userOnsetTimesMs: number[];
    toleranceMs?: number;
    minimumScoreRequired?: number;
}

/**
 * Phase of the rhythm challenge
 */
export type RhythmChallengePhase = 
    | 'READY' 
    | 'LISTENING' 
    | 'COUNTDOWN' 
    | 'RECORDING' 
    | 'PROCESSING' 
    | 'RESULTS';

/**
 * Input mode for rhythm challenge
 */
export type RhythmInputMode = 'TAP' | 'AUDIO';

/**
 * State for rhythm challenge component
 */
export interface RhythmChallengeState {
    phase: RhythmChallengePhase;
    inputMode: RhythmInputMode;
    tapTimestamps: number[];
    recordingStartTime: number | null;
    referencePattern: RhythmPatternDTO | null;
    scoringResult: RhythmScoringResult | null;
    error: string | null;
    listenCount: number;
    attemptCount: number;
    countdownValue: number;
}

/**
 * Props for rhythm tap pad component
 */
export interface RhythmTapPadProps {
    isActive: boolean;
    onTap: (timestampMs: number) => void;
    tapCount: number;
    maxDuration?: number;
}

/**
 * Visual beat indicator state
 */
export interface BeatIndicator {
    index: number;
    expectedTimeMs: number;
    actualTimeMs?: number;
    error?: number;
    score?: number;
    status: 'pending' | 'hit' | 'missed' | 'early' | 'late';
}

/**
 * Sound quality assessment
 */
export type SoundQuality = 'SHARP' | 'CLEAR' | 'MUFFLED';

/**
 * Detailed sound comparison for a single beat
 */
export interface SoundComparisonDetail {
    beatIndex: number;
    mfccSimilarity: number;
    spectralCentroidRef: number;
    spectralCentroidUser: number;
    brightnessMatch: number;
    energyMatch: number;
    overallSoundScore: number;
    userQuality: SoundQuality;
    referenceQuality: SoundQuality;
    feedback: string;
}

/**
 * Enhanced scoring result with sound similarity
 */
export interface EnhancedRhythmScoringResult extends RhythmScoringResult {
    soundSimilarityScore?: number;
    perBeatSoundScores?: number[];
    soundDetails?: SoundComparisonDetail[];
    soundSimilarityEnabled: boolean;
    timingWeight: number;
    soundWeight: number;
    combinedScore: number;
    goodSoundMatches?: number;
    averageBrightnessDiff?: number;
    soundFeedback?: string;
}

/**
 * Request for scoring with audio file
 */
export interface ScoreRhythmAudioRequest {
    questionId: number;
    audioFile: {
        uri: string;
        name: string;
        type: string;
    };
    enableSoundSimilarity: boolean;
    toleranceMs?: number;
}

/**
 * Settings for rhythm challenge
 */
export interface RhythmChallengeSettings {
    inputMode: 'TAP' | 'AUDIO';
    enableSoundSimilarity: boolean;
    timingWeight: number;
    soundWeight: number;
}
