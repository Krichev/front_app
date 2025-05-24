// src/components/VoiceRecorder.tsx
import React, {useEffect, useState} from 'react';
import {ActivityIndicator, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {speechEvents, useStreamingSpeechRecognition} from '../services/speech/StreamingSpeechRecognitionService';

interface VoiceRecorderProps {
    onTranscription: (text: string) => void;
    isActive?: boolean;
    language?: string;
    maxDuration?: number;
    buttonSize?: number;
    showTranscription?: boolean;
    customStyles?: {
        container?: object;
        button?: object;
        activeButton?: object;
        transcriptionContainer?: object;
        transcriptionText?: object;
    };
}

const VoiceRecorder: React.FC<VoiceRecorderProps> = ({
                                                         onTranscription,
                                                         isActive = false,
                                                         language = 'en-US',
                                                         maxDuration = 60,
                                                         buttonSize = 60,
                                                         showTranscription = false,
                                                         customStyles = {},
                                                     }) => {
    const [transcription, setTranscription] = useState('');
    const [isInitializing, setIsInitializing] = useState(true);
    const [isListening, setIsListening] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [recordingTime, setRecordingTime] = useState(0);
    const [visualFeedback, setVisualFeedback] = useState(0);

    // Initialize the speech recognition service
    const { startRecording, stopRecording, isRecording } = useStreamingSpeechRecognition(
        (result) => {
            // Update transcription state
            setTranscription(result.text);

            // Call the parent component's callback
            if (result.text.trim()) {
                onTranscription(result.text);
            }

            // Update visual feedback based on confidence
            if (result.confidence) {
                setVisualFeedback(result.confidence);
            }
        },
        (error) => {
            console.error('Speech recognition error:', error);
            setError(error.message || 'Speech recognition error');
        },
        {
            language: language,
            maxDuration: maxDuration,
            autoReconnect: true,
        }
    );

    // Setup effect for initialization state
    useEffect(() => {
        const initTimeout = setTimeout(() => {
            setIsInitializing(false);
        }, 1000);

        // Listen for initialization events
        const onInitialized = () => {
            setIsInitializing(false);
            clearTimeout(initTimeout);
        };

        speechEvents.on('initialized', onInitialized);

        // Cleanup
        return () => {
            clearTimeout(initTimeout);
            speechEvents.off('initialized', onInitialized);
        };
    }, []);

    // Effect for automatic recording when isActive changes
    useEffect(() => {
        if (isActive && !isListening && !isInitializing) {
            handleStartRecording();
        } else if (!isActive && isListening) {
            handleStopRecording();
        }
    }, [isActive, isInitializing]);

    // Setup recording timer
    useEffect(() => {
        let interval: NodeJS.Timeout | null = null;

        if (isListening) {
            interval = setInterval(() => {
                setRecordingTime((prevTime) => prevTime + 1);
            }, 1000);
        } else if (!isListening) {
            setRecordingTime(0);
        }

        return () => {
            if (interval) {
                clearInterval(interval);
            }
        };
    }, [isListening]);

    // Handle start recording
    const handleStartRecording = async () => {
        try {
            setError(null);
            const started = await startRecording();
            if (started) {
                setIsListening(true);
            } else {
                setError('Failed to start recording');
            }
        } catch (err) {
            setError('Error starting recording');
            console.error('Error starting recording:', err);
        }
    };

    // Handle stop recording
    const handleStopRecording = () => {
        try {
            stopRecording();
            setIsListening(false);
        } catch (err) {
            console.error('Error stopping recording:', err);
        }
    };

    // Toggle recording state
    const toggleRecording = () => {
        if (isListening) {
            handleStopRecording();
        } else {
            handleStartRecording();
        }
    };

    // Format recording time
    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    // Calculate button size based on visual feedback
    const getButtonSize = () => {
        // Scale between 0.8 and 1.2 of the original size based on confidence
        const scaleFactor = 0.8 + (visualFeedback * 0.4);
        return buttonSize * scaleFactor;
    };

    return (
        <View style={[styles.container, customStyles.container]}>
            {/* Recording button */}
            <TouchableOpacity
                onPress={toggleRecording}
                disabled={isInitializing}
                style={[
                    styles.recordButton,
                    isListening && styles.recordingButton,
                    customStyles.button,
                    isListening && customStyles.activeButton,
                    {
                        width: getButtonSize(),
                        height: getButtonSize(),
                        borderRadius: getButtonSize() / 2,
                    },
                ]}
            >
                {isInitializing ? (
                    <ActivityIndicator color="white" size="small" />
                ) : isListening ? (
                    <MaterialCommunityIcons name="stop" size={buttonSize / 2} color="white" />
                ) : (
                    <MaterialCommunityIcons name="microphone" size={buttonSize / 2} color="white" />
                )}
            </TouchableOpacity>

            {/* Recording timer */}
            {isListening && (
                <Text style={styles.timerText}>{formatTime(recordingTime)}</Text>
            )}

            {/* Show error if any */}
            {error && <Text style={styles.errorText}>{error}</Text>}

            {/* Show transcription if enabled */}
            {showTranscription && transcription && (
                <View style={[styles.transcriptionContainer, customStyles.transcriptionContainer]}>
                    <Text style={[styles.transcriptionText, customStyles.transcriptionText]}>
                        {transcription}
                    </Text>
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: 10,
    },
    recordButton: {
        backgroundColor: '#4CAF50',
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 3,
    },
    recordingButton: {
        backgroundColor: '#F44336',
        transform: [{ scale: 1.1 }],
    },
    timerText: {
        marginTop: 8,
        fontSize: 14,
        color: '#555',
        fontWeight: '500',
    },
    transcriptionContainer: {
        backgroundColor: '#f0f0f0',
        padding: 10,
        borderRadius: 8,
        marginTop: 10,
        width: '100%',
    },
    transcriptionText: {
        fontSize: 14,
        color: '#333',
    },
    errorText: {
        color: '#F44336',
        marginTop: 8,
        fontSize: 12,
    },
});

export default VoiceRecorder;