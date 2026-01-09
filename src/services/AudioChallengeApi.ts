import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { getAuthToken } from '../utils/auth';
import {
    AudioChallengeSubmission,
    CreateAudioQuestionRequest,
    AudioChallengeTypeInfo
} from '../entities/ChallengeState/model/types';
import { API_BASE_URL } from '../config/api';

export const audioChallengeApi = createApi({
    reducerPath: 'audioChallengeApi',
    baseQuery: fetchBaseQuery({
        baseUrl: `${API_BASE_URL}/api/audio-challenges`,
        prepareHeaders: async (headers) => {
            const token = await getAuthToken();
            if (token) {
                headers.set('Authorization', `Bearer ${token}`);
            }
            return headers;
        }
    }),
    tagTypes: ['AudioSubmission', 'AudioQuestion'],
    endpoints: (builder) => ({
        // Get available challenge types
        getAudioChallengeTypes: builder.query<AudioChallengeTypeInfo[], void>({
            query: () => '/types'
        }),

        // Create audio question
        createAudioQuestion: builder.mutation<any, {
            request: CreateAudioQuestionRequest;
            referenceAudio?: {
                uri: string;
                name: string;
                type: string;
            };
        }>({
            query: ({ request, referenceAudio }) => {
                const formData = new FormData();
                formData.append('request', JSON.stringify(request));

                if (referenceAudio) {
                    formData.append('referenceAudio', {
                        uri: referenceAudio.uri,
                        name: referenceAudio.name,
                        type: referenceAudio.type
                    } as any);
                }

                return {
                    url: '',
                    method: 'POST',
                    body: formData
                };
            },
            invalidatesTags: ['AudioQuestion']
        }),

        // Submit recording
        submitRecording: builder.mutation<AudioChallengeSubmission, {
            questionId: number;
            audioFile: {
                uri: string;
                name: string;
                type: string;
            };
        }>({
            query: ({ questionId, audioFile }) => {
                const formData = new FormData();
                formData.append('audioFile', {
                    uri: audioFile.uri,
                    name: audioFile.name,
                    type: audioFile.type
                } as any);

                return {
                    url: `/${questionId}/submit`,
                    method: 'POST',
                    body: formData
                };
            },
            invalidatesTags: ['AudioSubmission']
        }),

        // Get submission status
        getSubmissionStatus: builder.query<AudioChallengeSubmission, number>({
            query: (submissionId) => `/submissions/${submissionId}`,
            providesTags: (result, error, id) => [{ type: 'AudioSubmission', id }]
        }),

        // Get user submissions for question
        getUserSubmissions: builder.query<AudioChallengeSubmission[], number>({
            query: (questionId) => `/${questionId}/submissions`,
            providesTags: ['AudioSubmission']
        }),

        // Get best submission
        getBestSubmission: builder.query<AudioChallengeSubmission | null, number>({
            query: (questionId) => `/${questionId}/best`,
            providesTags: ['AudioSubmission']
        })
    })
});

export const {
    useGetAudioChallengeTypesQuery,
    useCreateAudioQuestionMutation,
    useSubmitRecordingMutation,
    useGetSubmissionStatusQuery,
    useGetUserSubmissionsQuery,
    useGetBestSubmissionQuery
} = audioChallengeApi;
