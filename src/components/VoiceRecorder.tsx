// Modified src/components/VoiceRecorder.tsx
import React, {useEffect, useState} from 'react';
import {ActivityIndicator, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {SpeechToTextService} from '../services/speech/SpeechToTextService';
import {TokenService} from '../services/speech/TokenService';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

interface VoiceRecorderProps {
    onTranscription: (text: string) => void;
    isActive: boolean;
}

const VoiceRecorder: React.FC<VoiceRecorderProps> = ({ onTranscription, isActive }) => {
    const [sttService, setSTTService] = useState<SpeechToTextService | null>(null);
    const [isRecording, setIsRecording] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isReconnecting, setIsReconnecting] = useState(false);
    const [reconnectAttempt, setReconnectAttempt] = useState(0);

    // Initialize STT service
    useEffect(() => {
        const initializeSTT = async () => {
            try {
                setIsLoading(true);
                setError(null);

                // Get IAM token
                const iamToken = await TokenService.getIAMToken();
                const folderId = TokenService.getFolderId();

                // Create STT service with reconnection handlers
                const service = new SpeechToTextService({
                    iamToken,
                    folderId,
                    onTranscription: (text) => {
                        onTranscription(text);
                        // Reset reconnection UI state on successful transcription
                        setIsReconnecting(false);
                        setReconnectAttempt(0);
                    },
                    onError: (err) => {
                        console.error('STT error:', err);
                        // Only show error if we're not in reconnection state
                        if (!isReconnecting) {
                            setError('Error with speech recognition');
                        }
                    },
                    onReconnecting: (attempt) => {
                        setIsReconnecting(true);
                        setReconnectAttempt(attempt);
                    },
                    onReconnectFailed: () => {
                        setIsReconnecting(false);
                        setReconnectAttempt(0);
                        setError('Connection failed after multiple attempts');
                    },
                    maxReconnectAttempts: 5
                });

                setSTTService(service);
            } catch (err) {
                console.error('Error initializing STT:', err);
                setError('Failed to initialize speech recognition');
            } finally {
                setIsLoading(false);
            }
        };

        if (isActive) {
            initializeSTT();
        }

        // Cleanup
        return () => {
            if (sttService) {
                sttService.cleanup();
            }
        };
    }, [isActive, onTranscription]);

    // Toggle recording
    const toggleRecording = () => {
        if (!sttService) return;

        if (isRecording) {
            sttService.stopRecording();
            setIsRecording(false);
            setIsReconnecting(false);
            setReconnectAttempt(0);
        } else {
            sttService.startRecording();
            setIsRecording(true);
            setError(null);
        }
    };

    if (!isActive) return null;

    if (isLoading) {
        return (
            <View style={styles.container}>
                <ActivityIndicator size="small" color="#4CAF50" />
                <Text style={styles.statusText}>Initializing voice recognition...</Text>
            </View>
        );
    }

    if (error && !isReconnecting) {
        return (
            <View style={styles.container}>
                <MaterialCommunityIcons name="alert-circle" size={24} color="#F44336" />
                <Text style={[styles.statusText, styles.errorText]}>{error}</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <TouchableOpacity
                style={[
                    styles.recordButton,
                    isRecording && !isReconnecting && styles.recordingButton,
                    isReconnecting && styles.reconnectingButton
                ]}
                onPress={toggleRecording}
                disabled={!sttService || isReconnecting}
            >
                {isReconnecting ? (
                    <ActivityIndicator size="small" color="white" />
                ) : (
                    <MaterialCommunityIcons
                        name={isRecording ? "stop" : "microphone"}
                        size={24}
                        color="white"
                    />
                )}
            </TouchableOpacity>
            <Text style={styles.statusText}>
                {isReconnecting
                    ? `Reconnecting (${reconnectAttempt}/5)...`
                    : isRecording
                        ? 'Listening...'
                        : 'Tap to record discussion'}
            </Text>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 8,
        backgroundColor: '#f5f5f5',
        borderRadius: 8,
        margin: 8,
    },
    recordButton: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#4CAF50',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    recordingButton: {
        backgroundColor: '#F44336',
    },
    reconnectingButton: {
        backgroundColor: '#FF9800',
    },
    statusText: {
        fontSize: 14,
        color: '#555',
    },
    errorText: {
        color: '#F44336',
    },
});

export default VoiceRecorder;