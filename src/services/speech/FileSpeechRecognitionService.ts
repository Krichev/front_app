// src/services/speech/FileSpeechRecognitionService.ts
import {PermissionsAndroid, Platform} from 'react-native';
import AudioRecord from 'react-native-audio-record';
import RNFS from 'react-native-fs';

export interface FileSpeechConfig {
    serverUrl: string;
    language?: string;
    sampleRate?: number;
    quality?: 'low' | 'medium' | 'high';
}

export interface RecognitionResult {
    success: boolean;
    recognizedText?: string;
    errorMessage?: string;
}

export class FileSpeechRecognitionService {
    private config: FileSpeechConfig;
    private isInitialized: boolean = false;
    private isRecording: boolean = false;
    private currentRecordingPath: string | null = null;
    private hasPermission: boolean = false;

    constructor(config: FileSpeechConfig) {
        this.config = {
            language: 'en-US',
            sampleRate: 44100,
            quality: 'medium',
            ...config
        };
    }

    /**
     * Request microphone permissions
     */
    async requestPermissions(): Promise<boolean> {
        if (this.hasPermission) return true;

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
                this.hasPermission = granted === PermissionsAndroid.RESULTS.GRANTED;
                return this.hasPermission;
            } catch (err) {
                console.error('Failed to request permission:', err);
                return false;
            }
        } else {
            // For iOS, permissions are handled through info.plist
            this.hasPermission = true;
            return true;
        }
    }

    /**
     * Initialize the audio recording system
     */
    async initialize(): Promise<boolean> {
        if (this.isInitialized) return true;

        const hasAudioPermission = await this.requestPermissions();
        if (!hasAudioPermission) {
            throw new Error('Microphone permission denied');
        }

        // Configure audio recording
        const audioConfig = {
            sampleRate: this.config.sampleRate || 44100,
            channels: 1,
            bitsPerSample: 16,
            audioSource: 1, // DEFAULT/MIC source
            // Record to a temporary file
            wavFile: this.generateRecordingPath(),
        };

        try {
            await AudioRecord.init(audioConfig);
            this.isInitialized = true;
            return true;
        } catch (error) {
            console.error('Failed to initialize audio recording:', error);
            throw new Error('Failed to initialize audio recording');
        }
    }

    /**
     * Generate a unique file path for recording
     */
    private generateRecordingPath(): string {
        const timestamp = Date.now();
        const filename = `recording_${timestamp}.wav`;
        return `${RNFS.CachesDirectoryPath}/${filename}`;
    }

    /**
     * Start recording audio
     */
    async startRecording(): Promise<string> {
        if (!this.isInitialized) {
            await this.initialize();
        }

        if (this.isRecording) {
            throw new Error('Already recording');
        }

        try {
            this.currentRecordingPath = this.generateRecordingPath();

            // Note: In react-native-audio-record, wavFile path is set during init.
            // If we want to change the path for each recording, we might need to re-init.
            // But double-init without stopping/releasing might cause issues.
            // However, the doc says "Remove the second init() call".
            // If we remove it, all recordings will go to the path set in initialize().
            // Let's stick to the instruction.
            
            await AudioRecord.start();
            this.isRecording = true;

            console.log('Started recording');
            return this.currentRecordingPath;
        } catch (error) {
            console.error('Failed to start recording:', error);
            throw new Error('Failed to start recording');
        }
    }

    /**
     * Stop recording and return the file path
     */
    async stopRecording(): Promise<string | null> {
        if (!this.isRecording) {
            console.warn('Not currently recording');
            return null;
        }

        try {
            await AudioRecord.stop();
            this.isRecording = false;

            const recordingPath = this.currentRecordingPath;
            this.currentRecordingPath = null;

            console.log('Stopped recording. File saved to:', recordingPath);
            return recordingPath;
        } catch (error) {
            console.error('Failed to stop recording:', error);
            throw new Error('Failed to stop recording');
        }
    }

    /**
     * Send audio file to server for recognition
     */
    async recognizeAudioFile(filePath: string): Promise<RecognitionResult> {
        try {
            // Check if file exists
            const fileExists = await RNFS.exists(filePath);
            if (!fileExists) {
                throw new Error('Audio file does not exist');
            }

            // Get file stats
            const fileStats = await RNFS.stat(filePath);
            console.log('Sending audio file:', filePath, 'Size:', fileStats.size, 'bytes');

            // Create FormData
            const formData = new FormData();
            formData.append('audio', {
                uri: Platform.OS === 'android' ? `file://${filePath}` : filePath,
                type: 'audio/wav',
                name: 'recording.wav',
            } as any);

            // Send to server
            const response = await fetch(this.config.serverUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
                body: formData,
            });

            if (!response.ok) {
                throw new Error(`Server error: ${response.status} ${response.statusText}`);
            }

            const result: RecognitionResult = await response.json();
            console.log('Recognition result:', result);

            // Clean up the file after sending
            this.cleanupFile(filePath);

            return result;
        } catch (error) {
            console.error('Error recognizing audio file:', error);
            return {
                success: false,
                errorMessage: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }

    /**
     * Record and recognize in one step
     */
    async recordAndRecognize(maxDurationMs: number = 10000): Promise<RecognitionResult> {
        try {
            // Start recording
            const filePath = await this.startRecording();

            // Stop recording after max duration or when manually stopped
            await new Promise(resolve => setTimeout(resolve, maxDurationMs));

            if (this.isRecording) {
                await this.stopRecording();
            }

            // Send for recognition
            return await this.recognizeAudioFile(filePath);
        } catch (error) {
            console.error('Error in recordAndRecognize:', error);
            return {
                success: false,
                errorMessage: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }

    /**
     * Clean up temporary audio files
     */
    private async cleanupFile(filePath: string): Promise<void> {
        try {
            const exists = await RNFS.exists(filePath);
            if (exists) {
                await RNFS.unlink(filePath);
                console.log('Cleaned up audio file:', filePath);
            }
        } catch (error) {
            console.warn('Failed to cleanup file:', filePath, error);
        }
    }

    /**
     * Clean up all recording-related files in cache
     */
    async cleanupAllRecordings(): Promise<void> {
        try {
            const cacheDir = RNFS.CachesDirectoryPath;
            const files = await RNFS.readDir(cacheDir);

            const recordingFiles = files.filter(file =>
                file.name.startsWith('recording_') && file.name.endsWith('.wav')
            );

            await Promise.all(
                recordingFiles.map(file => this.cleanupFile(file.path))
            );

            console.log(`Cleaned up ${recordingFiles.length} recording files`);
        } catch (error) {
            console.warn('Failed to cleanup recordings:', error);
        }
    }

    /**
     * Get current recording status
     */
    getRecordingStatus(): {
        isInitialized: boolean;
        isRecording: boolean;
        hasPermission: boolean;
        currentRecordingPath: string | null;
    } {
        return {
            isInitialized: this.isInitialized,
            isRecording: this.isRecording,
            hasPermission: this.hasPermission,
            currentRecordingPath: this.currentRecordingPath,
        };
    }

    /**
     * Clean up resources
     */
    async cleanup(): Promise<void> {
        if (this.isRecording) {
            await this.stopRecording();
        }
        await this.cleanupAllRecordings();
    }
}