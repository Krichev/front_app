// src/services/speech/SpeechAPIAdapter.ts
// Adapter to handle different speech-to-text API response formats

export interface UnifiedTranscriptionResponse {
    text: string;
    confidence?: number;
    alternatives?: Array<{
        text: string;
        confidence?: number;
    }>;
    language?: string;
    duration?: number;
}

export class SpeechAPIAdapter {
    /**
     * Parse response from different speech-to-text services
     */
    static parseResponse(response: any, provider?: string): UnifiedTranscriptionResponse {
        // Try to auto-detect the format if provider not specified
        if (!provider) {
            provider = this.detectProvider(response);
        }

        switch (provider) {
            case 'google':
                return this.parseGoogleResponse(response);
            case 'azure':
                return this.parseAzureResponse(response);
            case 'aws':
                return this.parseAWSResponse(response);
            case 'whisper':
                return this.parseWhisperResponse(response);
            case 'deepgram':
                return this.parseDeepgramResponse(response);
            case 'assemblyai':
                return this.parseAssemblyAIResponse(response);
            default:
                return this.parseGenericResponse(response);
        }
    }

    /**
     * Detect provider based on response structure
     */
    private static detectProvider(response: any): string {
        if (response.results && response.results[0]?.alternatives) {
            return 'google';
        }
        if (response.RecognitionStatus) {
            return 'azure';
        }
        if (response.results?.transcripts) {
            return 'aws';
        }
        if (response.text && response.segments) {
            return 'whisper';
        }
        if (response.results?.channels) {
            return 'deepgram';
        }
        if (response.text && response.id && response.status) {
            return 'assemblyai';
        }
        return 'generic';
    }

    /**
     * Parse Google Cloud Speech-to-Text response
     */
    private static parseGoogleResponse(response: any): UnifiedTranscriptionResponse {
        const result = response.results?.[0];
        if (!result) {
            throw new Error('Invalid Google Speech response');
        }

        const alternatives = result.alternatives || [];
        const primary = alternatives[0];

        return {
            text: primary?.transcript || '',
            confidence: primary?.confidence,
            alternatives: alternatives.map((alt: any) => ({
                text: alt.transcript,
                confidence: alt.confidence,
            })),
            language: response.language_code,
        };
    }

    /**
     * Parse Azure Speech Services response
     */
    private static parseAzureResponse(response: any): UnifiedTranscriptionResponse {
        if (response.RecognitionStatus !== 'Success') {
            throw new Error(`Azure recognition failed: ${response.RecognitionStatus}`);
        }

        return {
            text: response.DisplayText || response.Text || '',
            confidence: response.Confidence,
            duration: response.Duration ? response.Duration / 10000000 : undefined, // Convert from ticks to seconds
            language: response.Language,
        };
    }

    /**
     * Parse AWS Transcribe response
     */
    private static parseAWSResponse(response: any): UnifiedTranscriptionResponse {
        const transcript = response.results?.transcripts?.[0];
        if (!transcript) {
            throw new Error('Invalid AWS Transcribe response');
        }

        const alternatives = response.results?.items?.map((item: any) => ({
            text: item.alternatives?.[0]?.content || '',
            confidence: item.alternatives?.[0]?.confidence,
        }));

        return {
            text: transcript.transcript || '',
            alternatives,
        };
    }

    /**
     * Parse OpenAI Whisper response
     */
    private static parseWhisperResponse(response: any): UnifiedTranscriptionResponse {
        return {
            text: response.text || '',
            language: response.language,
            duration: response.duration,
            alternatives: response.segments?.map((segment: any) => ({
                text: segment.text,
                confidence: segment.avg_logprob ? Math.exp(segment.avg_logprob) : undefined,
            })),
        };
    }

    /**
     * Parse Deepgram response
     */
    private static parseDeepgramResponse(response: any): UnifiedTranscriptionResponse {
        const channel = response.results?.channels?.[0];
        const alternative = channel?.alternatives?.[0];

        if (!alternative) {
            throw new Error('Invalid Deepgram response');
        }

        return {
            text: alternative.transcript || '',
            confidence: alternative.confidence,
            alternatives: channel.alternatives?.map((alt: any) => ({
                text: alt.transcript,
                confidence: alt.confidence,
            })),
            duration: response.metadata?.duration,
        };
    }

    /**
     * Parse AssemblyAI response
     */
    private static parseAssemblyAIResponse(response: any): UnifiedTranscriptionResponse {
        if (response.status !== 'completed') {
            throw new Error(`AssemblyAI transcription not completed: ${response.status}`);
        }

        return {
            text: response.text || '',
            confidence: response.confidence,
            language: response.language_code,
            duration: response.audio_duration,
        };
    }

    /**
     * Parse generic/custom API response
     */
    private static parseGenericResponse(response: any): UnifiedTranscriptionResponse {
        // Try common field names
        const text = response.text ||
            response.transcription ||
            response.transcript ||
            response.result ||
            response.data?.text ||
            response.data?.transcription ||
            '';

        const confidence = response.confidence ||
            response.score ||
            response.data?.confidence;

        return {
            text,
            confidence,
            language: response.language || response.lang,
            duration: response.duration || response.audio_duration,
        };
    }
}

// Usage example in your VoiceRecorder:
/*
const sendAudioFileToAPI = async (filePath: string) => {
    try {
        // ... make API request ...

        const response = await fetch(restEndpoint, {
            method: 'POST',
            headers: headers,
            body: formData,
        });

        const result = await response.json();

        // Use the adapter to parse the response
        const unifiedResponse = SpeechAPIAdapter.parseResponse(result, 'google'); // or auto-detect

        if (unifiedResponse.text) {
            onTranscription(unifiedResponse.text);

            // Save with FileService
            await FileService.saveTranscription({
                audioFilePath: filePath,
                transcription: unifiedResponse.text,
                timestamp: new Date().toISOString(),
                duration: recordingDuration,
                language: unifiedResponse.language || language,
                confidence: unifiedResponse.confidence,
            });
        }
    } catch (error) {
        // handle error
    }
};
*/