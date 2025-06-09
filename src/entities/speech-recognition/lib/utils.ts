// src/entities/speech-recognition/lib/utils.ts
import {SpeechRecognitionConfig, SpeechRecognitionResult} from '../model/types';

export const validateSpeechConfig = (config: SpeechRecognitionConfig): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];

    if (config.recognition?.maxDuration && config.recognition.maxDuration <= 0) {
        errors.push('Max duration must be greater than 0');
    }

    if (config.audio?.sampleRate && config.audio.sampleRate < 8000) {
        errors.push('Sample rate must be at least 8000 Hz');
    }

    if (config.webSocket?.url && !isValidUrl(config.webSocket.url)) {
        errors.push('Invalid WebSocket URL');
    }

    return {
        isValid: errors.length === 0,
        errors,
    };
};

export const formatRecognitionResult = (result: SpeechRecognitionResult): string => {
    const { text, confidence, isFinal } = result;

    if (isFinal) {
        return text.trim();
    }

    // Add visual indicator for interim results
    return `${text.trim()}${confidence > 0.8 ? '' : '...'}`;
};

export const calculateSpeechQuality = (result: SpeechRecognitionResult): number => {
    const { confidence, text, alternatives = [] } = result;

    // Base quality on confidence
    let quality = confidence;

    // Bonus for longer, coherent text
    if (text.length > 10) {
        quality += 0.1;
    }

    // Bonus for having alternatives (indicates good processing)
    if (alternatives.length > 0) {
        quality += 0.05;
    }

    return Math.min(1, quality);
};

export const isValidUrl = (url: string): boolean => {
    try {
        new URL(url);
        return true;
    } catch {
        return false;
    }
};

export const normalizeText = (text: string): string => {
    return text
        .toLowerCase()
        .trim()
        .replace(/[^\w\s]/g, '')
        .replace(/\s+/g, ' ');
};

export const calculateSimilarity = (text1: string, text2: string): number => {
    const normalized1 = normalizeText(text1);
    const normalized2 = normalizeText(text2);

    if (normalized1 === normalized2) return 1;

    const distance = levenshteinDistance(normalized1, normalized2);
    const maxLength = Math.max(normalized1.length, normalized2.length);

    return maxLength === 0 ? 0 : 1 - distance / maxLength;
};

const levenshteinDistance = (a: string, b: string): number => {
    if (a.length === 0) return b.length;
    if (b.length === 0) return a.length;

    const matrix = [];

    for (let i = 0; i <= b.length; i++) {
        matrix[i] = [i];
    }

    for (let j = 0; j <= a.length; j++) {
        matrix[0][j] = j;
    }

    for (let i = 1; i <= b.length; i++) {
        for (let j = 1; j <= a.length; j++) {
            if (b.charAt(i - 1) === a.charAt(j - 1)) {
                matrix[i][j] = matrix[i - 1][j - 1];
            } else {
                matrix[i][j] = Math.min(
                    matrix[i - 1][j - 1] + 1,
                    matrix[i][j - 1] + 1,
                    matrix[i - 1][j] + 1
                );
            }
        }
    }

    return matrix[b.length][a.length];
};