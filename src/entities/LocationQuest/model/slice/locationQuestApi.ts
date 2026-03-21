import { createApi } from '@reduxjs/toolkit/query/react';
import { createBaseQueryWithAuth } from '../../../../app/api/baseQueryWithAuth';
import NetworkConfigManager from '../../../../config/NetworkConfig';
import type {
  LocationQuest,
  QuestWaypoint,
  QuestParticipation,
  WaypointCompletion,
  QuestProgressDTO,
  LocationUpdateRequest,
  QuestDiscoverParams,
} from '../types';

const BASE_URL = NetworkConfigManager.getInstance().getBaseUrl();

export const locationQuestApi = createApi({
  reducerPath: 'locationQuestApi',
  baseQuery: createBaseQueryWithAuth(BASE_URL),
  tagTypes: ['LocationQuest', 'QuestProgress'],
  endpoints: (builder) => ({
    discoverQuests: builder.query<LocationQuest[], QuestDiscoverParams>({
      query: (params) => ({
        url: '/location-quests/discover',
        params,
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: 'LocationQuest' as const, id })),
              { type: 'LocationQuest', id: 'LIST' },
            ]
          : [{ type: 'LocationQuest', id: 'LIST' }],
    }),

    getQuestById: builder.query<LocationQuest & { waypoints: QuestWaypoint[] }, number>({
      query: (id) => `/location-quests/${id}`,
      providesTags: (result, error, id) => [{ type: 'LocationQuest', id }],
    }),

    joinQuest: builder.mutation<QuestParticipation, number>({
      query: (id) => ({
        url: `/location-quests/${id}/join`,
        method: 'POST',
      }),
      invalidatesTags: (result, error, id) => [
        { type: 'LocationQuest', id },
        { type: 'LocationQuest', id: 'LIST' },
      ],
    }),

    startQuest: builder.mutation<QuestParticipation, number>({
      query: (id) => ({
        url: `/location-quests/${id}/start`,
        method: 'POST',
      }),
      invalidatesTags: (result, error, id) => [{ type: 'QuestProgress', id }],
    }),

    reportArrival: builder.mutation<WaypointCompletion, { questId: number; waypointId: number }>({
      query: ({ questId, waypointId }) => ({
        url: `/location-quests/${questId}/waypoints/${waypointId}/arrive`,
        method: 'POST',
      }),
      invalidatesTags: (result, error, { questId }) => [{ type: 'QuestProgress', id: questId }],
    }),

    completeTask: builder.mutation<WaypointCompletion, {
      questId: number;
      waypointId: number;
      answer?: string;
      fileUri?: string;
      fileName?: string;
      fileType?: string;
      metadata?: string;
    }>({
      queryFn: async ({ questId, waypointId, answer, fileUri, fileName, fileType, metadata }, api, _, baseQuery) => {
        const formData = new FormData();
        if (answer) formData.append('answer', answer);
        if (metadata) formData.append('metadata', metadata);
        
        if (fileUri) {
          formData.append('file', {
            uri: fileUri,
            name: fileName || `proof_${questId}_${waypointId}_${Date.now()}`,
            type: fileType || 'application/octet-stream',
          } as any);
        }
        
        const result = await baseQuery({
          url: `/location-quests/${questId}/waypoints/${waypointId}/complete-task`,
          method: 'POST',
          body: formData,
        });
        return result.error ? { error: result.error } : { data: result.data as WaypointCompletion };
      },
      invalidatesTags: (result, error, { questId }) => [{ type: 'QuestProgress', id: questId }],
    }),

    updateLocation: builder.mutation<void, { questId: number } & LocationUpdateRequest>({
      query: ({ questId, ...locationData }) => ({
        url: `/location-quests/${questId}/location-update`,
        method: 'POST',
        body: locationData,
      }),
    }),

    getProgress: builder.query<QuestProgressDTO, number>({
      query: (questId) => `/location-quests/${questId}/progress`,
      providesTags: (result, error, questId) => [{ type: 'QuestProgress', id: questId }],
    }),

    abandonQuest: builder.mutation<{ message: string }, number>({
      query: (id) => ({
        url: `/location-quests/${id}/abandon`,
        method: 'POST',
      }),
      invalidatesTags: (result, error, id) => [
        { type: 'LocationQuest', id },
        { type: 'QuestProgress', id },
      ],
    }),
  }),
});

export const {
  useDiscoverQuestsQuery,
  useGetQuestByIdQuery,
  useJoinQuestMutation,
  useStartQuestMutation,
  useReportArrivalMutation,
  useCompleteTaskMutation,
  useUpdateLocationMutation,
  useGetProgressQuery,
  useAbandonQuestMutation,
} = locationQuestApi;
