// src/services/speech/FileSpeechRecognitionService.ts
import AudioRecord from 'react-native-audio-record';
import RNFS from 'react-native-fs';
import {PermissionsAndroid, Platform} from 'react-native';
import {SpeechRecognitionConfig, SpeechRecognitionResult} from '../../entities/speech-recognition/model/types';

export class FileSpeechRecognitionService {
    private isInitialized: boolean = false;
    private isRecording: boolean = false;
    private hasPermission: boolean = false;
    private currentRecordingPath: string | null = null;
    private config: SpeechRecognitionConfig;

    constructor(config: SpeechRecognitionConfig) {
        this.config = config;
    }

    /**
     * Initialize the speech recognition service
     */
    async initialize(): Promise<void> {
        try {
            // Request microphone permission
            this.hasPermission = await this.requestMicrophonePermission();

            if (!this.hasPermission) {
                throw new Error('Microphone permission denied');
            }

            // Configure audio recording
            const audioConfig = {
                sampleRate: this.config.audio?.sampleRate || 16000,
                channels: 1,
                bitsPerSample: 16,
                audioEncoding: 'wav',
                includeBase64: false,
                audioEncodingBitRate: 32000,
            };

            AudioRecord.init(audioConfig);
            this.isInitialized = true;
        } catch (error) {
            console.error('Failed to initialize FileSpeechRecognitionService:', error);
            throw error;
        }
    }

    /**
     * Request microphone permission
     */
    private async requestMicrophonePermission(): Promise<boolean> {
        if (Platform.OS === 'android') {
            try {
                const granted = await PermissionsAndroid.request(
                    PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
                    {
                        title: 'Microphone Permission',
                        message: 'This app needs access to your microphone to record audio.',
                        buttonNeutral: 'Ask Me Later',
                        buttonNegative: 'Cancel',
                        buttonPositive: 'OK',
                    }
                );
                return granted === PermissionsAndroid.RESULTS.GRANTED;
            } catch (error) {
                console.error('Error requesting microphone permission:', error);
                return false;
            }
        }
        return true; // iOS permissions are handled in Info.plist
    }

    /**
     * Start recording
     */
    async startRecording(): Promise<string> {
        if (!this.isInitialized) {
            throw new Error('Service not initialized');
        }

        if (this.isRecording) {
            throw new Error('Already recording');
        }

        try {
            // Generate unique filename
            const timestamp = Date.now();
            const filename = `recording_${timestamp}.wav`;
            this.currentRecordingPath = `${RNFS.CachesDirectoryPath}/${filename}`;

            // Start recording
            AudioRecord.start();
            this.isRecording = true;

            console.log('Started recording to:', this.currentRecordingPath);
            return this.currentRecordingPath;
        } catch (error) {
            console.error('Failed to start recording:', error);
            throw error;
        }
    }

    /**
     * Stop recording and return file path
     */
    async stopRecording(): Promise<string> {
        if (!this.isRecording) {
            throw new Error('Not currently recording');
        }

        try {
            const audioFile = await AudioRecord.stop();
            this.isRecording = false;

            if (this.currentRecordingPath && audioFile) {
                // Move the recorded file to our desired location
                await RNFS.moveFile(audioFile, this.currentRecordingPath);
                console.log('Recording saved to:', this.currentRecordingPath);
                return this.currentRecordingPath;
            } else {
                throw new Error('Failed to save recording');
            }
        } catch (error) {
            console.error('Failed to stop recording:', error);
            this.isRecording = false;
            throw error;
        }
    }

    /**
     * Process audio file for speech recognition
     */
    async processAudioFile(filePath: string): Promise<SpeechRecognitionResult> {
        try {
            // Check if file exists
            const fileExists = await RNFS.exists(filePath);
            if (!fileExists) {
                throw new Error('Audio file not found');
            }

            // Get file info
            const fileStats = await RNFS.stat(filePath);
            console.log('Processing audio file:', {
                path: filePath,
                size: fileStats.size,
                duration: this.estimateAudioDuration(fileStats.size)
            });

            // Here you would typically send the audio file to a speech recognition service
            // For now, return a mock result
            const mockResult: SpeechRecognitionResult = {
                text: 'Mock transcription result',
                confidence: 0.85,
                isFinal: true,
                alternatives: [
                    { text: 'Alternative transcription', confidence: 0.75 }
                ]
            };

            return mockResult;
        } catch (error) {
            console.error('Error processing audio file:', error);
            return {
                text: '',
                confidence: 0,
                isFinal: true,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }

    /**
     * Estimate audio duration based on file size
     */
    private estimateAudioDuration(fileSize: number): number {
        // Rough estimation: 16kHz, 16-bit, mono = 32KB per second
        const bytesPerSecond = (this.config.audio?.sampleRate || 16000) * 2;
        return Math.round(fileSize / bytesPerSecond);
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