// src/types/audioChallenge.types.ts

import { ProcessedFileInfo } from '../services/speech/FileService';
import { QuestionVisibility } from '../entities/QuizState/model/types/question.types';

export interface AudioChallengeTypeInfo {
    type: string;
    requiresReferenceAudio: boolean;
    usesPitchScoring: boolean;
    usesRhythmScoring: boolean;
    usesVoiceScoring: boolean;
    scoringWeights: {
        pitch: number;
        rhythm: number;
        voice: number;
    };
    // UI visibility flags
    showRhythmSettings: boolean;      // BPM, time signature
    showClassificationSection: boolean; // topic, difficulty, visibility
    showAudioSegmentTrim: boolean;    // start/end time controls
    // Contextual help
    rhythmSettingsHint?: string;      // Why hidden/shown
}

export type AudioChallengeType = 'RHYTHM_CREATION' | 'RHYTHM_REPEAT' | 'SOUND_MATCH' | 'SINGING';

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

export const AUDIO_CHALLENGE_TYPES_INFO: Record<AudioChallengeType, AudioChallengeTypeInfo> = {
    RHYTHM_CREATION: {
        type: 'RHYTHM_CREATION',
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
        requiresReferenceAudio: true,
        usesPitchScoring: true,
        usesRhythmScoring: true,
        usesVoiceScoring: true,
        scoringWeights: { pitch: 0.4, rhythm: 0.3, voice: 0.3 },
        showRhythmSettings: true,  // Optional BPM hint
        showClassificationSection: true,
        showAudioSegmentTrim: true,
        rhythmSettingsHint: 'Optional: Set BPM as a visual guide for the singer',
    }
};
