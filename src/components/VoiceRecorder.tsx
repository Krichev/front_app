// Modified src/components/VoiceRecorder.tsx with Russian language support
import React, {useEffect, useState} from 'react';
import {ActivityIndicator, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import AudioRecord from 'react-native-audio-record';
import axios from 'axios';

interface VoiceRecorderProps {
    onTranscription: (text: string) => void;
    isActive: boolean;
    language?: 'en' | 'ru'; // Add language prop
    onLanguageToggle?: () => void; // Optional callback for language toggle
}

const VoiceRecorder: React.FC<VoiceRecorderProps> = ({
                                                         onTranscription,
                                                         isActive,
                                                         language = 'en', // Default to English
                                                         onLanguageToggle
                                                     }) => {
    const [isRecording, setIsRecording] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isReconnecting, setIsReconnecting] = useState(false);
    const [reconnectAttempt, setReconnectAttempt] = useState(0);
    const [audioData, setAudioData] = useState<string | null>(null);

    // API endpoint for your Java backend
    const API_ENDPOINT = 'http://your-server-address/api/speech-to-text';

    // Initialize audio recording
    useEffect(() => {
        const setupAudioRecording = async () => {
            if (!isActive) return;

            try {
                // Configure audio recording
                const options = {
                    sampleRate: 16000,
                    channels: 1,
                    bitsPerSample: 16,
                    audioSource: 6, // MIC source
                    wavFile: '', // No file saving (streaming only)
                };

                await AudioRecord.init(options);

                // Set up data handler
                AudioRecord.on('data', (data) => {
                    // Store the latest audio data
                    setAudioData(data);
                });

                setError(null);
            } catch (err) {
                console.error('Error initializing audio recording:', err);
                setError('Failed to initialize audio recording');
            }
        };

        setupAudioRecording();

        // Cleanup
        return () => {
            if (isRecording) {
                AudioRecord.stop();
            }
        };
    }, [isActive]);

    // Toggle recording
    const toggleRecording = async () => {
        if (isRecording) {
            // Stop recording
            AudioRecord.stop();
            setIsRecording(false);
            setIsProcessing(true);

            // Send the recorded audio to the backend for processing
            if (audioData) {
                try {
                    // Send to your Java backend with language parameter
                    const response = await axios.post(API_ENDPOINT, {
                        audioData: audioData,
                        language: language === 'en' ? 'en-US' : 'ru-RU', // Specify language
                        format: 'raw' // Or whatever format your backend expects
                    });

                    // Process the transcription result
                    if (response.data && response.data.transcription) {
                        onTranscription(response.data.transcription);
                    } else {
                        setError('No transcription received');
                    }
                } catch (err) {
                    console.error('Error sending audio to backend:', err);
                    setError('Failed to process speech');
                } finally {
                    setIsProcessing(false);
                    setAudioData(null); // Clear the audio data
                }
            } else {
                setIsProcessing(false);
                setError('No audio data captured');
            }
        } else {
            // Start recording
            try {
                setError(null);
                await AudioRecord.start();
                setIsRecording(true);
            } catch (err) {
                console.error('Error starting recording:', err);
                setError('Failed to start recording');
            }
        }
    };

    // Get colors based on language
    const getLanguageColor = () => {
        if (isRecording) return '#F44336'; // Red when recording for both languages
        return language === 'en' ? '#4CAF50' : '#2196F3'; // Green for English, Blue for Russian
    };

    if (!isActive) return null;

    return (
        <View style={styles.container}>
            <View style={styles.recordControls}>
                <TouchableOpacity
                    style={[
                        styles.recordButton,
                        { backgroundColor: getLanguageColor() },
                        isRecording && styles.recordingButton,
                        isProcessing && styles.processingButton
                    ]}
                    onPress={toggleRecording}
                    disabled={isProcessing}
                >
                    {isProcessing ? (
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
                    {isProcessing
                        ? `Processing speech...`
                        : isRecording
                            ? `Recording in ${language === 'en' ? 'English' : 'Russian'}...`
                            : `Tap to record ${language === 'en' ? 'English' : 'Russian'}`}
                </Text>
            </View>

            {/* Language toggle button */}
            {onLanguageToggle && (
                <TouchableOpacity
                    style={[styles.languageButton, { backgroundColor: getLanguageColor() }]}
                    onPress={onLanguageToggle}
                    disabled={isRecording || isProcessing}
                >
                    <Text style={styles.languageButtonText}>
                        {language === 'en' ? 'EN' : 'RU'}
                    </Text>
                </TouchableOpacity>
            )}

            {error && (
                <Text style={styles.errorText}>{error}</Text>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'column',
        padding: 8,
        backgroundColor: '#f5f5f5',
        borderRadius: 8,
        margin: 8,
    },
    recordControls: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    recordButton: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    recordingButton: {
        backgroundColor: '#F44336',
    },
    processingButton: {
        backgroundColor: '#FF9800',
    },
    statusText: {
        fontSize: 14,
        color: '#555',
        flex: 1,
    },
    errorText: {
        color: '#F44336',
        fontSize: 12,
        marginTop: 8,
    },
    languageButton: {
        paddingVertical: 6,
        paddingHorizontal: 10,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        alignSelf: 'flex-end',
        marginTop: 8,
    },
    languageButtonText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 12,
    },
});

export default VoiceRecorder;