// src/entities/speech-recognition/index.ts
export type {
    StreamingConfig,
    SpeechRecognitionConfig,
    TokenData,
    SpeechRecognitionState,
    SpeechRecognitionResult,
} from './model/types';

export { speechRecognitionSlice, speechRecognitionActions } from './model/slice';
export { speechRecognitionSelectors } from './model/selectors';

export {
    createStreamingService,
    createCommandRecognitionService,
    createDictationService,
    createWWWGameDiscussionService,
} from './lib/speechFactory';

export {
    getIAMToken,
    getFolderId,
    clearCachedToken,
} from './lib/tokenService';

export {
    validateSpeechConfig,
    formatRecognitionResult,
    calculateSpeechQuality,
} from './lib/utils';
