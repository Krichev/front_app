// src/components/VoiceRecorderWithFile.tsx
import React, {useEffect, useRef, useState} from 'react';
import {
    ActivityIndicator,
    Animated,
    PermissionsAndroid,
    Platform,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import AudioRecord from 'react-native-audio-record';
import { safeRNFS as RNFS, isRNFSAvailable } from '../shared/lib/fileSystem';
import {FileService} from "../services/speech/FileService.ts";

interface VoiceRecorderWithFileProps {
    onTranscription: (text: string) => void;
    isActive?: boolean;
    restEndpoint: string;
    apiKey?: string;
    language?: string;
    maxRecordingDuration?: number; // Maximum recording duration in seconds
}

const VoiceRecorderWithFile: React.FC<VoiceRecorderWithFileProps> = ({
                                                                         onTranscription,
                                                                         isActive = false,
                                                                         restEndpoint,
                                                                         apiKey,
                                                                         language = 'en-US',
                                                                         maxRecordingDuration = 60, // Default 60 seconds max
                                                                     }) => {
    // State
    const [isRecording, setIsRecording] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [hasPermission, setHasPermission] = useState(false);
    const [recordingDuration, setRecordingDuration] = useState(0);
    const [audioFilePath, setAudioFilePath] = useState<string | null>(null);

    // Refs
    const durationTimer = useRef<NodeJS.Timeout | null>(null);
    const pulseAnimation = useRef(new Animated.Value(1)).current;

    // Animation for recording indicator
    useEffect(() => {
        if (isRecording) {
            Animated.loop(
                Animated.sequence([
                    Animated.timing(pulseAnimation, {
                        toValue: 1.2,
                        duration: 500,
                        useNativeDriver: true,
                    }),
                    Animated.timing(pulseAnimation, {
                        toValue: 1,
                        duration: 500,
                        useNativeDriver: true,
                    }),
                ])
            ).start();
        } else {
            pulseAnimation.setValue(1);
        }
    }, [isRecording, pulseAnimation]);

    // Request permissions
    const requestPermissions = async (): Promise<boolean> => {
        if (Platform.OS === 'android') {
            try {
                const granted = await PermissionsAndroid.request(
                    PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
                    {
                        title: 'Microphone Permission',
                        message: 'This app needs access to your microphone for voice recording',
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
        }
        return true;
    };

    // Initialize audio recording
    const initializeRecording = async (): Promise<boolean> => {
        const permission = await requestPermissions();
        setHasPermission(permission);

        if (!permission) {
            setError('Microphone permission denied');
            return false;
        }

        // Generate unique filename
        const timestamp = new Date().getTime();
        const fileName = `voice_recording_${timestamp}.wav`;
        
        if (!isRNFSAvailable()) {
            setError('File system not available');
            return false;
        }

        const filePath = `${RNFS.CachesDirectoryPath}/${fileName}`;

        const options = {
            sampleRate: 16000,
            channels: 1,
            bitsPerSample: 16,
            audioSource: Platform.OS === 'android' ? 6 : 0,
            wavFile: filePath, // Save to file
        };

        try {
            await AudioRecord.init(options);
            setAudioFilePath(filePath);
            return true;
        } catch (error) {
            console.error('Failed to initialize audio recording:', error);
            setError('Failed to initialize audio recording');
            return false;
        }
    };

    // Send audio file to REST API
    const sendAudioFileToAPI = async (filePath: string) => {
        try {
            setIsProcessing(true);

            if (!isRNFSAvailable()) {
                throw new Error('File system not available for verification');
            }

            // Check if file exists
            const fileExists = await RNFS.exists(filePath);
            if (!fileExists) {
                throw new Error('Audio file not found');
            }

            // Get file info
            const fileInfo = await RNFS.stat(filePath);
            console.log(`Audio file size: ${fileInfo.size} bytes`);

            // Create FormData
            const formData = new FormData();
            formData.append('audio', {
                uri: Platform.OS === 'ios' ? filePath : `file://${filePath}`,
                type: 'audio/wav',
                name: 'recording.wav',
            } as any);
            formData.append('language', language);
            formData.append('encoding', 'LINEAR16');
            formData.append('sampleRate', '16000');

            // Make API request
            const response = await fetch(restEndpoint, {
                method: 'POST',
                headers: {
                    'Authorization': apiKey ? `Bearer ${apiKey}` : '',
                    'Accept': 'application/json',
                },
                body: formData,
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`API Error (${response.status}): ${errorText}`);
            }

            const result = await response.json();

            // Handle the transcription result
            if (result.transcription || result.text) {
                const transcribedText = result.transcription || result.text;
                onTranscription(transcribedText);
                setError(null);

                // Save transcription with FileService if needed
                await FileService.saveTranscription({
                    audioFilePath: filePath,
                    transcription: transcribedText,
                    timestamp: new Date().toISOString(),
                    duration: recordingDuration,
                    language: language,
                });
            } else {
                throw new Error('No transcription in response');
            }
        } catch (error: any) {
            console.error('Error sending audio to API:', error);
            setError(error.message || 'Failed to transcribe audio');
        } finally {
            setIsProcessing(false);
        }
    };

    // Start recording
    const startRecording = async () => {
        const initialized = await initializeRecording();
        if (!initialized) return;

        try {
            // Reset state
            setError(null);
            setRecordingDuration(0);

            // Start recording
            await AudioRecord.start();
            setIsRecording(true);

            // Start duration timer
            durationTimer.current = setInterval(() => {
                setRecordingDuration(prev => {
                    const newDuration = prev + 1;

                    // Auto-stop if max duration reached
                    if (newDuration >= maxRecordingDuration) {
                        stopRecording();
                    }

                    return newDuration;
                });
            }, 1000);
        } catch (error) {
            console.error('Failed to start recording:', error);
            setError('Failed to start recording');
        }
    };

    // Stop recording
    const stopRecording = async () => {
        if (!isRecording) return;

        try {
            // Stop recording
            const audioFile = await AudioRecord.stop();
            setIsRecording(false);

            // Clear duration timer
            if (durationTimer.current) {
                clearInterval(durationTimer.current);
                durationTimer.current = null;
            }

            // Process the audio file
            if (audioFile && audioFilePath) {
                console.log('Audio recorded to:', audioFile);
                await sendAudioFileToAPI(audioFilePath);
            }
        } catch (error) {
            console.error('Failed to stop recording:', error);
            setError('Failed to stop recording');
        }
    };

    // Clean up audio files
    const cleanupAudioFiles = async () => {
        if (audioFilePath && isRNFSAvailable()) {
            try {
                const exists = await RNFS.exists(audioFilePath);
                if (exists) {
                    await RNFS.unlink(audioFilePath);
                    console.log('Cleaned up audio file:', audioFilePath);
                }
            } catch (error) {
                console.error('Error cleaning up audio file:', error);
            }
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

    // Format duration
    const formatDuration = (seconds: number): string => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    // Auto-start/stop based on isActive prop
    useEffect(() => {
        if (isActive && !isRecording) {
            startRecording();
        } else if (!isActive && isRecording) {
            stopRecording();
        }
    }, [isActive]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (isRecording) {
                stopRecording();
            }
            if (durationTimer.current) {
                clearInterval(durationTimer.current);
            }
            cleanupAudioFiles();
        };
    }, []);

    return (
        <View style={styles.container}>
            {/* Main Recording Button */}
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
                ) : isRecording ? (
                    <Animated.View
                        style={{
                            transform: [{ scale: pulseAnimation }],
                        }}
                    >
                        <MaterialCommunityIcons name="stop" size={36} color="white" />
                    </Animated.View>
                ) : (
                    <MaterialCommunityIcons name="microphone" size={36} color="white" />
                )}
            </TouchableOpacity>

            {/* Status Text */}
            <View style={styles.statusContainer}>
                <Text style={styles.statusText}>
                    {isProcessing
                        ? 'Processing audio...'
                        : isRecording
                            ? `Recording... ${formatDuration(recordingDuration)}`
                            : 'Tap to start recording'}
                </Text>

                {isRecording && (
                    <Text style={styles.durationWarning}>
                        Max duration: {formatDuration(maxRecordingDuration)}
                    </Text>
                )}
            </View>

            {/* Error Display */}
            {error && (
                <View style={styles.errorContainer}>
                    <MaterialCommunityIcons name="alert-circle" size={20} color="#F44336" />
                    <Text style={styles.errorText}>{error}</Text>
                    <TouchableOpacity onPress={() => setError(null)}>
                        <MaterialCommunityIcons name="close" size={20} color="#F44336" />
                    </TouchableOpacity>
                </View>
            )}

            {/* Recording Indicator */}
            {isRecording && (
                <View style={styles.recordingIndicator}>
                    <Animated.View
                        style={[
                            styles.recordingDot,
                            {
                                transform: [{ scale: pulseAnimation }],
                            },
                        ]}
                    />
                    <Text style={styles.recordingText}>Recording to file...</Text>
                </View>
            )}

            {/* Progress Bar */}
            {isRecording && (
                <View style={styles.progressContainer}>
                    <View style={styles.progressBar}>
                        <View
                            style={[
                                styles.progressFill,
                                {
                                    width: `${(recordingDuration / maxRecordingDuration) * 100}%`,
                                },
                            ]}
                        />
                    </View>
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        padding: 16,
        alignItems: 'center',
    },
    recordButton: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#4CAF50',
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        marginBottom: 12,
    },
    recordingButton: {
        backgroundColor: '#F44336',
    },
    disabledButton: {
        backgroundColor: '#BDBDBD',
    },
    statusContainer: {
        alignItems: 'center',
        marginBottom: 8,
    },
    statusText: {
        fontSize: 16,
        color: '#666',
        marginBottom: 4,
    },
    durationWarning: {
        fontSize: 12,
        color: '#999',
    },
    errorContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFEBEE',
        padding: 12,
        borderRadius: 8,
        marginTop: 8,
        width: '100%',
    },
    errorText: {
        flex: 1,
        color: '#F44336',
        marginHorizontal: 8,
        fontSize: 14,
    },
    recordingIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 8,
    },
    recordingDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#F44336',
        marginRight: 8,
    },
    recordingText: {
        color: '#666',
        fontSize: 14,
    },
    progressContainer: {
        width: '100%',
        marginTop: 12,
        paddingHorizontal: 20,
    },
    progressBar: {
        height: 4,
        backgroundColor: '#E0E0E0',
        borderRadius: 2,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        backgroundColor: '#4CAF50',
    },
});

export default VoiceRecorderWithFile;