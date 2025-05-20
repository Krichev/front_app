// src/config/SpeechConfig.ts
export const SPEECH_CONFIG = {
    // For development (Android emulator)
    DEV_SERVER_URL: 'http://10.0.2.2:8080/api/speech/recognize',

    // For development (iOS simulator)
    IOS_DEV_SERVER_URL: 'http://localhost:8080/api/speech/recognize',

    // For production
    PROD_SERVER_URL: 'https://your-production-server.com/api/speech/recognize',

    // For real device testing
    DEVICE_SERVER_URL: 'http://192.168.1.100:8080/api/speech/recognize', // Replace with your local IP

    DEFAULT_LANGUAGE: 'en-US',
    MAX_RECORDING_DURATION: 10000, // 10 seconds
    SAMPLE_RATE: 16000,
};

// Helper function to get the appropriate server URL
export function getServerUrl(): string {
    if (__DEV__) {
        // Development mode
        const Platform = require('react-native').Platform;
        return Platform.OS === 'ios' ? SPEECH_CONFIG.IOS_DEV_SERVER_URL : SPEECH_CONFIG.DEV_SERVER_URL;
    } else {
        // Production mode
        return SPEECH_CONFIG.PROD_SERVER_URL;
    }
}