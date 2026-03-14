// src/screens/components/RhythmAudioRecorder.tsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    Animated,
    PermissionsAndroid,
    Platform,
    Alert,
    ActivityIndicator,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import AudioRecord from 'react-native-audio-record';
import { useTranslation } from 'react-i18next';
import { safeRNFS as RNFS, isRNFSAvailable } from '../../shared/lib/fileSystem';
import { useAppStyles } from '../../shared/ui/hooks/useAppStyles';
import { createStyles } from '../../shared/ui/theme';
import { useOnsetDetector } from '../../hooks/useOnsetDetector';

interface RhythmAudioRecorderProps {
    isActive: boolean;
    onRecordingStart: () => void;
    onRecordingStop?: () => void;
    onRecordingComplete: (audioFile: { uri: string; name: string; type: string }) => void;
    onRecordingCancel: () => void;
    onOnsetDetected?: (timestampMs: number) => void;
    onsetSensitivity?: 'percussive' | 'tonal';
    maxDuration?: number;
    countdownSeconds?: number;
}

type RecordingPhase = 'IDLE' | 'COUNTDOWN' | 'RECORDING' | 'PROCESSING';

export const RhythmAudioRecorder: React.FC<RhythmAudioRecorderProps> = ({
    isActive,
    onRecordingStart,
    onRecordingStop,
    onRecordingComplete,
    onRecordingCancel,
    onOnsetDetected,
    onsetSensitivity = 'percussive',
    maxDuration = 30,
    countdownSeconds = 3,
}) => {
    const { t } = useTranslation();
    const { theme } = useAppStyles();
    const styles = themeStyles;
    
    const [phase, setPhase] = useState<RecordingPhase>('IDLE');
    const [countdown, setCountdown] = useState(countdownSeconds);
    const [duration, setDuration] = useState(0);
    const [hasPermission, setHasPermission] = useState(false);
    
    const pulseAnim = useRef(new Animated.Value(1)).current;
    const durationTimerRef = useRef<NodeJS.Timeout | null>(null);
    const countdownTimerRef = useRef<NodeJS.Timeout | null>(null);
    const audioFilePath = useRef<string>('');

    // Initialize onset detector
    const detector = useOnsetDetector({
        sensitivity: onsetSensitivity,
        onOnsetDetected: (ts) => onOnsetDetected?.(ts),
        sampleRate: 44100,
        bufferLatencyMs: 70, // Estimated buffer latency
    });
    
    // Request permissions on mount
    useEffect(() => {
        requestPermissions();
        return () => {
            cleanup();
        };
    }, []);
    
    // Initialize recorder when active
    useEffect(() => {
        if (isActive && hasPermission) {
            initializeRecorder();
        }
    }, [isActive, hasPermission]);
    
    // Pulse animation during recording
    useEffect(() => {
        if (phase === 'RECORDING') {
            const pulse = Animated.loop(
                Animated.sequence([
                    Animated.timing(pulseAnim, {
                        toValue: 1.2,
                        duration: 500,
                        useNativeDriver: true,
                    }),
                    Animated.timing(pulseAnim, {
                        toValue: 1,
                        duration: 500,
                        useNativeDriver: true,
                    }),
                ])
            );
            pulse.start();
            return () => pulse.stop();
        } else {
            pulseAnim.setValue(1);
        }
    }, [phase, pulseAnim]);
    
    const requestPermissions = async () => {
        if (Platform.OS === 'android') {
            try {
                const granted = await PermissionsAndroid.request(
                    PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
                    {
                        title: t('rhythmChallenge.errors.microphonePermissionTitle', 'Microphone Permission'),
                        message: t('rhythmChallenge.errors.microphonePermission', 'This app needs access to your microphone to record your rhythm.'),
                        buttonNeutral: t('common.askLater', 'Ask Later'),
                        buttonNegative: t('common.cancel', 'Cancel'),
                        buttonPositive: t('common.ok', 'OK'),
                    }
                );
                setHasPermission(granted === PermissionsAndroid.RESULTS.GRANTED);
            } catch (err) {
                console.error('Permission error:', err);
                setHasPermission(false);
            }
        } else {
            setHasPermission(true);
        }
    };
    
    const initializeRecorder = () => {
        if (!isRNFSAvailable()) {
            console.error('RNFS not available, cannot initialize recorder path');
            return;
        }
        const options = {
            sampleRate: 44100,
            channels: 1,
            bitsPerSample: 16,
            wavFile: `rhythm_recording_${Date.now()}.wav`,
        };
        
        AudioRecord.init(options);
        audioFilePath.current = `${RNFS.CachesDirectoryPath}/${options.wavFile}`;
    };
    
    const startCountdown = useCallback(() => {
        setPhase('COUNTDOWN');
        setCountdown(countdownSeconds);

        // Start AudioRecord early for noise floor calibration during countdown
        console.log('🎤 [RhythmAudioRecorder] Starting AudioRecord for calibration');
        AudioRecord.start();
        AudioRecord.on('data', (data) => {
            detector.calibrateNoiseFloor(data);
        });
        
        countdownTimerRef.current = setInterval(() => {
            setCountdown(prev => {
                if (prev <= 1) {
                    clearInterval(countdownTimerRef.current!);
                    startRecording();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    }, [countdownSeconds, detector]);
    
    const startRecording = useCallback(() => {
        setPhase('RECORDING');
        setDuration(0);
        
        // Switch AudioRecord listener from calibration to onset detection
        console.log('🎤 [RhythmAudioRecorder] Switching to onset detection');
        detector.startDetection();
        AudioRecord.on('data', (data) => {
            detector.processAudioChunk(data);
        });

        onRecordingStart();
        
        durationTimerRef.current = setInterval(() => {
            setDuration(prev => {
                if (prev >= maxDuration - 1) {
                    stopRecording();
                    return prev;
                }
                return prev + 1;
            });
        }, 1000);
    }, [maxDuration, onRecordingStart, detector]);
    
    const stopRecording = useCallback(async () => {
        setPhase('PROCESSING');
        
        // Immediate sync callback for UI to finalize client-side scores
        onRecordingStop?.();
        detector.stopDetection();

        if (durationTimerRef.current) {
            clearInterval(durationTimerRef.current);
        }
        
        try {
            const filePath = await AudioRecord.stop();
            // Remove the on('data') listener to avoid processing after stop
            AudioRecord.on('data', () => {});
            
            if (duration < 1) {
                Alert.alert(t('common.error'), t('rhythmChallenge.errors.recordingTooShort'));
                setPhase('IDLE');
                return;
            }

            // Verify file exists
            let exists = false;
            const finalPath = filePath || audioFilePath.current;
            if (isRNFSAvailable()) {
                exists = await RNFS.exists(finalPath);
            } else {
                exists = true; 
            }

            if (!exists) {
                throw new Error('Recording file not found');
            }
            
            const uri = Platform.OS === 'android' && !finalPath.startsWith('file://')
                ? `file://${finalPath}`
                : finalPath;

            const audioFile = {
                uri,
                name: `rhythm_${Date.now()}.wav`,
                type: 'audio/wav',
            };
            
            setPhase('IDLE');
            onRecordingComplete(audioFile);
            
        } catch (error) {
            console.error('Recording error:', error);
            Alert.alert(t('common.error'), t('rhythmChallenge.errors.recordingFailed'));
            setPhase('IDLE');
        }
    }, [onRecordingComplete, onRecordingStop, duration, t, detector]);
    
    const cancelRecording = useCallback(() => {
        cleanup();
        setPhase('IDLE');
        setDuration(0);
        onRecordingCancel();
    }, [onRecordingCancel]);
    
    const cleanup = () => {
        if (durationTimerRef.current) {
            clearInterval(durationTimerRef.current);
        }
        if (countdownTimerRef.current) {
            clearInterval(countdownTimerRef.current);
        }
        try {
            AudioRecord.stop();
        } catch (e) {}
    };
    
    const formatDuration = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };
    
    if (!hasPermission) {
        return (
            <View style={styles.container}>
                <MaterialCommunityIcons name="microphone-off" size={64} color={theme.colors.error.main} />
                <Text style={styles.errorText}>{t('rhythmChallenge.errors.microphonePermission')}</Text>
                <TouchableOpacity style={styles.permissionButton} onPress={requestPermissions}>
                    <Text style={styles.permissionButtonText}>{t('common.retry', 'Retry')}</Text>
                </TouchableOpacity>
            </View>
        );
    }
    
    return (
        <View style={styles.container}>
            {phase === 'IDLE' && (
                <View style={styles.idleContainer}>
                    <TouchableOpacity style={styles.startButton} onPress={startCountdown}>
                        <MaterialCommunityIcons name="microphone" size={48} color={theme.colors.text.inverse} />
                        <Text style={styles.startButtonText}>{t('rhythmChallenge.startRecording')}</Text>
                    </TouchableOpacity>
                    <Text style={styles.hintText}>
                        {t('rhythmChallenge.tapAlong')}
                    </Text>
                </View>
            )}
            
            {phase === 'COUNTDOWN' && (
                <View style={styles.countdownContainer}>
                    <Text style={styles.countdownText}>{countdown}</Text>
                    <Text style={styles.countdownLabel}>{t('rhythmChallenge.getReady')}</Text>
                </View>
            )}
            
            {phase === 'RECORDING' && (
                <View style={styles.recordingContainer}>
                    <Animated.View style={[
                        styles.recordingIndicator,
                        { transform: [{ scale: pulseAnim }] }
                    ]}>
                        <MaterialCommunityIcons name="microphone" size={64} color={theme.colors.error.main} />
                    </Animated.View>
                    
                    <Text style={styles.recordingDuration}>{formatDuration(duration)}</Text>
                    <Text style={styles.recordingHint}>{t('rhythmChallenge.recording')}</Text>
                    
                    <View style={styles.recordingControls}>
                        <TouchableOpacity style={styles.cancelButton} onPress={cancelRecording}>
                            <MaterialCommunityIcons name="close" size={24} color={theme.colors.text.inverse} />
                            <Text style={styles.cancelButtonText}>{t('common.cancel')}</Text>
                        </TouchableOpacity>
                        
                        <TouchableOpacity style={styles.stopButton} onPress={stopRecording}>
                            <MaterialCommunityIcons name="check" size={32} color={theme.colors.text.inverse} />
                            <Text style={styles.stopButtonText}>{t('rhythmChallenge.done')}</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            )}
            
            {phase === 'PROCESSING' && (
                <View style={styles.processingContainer}>
                    <ActivityIndicator size="large" color={theme.colors.primary.main} />
                    <Text style={styles.processingText}>{t('rhythmChallenge.processing')}</Text>
                </View>
            )}
        </View>
    );
};

const themeStyles = createStyles(theme => ({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: theme.spacing.xl,
    },
    idleContainer: {
        alignItems: 'center',
    },
    startButton: {
        backgroundColor: theme.colors.primary.main,
        width: 150,
        height: 150,
        borderRadius: 75,
        justifyContent: 'center',
        alignItems: 'center',
        ...theme.shadows.medium,
    },
    startButtonText: {
        color: theme.colors.text.inverse,
        fontSize: 14,
        fontWeight: 'bold',
        marginTop: theme.spacing.xs,
    },
    hintText: {
        color: theme.colors.text.secondary,
        fontSize: 16,
        textAlign: 'center',
        marginTop: theme.spacing.xl,
        fontStyle: 'italic',
    },
    countdownContainer: {
        alignItems: 'center',
    },
    countdownText: {
        fontSize: 120,
        fontWeight: '900',
        color: theme.colors.primary.main,
    },
    countdownLabel: {
        fontSize: 24,
        color: theme.colors.text.secondary,
        marginTop: theme.spacing.md,
    },
    recordingContainer: {
        alignItems: 'center',
    },
    recordingIndicator: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: 'rgba(244, 67, 54, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: theme.colors.error.main,
    },
    recordingDuration: {
        fontSize: 56,
        fontWeight: 'bold',
        color: theme.colors.text.inverse,
        marginTop: theme.spacing.xl,
        fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    },
    recordingHint: {
        color: theme.colors.error.main,
        fontSize: 18,
        fontWeight: 'bold',
        marginTop: theme.spacing.sm,
    },
    recordingControls: {
        flexDirection: 'row',
        marginTop: theme.spacing['3xl'],
        gap: theme.spacing.lg,
    },
    cancelButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.neutral.gray[700],
        paddingHorizontal: theme.spacing.xl,
        paddingVertical: theme.spacing.md,
        borderRadius: theme.layout.borderRadius.md,
    },
    cancelButtonText: {
        color: theme.colors.text.inverse,
        marginLeft: theme.spacing.sm,
        fontWeight: '600',
    },
    stopButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.success.main,
        paddingHorizontal: theme.spacing['2xl'],
        paddingVertical: theme.spacing.md,
        borderRadius: theme.layout.borderRadius.md,
        ...theme.shadows.small,
    },
    stopButtonText: {
        color: theme.colors.text.inverse,
        fontSize: 20,
        fontWeight: 'bold',
        marginLeft: theme.spacing.sm,
    },
    processingContainer: {
        alignItems: 'center',
    },
    processingText: {
        color: theme.colors.text.secondary,
        fontSize: 18,
        marginTop: theme.spacing.lg,
    },
    errorText: {
        color: theme.colors.error.main,
        fontSize: 16,
        marginTop: theme.spacing.lg,
        textAlign: 'center',
    },
    permissionButton: {
        backgroundColor: theme.colors.primary.main,
        paddingHorizontal: theme.spacing.xl,
        paddingVertical: theme.spacing.md,
        borderRadius: theme.layout.borderRadius.md,
        marginTop: theme.spacing.xl,
    },
    permissionButtonText: {
        color: theme.colors.text.inverse,
        fontWeight: 'bold',
    },
}));

export default RhythmAudioRecorder;
