// src/features/speech-to-text/lib/hooks.ts
import {useCallback, useEffect, useRef} from 'react';
import {useDispatch, useSelector} from 'react-redux';
import {
    createStreamingService,
    speechRecognitionActions,
    speechRecognitionSelectors
} from '../../../entities/speech-recognition';
import {speechToTextActions} from '../model/slice';
import type {RootState} from '../../../app/store';
import type {SpeechToTextConfig} from '../model/types';

export const useSpeechToText = (config?: Partial<SpeechToTextConfig>) => {
    const dispatch = useDispatch();
    const serviceRef = useRef<any>(null);

    // Selectors
    const isRecording = useSelector(speechRecognitionSelectors.selectIsRecording);
    const currentResult = useSelector(speechRecognitionSelectors.selectCurrentResult);
    const finalResult = useSelector(speechRecognitionSelectors.selectFinalResult);
    const error = useSelector(speechRecognitionSelectors.selectError);
    const quality = useSelector(speechRecognitionSelectors.selectQuality);
    const connectionStatus = useSelector(speechRecognitionSelectors.selectConnectionStatus);

    const featureConfig = useSelector((state: RootState) => state.speechToText.config);
    const transcriptHistory = useSelector((state: RootState) => state.speechToText.transcriptHistory);

    // Update config if provided
    useEffect(() => {
        if (config) {
            dispatch(speechToTextActions.updateConfig(config));
        }
    }, [config, dispatch]);

    // Initialize service based on mode
    const initializeService = useCallback(() => {
        const mode = config?.mode || featureConfig.mode;
        const language = config?.language || featureConfig.language || 'en-US';

        switch (mode) {
            case 'command':
                serviceRef.current = createStreamingService(language);
                break;
            case 'dictation':
                serviceRef.current = createStreamingService(language);
                break;
            case 'discussion':
                serviceRef.current = createStreamingService(language);
                break;
            case 'continuous':
                serviceRef.current = createStreamingService(language);
                break;
            default:
                serviceRef.current = createStreamingService(language);
        }

        // Set up event handlers
        if (serviceRef.current) {
            serviceRef.current.onResult((result: any) => {
                dispatch(speechRecognitionActions.setResult(result));

                if (result.isFinal) {
                    dispatch(speechToTextActions.addTranscript({
                        text: result.text,
                        confidence: result.confidence || 0.8,
                    }));

                    // Call external callback if provided
                    const callback = config?.onResult || featureConfig.onResult;
                    if (callback) {
                        callback(result.text, result.isFinal);
                    }
                }
            });

            serviceRef.current.onError((error: Error) => {
                dispatch(speechRecognitionActions.setError(error.message));

                const errorCallback = config?.onError || featureConfig.onError;
                if (errorCallback) {
                    errorCallback(error.message);
                }
            });
        }
    }, [config, featureConfig, dispatch]);

    // Start recording
    const startRecording = useCallback(async () => {
        try {
            if (!serviceRef.current) {
                initializeService();
            }

            dispatch(speechRecognitionActions.startRecording());
            dispatch(speechToTextActions.setActive(true));

            if (serviceRef.current) {
                await serviceRef.current.start();
            }
        } catch (error) {
            dispatch(speechRecognitionActions.setError(
                error instanceof Error ? error.message : 'Failed to start recording'
            ));
        }
    }, [initializeService, dispatch]);

    // Stop recording
    const stopRecording = useCallback(async () => {
        try {
            if (serviceRef.current) {
                await serviceRef.current.stop();
            }

            dispatch(speechRecognitionActions.stopRecording());
            dispatch(speechToTextActions.setActive(false));
        } catch (error) {
            dispatch(speechRecognitionActions.setError(
                error instanceof Error ? error.message : 'Failed to stop recording'
            ));
        }
    }, [dispatch]);

    // Toggle recording
    const toggleRecording = useCallback(() => {
        if (isRecording) {
            stopRecording();
        } else {
            startRecording();
        }
    }, [isRecording, startRecording, stopRecording]);

    // Clear results
    const clearResults = useCallback(() => {
        dispatch(speechRecognitionActions.reset());
        dispatch(speechToTextActions.clearHistory());
    }, [dispatch]);

    // Set mode
    const setMode = useCallback((mode: SpeechToTextConfig['mode']) => {
        dispatch(speechToTextActions.setMode(mode));
        // Reinitialize service with new mode
        if (serviceRef.current) {
            serviceRef.current = null;
            initializeService();
        }
    }, [dispatch, initializeService]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (serviceRef.current && isRecording) {
                serviceRef.current.stop();
            }
        };
    }, [isRecording]);

    return {
        // State
        isRecording,
        currentResult,
        finalResult,
        error,
        quality,
        connectionStatus,
        transcriptHistory,
        config: featureConfig,

        // Actions
        startRecording,
        stopRecording,
        toggleRecording,
        clearResults,
        setMode,

        // Computed
        hasResults: currentResult.length > 0 || finalResult.length > 0,
        isConnected: connectionStatus === 'connected',
        hasError: error !== null,
    };
};