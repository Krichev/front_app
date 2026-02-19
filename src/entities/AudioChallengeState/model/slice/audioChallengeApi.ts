// src/entities/AudioChallengeState/model/slice/audioChallengeApi.ts
import {createApi} from '@reduxjs/toolkit/query/react';
import {Platform} from 'react-native';
import {createBaseQueryWithAuth} from '../../../../app/api/baseQueryWithAuth';
import {
    AudioChallengeType,
    AudioChallengeTypeInfo,
    AUDIO_CHALLENGE_TYPES,
    AUDIO_CHALLENGE_TYPES_INFO,
    AudioFileInfo,
} from '../../../../types/audioChallenge.types';

export {
    AudioChallengeType,
    AUDIO_CHALLENGE_TYPES,
    AUDIO_CHALLENGE_TYPES_INFO,
};

export type { AudioChallengeTypeInfo, AudioFileInfo };

// ============================================================================
// TYPES
// ============================================================================

/**
 * Request to create a new audio challenge question
 */
export interface CreateAudioQuestionRequest {
    question: string;
    answer?: string;
    audioChallengeType: AudioChallengeType;
    topic?: string;
    difficulty?: 'EASY' | 'MEDIUM' | 'HARD';
    visibility?: 'PUBLIC' | 'PRIVATE' | 'GROUP_ONLY' | 'QUIZ_ONLY';
    additionalInfo?: string;
    audioSegmentStart?: number;
    audioSegmentEnd?: number;
    minimumScorePercentage?: number;
    rhythmBpm?: number;
    rhythmTimeSignature?: string;
}

/**
 * Request to update audio challenge configuration
 */
export interface UpdateAudioConfigRequest {
    audioChallengeType?: AudioChallengeType;
    audioReferenceMediaId?: number;
    audioSegmentStart?: number;
    audioSegmentEnd?: number;
    minimumScorePercentage?: number;
    rhythmBpm?: number;
    rhythmTimeSignature?: string;
}

/**
 * Audio question response from the API
 */
export interface AudioQuestionResponse {
    id: number;
    externalId?: string;
    question: string;
    answer?: string;
    questionType: 'AUDIO';
    difficulty?: string;
    topic?: string;
    
    // Media properties
    mediaUrl?: string;
    questionMediaId?: number;
    questionMediaType?: string;
    
    // Audio challenge specific
    audioChallengeType: AudioChallengeType;
    audioSegmentStart?: number;
    audioSegmentEnd?: number;
    minimumScorePercentage: number;
    rhythmBpm?: number;
    rhythmTimeSignature?: string;
    audioChallengeConfig?: string;
    
    // User creation tracking
    isUserCreated?: boolean;
    creatorId?: number;
    creatorUsername?: string;
    
    // Status and metadata
    isActive?: boolean;
    usageCount?: number;
    additionalInfo?: string;
    
    // Timestamps
    createdAt?: string;
    updatedAt?: string;
}

/**
 * Audio challenge submission status
 */
export type SubmissionStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';

/**
 * Audio challenge submission result
 */
export interface AudioChallengeSubmission {
    id: number;
    questionId: number;
    userId: number;
    processingStatus: SubmissionStatus;
    processingProgress: number;
    
    // Scoring results (available when COMPLETED)
    overallScore?: number;
    pitchScore?: number;
    rhythmScore?: number;
    voiceScore?: number;
    passed?: boolean;
    minimumScoreRequired: number;
    detailedMetrics?: string;
    
    // Timestamps
    createdAt: string;
    processedAt?: string;
}

// ============================================================================
// API DEFINITION
// ============================================================================

export const audioChallengeApi = createApi({
    reducerPath: 'audioChallengeApi',
    baseQuery: createBaseQueryWithAuth('http://10.0.2.2:8082/api'),
    tagTypes: ['AudioQuestion', 'AudioSubmission'],
    endpoints: (builder) => ({
        // =============================================================================
        // AUDIO QUESTION ENDPOINTS
        // =============================================================================

        /**
         * Get audio challenge type info (for UI)
         * Returns static data about challenge types
         */
        getAudioChallengeTypes: builder.query<AudioChallengeTypeInfo[], void>({
            queryFn: () => ({data: AUDIO_CHALLENGE_TYPES}),
        }),

        /**
         * Create a new audio challenge question with optional reference audio
         * Uses multipart/form-data for file upload
         */
        createAudioQuestion: builder.mutation<
            AudioQuestionResponse,
            {
                request: CreateAudioQuestionRequest;
                referenceAudio?: AudioFileInfo;
            }
        >({
            query: ({request, referenceAudio}) => {
                const formData = new FormData();

                // Add request data as JSON
                formData.append('request', JSON.stringify(request));

                // Add reference audio file if provided
                if (referenceAudio) {
                    // Normalize URI for platform
                    let fileUri = referenceAudio.uri;
                    if (Platform.OS === 'android') {
                        if (!fileUri.startsWith('file://') && !fileUri.startsWith('content://')) {
                            fileUri = 'file://' + fileUri;
                        }
                    }

                    formData.append('referenceAudio', {
                        uri: fileUri,
                        name: referenceAudio.name,
                        type: referenceAudio.type,
                    } as any);
                }

                return {
                    url: '/questions/audio',
                    method: 'POST',
                    body: formData,
                };
            },
            invalidatesTags: ['AudioQuestion'],
        }),

        /**
         * Get an audio question by ID
         */
        getAudioQuestion: builder.query<AudioQuestionResponse, number>({
            query: (questionId) => `/questions/audio/${questionId}`,
            providesTags: (result, error, questionId) => [
                {type: 'AudioQuestion', id: questionId},
            ],
        }),

        /**
         * Update audio challenge configuration for a question
         */
        updateAudioConfig: builder.mutation<
            AudioQuestionResponse,
            {questionId: number; config: UpdateAudioConfigRequest}
        >({
            query: ({questionId, config}) => ({
                url: `/questions/audio/${questionId}/config`,
                method: 'PUT',
                body: config,
            }),
            invalidatesTags: (result, error, {questionId}) => [
                {type: 'AudioQuestion', id: questionId},
            ],
        }),

        /**
         * Upload/replace reference audio for an existing question
         */
        uploadReferenceAudio: builder.mutation<
            AudioQuestionResponse,
            {questionId: number; audioFile: AudioFileInfo}
        >({
            query: ({questionId, audioFile}) => {
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
                    url: `/questions/audio/${questionId}/reference`,
                    method: 'POST',
                    body: formData,
                };
            },
            invalidatesTags: (result, error, {questionId}) => [
                {type: 'AudioQuestion', id: questionId},
            ],
        }),

        /**
         * Delete an audio question
         */
        deleteAudioQuestion: builder.mutation<void, number>({
            query: (questionId) => ({
                url: `/questions/audio/${questionId}`,
                method: 'DELETE',
            }),
            invalidatesTags: (result, error, questionId) => [
                {type: 'AudioQuestion', id: questionId},
                'AudioQuestion',
            ],
        }),

        /**
         * Get all audio questions created by the current user
         */
        getUserAudioQuestions: builder.query<
            AudioQuestionResponse[],
            {page?: number; size?: number; challengeType?: AudioChallengeType}
        >({
            query: ({page = 0, size = 20, challengeType}) => ({
                url: '/questions/audio/user/me',
                params: {
                    page,
                    size,
                    ...(challengeType && {challengeType}),
                },
            }),
            providesTags: (result) =>
                result
                    ? [
                          ...result.map((q) => ({type: 'AudioQuestion' as const, id: q.id})),
                          {type: 'AudioQuestion', id: 'LIST'},
                      ]
                    : [{type: 'AudioQuestion', id: 'LIST'}],
        }),

        // =============================================================================
        // SUBMISSION ENDPOINTS
        // =============================================================================

        /**
         * Submit a recording for scoring
         * User records audio and submits for async processing
         */
        submitRecording: builder.mutation<
            AudioChallengeSubmission,
            {questionId: number; audioFile: AudioFileInfo}
        >({
            query: ({questionId, audioFile}) => {
                const formData = new FormData();

                let fileUri = audioFile.uri;
                if (Platform.OS === 'android') {
                    if (!fileUri.startsWith('file://') && !fileUri.startsWith('content://')) {
                        fileUri = 'file://' + fileUri;
                    }
                }

                // Ensure we have a proper audio content type
                let contentType = audioFile.type;
                if (!contentType || contentType === 'application/octet-stream') {
                    // Determine from filename extension
                    const extension = audioFile.name?.split('.').pop()?.toLowerCase();
                    contentType = {
                        'mp3': 'audio/mpeg',
                        'wav': 'audio/wav',
                        'm4a': 'audio/m4a',
                        'aac': 'audio/aac',
                        'ogg': 'audio/ogg',
                        'webm': 'audio/webm',
                        '3gp': 'audio/3gpp',
                    }[extension || ''] || 'audio/mpeg'; // Default to audio/mpeg
                }

                console.log('📤 Submitting audio recording:', {
                    questionId,
                    fileUri,
                    fileName: audioFile.name,
                    originalType: audioFile.type,
                    resolvedType: contentType,
                });

                formData.append('audioFile', {
                    uri: fileUri,
                    name: audioFile.name || `recording_${Date.now()}.mp3`,
                    type: contentType,
                } as any);

                return {
                    url: `/questions/audio/${questionId}/submit`,
                    method: 'POST',
                    body: formData,
                };
            },
            invalidatesTags: (result, error, {questionId}) => [
                {type: 'AudioSubmission', id: `QUESTION_${questionId}`},
            ],
        }),

        /**
         * Get the status of a submission
         * Poll this endpoint while status is PENDING or PROCESSING
         */
        getSubmissionStatus: builder.query<AudioChallengeSubmission, number>({
            query: (submissionId) => `/questions/audio/submissions/${submissionId}`,
            providesTags: (result, error, submissionId) => [
                {type: 'AudioSubmission', id: submissionId},
            ],
        }),

        /**
         * Get all submissions for a question by the current user
         */
        getUserSubmissions: builder.query<AudioChallengeSubmission[], number>({
            query: (questionId) => `/questions/audio/${questionId}/submissions`,
            providesTags: (result, error, questionId) => [
                {type: 'AudioSubmission', id: `QUESTION_${questionId}`},
            ],
        }),

        /**
         * Get the best submission (highest score) for a question
         */
        getBestSubmission: builder.query<AudioChallengeSubmission | null, number>({
            query: (questionId) => `/questions/audio/${questionId}/best`,
            providesTags: (result, error, questionId) => [
                {type: 'AudioSubmission', id: `BEST_${questionId}`},
            ],
        }),

        /**
         * Get submission leaderboard for a question
         */
        getQuestionLeaderboard: builder.query<
            Array<{
                userId: number;
                username: string;
                bestScore: number;
                attemptCount: number;
            }>,
            {questionId: number; limit?: number}
        >({
            query: ({questionId, limit = 10}) => ({
                url: `/questions/audio/${questionId}/leaderboard`,
                params: {limit},
            }),
            providesTags: (result, error, {questionId}) => [
                {type: 'AudioSubmission', id: `LEADERBOARD_${questionId}`},
            ],
        }),

        // =============================================================================
        // UTILITY ENDPOINTS
        // =============================================================================

        /**
         * Get presigned URL for audio playback
         */
        getAudioPlaybackUrl: builder.query<{url: string; expiresIn: number}, string>({
            query: (mediaId) => `/media/audio/${mediaId}/playback-url`,
        }),

        /**
         * Validate audio file before upload
         */
        validateAudioFile: builder.mutation<
            {valid: boolean; error?: string; duration?: number},
            AudioFileInfo
        >({
            query: (audioFile) => {
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
                    url: '/media/audio/validate',
                    method: 'POST',
                    body: formData,
                };
            },
        }),
    }),
});

// ============================================================================
// HOOKS EXPORT
// ============================================================================

export const {
    // Query hooks
    useGetAudioChallengeTypesQuery,
    useGetAudioQuestionQuery,
    useGetUserAudioQuestionsQuery,
    useGetSubmissionStatusQuery,
    useGetUserSubmissionsQuery,
    useGetBestSubmissionQuery,
    useGetQuestionLeaderboardQuery,
    useGetAudioPlaybackUrlQuery,
    useLazyGetAudioPlaybackUrlQuery,
    useLazyGetSubmissionStatusQuery,

    // Mutation hooks
    useCreateAudioQuestionMutation,
    useUpdateAudioConfigMutation,
    useUploadReferenceAudioMutation,
    useDeleteAudioQuestionMutation,
    useSubmitRecordingMutation,
    useValidateAudioFileMutation,
} = audioChallengeApi;

// ============================================================================
// SELECTORS
// ============================================================================

/**
 * Get challenge type info by type
 */
export const selectChallengeTypeInfo = (type: AudioChallengeType): AudioChallengeTypeInfo | undefined => {
    return AUDIO_CHALLENGE_TYPES_INFO[type];
};

/**
 * Check if a challenge type requires reference audio
 */
export const requiresReferenceAudio = (type: AudioChallengeType): boolean => {
    return AUDIO_CHALLENGE_TYPES_INFO[type]?.requiresReferenceAudio ?? false;
};

/**
 * Get scoring weights for a challenge type
 * Returns [pitchWeight, rhythmWeight, voiceWeight]
 */
export const getScoringWeights = (type: AudioChallengeType): [number, number, number] => {
    const weights = AUDIO_CHALLENGE_TYPES_INFO[type]?.scoringWeights;
    if (weights) {
        return [weights.pitch, weights.rhythm, weights.voice];
    }
    return [0.33, 0.33, 0.34];
};

export default audioChallengeApi;
