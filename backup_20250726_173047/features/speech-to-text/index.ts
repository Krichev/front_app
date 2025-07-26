// src/features/speech-to-text/index.ts
export { SpeechButton } from './ui/SpeechButton';
export { SpeechIndicator } from './ui/SpeechIndicator';
export { SpeechSettings } from './ui/SpeechSettings';
export { SpeechResultDisplay } from './ui/SpeechResultDisplay';

export { useSpeechToText } from './lib/hooks';
export { speechToTextModel } from './model';

export type {
    SpeechToTextConfig,
    SpeechToTextMode,
} from './model/types';