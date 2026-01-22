// src/screens/components/RhythmAudioRecorder.tsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Animated,
    PermissionsAndroid,
    Platform,
    Alert,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import AudioRecord from 'react-native-audio-record';
import RNFS from 'react-native-fs';

interface RhythmAudioRecorderProps {
    isActive: boolean;
    onRecordingStart: () => void;
    onRecordingComplete: (audioFile: { uri: string; name: string; type: string }) => void;
    onRecordingCancel: () => void;
    maxDuration?: number;
    countdownSeconds?: number;
}

type RecordingPhase = 'IDLE' | 'COUNTDOWN' | 'RECORDING' | 'PROCESSING';

/**
 * Audio recorder optimized for rhythm/clap capture
 * Uses high sample rate for accurate onset detection
 */
export const RhythmAudioRecorder: React.FC<RhythmAudioRecorderProps> = ({
    isActive,
    onRecordingStart,
    onRecordingComplete,
    onRecordingCancel,
    maxDuration = 30,
    countdownSeconds = 3,
}) => {
    const [phase, setPhase] = useState<RecordingPhase>('IDLE');
    const [countdown, setCountdown] = useState(countdownSeconds);
    const [duration, setDuration] = useState(0);
    const [hasPermission, setHasPermission] = useState(false);
    const [audioLevel, setAudioLevel] = useState(0);
    
    const pulseAnim = useRef(new Animated.Value(1)).current;
    const levelAnim = useRef(new Animated.Value(0)).current;
    const durationTimerRef = useRef<NodeJS.Timeout | null>(null);
    const countdownTimerRef = useRef<NodeJS.Timeout | null>(null);
    const audioFilePath = useRef<string>('');
    
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
                        title: 'Microphone Permission',
                        message: 'This app needs access to your microphone to record your rhythm.',
                        buttonNeutral: 'Ask Later',
                        buttonNegative: 'Cancel',
                        buttonPositive: 'OK',
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
        const options = {
            sampleRate: 44100,  // High sample rate for accurate onset detection
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
    }, [countdownSeconds]);
    
    const startRecording = useCallback(() => {
        setPhase('RECORDING');
        setDuration(0);
        
        AudioRecord.start();
        onRecordingStart();
        
        // Duration timer
        durationTimerRef.current = setInterval(() => {
            setDuration(prev => {
                if (prev >= maxDuration - 1) {
                    stopRecording();
                    return prev;
                }
                return prev + 1;
            });
        }, 1000);
        
        // Audio level monitoring (simulated - actual implementation depends on library)
        // In a real implementation, use AudioRecord's onData callback
    }, [maxDuration, onRecordingStart]);
    
    const stopRecording = useCallback(async () => {
        setPhase('PROCESSING');
        
        if (durationTimerRef.current) {
            clearInterval(durationTimerRef.current);
        }
        
        try {
            const filePath = await AudioRecord.stop();
            
            // Verify file exists
            const exists = await RNFS.exists(filePath || audioFilePath.current);
            if (!exists) {
                throw new Error('Recording file not found');
            }
            
            const audioFile = {
                uri: `file://${filePath || audioFilePath.current}`,
                name: `rhythm_${Date.now()}.wav`,
                type: 'audio/wav',
            };
            
            setPhase('IDLE');
            onRecordingComplete(audioFile);
            
        } catch (error) {
            console.error('Recording error:', error);
            Alert.alert('Error', 'Failed to save recording. Please try again.');
            setPhase('IDLE');
        }
    }, [onRecordingComplete]);
    
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
        } catch (e) {
            // Ignore
        }
    };
    
    const formatDuration = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };
    
    if (!hasPermission) {
        return (
            <View style={styles.container}>
                <MaterialCommunityIcons name="microphone-off" size={48} color="#F44336" />
                <Text style={styles.errorText}>Microphone permission required</Text>
                <TouchableOpacity style={styles.permissionButton} onPress={requestPermissions}>
                    <Text style={styles.permissionButtonText}>Grant Permission</Text>
                </TouchableOpacity>
            </View>
        );
    }
    
    return (
        <View style={styles.container}>
            {phase === 'IDLE' && (
                <View style={styles.idleContainer}>
                    <TouchableOpacity style={styles.startButton} onPress={startCountdown}>
                        <MaterialCommunityIcons name="microphone" size={48} color="#fff" />
                        <Text style={styles.startButtonText}>Start Recording</Text>
                    </TouchableOpacity>
                    <Text style={styles.hintText}>
                        Record your claps to match the rhythm pattern
                    </Text>
                </View>
            )}
            
            {phase === 'COUNTDOWN' && (
                <View style={styles.countdownContainer}>
                    <Text style={styles.countdownText}>{countdown}</Text>
                    <Text style={styles.countdownLabel}>Get ready to clap!</Text>
                </View>
            )}
            
            {phase === 'RECORDING' && (
                <View style={styles.recordingContainer}>
                    <Animated.View style={[
                        styles.recordingIndicator,
                        { transform: [{ scale: pulseAnim }] }
                    ]}>
                        <MaterialCommunityIcons name="microphone" size={64} color="#F44336" />
                    </Animated.View>
                    
                    {/* Audio Level Visualization */}
                    <View style={styles.levelContainer}>
                        {[...Array(10)].map((_, i) => (
                            <View
                                key={i}
                                style={[
                                    styles.levelBar,
                                    i < Math.floor(audioLevel * 10) && styles.levelBarActive,
                                ]}
                            />
                        ))}
                    </View>
                    
                    <Text style={styles.recordingDuration}>{formatDuration(duration)}</Text>
                    <Text style={styles.recordingHint}>Clap along with the rhythm!</Text>
                    
                    <View style={styles.recordingControls}>
                        <TouchableOpacity style={styles.cancelButton} onPress={cancelRecording}>
                            <MaterialCommunityIcons name="close" size={24} color="#fff" />
                            <Text style={styles.cancelButtonText}>Cancel</Text>
                        </TouchableOpacity>
                        
                        <TouchableOpacity style={styles.stopButton} onPress={stopRecording}>
                            <MaterialCommunityIcons name="stop" size={32} color="#fff" />
                            <Text style={styles.stopButtonText}>Done</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            )}
            
            {phase === 'PROCESSING' && (
                <View style={styles.processingContainer}>
                    <MaterialCommunityIcons name="loading" size={48} color="#4CAF50" />
                    <Text style={styles.processingText}>Processing recording...</Text>
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    idleContainer: {
        alignItems: 'center',
    },
    startButton: {
        backgroundColor: '#4CAF50',
        width: 150,
        height: 150,
        borderRadius: 75,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#4CAF50',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    startButtonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
        marginTop: 8,
    },
    hintText: {
        color: '#888',
        fontSize: 14,
        textAlign: 'center',
        marginTop: 20,
    },
    countdownContainer: {
        alignItems: 'center',
    },
    countdownText: {
        fontSize: 120,
        fontWeight: 'bold',
        color: '#4CAF50',
    },
    countdownLabel: {
        fontSize: 20,
        color: '#888',
        marginTop: 16,
    },
    recordingContainer: {
        alignItems: 'center',
    },
    recordingIndicator: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: 'rgba(244, 67, 54, 0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    levelContainer: {
        flexDirection: 'row',
        marginTop: 20,
        gap: 4,
    },
    levelBar: {
        width: 8,
        height: 30,
        backgroundColor: '#333',
        borderRadius: 4,
    },
    levelBarActive: {
        backgroundColor: '#4CAF50',
    },
    recordingDuration: {
        fontSize: 48,
        fontWeight: 'bold',
        color: '#fff',
        marginTop: 20,
        fontFamily: 'monospace',
    },
    recordingHint: {
        color: '#888',
        fontSize: 16,
        marginTop: 8,
    },
    recordingControls: {
        flexDirection: 'row',
        marginTop: 32,
        gap: 20,
    },
    cancelButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#333',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 8,
    },
    cancelButtonText: {
        color: '#fff',
        marginLeft: 8,
    },
    stopButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F44336',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 8,
    },
    stopButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '600',
        marginLeft: 8,
    },
    processingContainer: {
        alignItems: 'center',
    },
    processingText: {
        color: '#888',
        fontSize: 16,
        marginTop: 16,
    },
    errorText: {
        color: '#F44336',
        fontSize: 16,
        marginTop: 16,
    },
    permissionButton: {
        backgroundColor: '#2196F3',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 8,
        marginTop: 16,
    },
    permissionButtonText: {
        color: '#fff',
        fontWeight: '600',
    },
});

export default RhythmAudioRecorder;
