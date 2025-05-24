// src/components/VoiceRecorder.tsx
import React, {useEffect, useRef, useState} from 'react';
import {ActivityIndicator, PermissionsAndroid, Platform, StyleSheet, Text, TouchableOpacity, View,} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import AudioRecord from 'react-native-audio-record';
import {Buffer} from 'buffer';

interface VoiceRecorderProps {
    onTranscription: (text: string) => void;
    isActive: boolean;
    restEndpoint?: string;
    apiKey?: string;
    language?: string;
}

const VoiceRecorder: React.FC<VoiceRecorderProps> = ({
                                                         onTranscription,
                                                         isActive,
                                                         restEndpoint = 'https://your-stt-api.com/transcribe', // Replace with your actual endpoint
                                                         apiKey,
                                                         language = 'en-US',
                                                     }) => {
    const [isRecording, setIsRecording] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [audioData, setAudioData] = useState<string[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [hasPermission, setHasPermission] = useState(false);
    const recordingInterval = useRef<NodeJS.Timeout | null>(null);
    const audioChunks = useRef<string[]>([]);

    // Request microphone permissions
    const requestPermissions = async (): Promise<boolean> => {
        if (Platform.OS === 'android') {
            try {
                const granted = await PermissionsAndroid.request(
                    PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
                    {
                        title: 'Microphone Permission',
                        message: 'App needs access to your microphone for voice recording',
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
    };

    // Initialize audio recording
    const initializeRecording = async () => {
        const hasAudioPermission = await requestPermissions();
        setHasPermission(hasAudioPermission);

        if (!hasAudioPermission) {
            setError('Microphone permission denied');
            return false;
        }

        const options = {
            sampleRate: 16000,
            channels: 1,
            bitsPerSample: 16,
            audioSource: 6, // MIC source
            wavFile: '', // No file saving (streaming only)
        };

        try {
            await AudioRecord.init(options);
            return true;
        } catch (error) {
            console.error('Failed to initialize audio recording:', error);
            setError('Failed to initialize audio recording');
            return false;
        }
    };

    // Send audio data to REST API for transcription
    const sendAudioToAPI = async (audioBase64: string) => {
        try {
            setIsProcessing(true);

            // Convert base64 to blob
            const audioBuffer = Buffer.from(audioBase64, 'base64');

            // Create form data
            const formData = new FormData();
            formData.append('audio', {
                uri: `data:audio/wav;base64,${audioBase64}`,
                type: 'audio/wav',
                name: 'recording.wav',
            } as any);
            formData.append('language', language);

            // Make REST API call
            const response = await fetch(restEndpoint, {
                method: 'POST',
                headers: {
                    'Authorization': apiKey ? `Bearer ${apiKey}` : '',
                    'Accept': 'application/json',
                },
                body: formData,
            });

            if (!response.ok) {
                throw new Error(`API Error: ${response.status} ${response.statusText}`);
            }

            const result = await response.json();

            // Handle the transcription result
            if (result.transcription || result.text) {
                const transcribedText = result.transcription || result.text;
                onTranscription(transcribedText);
                setError(null);
            } else {
                throw new Error('No transcription in response');
            }
        } catch (error) {
            console.error('Error sending audio to API:', error);
            setError('Failed to transcribe audio');
        } finally {
            setIsProcessing(false);
        }
    };

    // Alternative: Send audio chunks periodically for streaming-like behavior
    const sendAudioChunks = async () => {
        if (audioChunks.current.length === 0) return;

        // Combine audio chunks
        const combinedAudio = audioChunks.current.join('');
        audioChunks.current = []; // Clear chunks

        await sendAudioToAPI(combinedAudio);
    };

    // Start recording
    const startRecording = async () => {
        const initialized = await initializeRecording();
        if (!initialized) return;

        try {
            // Clear previous data
            audioChunks.current = [];
            setAudioData([]);
            setError(null);

            // Set up data handler
            AudioRecord.on('data', (data: string) => {
                // Store audio chunks
                audioChunks.current.push(data);
            });

            // Start recording
            AudioRecord.start();
            setIsRecording(true);

            // Set up periodic sending of audio chunks (every 3 seconds)
            recordingInterval.current = setInterval(() => {
                sendAudioChunks();
            }, 3000);
        } catch (error) {
            console.error('Failed to start recording:', error);
            setError('Failed to start recording');
        }
    };

    // Stop recording
    const stopRecording = async () => {
        if (!isRecording) return;

        try {
            // Stop the recording
            await AudioRecord.stop();
            setIsRecording(false);

            // Clear interval
            if (recordingInterval.current) {
                clearInterval(recordingInterval.current);
                recordingInterval.current = null;
            }

            // Send any remaining audio chunks
            if (audioChunks.current.length > 0) {
                await sendAudioChunks();
            }
        } catch (error) {
            console.error('Failed to stop recording:', error);
            setError('Failed to stop recording');
        }
    };

    // Toggle recording
    const toggleRecording = () => {
        if (isRecording) {
            stopRecording();
        } else {
            startRecording();
        }
    };

    // Clean up on unmount
    useEffect(() => {
        return () => {
            if (isRecording) {
                stopRecording();
            }
            if (recordingInterval.current) {
                clearInterval(recordingInterval.current);
            }
        };
    }, []);

    // Auto-start/stop based on isActive prop
    useEffect(() => {
        if (isActive && !isRecording) {
            startRecording();
        } else if (!isActive && isRecording) {
            stopRecording();
        }
    }, [isActive]);

    return (
        <View style={styles.container}>
            <TouchableOpacity
                style={[
                    styles.recordButton,
                    isRecording && styles.recordingButton,
                    !hasPermission && styles.disabledButton,
                ]}
                onPress={toggleRecording}
                disabled={!hasPermission || isProcessing}
            >
                {isProcessing ? (
                    <ActivityIndicator size="large" color="white" />
                ) : (
                    <MaterialCommunityIcons
                        name={isRecording ? 'stop' : 'microphone'}
                        size={36}
                        color="white"
                    />
                )}
            </TouchableOpacity>

            <Text style={styles.statusText}>
                {isProcessing
                    ? 'Processing...'
                    : isRecording
                        ? 'Recording... Tap to stop'
                        : 'Tap to start recording'}
            </Text>

            {error && (
                <View style={styles.errorContainer}>
                    <MaterialCommunityIcons name="alert-circle" size={20} color="#F44336" />
                    <Text style={styles.errorText}>{error}</Text>
                </View>
            )}

            {isRecording && (
                <View style={styles.recordingIndicator}>
                    <View style={styles.recordingDot} />
                    <Text style={styles.recordingText}>Recording in progress</Text>
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        padding: 16,
    },
    recordButton: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#4CAF50',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
    },
    recordingButton: {
        backgroundColor: '#F44336',
    },
    disabledButton: {
        backgroundColor: '#BDBDBD',
    },
    statusText: {
        fontSize: 16,
        color: '#666',
        marginBottom: 8,
    },
    errorContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFEBEE',
        padding: 12,
        borderRadius: 8,
        marginTop: 8,
    },
    errorText: {
        color: '#F44336',
        marginLeft: 8,
        fontSize: 14,
    },
    recordingIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 12,
    },
    recordingDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#F44336',
        marginRight: 8,
        // Add pulsing animation
    },
    recordingText: {
        color: '#F44336',
        fontSize: 14,
    },
});

export default VoiceRecorder;