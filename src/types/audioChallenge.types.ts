// src/types/audioChallenge.types.ts

// ============================================================================
// AUDIO CHALLENGE TYPE - SINGLE SOURCE OF TRUTH
// ============================================================================

export type AudioChallengeType = 'RHYTHM_CREATION' | 'RHYTHM_REPEAT' | 'SOUND_MATCH' | 'SINGING';

/**
 * Complete audio challenge type configuration
 * Includes scoring info, UI visibility flags, and display metadata
 */
export interface AudioChallengeTypeInfo {
    // Identity
    type: AudioChallengeType;
    label: string;
    description: string;
    icon: string;
    
    // Scoring configuration
    requiresReferenceAudio: boolean;
    usesPitchScoring: boolean;
    usesRhythmScoring: boolean;
    usesVoiceScoring: boolean;
    scoringWeights: {
        pitch: number;
        rhythm: number;
        voice: number;
    };
    
    // UI visibility flags (for form display)
    showRhythmSettings: boolean;
    showClassificationSection: boolean;
    showAudioSegmentTrim: boolean;
    
    // Contextual help text
    rhythmSettingsHint?: string;
}

/**
 * Audio challenge types as a Record for direct key access
 * Usage: AUDIO_CHALLENGE_TYPES_INFO['RHYTHM_REPEAT']
 */
export const AUDIO_CHALLENGE_TYPES_INFO: Record<AudioChallengeType, AudioChallengeTypeInfo> = {
    RHYTHM_CREATION: {
        type: 'RHYTHM_CREATION',
        label: 'Create Rhythm',
        description: 'Create your own rhythm pattern. Scored on consistency and creativity.',
        icon: 'music-note-plus',
        requiresReferenceAudio: false,
        usesPitchScoring: false,
        usesRhythmScoring: true,
        usesVoiceScoring: false,
        scoringWeights: { pitch: 0, rhythm: 1.0, voice: 0 },
        showRhythmSettings: true,
        showClassificationSection: true,
        showAudioSegmentTrim: false,
        rhythmSettingsHint: 'Set the target tempo for rhythm creation',
    },
    RHYTHM_REPEAT: {
        type: 'RHYTHM_REPEAT',
        label: 'Repeat Rhythm',
        description: 'Listen and repeat the rhythm pattern you hear.',
        icon: 'repeat',
        requiresReferenceAudio: true,
        usesPitchScoring: false,
        usesRhythmScoring: true,
        usesVoiceScoring: false,
        scoringWeights: { pitch: 0, rhythm: 1.0, voice: 0 },
        showRhythmSettings: false,
        showClassificationSection: false,
        showAudioSegmentTrim: true,
        rhythmSettingsHint: 'Rhythm pattern is extracted from your reference audio',
    },
    SOUND_MATCH: {
        type: 'SOUND_MATCH',
        label: 'Match Sound',
        description: 'Make sounds as close as possible to the reference.',
        icon: 'waveform',
        requiresReferenceAudio: true,
        usesPitchScoring: true,
        usesRhythmScoring: false,
        usesVoiceScoring: true,
        scoringWeights: { pitch: 0.5, rhythm: 0, voice: 0.5 },
        showRhythmSettings: false,
        showClassificationSection: false,
        showAudioSegmentTrim: true,
    },
    SINGING: {
        type: 'SINGING',
        label: 'Sing Along',
        description: 'Sing the song segment and receive a karaoke-style score.',
        icon: 'microphone',
        requiresReferenceAudio: true,
        usesPitchScoring: true,
        usesRhythmScoring: true,
        usesVoiceScoring: true,
        scoringWeights: { pitch: 0.4, rhythm: 0.3, voice: 0.3 },
        showRhythmSettings: true,
        showClassificationSection: true,
        showAudioSegmentTrim: true,
        rhythmSettingsHint: 'Optional: Set BPM as a visual guide for the singer',
    },
};

/**
 * Audio challenge types as an Array for iteration
 * Usage: AUDIO_CHALLENGE_TYPES.map(type => ...)
 */
export const AUDIO_CHALLENGE_TYPES: AudioChallengeTypeInfo[] = Object.values(AUDIO_CHALLENGE_TYPES_INFO);

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get challenge type info by type string
 */
export const getAudioChallengeTypeInfo = (type: AudioChallengeType): AudioChallengeTypeInfo => {
    return AUDIO_CHALLENGE_TYPES_INFO[type];
};

/**
 * Check if a challenge type requires reference audio
 */
export const requiresReferenceAudio = (type: AudioChallengeType): boolean => {
    return AUDIO_CHALLENGE_TYPES_INFO[type]?.requiresReferenceAudio ?? false;
};

/**
 * Get scoring weights for a challenge type
 */
export const getScoringWeights = (type: AudioChallengeType): { pitch: number; rhythm: number; voice: number } => {
    return AUDIO_CHALLENGE_TYPES_INFO[type]?.scoringWeights ?? { pitch: 0.33, rhythm: 0.33, voice: 0.34 };
};

// ============================================================================
// OTHER TYPES
// ============================================================================

import { ProcessedFileInfo } from '../services/speech/FileService';
import { QuestionVisibility } from '../entities/QuizState/model/types/question.types';

export interface CreateAudioQuestionForm {
    question: string;
    answer?: string;
    audioChallengeType: AudioChallengeType;
    topic?: string;
    difficulty?: 'EASY' | 'MEDIUM' | 'HARD';
    rhythmBpm?: number; // 40-240
    rhythmTimeSignature?: string; // e.g. "4/4"
    minimumScorePercentage: number; // 0-100
    audioSegmentStart?: number;
    audioSegmentEnd?: number;
    referenceAudio?: ProcessedFileInfo | null;
    visibility: QuestionVisibility;
    additionalInfo?: string;
}

export interface RecordingState {
    isRecording: boolean;
    isPaused: boolean;
    duration: number;
    audioPath: string | null;
}
