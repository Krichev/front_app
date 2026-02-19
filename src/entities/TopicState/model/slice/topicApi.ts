// src/entities/TopicState/model/slice/topicApi.ts
import { createApi } from '@reduxjs/toolkit/query/react';
import { createBaseQueryWithAuth } from '../../../../app/api/baseQueryWithAuth';
import NetworkConfigManager from '../../../../config/NetworkConfig';
import {
    Topic,
    TopicTreeNode,
    SelectableTopic,
    CreateTopicRequest,
    ValidationStatus
} from '../types/topic.types';

export const topicApi = createApi({
    reducerPath: 'topicApi',
    baseQuery: createBaseQueryWithAuth(NetworkConfigManager.getInstance().getBaseUrl()),
    tagTypes: ['Topic', 'TopicTree'],
    endpoints: (builder) => ({
        /**
         * Get full topic tree (for browsing)
         */
        getTopicTree: builder.query<TopicTreeNode[], void>({
            query: () => '/topics/tree',
            providesTags: ['TopicTree'],
        }),

        /**
         * Get selectable topics for current user (approved + own pending)
         */
        getSelectableTopics: builder.query<SelectableTopic[], void>({
            query: () => '/topics/selectable',
            providesTags: ['Topic'],
        }),

        /**
         * Get topic by ID
         */
        getTopicById: builder.query<Topic, number>({
            query: (id) => `/topics/${id}`,
            providesTags: (result, error, id) => [{ type: 'Topic', id }],
        }),

        /**
         * Get children of a topic
         */
        getTopicChildren: builder.query<Topic[], number>({
            query: (parentId) => `/topics/${parentId}/children`,
            providesTags: (result, error, parentId) => [
                { type: 'Topic', id: `children-${parentId}` }
            ],
        }),

        /**
         * Search topics
         */
        searchTopics: builder.query<Topic[], { query: string; includeOwn?: boolean }>({
            query: ({ query, includeOwn = true }) => ({
                url: '/topics/search',
                params: { q: query, includeOwn },
            }),
            providesTags: ['Topic'],
        }),

        /**
         * Create new topic
         */
        createTopic: builder.mutation<Topic, CreateTopicRequest>({
            query: (request) => ({
                url: '/topics',
                method: 'POST',
                body: request,
            }),
            invalidatesTags: ['Topic', 'TopicTree'],
        }),

        /**
         * Get root topics (no parent)
         */
        getRootTopics: builder.query<Topic[], void>({
            query: () => '/topics/roots',
            providesTags: ['TopicTree'],
        }),
    }),
});

export const {
    useGetTopicTreeQuery,
    useGetSelectableTopicsQuery,
    useGetTopicByIdQuery,
    useGetTopicChildrenQuery,
    useLazyGetTopicChildrenQuery,
    useSearchTopicsQuery,
    useCreateTopicMutation,
    useGetRootTopicsQuery,
    useLazySearchTopicsQuery,
} = topicApi;
