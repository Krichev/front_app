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
        scoringWeights: { pitch: 0, rhythm: 1.0, voice: 0 }
    },
    RHYTHM_REPEAT: {
        type: 'RHYTHM_REPEAT',
        requiresReferenceAudio: true,
        usesPitchScoring: false,
        usesRhythmScoring: true,
        usesVoiceScoring: false,
        scoringWeights: { pitch: 0, rhythm: 1.0, voice: 0 }
    },
    SOUND_MATCH: {
        type: 'SOUND_MATCH',
        requiresReferenceAudio: true,
        usesPitchScoring: true,
        usesRhythmScoring: false,
        usesVoiceScoring: true,
        scoringWeights: { pitch: 0.5, rhythm: 0, voice: 0.5 }
    },
    SINGING: {
        type: 'SINGING',
        requiresReferenceAudio: true,
        usesPitchScoring: true,
        usesRhythmScoring: true,
        usesVoiceScoring: true,
        scoringWeights: { pitch: 0.4, rhythm: 0.3, voice: 0.3 }
    }
};
