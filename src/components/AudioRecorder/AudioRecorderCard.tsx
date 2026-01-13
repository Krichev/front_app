// src/components/AudioRecorder/AudioRecorderCard.tsx
import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAudioRecorder } from '../../hooks/useAudioRecorder';

interface AudioRecorderCardProps {
    onRecordingComplete: (path: string, duration: number) => void;
    onDelete?: () => void;
    initialAudioPath?: string | null;
}

export const AudioRecorderCard: React.FC<AudioRecorderCardProps> = ({
    onRecordingComplete,
    onDelete,
    initialAudioPath
}) => {
    const {
        startRecording,
        stopRecording,
        isRecording,
        duration,
        audioPath,
        playAudio,
        stopPlayback,
        isPlaying,
        resetRecording,
        hasPermission,
        initializeRecorder
    } = useAudioRecorder();

    // Pulse animation for recording state
    const pulseAnim = React.useRef(new Animated.Value(1)).current;

    useEffect(() => {
        initializeRecorder();
    }, [initializeRecorder]);

    useEffect(() => {
        if (isRecording) {
            Animated.loop(
                Animated.sequence([
                    Animated.timing(pulseAnim, {
                        toValue: 1.2,
                        duration: 1000,
                        useNativeDriver: true,
                    }),
                    Animated.timing(pulseAnim, {
                        toValue: 1,
                        duration: 1000,
                        useNativeDriver: true,
                    }),
                ])
            ).start();
        } else {
            pulseAnim.setValue(1);
        }
    }, [isRecording, pulseAnim]);

    const handleStop = async () => {
        const path = await stopRecording();
        if (path) {
            onRecordingComplete(path, duration);
        }
    };

    const handleReset = () => {
        resetRecording();
        if (onDelete) onDelete();
    };

    const formatDuration = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    // If we have a recording (either just recorded or initial)
    const currentPath = audioPath || initialAudioPath;
    const showPlayer = !!currentPath && !isRecording;

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Reference Audio</Text>
            
            <View style={styles.cardContent}>
                {showPlayer ? (
                    <View style={styles.playerContainer}>
                        <View style={styles.playbackInfo}>
                            <MaterialCommunityIcons name="file-music" size={32} color="#4CAF50" />
                            <Text style={styles.durationText}>
                                {duration > 0 ? formatDuration(duration) : 'Audio Recorded'}
                            </Text>
                        </View>
                        
                        <View style={styles.controlsRow}>
                            <TouchableOpacity 
                                style={styles.playButton} 
                                onPress={isPlaying ? stopPlayback : playAudio}
                            >
                                <MaterialCommunityIcons 
                                    name={isPlaying ? "stop" : "play"} 
                                    size={32} 
                                    color="#007AFF" 
                                />
                            </TouchableOpacity>
                            
                            <TouchableOpacity 
                                style={styles.deleteButton} 
                                onPress={handleReset}
                            >
                                <MaterialCommunityIcons name="delete" size={24} color="#FF3B30" />
                            </TouchableOpacity>
                        </View>
                    </View>
                ) : (
                    <View style={styles.recorderContainer}>
                        <View style={styles.timerContainer}>
                            <Text style={styles.timerText}>{formatDuration(duration)}</Text>
                        </View>
                        
                        <TouchableOpacity
                            onPress={isRecording ? handleStop : startRecording}
                            disabled={!hasPermission}
                            style={styles.recordButtonWrapper}
                        >
                            <Animated.View style={[
                                styles.recordButton, 
                                isRecording ? styles.recording : styles.idle,
                                { transform: [{ scale: pulseAnim }] }
                            ]}>
                                <MaterialCommunityIcons 
                                    name={isRecording ? "stop" : "microphone"} 
                                    size={32} 
                                    color="white" 
                                />
                            </Animated.View>
                        </TouchableOpacity>
                        
                        <Text style={styles.statusText}>
                            {isRecording ? 'Recording...' : 'Tap to Record'}
                        </Text>
                    </View>
                )}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: 24,
    },
    title: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 12,
    },
    cardContent: {
        backgroundColor: '#F5F5F5',
        borderRadius: 12,
        padding: 16,
        borderWidth: 1,
        borderColor: '#E0E0E0',
    },
    recorderContainer: {
        alignItems: 'center',
        paddingVertical: 8,
    },
    timerContainer: {
        marginBottom: 16,
    },
    timerText: {
        fontSize: 24,
        fontWeight: '700',
        color: '#333',
        fontVariant: ['tabular-nums'],
    },
    recordButtonWrapper: {
        marginBottom: 12,
    },
    recordButton: {
        width: 72,
        height: 72,
        borderRadius: 36,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
    },
    idle: {
        backgroundColor: '#FF3B30',
    },
    recording: {
        backgroundColor: '#D32F2F',
    },
    statusText: {
        fontSize: 14,
        color: '#666',
    },
    playerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    playbackInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    durationText: {
        fontSize: 16,
        fontWeight: '500',
        color: '#333',
    },
    controlsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    playButton: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#E3F2FD',
        justifyContent: 'center',
        alignItems: 'center',
    },
    deleteButton: {
        padding: 8,
    },
});
