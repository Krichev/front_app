// src/services/speech/WebSocketSpeechService.ts
import {NativeModules} from 'react-native';
import AudioRecord from 'react-native-audio-record';
import {Buffer} from 'buffer';

const { STTModule } = NativeModules;

interface WebSocketSpeechConfig {
    serverUrl: string;  // Your Java backend WebSocket URL
    onTranscription?: (text: string) => void;
    onError?: (error: any) => void;
    onConnectionChange?: (connected: boolean) => void;
}

export class WebSocketSpeechService {
    private config: WebSocketSpeechConfig;
    private isRecording: boolean = false;
    private isConnected: boolean = false;
    private websocket: WebSocket | null = null;
    private reconnectAttempts: number = 0;
    private maxReconnectAttempts: number = 5;
    private reconnectTimeout: NodeJS.Timeout | null = null;

    constructor(config: WebSocketSpeechConfig) {
        this.config = config;
        this.setupAudioRecording();
    }

    private setupAudioRecording(): void {
        // Configure audio recording settings
        const options = {
            sampleRate: 16000,      // Standard for most STT services
            channels: 1,            // Mono audio
            bitsPerSample: 16,      // 16-bit audio
            audioSource: 6,         // MIC source
            wavFile: '',            // No file saving
        };

        AudioRecord.init(options);
    }

    public connect(): void {
        if (this.websocket && (this.websocket.readyState === WebSocket.OPEN ||
            this.websocket.readyState === WebSocket.CONNECTING)) {
            return;
        }

        try {
            // Connect to your Java backend WebSocket
            this.websocket = new WebSocket(this.config.serverUrl);

            this.websocket.onopen = () => {
                console.log('WebSocket connected to speech server');
                this.isConnected = true;
                this.reconnectAttempts = 0;

                if (this.config.onConnectionChange) {
                    this.config.onConnectionChange(true);
                }

                // Send initial metadata if needed
                this.websocket?.send(JSON.stringify({
                    type: 'init',
                    sampleRate: 16000,
                    channels: 1,
                    bitsPerSample: 16
                }));
            };

            this.websocket.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);

                    if (data.type === 'transcription' && data.text && this.config.onTranscription) {
                        this.config.onTranscription(data.text);
                    } else if (data.type === 'error' && this.config.onError) {
                        this.config.onError(data.message || 'Unknown error from speech server');
                    }
                } catch (error) {
                    console.error('Error parsing WebSocket message:', error);
                }
            };

            this.websocket.onerror = (error) => {
                console.error('WebSocket error:', error);
                if (this.config.onError) {
                    this.config.onError(error);
                }
            };

            this.websocket.onclose = () => {
                console.log('WebSocket connection closed');
                this.isConnected = false;

                if (this.config.onConnectionChange) {
                    this.config.onConnectionChange(false);
                }

                // Try to reconnect if we were recording
                if (this.isRecording) {
                    this.handleReconnect();
                }
            };
        } catch (error) {
            console.error('Error connecting to WebSocket:', error);
            if (this.config.onError) {
                this.config.onError(error);
            }
        }
    }

    private handleReconnect(): void {
        if (this.reconnectTimeout) {
            clearTimeout(this.reconnectTimeout);
        }

        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            console.log('Max reconnect attempts reached');
            if (this.config.onError) {
                this.config.onError(new Error('Failed to reconnect after maximum attempts'));
            }
            return;
        }

        this.reconnectAttempts++;
        const delay = Math.min(1000 * (2 ** this.reconnectAttempts), 10000);

        console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts}) in ${delay}ms`);

        this.reconnectTimeout = setTimeout(() => {
            this.connect();
        }, delay);
    }

    public startRecording(): boolean {
        if (!this.isConnected) {
            console.log('WebSocket not connected, attempting to connect...');
            this.connect();
            return false;
        }

        try {
            // Set up data handler for audio chunks
            AudioRecord.on('data', (data) => {
                if (this.isRecording && this.websocket?.readyState === WebSocket.OPEN) {
                    // Send audio chunks to the Java backend
                    const buffer = Buffer.from(data, 'base64');

                    // Send binary data
                    this.websocket.send(buffer);
                }
            });

            AudioRecord.start();
            this.isRecording = true;
            return true;
        } catch (error) {
            console.error('Error starting audio recording:', error);
            if (this.config.onError) {
                this.config.onError(error);
            }
            return false;
        }
    }

    public stopRecording(): void {
        if (!this.isRecording) return;

        try {
            AudioRecord.stop();

            // Send end-of-stream signal to the server
            if (this.websocket?.readyState === WebSocket.OPEN) {
                this.websocket.send(JSON.stringify({ type: 'end' }));
            }

            this.isRecording = false;
        } catch (error) {
            console.error('Error stopping recording:', error);
            if (this.config.onError) {
                this.config.onError(error);
            }
        }
    }

    public disconnect(): void {
        this.stopRecording();

        if (this.reconnectTimeout) {
            clearTimeout(this.reconnectTimeout);
            this.reconnectTimeout = null;
        }

        if (this.websocket) {
            this.websocket.close();
            this.websocket = null;
        }

        this.isConnected = false;
    }
}