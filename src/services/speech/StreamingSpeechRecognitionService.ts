// src/services/speech/StreamingSpeechRecognitionService.ts
import {EmitterSubscription, NativeEventEmitter, NativeModules, Platform} from 'react-native';
import AudioRecord from 'react-native-audio-record';
import {TokenService} from './TokenService';
import EventEmitter from 'eventemitter3';
import React from "react";

// Configuration for streaming speech recognition
export interface StreamingConfig {
    language?: string;
    sampleRate?: number;
    maxDuration?: number; // Maximum recording duration in seconds
    autoReconnect?: boolean;
    maxReconnectAttempts?: number;
    serverUrl?: string; // Optional custom server URL
}

// Recognition result interface
export interface RecognitionResult {
    text: string;
    isFinal: boolean;
    confidence?: number;
}

// Global EventEmitter for handling events from the speech recognition service
export const speechEvents = new EventEmitter();

/**
 * Service for streaming speech recognition
 * Handles audio recording and streaming to a speech recognition API
 */
export class StreamingSpeechRecognitionService {
    private static instance: StreamingSpeechRecognitionService;
    private config: StreamingConfig;
    private isRecording: boolean = false;
    private isInitialized: boolean = false;
    private webSocket: WebSocket | null = null;
    private reconnectAttempts: number = 0;
    private eventSubscriptions: EmitterSubscription[] = [];
    private audioConfig = {
        sampleRate: 16000,
        channels: 1,
        bitsPerSample: 16,
        audioSource: 6, // MIC source
        wavFile: '', // No file saving (streaming only)
    };
    private recordingTimeout: NodeJS.Timeout | null = null;
    private lastPartialText: string = ''; // Store the last partial result

    /**
     * Get the singleton instance of the service
     */
    public static getInstance(): StreamingSpeechRecognitionService {
        if (!this.instance) {
            this.instance = new StreamingSpeechRecognitionService();
        }
        return this.instance;
    }

    /**
     * Private constructor for singleton pattern
     */
    private constructor() {
        this.config = {
            language: 'en-US',
            sampleRate: 16000,
            maxDuration: 60, // Default 60 seconds max recording time
            autoReconnect: true,
            maxReconnectAttempts: 3,
            serverUrl: 'wss://speech.ai.cloud.example.com/v1/stt/ws', // Replace with actual service URL
        };
    }

    /**
     * Initialize the service with configuration
     */
    public async initialize(config?: Partial<StreamingConfig>): Promise<boolean> {
        try {
            // Override default config with provided values
            if (config) {
                this.config = { ...this.config, ...config };
            }

            // Request audio recording permissions
            const hasPermission = await this.requestPermissions();
            if (!hasPermission) {
                console.error('Microphone permission denied');
                speechEvents.emit('error', { message: 'Microphone permission denied' });
                return false;
            }

            // Initialize audio recording
            await AudioRecord.init(this.audioConfig);

            // Set up audio data event handler
            this.setupEventListeners();

            this.isInitialized = true;
            speechEvents.emit('initialized');
            return true;
        } catch (error) {
            console.error('Failed to initialize speech recognition:', error);
            speechEvents.emit('error', { message: 'Initialization failed', error });
            return false;
        }
    }

    /**
     * Set up event listeners for audio data
     */
    private setupEventListeners(): void {
        // Clean up existing event listeners
        this.cleanupEventListeners();

        // Set up native event listeners if needed
        if (Platform.OS === 'android' || Platform.OS === 'ios') {
            try {
                const speechEventEmitter = new NativeEventEmitter(NativeModules.SpeechRecognition);

                // Subscribe to speech recognition events
                this.eventSubscriptions.push(
                    speechEventEmitter.addListener('onSpeechResult', this.handleSpeechResult.bind(this))
                );

                this.eventSubscriptions.push(
                    speechEventEmitter.addListener('onSpeechError', this.handleSpeechError.bind(this))
                );
            } catch (error) {
                console.warn('Could not set up native speech event listeners:', error);
            }
        }

        // Set up audio data handler
        AudioRecord.on('data', this.handleAudioData.bind(this));
    }

    /**
     * Clean up event listeners
     */
    private cleanupEventListeners(): void {
        // Remove all event subscriptions
        this.eventSubscriptions.forEach(subscription => subscription.remove());
        this.eventSubscriptions = [];

        // Remove audio data handler - use empty function instead of null
        AudioRecord.on('data', () => {});

        // If the library has a proper removeListener method, you could use it like this:
        // if (typeof AudioRecord.removeListener === 'function') {
        //   AudioRecord.removeListener('data');
        // }
    }

    /**
     * Request microphone permissions
     */
    private async requestPermissions(): Promise<boolean> {
        if (Platform.OS === 'android') {
            try {
                const granted = await NativeModules.PermissionsAndroid.request(
                    NativeModules.PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
                    {
                        title: 'Microphone Permission',
                        message: 'App needs access to your microphone for speech recognition',
                        buttonNeutral: 'Ask Me Later',
                        buttonNegative: 'Cancel',
                        buttonPositive: 'OK',
                    }
                );
                return granted === NativeModules.PermissionsAndroid.RESULTS.GRANTED;
            } catch (err) {
                console.warn('Error requesting permissions:', err);
                return false;
            }
        } else {
            // For iOS, permissions are handled through info.plist
            return true;
        }
    }

    /**
     * Start recording and streaming audio for recognition
     */
    public async startRecording(): Promise<boolean> {
        // Check if already recording
        if (this.isRecording) {
            console.warn('Already recording, ignoring startRecording call');
            return true;
        }

        // Check if initialized
        if (!this.isInitialized) {
            const initialized = await this.initialize();
            if (!initialized) {
                return false;
            }
        }

        try {
            // Connect to speech recognition server
            const connected = await this.connectWebSocket();
            if (!connected) {
                return false;
            }

            // Start recording
            AudioRecord.start();
            this.isRecording = true;
            speechEvents.emit('recordingStarted');

            // Set optional timeout for maximum recording duration
            if (this.config.maxDuration && this.config.maxDuration > 0) {
                if (this.recordingTimeout) {
                    clearTimeout(this.recordingTimeout);
                }
                this.recordingTimeout = setTimeout(() => {
                    if (this.isRecording) {
                        this.stopRecording();
                        speechEvents.emit('recordingTimeout');
                    }
                }, this.config.maxDuration * 1000);
            }

            return true;
        } catch (error) {
            console.error('Error starting recording:', error);
            speechEvents.emit('error', { message: 'Failed to start recording', error });
            return false;
        }
    }

    /**
     * Connect to the WebSocket server for streaming recognition
     */
    private async connectWebSocket(): Promise<boolean> {
        try {
            // Close existing WebSocket if open
            if (this.webSocket) {
                this.webSocket.close();
                this.webSocket = null;
            }

            // Get authentication token for the speech service
            const token = await TokenService.getIAMToken();
            const folderId = TokenService.getFolderId();

            // Create WebSocket connection
            this.webSocket = new WebSocket(this.config.serverUrl!);

            // Set up WebSocket event handlers
            this.webSocket.onopen = () => {
                // Send configuration to the server
                if (this.webSocket && this.webSocket.readyState === WebSocket.OPEN) {
                    const config = {
                        type: 'config',
                        token,
                        folderId,
                        language: this.config.language,
                        sampleRate: this.config.sampleRate,
                        audioFormat: 'pcm', // PCM audio format
                    };
                    this.webSocket.send(JSON.stringify(config));
                    speechEvents.emit('connected');
                }
            };

            this.webSocket.onmessage = (event) => {
                try {
                    const response = JSON.parse(event.data);
                    if (response.type === 'result') {
                        this.handleSpeechResult(response);
                    } else if (response.type === 'error') {
                        this.handleSpeechError(response);
                    }
                } catch (error) {
                    console.warn('Error parsing WebSocket message:', error);
                }
            };

            this.webSocket.onerror = (error) => {
                console.error('WebSocket error:', error);
                speechEvents.emit('error', { message: 'WebSocket error', error });
                this.handleConnectionError();
            };

            this.webSocket.onclose = (event) => {
                console.log(`WebSocket closed with code ${event.code}`, event.reason);
                speechEvents.emit('disconnected', { code: event.code, reason: event.reason });

                // Attempt to reconnect if configured and recording is still active
                if (this.isRecording && this.config.autoReconnect) {
                    this.handleConnectionError();
                }
            };

            // Wait for connection or timeout
            return new Promise((resolve) => {
                // Set a timeout for connection
                const timeout = setTimeout(() => {
                    resolve(false);
                }, 5000);

                // Listen for successful connection
                this.webSocket!.onopen = () => {
                    clearTimeout(timeout);
                    resolve(true);
                };
            });
        } catch (error) {
            console.error('Error connecting to speech recognition server:', error);
            speechEvents.emit('error', { message: 'Connection error', error });
            return false;
        }
    }

    /**
     * Handle WebSocket connection errors with reconnection logic
     */
    private handleConnectionError(): void {
        if (!this.config.autoReconnect || !this.isRecording) {
            return;
        }

        // Increment reconnect attempts
        this.reconnectAttempts++;

        // Check if we've exceeded max reconnect attempts
        if (this.reconnectAttempts > (this.config.maxReconnectAttempts || 3)) {
            console.warn('Max reconnect attempts reached, stopping recording');
            this.stopRecording();
            speechEvents.emit('reconnectFailed');
            return;
        }

        // Exponential backoff for reconnection
        const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts - 1), 10000);

        console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.config.maxReconnectAttempts})...`);
        speechEvents.emit('reconnecting', { attempt: this.reconnectAttempts, maxAttempts: this.config.maxReconnectAttempts });

        // Attempt to reconnect after delay
        setTimeout(async () => {
            if (this.isRecording) {
                await this.connectWebSocket();
            }
        }, delay);
    }

    /**
     * Stop recording and streaming
     */
    public stopRecording(): void {
        if (!this.isRecording) {
            return;
        }

        try {
            // Stop recording
            AudioRecord.stop();

            // Clear recording timeout if set
            if (this.recordingTimeout) {
                clearTimeout(this.recordingTimeout);
                this.recordingTimeout = null;
            }

            // Close WebSocket connection
            if (this.webSocket) {
                // Send end-of-stream message
                if (this.webSocket.readyState === WebSocket.OPEN) {
                    this.webSocket.send(JSON.stringify({ type: 'end' }));
                }
                this.webSocket.close();
                this.webSocket = null;
            }

            // Reset state
            this.isRecording = false;
            this.reconnectAttempts = 0;
            this.lastPartialText = '';

            speechEvents.emit('recordingStopped');
        } catch (error) {
            console.error('Error stopping recording:', error);
            speechEvents.emit('error', { message: 'Error stopping recording', error });
        }
    }

    /**
     * Handle audio data from recorder
     */
    private handleAudioData(data: string): void {
        // Skip if not recording or WebSocket is not connected
        if (!this.isRecording || !this.webSocket || this.webSocket.readyState !== WebSocket.OPEN) {
            return;
        }

        try {
            // Send audio data to the WebSocket
            this.webSocket.send(data);
        } catch (error) {
            console.warn('Error sending audio data:', error);
        }
    }

    /**
     * Handle speech recognition results
     */
    private handleSpeechResult(result: any): void {
        // Skip if result is empty
        if (!result || !result.text) {
            return;
        }

        const isFinal = result.isFinal || result.final || false;
        const confidence = result.confidence || 0;
        const text = result.text;

        // Update last partial text if this is not final
        if (!isFinal) {
            this.lastPartialText = text;
        }

        // Emit the result
        speechEvents.emit('result', {
            text,
            isFinal,
            confidence
        });

        // Emit specific events for partial and final results
        if (isFinal) {
            speechEvents.emit('finalResult', {
                text,
                confidence
            });
        } else {
            speechEvents.emit('partialResult', {
                text,
                confidence
            });
        }
    }

    /**
     * Handle speech recognition errors
     */
    private handleSpeechError(error: any): void {
        console.error('Speech recognition error:', error);
        speechEvents.emit('recognitionError', error);
    }

    /**
     * Clean up resources
     */
    public cleanup(): void {
        this.stopRecording();
        this.cleanupEventListeners();
        this.isInitialized = false;
        speechEvents.emit('cleanup');
    }

    /**
     * Check if recording is in progress
     */
    public isRecordingActive(): boolean {
        return this.isRecording;
    }

    /**
     * Get the last recognized text
     */
    public getLastText(): string {
        return this.lastPartialText;
    }
}

// Create a hook for using the streaming speech recognition service in React components
export function useStreamingSpeechRecognition(
    onResult?: (result: RecognitionResult) => void,
    onError?: (error: any) => void,
    config?: Partial<StreamingConfig>
) {
    const service = StreamingSpeechRecognitionService.getInstance();

    React.useEffect(() => {
        // Initialize the service
        service.initialize(config).catch(error => {
            console.error('Error initializing speech recognition:', error);
            if (onError) onError(error);
        });

        // Set up event listeners
        const resultHandler = (result: RecognitionResult) => {
            if (onResult) onResult(result);
        };

        const errorHandler = (error: any) => {
            if (onError) onError(error);
        };

        // Subscribe to events
        speechEvents.on('result', resultHandler);
        speechEvents.on('error', errorHandler);

        // Cleanup function
        return () => {
            speechEvents.off('result', resultHandler);
            speechEvents.off('error', errorHandler);
        };
    }, [onResult, onError, config]);

    // Return control functions
    return {
        startRecording: service.startRecording.bind(service),
        stopRecording: service.stopRecording.bind(service),
        isRecording: service.isRecordingActive.bind(service),
        getLastText: service.getLastText.bind(service),
    };
}

// Example usage:
//
// In a component:
// const { startRecording, stopRecording, isRecording } = useStreamingSpeechRecognition(
//   (result) => {
//     if (result.isFinal) {
//       console.log('Final transcription:', result.text);
//     } else {
//       console.log('Partial transcription:', result.text);
//     }
//   },
//   (error) => {
//     console.error('Speech recognition error:', error);
//   }
// );