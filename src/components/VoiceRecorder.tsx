// src/components/VoiceRecorder.tsx
import React, {useEffect, useRef, useState} from 'react';
import {ActivityIndicator, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {WebSocketSpeechService} from '../services/speech/WebSocketSpeechService';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

interface VoiceRecorderProps {
    onTranscription: (text: string) => void;
    isActive?: boolean;
    serverUrl?: string;
}

const VoiceRecorder: React.FC<VoiceRecorderProps> = ({
                                                         onTranscription,
                                                         isActive = true,
                                                         serverUrl = 'ws://your-java-backend-url:8080/speech'  // Your WebSocket endpoint
                                                     }) => {
    const [isRecording, setIsRecording] = useState(false);
    const [isConnected, setIsConnected] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const speechService = useRef<WebSocketSpeechService | null>(null);

    // Initialize the speech service
    useEffect(() => {
        if (!speechService.current && isActive) {
            speechService.current = new WebSocketSpeechService({
                serverUrl,
                onTranscription: (text) => {
                    onTranscription(text);
                },
                onError: (err) => {
                    console.error('Speech recognition error:', err);
                    setError('Speech recognition error. Please try again.');
                    setIsRecording(false);
                },
                onConnectionChange: (connected) => {
                    setIsConnected(connected);
                }
            });

            // Connect to the WebSocket server
            speechService.current.connect();
        }

        return () => {
            if (speechService.current) {
                speechService.current.disconnect();
                speechService.current = null;
            }
        };
    }, [isActive, onTranscription, serverUrl]);

    const toggleRecording = () => {
        if (!speechService.current) return;

        if (isRecording) {
            speechService.current.stopRecording();
            setIsRecording(false);
        } else {
            if (isConnected) {
                const started = speechService.current.startRecording();
                setIsRecording(started);
                setError(null);
            } else {
                setError('Not connected to speech server. Please wait...');
                // Try to reconnect
                speechService.current.connect();
            }
        }
    };

    if (!isActive) return null;

    return (
        <View style={styles.container}>
            <TouchableOpacity
                style={[
                    styles.recordButton,
                    isRecording ? styles.recordingButton : styles.notRecordingButton,
                    !isConnected && styles.disabledButton
                ]}
                onPress={toggleRecording}
                disabled={!isConnected}
            >
                {isConnected ? (
                    <MaterialCommunityIcons
                        name={isRecording ? 'stop' : 'microphone'}
                        size={24}
                        color="white"
                    />
                ) : (
                    <ActivityIndicator size="small" color="white" />
                )}
                <Text style={styles.buttonText}>
                    {isRecording ? 'Stop' : isConnected ? 'Record' : 'Connecting...'}
                </Text>
            </TouchableOpacity>

            {error && (
                <Text style={styles.errorText}>{error}</Text>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        marginVertical: 10,
    },
    recordButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 25,
        elevation: 2,
    },
    recordingButton: {
        backgroundColor: '#F44336',
    },
    notRecordingButton: {
        backgroundColor: '#4CAF50',
    },
    disabledButton: {
        backgroundColor: '#AAAAAA',
    },
    buttonText: {
        color: 'white',
        marginLeft: 8,
        fontWeight: 'bold',
    },
    errorText: {
        color: '#F44336',
        marginTop: 8,
        textAlign: 'center',
    },
});

export default VoiceRecorder;