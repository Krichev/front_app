// src/components/VoiceRecorderV2.tsx For streaming mode
import React, {useCallback, useEffect, useRef, useState} from 'react';
import {Alert, Animated, StyleSheet, Text, TouchableOpacity, View,} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {SpeechRecognitionFactory} from '../services/speech/SpeechRecognitionFactory';
import {SpeechRecognitionConfig, SpeechRecognitionService} from '../services/speech/SpeechRecognitionInterface';

interface VoiceRecorderV2Props {
    onTranscription: (text: string) => void;
    onPartialTranscription?: (text: string) => void; // For streaming mode
    onError?: (error: string) => void;
    isActive?: boolean;
    maxRecordingDuration?: number;
    serverUrl?: string;
    language?: string;
    mode?: 'streaming' | 'file-upload' | 'auto'; // Auto selects based on use case
    useCase?: 'real-time' | 'final-answer' | 'discussion';
    allowModeSwitch?: boolean; // Allow user to switch modes
    // WebSocket specific props
    iamToken?: string;
    folderId?: string;
}

const VoiceRecorderV2: React.FC<VoiceRecorderV2Props> = ({
                                                             onTranscription,
                                                             onPartialTranscription,
                                                             onError,
                                                             isActive = true,
                                                             maxRecordingDuration = 10000,
                                                             serverUrl = 'http://10.0.2.2:8080/api/speech/recognize',
                                                             language = 'en-US',
                                                             mode = 'auto',
                                                             useCase = 'discussion',
                                                             allowModeSwitch = false,
                                                             iamToken,
                                                             folderId,
                                                         }) => {
    const [actualMode, setActualMode] = useState<'streaming' | 'file-upload'>(() => {
        if (mode === 'auto') {
            const recommended = SpeechRecognitionFactory.getRecommendedConfig(useCase);
            return recommended.mode || 'file-upload';
        }
        return mode;
    });

    const [isRecording, setIsRecording] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isInitialized, setIsInitialized] = useState(false);
    const [recordingDuration, setRecordingDuration] = useState(0);
    const [lastTranscription, setLastTranscription] = useState<string>('');
    const [partialText, setPartialText] = useState<string>('');

    const speechService = useRef<SpeechRecognitionService | null>(null);
    const durationInterval = useRef<NodeJS.Timeout | null>(null);
    const recordingTimeout = useRef<NodeJS.Timeout | null>(null);
    const pulseAnimation = useRef(new Animated.Value(1)).current;

    // Initialize speech service
    useEffect(() => {
        const initializeService = async () => {
            try {
                // Clean up existing service
                if (speechService.current) {
                    await speechService.current.cleanup();
                }

                // Create configuration
                const config: SpeechRecognitionConfig = {
                    mode: actualMode,
                    serverUrl,
                    language,
                    sampleRate: 16000,
                    quality: 'medium',
                    maxRecordingDuration,
                    iamToken,
                    folderId,
                };

                // Create events based on mode
                const events = actualMode === 'streaming'
                    ? {
                        onPartialTranscription: (text: string) => {
                            setPartialText(text);
                            if (onPartialTranscription) {
                                onPartialTranscription(text);
                            }
                        },
                        onFinalTranscription: (text: string) => {
                            setLastTranscription(text);
                            setPartialText('');
                            onTranscription(text);
                        },
                        onError: (error: string) => {
                            console.error('Streaming error:', error);
                            if (onError) onError(error);
                        },
                        onReconnecting: (attempt: number) => {
                            console.log(`Reconnecting attempt ${attempt}`);
                        },
                        onReconnectFailed: () => {
                            if (onError) onError('Failed to reconnect to server');
                        },
                    }
                    : {
                        onTranscription: (text: string) => {
                            setLastTranscription(text);
                            onTranscription(text);
                        },
                        onError: (error: string) => {
                            console.error('File upload error:', error);
                            if (onError) onError(error);
                        },
                        onProcessingStart: () => {
                            setIsProcessing(true);
                        },
                        onProcessingEnd: () => {
                            setIsProcessing(false);
                        },
                    };

                // Create service
                speechService.current = SpeechRecognitionFactory.createService(config, events);

                // Initialize
                const initialized = await speechService.current.initialize();
                setIsInitialized(initialized);

                if (!initialized && onError) {
                    onError('Failed to initialize speech recognition');
                }
            } catch (error) {
                console.error('Failed to initialize speech service:', error);
                if (onError) {
                    onError(`Failed to initialize: ${error instanceof Error ? error.message : 'Unknown error'}`);
                }
            }
        };

        initializeService();

        return () => {
            cleanup();
        };
    }, [actualMode, serverUrl, language, maxRecordingDuration, iamToken, folderId]);

    // Pulse animation for recording indicator
    useEffect(() => {
        if (isRecording) {
            const pulse = () => {
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
                ]).start(pulse);
            };
            pulse();
        } else {
            pulseAnimation.stopAnimation();
            pulseAnimation.setValue(1);
        }
    }, [isRecording, pulseAnimation]);

    // Duration tracking
    useEffect(() => {
        if (isRecording) {
            setRecordingDuration(0);
            durationInterval.current = setInterval(() => {
                setRecordingDuration(prev => prev + 100);
            }, 100);

            // Auto-stop recording after max duration for file mode
            if (actualMode === 'file-upload') {
                recordingTimeout.current = setTimeout(() => {
                    if (isRecording) {
                        handleStopRecording();
                    }
                }, maxRecordingDuration);
            }
        } else {
            if (durationInterval.current) {
                clearInterval(durationInterval.current);
                durationInterval.current = null;
            }
            if (recordingTimeout.current) {
                clearTimeout(recordingTimeout.current);
                recordingTimeout.current = null;
            }
        }

        return () => {
            if (durationInterval.current) clearInterval(durationInterval.current);
            if (recordingTimeout.current) clearTimeout(recordingTimeout.current);
        };
    }, [isRecording, maxRecordingDuration, actualMode]);

    const cleanup = useCallback(async () => {
        if (speechService.current) {
            await speechService.current.cleanup();
        }
        if (durationInterval.current) clearInterval(durationInterval.current);
        if (recordingTimeout.current) clearTimeout(recordingTimeout.current);
    }, []);

    const handleStartRecording = useCallback(async () => {
        if (!isInitialized || !speechService.current || isRecording || isProcessing) {
            return;
        }

        try {
            await speechService.current.startRecording();
            setIsRecording(true);
            setLastTranscription('');
            setPartialText('');
        } catch (error) {
            console.error('Failed to start recording:', error);
            if (onError) {
                onError(`Failed to start recording: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
        }
    }, [isInitialized, isRecording, isProcessing, onError]);

    const handleStopRecording = useCallback(async () => {
        if (!speechService.current || !isRecording) {
            return;
        }

        try {
            setIsRecording(false);
            await speechService.current.stopRecording();
        } catch (error) {
            console.error('Failed to stop recording:', error);
            if (onError) {
                onError(`Failed to stop recording: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
        } finally {
            setRecordingDuration(0);
        }
    }, [isRecording, onError]);

    const handleToggleRecording = useCallback(() => {
        if (isRecording) {
            handleStopRecording();
        } else {
            handleStartRecording();
        }
    }, [isRecording, handleStartRecording, handleStopRecording]);

    const handleModeSwitch = useCallback((newMode: 'streaming' | 'file-upload') => {
        if (isRecording) {
            Alert.alert('Cannot Switch', 'Please stop recording before switching modes');
            return;
        }
        setActualMode(newMode);
    }, [isRecording]);

    // Format duration for display
    const formatDuration = (ms: number): string => {
        const seconds = Math.floor(ms / 1000);
        const centiseconds = Math.floor((ms % 1000) / 10);
        return `${seconds}.${centiseconds.toString().padStart(2, '0')}s`;
    };

    const getModeIcon = (mode: 'streaming' | 'file-upload') => {
        return mode === 'streaming' ? 'radio-tower' : 'file-upload';
    };

    const getModeLabel = (mode: 'streaming' | 'file-upload') => {
        return mode === 'streaming' ? 'Real-time' : 'File Upload';
    };

    if (!isActive) {
        return null;
    }

    return (
        <View style={styles.container}>
            {/* Mode selector */}
            {allowModeSwitch && (
                <View style={styles.modeSelector}>
                    <Text style={styles.modeSelectorLabel}>Recognition Mode:</Text>
                    <View style={styles.modeButtons}>
                        <TouchableOpacity
                            style={[
                                styles.modeButton,
                                actualMode === 'streaming' && styles.activeModeButton,
                                isRecording && styles.disabledButton,
                            ]}
                            onPress={() => handleModeSwitch('streaming')}
                            disabled={isRecording}
                        >
                            <MaterialCommunityIcons
                                name="radio-tower"
                                size={16}
                                color={actualMode === 'streaming' ? '#fff' : '#666'}
                            />
                            <Text style={[
                                styles.modeButtonText,
                                actualMode === 'streaming' && styles.activeModeButtonText,
                            ]}>
                                Real-time
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[
                                styles.modeButton,
                                actualMode === 'file-upload' && styles.activeModeButton,
                                isRecording && styles.disabledButton,
                            ]}
                            onPress={() => handleModeSwitch('file-upload')}
                            disabled={isRecording}
                        >
                            <MaterialCommunityIcons
                                name="file-upload"
                                size={16}
                                color={actualMode === 'file-upload' ? '#fff' : '#666'}
                            />
                            <Text style={[
                                styles.modeButtonText,
                                actualMode === 'file-upload' && styles.activeModeButtonText,
                            ]}>
                                File Upload
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            )}

            {/* Current mode indicator */}
            <View style={styles.modeIndicator}>
                <MaterialCommunityIcons
                    name={getModeIcon(actualMode)}
                    size={16}
                    color="#666"
                />
                <Text style={styles.modeIndicatorText}>
                    {getModeLabel(actualMode)} Mode
                </Text>
            </View>

            {/* Recording controls */}
            <View style={styles.controls}>
                <Animated.View style={[styles.recordButtonContainer, {transform: [{scale: pulseAnimation}]}]}>
                    <TouchableOpacity
                        style={[
                            styles.recordButton,
                            isRecording ? styles.recordingButton : styles.idleButton,
                            (isProcessing || !isInitialized) && styles.disabledButton,
                        ]}
                        onPress={handleToggleRecording}
                        disabled={isProcessing || !isInitialized}
                    >
                        {isProcessing ? (
                            <MaterialCommunityIcons name="cog" size={24} color="white" />
                        ) : (
                            <MaterialCommunityIcons
                                name={isRecording ? "stop" : "microphone"}
                                size={24}
                                color="white"
                            />
                        )}
                    </TouchableOpacity>
                </Animated.View>
            </View>

            {/* Status display */}
            <View style={styles.statusContainer}>
                {isRecording && (
                    <View style={styles.recordingStatus}>
                        <Text style={styles.recordingText}>
                            🔴 {actualMode === 'streaming' ? 'Streaming' : 'Recording'}: {formatDuration(recordingDuration)}
                        </Text>
                        {actualMode === 'file-upload' && (
                            <Text style={styles.maxDurationText}>
                                Max: {formatDuration(maxRecordingDuration)}
                            </Text>
                        )}
                    </View>
                )}

                {isProcessing && (
                    <Text style={styles.processingText}>
                        🔄 Processing audio...
                    </Text>
                )}

                {!isInitialized && (
                    <Text style={styles.initializingText}>
                        🎤 Initializing...
                    </Text>
                )}
            </View>

            {/* Transcription display */}
            {(partialText || lastTranscription) && !isProcessing && (
                <View style={styles.transcriptionContainer}>
                    {partialText && actualMode === 'streaming' && (
                        <View style={styles.partialTranscription}>
                            <Text style={styles.transcriptionLabel}>Live transcription:</Text>
                            <Text style={[styles.transcriptionText, styles.partialText]}>{partialText}</Text>
                        </View>
                    )}

                    {lastTranscription && (
                        <View style={styles.finalTranscription}>
                            <Text style={styles.transcriptionLabel}>
                                {actualMode === 'streaming' ? 'Final result:' : 'Recognized:'}
                            </Text>
                            <Text style={styles.transcriptionText}>{lastTranscription}</Text>
                        </View>
                    )}
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
    modeSelector: {
        marginBottom: 16,
        width: '100%',
    },
    modeSelectorLabel: {
        fontSize: 14,
        color: '#666',
        marginBottom: 8,
        textAlign: 'center',
    },
    modeButtons: {
        flexDirection: 'row',
        justifyContent: 'center',
    },
    modeButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 8,
        marginHorizontal: 4,
        borderRadius: 20,
        backgroundColor: '#f0f0f0',
    },
    activeModeButton: {
        backgroundColor: '#4CAF50',
    },
    modeButtonText: {
        marginLeft: 4,
        fontSize: 12,
        color: '#666',
    },
    activeModeButtonText: {
        color: 'white',
        fontWeight: 'bold',
    },
    modeIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    modeIndicatorText: {
        marginLeft: 4,
        fontSize: 12,
        color: '#666',
    },
    controls: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    recordButtonContainer: {
        // Keep existing styles
    },
    recordButton: {
        width: 60,
        height: 60,
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 2},
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
    idleButton: {
        backgroundColor: '#4CAF50',
    },
    recordingButton: {
        backgroundColor: '#F44336',
    },
    disabledButton: {
        backgroundColor: '#BDBDBD',
        opacity: 0.6,
    },
    statusContainer: {
        minHeight: 40,
        justifyContent: 'center',
    },
    recordingStatus: {
        alignItems: 'center',
    },
    recordingText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#F44336',
    },
    maxDurationText: {
        fontSize: 12,
        color: '#757575',
        marginTop: 2,
    },
    processingText: {
        fontSize: 14,
        color: '#FF9800',
        fontWeight: '500',
        textAlign: 'center',
    },
    initializingText: {
        fontSize: 14,
        color: '#757575',
        textAlign: 'center',
    },
    transcriptionContainer: {
        marginTop: 16,
        width: '100%',
    },
    partialTranscription: {
        padding: 12,
        backgroundColor: '#fff9c4',
        borderRadius: 8,
        marginBottom: 8,
        borderLeftWidth: 3,
        borderLeftColor: '#FF9800',
    },
    finalTranscription: {
        padding: 12,
        backgroundColor: '#f5f5f5',
        borderRadius: 8,
        borderLeftWidth: 3,
        borderLeftColor: '#4CAF50',
    },
    transcriptionLabel: {
        fontSize: 12,
        color: '#757575',
        marginBottom: 4,
    },
    transcriptionText: {
        fontSize: 14,
        color: '#333',
    },
    partialText: {
        fontStyle: 'italic',
        color: '#666',
    },
});

export default VoiceRecorderV2;