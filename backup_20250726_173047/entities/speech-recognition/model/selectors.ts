// src/entities/speech-recognition/model/selectors.ts
import type {RootState} from '../../../app/store';

export const speechRecognitionSelectors = {
    selectIsRecording: (state: RootState) => state.speechRecognition.isRecording,
    selectIsProcessing: (state: RootState) => state.speechRecognition.isProcessing,
    selectCurrentResult: (state: RootState) => state.speechRecognition.currentResult,
    selectFinalResult: (state: RootState) => state.speechRecognition.finalResult,
    selectError: (state: RootState) => state.speechRecognition.error,
    selectQuality: (state: RootState) => state.speechRecognition.quality,
    selectConnectionStatus: (state: RootState) => state.speechRecognition.connectionStatus,
    selectIsConnected: (state: RootState) => state.speechRecognition.connectionStatus === 'connected',
    selectHasError: (state: RootState) => state.speechRecognition.error !== null,
};
