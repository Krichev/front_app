// src/entities/RhythmChallengeState/model/slice/rhythmApi.ts
import { createApi } from '@reduxjs/toolkit/query/react';
import { Platform } from 'react-native';
import { createBaseQueryWithAuth } from '../../../../app/api/baseQueryWithAuth';
import NetworkConfigManager from '../../../../config/NetworkConfig';
import { 
    RhythmPatternDTO, 
    RhythmScoringResult, 
    ScoreRhythmTapsRequest,
    EnhancedRhythmScoringResult,
    ScoreRhythmAudioRequest
} from '../../../../types/rhythmChallenge.types';
import { AudioFileInfo } from '../../../../types/audioChallenge.types';

// Karaoke service base URL

export const rhythmApi = createApi({
    reducerPath: 'rhythmApi',
    baseQuery: createBaseQueryWithAuth(NetworkConfigManager.getInstance().getKaraokeBaseUrl()),
    tagTypes: ['RhythmPattern', 'RhythmScore'],
    endpoints: (builder) => ({
        
        /**
         * Extract rhythm pattern from uploaded audio file
         * Used when creating a rhythm question
         */
        extractRhythmPattern: builder.mutation<
            RhythmPatternDTO,
            {
                audioFile: AudioFileInfo;
                silenceThresholdDb?: number;
                minOnsetIntervalMs?: number;
            }
        >({
            query: ({ audioFile, silenceThresholdDb = -40, minOnsetIntervalMs = 100 }) => {
                const formData = new FormData();
                
                let fileUri = audioFile.uri;
                if (Platform.OS === 'android') {
                    if (!fileUri.startsWith('file://') && !fileUri.startsWith('content://')) {
                        fileUri = 'file://' + fileUri;
                    }
                }
                
                formData.append('audioFile', {
                    uri: fileUri,
                    name: audioFile.name,
                    type: audioFile.type,
                } as any);
                
                return {
                    url: `/rhythm/extract-pattern?silenceThresholdDb=${silenceThresholdDb}&minOnsetIntervalMs=${minOnsetIntervalMs}`,
                    method: 'POST',
                    body: formData,
                };
            },
            invalidatesTags: ['RhythmPattern'],
        }),
        
        /**
         * Score user's rhythm taps against reference pattern
         * Main endpoint for tap-based rhythm challenges
         */
        scoreRhythmTaps: builder.mutation<RhythmScoringResult, ScoreRhythmTapsRequest>({
            query: (request) => ({
                url: '/rhythm/score',
                method: 'POST',
                body: {
                    referencePattern: request.referencePattern,
                    userOnsetTimesMs: request.userOnsetTimesMs,
                    toleranceMs: request.toleranceMs,
                    minimumScoreRequired: request.minimumScoreRequired,
                },
            }),
            invalidatesTags: ['RhythmScore'],
        }),
        
        /**
         * Score user's recorded audio against reference pattern
         * Used when user records claps/taps via microphone
         */
        scoreRhythmAudio: builder.mutation<
            EnhancedRhythmScoringResult,
            ScoreRhythmAudioRequest
        >({
            query: ({ questionId, audioFile, enableSoundSimilarity, toleranceMs = 150 }) => {
                const formData = new FormData();
                
                let fileUri = audioFile.uri;
                if (Platform.OS === 'android') {
                    if (!fileUri.startsWith('file://') && !fileUri.startsWith('content://')) {
                        fileUri = 'file://' + fileUri;
                    }
                }
                
                formData.append('audioFile', {
                    uri: fileUri,
                    name: audioFile.name,
                    type: audioFile.type,
                } as any);
                
                return {
                    url: `/rhythm/score-audio-file?questionId=${questionId}&enableSoundSimilarity=${enableSoundSimilarity}&toleranceMs=${toleranceMs}`,
                    method: 'POST',
                    body: formData,
                };
            },
            invalidatesTags: ['RhythmScore'],
        }),
        
        /**
         * Get the rhythm pattern for a question
         * Pattern is stored in audioChallengeConfig
         */
        getQuestionRhythmPattern: builder.query<RhythmPatternDTO, number>({
            query: (questionId) => `/rhythm/question/${questionId}/pattern`,
            providesTags: (result, error, questionId) => [
                { type: 'RhythmPattern', id: questionId },
            ],
        }),
    }),
});

export const {
    useExtractRhythmPatternMutation,
    useScoreRhythmTapsMutation,
    useScoreRhythmAudioMutation,
    useGetQuestionRhythmPatternQuery,
    useLazyGetQuestionRhythmPatternQuery,
} = rhythmApi;

export default rhythmApi;
