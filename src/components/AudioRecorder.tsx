// src/components/AudioRecorder.tsx
import React, {useEffect, useRef, useState} from 'react';
import {Alert, Animated, PermissionsAndroid, Platform, Text, TouchableOpacity, View,} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import AudioRecord from 'react-native-audio-record';
import {ProcessedFileInfo} from '../services/speech/FileService';
import {useAppStyles} from '../shared/ui/hooks/useAppStyles';
import {createStyles} from '../shared/ui/theme';

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
    const {theme} = useAppStyles();
    const styles = themeStyles;
    
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
    }, [initializeRecorder, cleanup]);

    useEffect(() => {
        if (recordingState.isRecording && !recordingState.isPaused) {
            startPulseAnimation();
            startDurationTimer();
        } else {
            stopPulseAnimation();
            stopDurationTimer();
        }
    }, [recordingState.isRecording, recordingState.isPaused, startPulseAnimation, startDurationTimer, stopPulseAnimation, stopDurationTimer]);

    const initializeRecorder = useCallback(async () => {
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
    }, [onCancel, quality]);

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

    const stopRecording = useCallback(async () => {
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
    }, [onRecordingComplete]);

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

    const startPulseAnimation = useCallback(() => {
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
    }, [pulseAnim, recordingState.isRecording, recordingState.isPaused]);

    const stopPulseAnimation = useCallback(() => {
        pulseAnim.setValue(1);
    }, [pulseAnim]);

    const startDurationTimer = useCallback(() => {
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
    }, [maxDuration, stopRecording]);

    const stopDurationTimer = useCallback(() => {
        if (durationInterval.current) {
            clearInterval(durationInterval.current);
            durationInterval.current = null;
        }
    }, []);

    const cleanup = useCallback(() => {
        stopDurationTimer();
        if (recordingState.isRecording) {
            AudioRecord.stop().catch(console.error);
        }
    }, [stopDurationTimer, recordingState.isRecording]);

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
                    <MaterialCommunityIcons name="close" size={24} color={theme.colors.text.secondary} />
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
                            color={theme.colors.text.inverse}
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
                            color={theme.colors.primary.main}
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
                        <MaterialCommunityIcons name="delete" size={24} color={theme.colors.error.main} />
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

const themeStyles = createStyles(theme => ({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background.primary,
        paddingHorizontal: theme.spacing.xl,
        paddingVertical: theme.spacing.lg,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: theme.spacing['3xl'],
    },
    title: {
        ...theme.typography.heading.h6,
        fontWeight: theme.typography.fontWeight.semibold,
        color: theme.colors.text.primary,
    },
    closeButton: {
        padding: theme.spacing.sm,
    },
    recordingArea: {
        alignItems: 'center',
        paddingVertical: theme.spacing['4xl'],
    },
    recordButton: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: theme.colors.error.main,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: theme.spacing['2xl'],
        ...theme.shadows.medium,
    },
    recordButtonActive: {
        backgroundColor: theme.colors.secondary.main,
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
        marginBottom: theme.spacing.lg,
    },
    durationText: {
        fontSize: 32, // Specific large size
        fontWeight: theme.typography.fontWeight.semibold,
        color: theme.colors.text.primary,
        fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    },
    maxDurationText: {
        ...theme.typography.body.medium,
        color: theme.colors.text.secondary,
        marginLeft: theme.spacing.xs,
        fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    },
    statusText: {
        ...theme.typography.body.medium,
        color: theme.colors.text.secondary,
        textAlign: 'center',
        marginBottom: theme.spacing['2xl'],
    },
    progressContainer: {
        width: '100%',
        height: 4,
        backgroundColor: theme.colors.border.light,
        borderRadius: 2,
        overflow: 'hidden',
    },
    progressBar: {
        height: '100%',
        backgroundColor: theme.colors.primary.main,
        borderRadius: 2,
    },
    controls: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: theme.spacing.xl,
        marginVertical: theme.spacing['2xl'],
    },
    controlButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.sm,
        paddingHorizontal: theme.spacing.lg,
        paddingVertical: theme.spacing.md,
        borderRadius: theme.layout.borderRadius.md,
        backgroundColor: theme.colors.background.tertiary,
    },
    controlButtonText: {
        ...theme.typography.body.medium,
        fontWeight: theme.typography.fontWeight.medium,
        color: theme.colors.primary.main,
    },
    deleteButton: {
        backgroundColor: theme.colors.error.background,
    },
    deleteButtonText: {
        color: theme.colors.error.main,
    },
    infoContainer: {
        marginTop: 'auto',
        paddingTop: theme.spacing.xl,
    },
    infoText: {
        ...theme.typography.body.small,
        color: theme.colors.text.secondary,
        textAlign: 'center',
        lineHeight: 20,
    },
}));

export default AudioRecorder;
