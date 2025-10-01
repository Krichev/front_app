// src/components/AudioRecorder.tsx
import React, {useEffect, useRef, useState} from 'react';
import {Alert, Animated, PermissionsAndroid, Platform, StyleSheet, Text, TouchableOpacity, View,} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import AudioRecord from 'react-native-audio-record';
import {ProcessedFileInfo} from '../services/speech/FileService';

export interface AudioRecorderProps {
    onRecordingComplete: (audioFile: ProcessedFileInfo) => void;
    onCancel: () => void;
    maxDuration?: number; // in seconds
    quality?: 'low' | 'medium' | 'high';
}

export interface RecordingState {
    isRecording: boolean;
    isPaused: boolean;
    duration: number;
    audioFile?: ProcessedFileInfo;
}

const AudioRecorder: React.FC<AudioRecorderProps> = ({
                                                         onRecordingComplete,
                                                         onCancel,
                                                         maxDuration = 300, // 5 minutes default
                                                         quality = 'medium'
                                                     }) => {
    const [recordingState, setRecordingState] = useState<RecordingState>({
        isRecording: false,
        isPaused: false,
        duration: 0,
    });

    const [hasPermission, setHasPermission] = useState<boolean>(false);
    const [isInitialized, setIsInitialized] = useState<boolean>(false);

    const pulseAnim = useRef(new Animated.Value(1)).current;
    const durationInterval = useRef<NodeJS.Timeout | null>(null);
    const recordingStartTime = useRef<number>(0);

    useEffect(() => {
        initializeRecorder();
        return () => {
            cleanup();
        };
    }, []);

    useEffect(() => {
        if (recordingState.isRecording && !recordingState.isPaused) {
            startPulseAnimation();
            startDurationTimer();
        } else {
            stopPulseAnimation();
            stopDurationTimer();
        }
    }, [recordingState.isRecording, recordingState.isPaused]);

    const initializeRecorder = async () => {
        try {
            // Request permissions
            const permission = await requestAudioPermission();
            if (!permission) {
                Alert.alert(
                    'Permission Required',
                    'Microphone permission is required to record audio.',
                    [{ text: 'OK', onPress: onCancel }]
                );
                return;
            }

            setHasPermission(true);

            // Configure audio recording options
            const options = {
                sampleRate: quality === 'high' ? 44100 : quality === 'medium' ? 22050 : 16000,
                channels: 1,
                bitsPerSample: 16,
                audioSource: 6, // VOICE_RECOGNITION
                wavFile: 'audio_recording.wav',
            };

            AudioRecord.init(options);
            setIsInitialized(true);
        } catch (error) {
            console.error('Error initializing audio recorder:', error);
            Alert.alert(
                'Initialization Error',
                'Failed to initialize audio recorder. Please try again.',
                [{ text: 'OK', onPress: onCancel }]
            );
        }
    };

    const requestAudioPermission = async (): Promise<boolean> => {
        if (Platform.OS === 'android') {
            try {
                const permission = PermissionsAndroid.PERMISSIONS.RECORD_AUDIO;
                const hasPermission = await PermissionsAndroid.check(permission);

                if (hasPermission) {
                    return true;
                }

                const status = await PermissionsAndroid.request(permission, {
                    title: 'Microphone Permission',
                    message: 'This app needs access to your microphone to record audio questions.',
                    buttonNeutral: 'Ask Me Later',
                    buttonNegative: 'Cancel',
                    buttonPositive: 'OK',
                });

                return status === PermissionsAndroid.RESULTS.GRANTED;
            } catch (error) {
                console.error('Error requesting audio permission:', error);
                return false;
            }
        }

        // iOS permissions are handled automatically by the library
        return true;
    };

    const startRecording = async () => {
        if (!hasPermission || !isInitialized) {
            await initializeRecorder();
            return;
        }

        try {
            AudioRecord.start();
            recordingStartTime.current = Date.now();
            setRecordingState(prev => ({
                ...prev,
                isRecording: true,
                isPaused: false,
                duration: 0,
            }));
        } catch (error) {
            console.error('Error starting recording:', error);
            Alert.alert('Recording Error', 'Failed to start recording. Please try again.');
        }
    };

    const pauseRecording = () => {
        try {
            // Note: react-native-audio-record doesn't support pause/resume
            // This is a placeholder for future implementation or alternative library
            setRecordingState(prev => ({
                ...prev,
                isPaused: !prev.isPaused,
            }));
        } catch (error) {
            console.error('Error pausing recording:', error);
        }
    };

    const stopRecording = async () => {
        try {
            const audioFile = await AudioRecord.stop();

            if (audioFile) {
                const processedFile: ProcessedFileInfo = {
                    name: `audio_${Date.now()}.wav`,
                    size: 0, // Will be calculated when file is read
                    type: 'audio/wav',
                    uri: audioFile,
                    createdAt: new Date().toISOString(),
                    modifiedAt: new Date().toISOString(),
                    sizeFormatted: '0 KB',
                    isImage: false,
                    isVideo: false,
                    extension: 'wav',
                };

                setRecordingState(prev => ({
                    ...prev,
                    isRecording: false,
                    isPaused: false,
                    audioFile: processedFile,
                }));

                onRecordingComplete(processedFile);
            } else {
                throw new Error('No audio file was created');
            }
        } catch (error) {
            console.error('Error stopping recording:', error);
            Alert.alert('Recording Error', 'Failed to save recording. Please try again.');
        }
    };

    const deleteRecording = () => {
        Alert.alert(
            'Delete Recording',
            'Are you sure you want to delete this recording?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: () => {
                        setRecordingState({
                            isRecording: false,
                            isPaused: false,
                            duration: 0,
                        });
                    },
                },
            ]
        );
    };

    const startPulseAnimation = () => {
        const pulse = () => {
            Animated.sequence([
                Animated.timing(pulseAnim, {
                    toValue: 1.2,
                    duration: 800,
                    useNativeDriver: true,
                }),
                Animated.timing(pulseAnim, {
                    toValue: 1,
                    duration: 800,
                    useNativeDriver: true,
                }),
            ]).start(() => {
                if (recordingState.isRecording && !recordingState.isPaused) {
                    pulse();
                }
            });
        };
        pulse();
    };

    const stopPulseAnimation = () => {
        pulseAnim.setValue(1);
    };

    const startDurationTimer = () => {
        durationInterval.current = setInterval(() => {
            setRecordingState(prev => {
                const newDuration = prev.duration + 1;

                // Auto-stop if max duration reached
                if (newDuration >= maxDuration) {
                    stopRecording();
                    return prev;
                }

                return {
                    ...prev,
                    duration: newDuration,
                };
            });
        }, 1000);
    };

    const stopDurationTimer = () => {
        if (durationInterval.current) {
            clearInterval(durationInterval.current);
            durationInterval.current = null;
        }
    };

    const cleanup = () => {
        stopDurationTimer();
        if (recordingState.isRecording) {
            AudioRecord.stop().catch(console.error);
        }
    };

    const formatDuration = (seconds: number): string => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const getMaxDurationFormatted = (): string => {
        return formatDuration(maxDuration);
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Record Audio Question</Text>
                <TouchableOpacity onPress={onCancel} style={styles.closeButton}>
                    <MaterialCommunityIcons name="close" size={24} color="#666" />
                </TouchableOpacity>
            </View>

            <View style={styles.recordingArea}>
                {/* Recording Visualization */}
                <Animated.View
                    style={[
                        styles.recordButton,
                        recordingState.isRecording && styles.recordButtonActive,
                        { transform: [{ scale: pulseAnim }] },
                    ]}
                >
                    <TouchableOpacity
                        onPress={recordingState.isRecording ? stopRecording : startRecording}
                        disabled={!hasPermission || !isInitialized}
                        style={styles.recordButtonInner}
                    >
                        <MaterialCommunityIcons
                            name={recordingState.isRecording ? 'stop' : 'microphone'}
                            size={40}
                            color="#FFF"
                        />
                    </TouchableOpacity>
                </Animated.View>

                {/* Duration Display */}
                <View style={styles.durationContainer}>
                    <Text style={styles.durationText}>
                        {formatDuration(recordingState.duration)}
                    </Text>
                    <Text style={styles.maxDurationText}>
                        / {getMaxDurationFormatted()}
                    </Text>
                </View>

                {/* Status Text */}
                <Text style={styles.statusText}>
                    {!hasPermission
                        ? 'Requesting microphone permission...'
                        : !isInitialized
                            ? 'Initializing recorder...'
                            : recordingState.isRecording
                                ? recordingState.isPaused
                                    ? 'Recording paused'
                                    : 'Recording... Tap to stop'
                                : 'Tap to start recording'}
                </Text>

                {/* Progress Bar */}
                <View style={styles.progressContainer}>
                    <View
                        style={[
                            styles.progressBar,
                            { width: `${(recordingState.duration / maxDuration) * 100}%` }
                        ]}
                    />
                </View>
            </View>

            {/* Controls */}
            <View style={styles.controls}>
                {recordingState.isRecording && (
                    <TouchableOpacity
                        onPress={pauseRecording}
                        style={styles.controlButton}
                    >
                        <MaterialCommunityIcons
                            name={recordingState.isPaused ? 'play' : 'pause'}
                            size={24}
                            color="#007AFF"
                        />
                        <Text style={styles.controlButtonText}>
                            {recordingState.isPaused ? 'Resume' : 'Pause'}
                        </Text>
                    </TouchableOpacity>
                )}

                {recordingState.audioFile && !recordingState.isRecording && (
                    <TouchableOpacity
                        onPress={deleteRecording}
                        style={[styles.controlButton, styles.deleteButton]}
                    >
                        <MaterialCommunityIcons name="delete" size={24} color="#FF3B30" />
                        <Text style={[styles.controlButtonText, styles.deleteButtonText]}>
                            Delete
                        </Text>
                    </TouchableOpacity>
                )}
            </View>

            {/* Info */}
            <View style={styles.infoContainer}>
                <Text style={styles.infoText}>
                    Record a clear audio question for your quiz. Make sure you're in a quiet environment.
                </Text>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFF',
        paddingHorizontal: 20,
        paddingVertical: 16,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 32,
    },
    title: {
        fontSize: 20,
        fontWeight: '600',
        color: '#333',
    },
    closeButton: {
        padding: 8,
    },
    recordingArea: {
        alignItems: 'center',
        paddingVertical: 40,
    },
    recordButton: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: '#FF3B30',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 24,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
    },
    recordButtonActive: {
        backgroundColor: '#FF6B6B',
    },
    recordButtonInner: {
        width: '100%',
        height: '100%',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 60,
    },
    durationContainer: {
        flexDirection: 'row',
        alignItems: 'baseline',
        marginBottom: 16,
    },
    durationText: {
        fontSize: 32,
        fontWeight: '600',
        color: '#333',
        fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    },
    maxDurationText: {
        fontSize: 16,
        color: '#666',
        marginLeft: 4,
        fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    },
    statusText: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        marginBottom: 24,
    },
    progressContainer: {
        width: '100%',
        height: 4,
        backgroundColor: '#E5E5E7',
        borderRadius: 2,
        overflow: 'hidden',
    },
    progressBar: {
        height: '100%',
        backgroundColor: '#007AFF',
        borderRadius: 2,
    },
    controls: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 20,
        marginVertical: 24,
    },
    controlButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 8,
        backgroundColor: '#F5F5F7',
    },
    controlButtonText: {
        fontSize: 16,
        fontWeight: '500',
        color: '#007AFF',
    },
    deleteButton: {
        backgroundColor: '#FFF5F5',
    },
    deleteButtonText: {
        color: '#FF3B30',
    },
    infoContainer: {
        marginTop: 'auto',
        paddingTop: 20,
    },
    infoText: {
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
        lineHeight: 20,
    },
});

export default AudioRecorder;