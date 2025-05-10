// src/services/speech/SpeechRecognitionService.ts
import {useCallback, useEffect, useRef, useState} from 'react';
import AudioRecord from 'react-native-audio-record';
import {PermissionsAndroid, Platform} from 'react-native';
import {Buffer} from 'buffer';

// Configuration types
export interface SpeechRecognitionConfig {
    serverUrl: string;
    iamToken: string;
    folderId: string;
    language?: string;
    sampleRate?: number;
}

// Hook for speech recognition
export function useSpeechRecognition(
    onTranscription: (text: string) => void,
    onError?: (error: string) => void
) {
    const [isInitialized, setIsInitialized] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const websocket = useRef<WebSocket | null>(null);
    const [hasPermission, setHasPermission] = useState(false);

    // Request microphone permissions
    const requestPermissions = useCallback(async (): Promise<boolean> => {
        if (Platform.OS === 'android') {
            try {
                const granted = await PermissionsAndroid.request(
                    PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
                    {
                        title: 'Microphone Permission',
                        message: 'App needs access to your microphone for speech recognition',
                        buttonNeutral: 'Ask Me Later',
                        buttonNegative: 'Cancel',
                        buttonPositive: 'OK',
                    }
                );
                return granted === PermissionsAndroid.RESULTS.GRANTED;
            } catch (err) {
                console.error('Failed to request permission:', err);
                return false;
            }
        } else {
            // For iOS, permissions are handled through info.plist
            return true;
        }
    }, []);

    // Initialize audio recording
    const initialize = useCallback(async () => {
        if (isInitialized) return true;

        const hasAudioPermission = await requestPermissions();
        setHasPermission(hasAudioPermission);

        if (!hasAudioPermission) {
            if (onError) onError('Microphone permission denied');
            return false;
        }

        // Configure audio recording
        const options = {
            sampleRate: 16000,
            channels: 1,
            bitsPerSample: 16,
            audioSource: 6, // MIC source
            wavFile: '', // No file saving (streaming only)
        };

        try {
            await AudioRecord.init(options);
            setIsInitialized(true);
            return true;
        } catch (error) {
            console.error('Failed to initialize audio recording:', error);
            if (onError) onError('Failed to initialize audio recording');
            return false;
        }
    }, [isInitialized, requestPermissions, onError]);

    // Connect to speech recognition server
    const connect = useCallback(
        async (config: SpeechRecognitionConfig): Promise<boolean> => {
            // Initialize audio if not already done
            const initialized = await initialize();
            if (!initialized) return false;

            // Close existing websocket if open
            if (websocket.current?.readyState === WebSocket.OPEN) {
                websocket.current.close();
            }

            try {
                // Create new WebSocket connection
                websocket.current = new WebSocket(config.serverUrl);

                // Set up event handlers
                websocket.current.onopen = () => {
                    console.log('WebSocket connection established');
                    // Send metadata
                    if (websocket.current?.readyState === WebSocket.OPEN) {
                        const metadata = {
                            type: 'metadata',
                            iamToken: config.iamToken,
                            folderId: config.folderId,
                            language: config.language || 'ru-RU',
                            sampleRate: config.sampleRate || 16000,
                        };
                        websocket.current.send(JSON.stringify(metadata));
                    }
                };

                websocket.current.onmessage = (event) => {
                    try {
                        const data = JSON.parse(event.data);
                        if (data.type === 'transcription' && data.text) {
                            onTranscription(data.text);
                        } else if (data.type === 'error' && onError) {
                            onError(data.message || 'Unknown error from speech server');
                        }
                    } catch (error) {
                        console.error('Error parsing WebSocket message:', error);
                    }
                };

                websocket.current.onerror = (error) => {
                    console.error('WebSocket error:', error);
                    if (onError) onError('WebSocket connection error');
                };

                websocket.current.onclose = () => {
                    console.log('WebSocket connection closed');
                };

                return true;
            } catch (error) {
                console.error('Failed to connect to speech server:', error);
                if (onError) onError('Failed to connect to speech server');
                return false;
            }
        },
        [initialize, onError]
    );

    // Start recording and streaming audio
    const startRecording = useCallback(() => {
        if (!isInitialized) {
            if (onError) onError('Audio recording not initialized');
            return false;
        }

        if (websocket.current?.readyState !== WebSocket.OPEN) {
            if (onError) onError('WebSocket not connected');
            return false;
        }

        try {
            // Set up data handler
            AudioRecord.on('data', (data) => {
                if (websocket.current?.readyState === WebSocket.OPEN) {
                    // Convert base64 to binary if needed
                    const buffer = Buffer.from(data, 'base64');
                    websocket.current.send(buffer);
                }
            });

            // Start recording
            AudioRecord.start();
            setIsRecording(true);
            return true;
        } catch (error) {
            console.error('Failed to start recording:', error);
            if (onError) onError('Failed to start recording');
            return false;
        }
    }, [isInitialized, onError]);

    // Stop recording
    const stopRecording = useCallback(() => {
        if (!isRecording) return;

        try {
            AudioRecord.stop();
            setIsRecording(false);
        } catch (error) {
            console.error('Failed to stop recording:', error);
            if (onError) onError('Failed to stop recording');
        }
    }, [isRecording, onError]);

    // Clean up resources
    const cleanup = useCallback(() => {
        stopRecording();
        if (websocket.current) {
            websocket.current.close();
            websocket.current = null;
        }
    }, [stopRecording]);

    // Clean up on unmount
    useEffect(() => {
        return () => {
            cleanup();
        };
    }, [cleanup]);

    return {
        initialize,
        connect,
        startRecording,
        stopRecording,
        cleanup,
        isInitialized,
        isRecording,
        hasPermission,
    };
}