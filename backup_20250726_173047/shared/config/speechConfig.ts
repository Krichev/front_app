// src/shared/config/speechConfig.ts
// Update to export the config properly for the entities
export const speechConfigV2 = {
    getConfig: () => ({
        recognition: {
            language: 'en-US',
            maxDuration: 300,
            continuous: true,
            interimResults: true,
        },
        audio: {
            sampleRate: 16000,
            channels: 1,
            encoding: 'LINEAR16',
        },
        webSocket: {
            url: 'wss://your-speech-service.com/ws',
            reconnectAttempts: 3,
            reconnectInterval: 5000,
        },
    }),
};