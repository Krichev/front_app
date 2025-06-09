// src/features/speech-to-text/model/types.ts
export type SpeechToTextMode = 'command' | 'dictation' | 'discussion' | 'continuous';

export interface SpeechToTextConfig {
    mode: SpeechToTextMode;
    language: string;
    autoStart: boolean;
    showInterimResults: boolean;
    highlightConfidence: boolean;
    maxDuration?: number;
    onResult?: (text: string, isFinal: boolean) => void;
    onError?: (error: string) => void;
}