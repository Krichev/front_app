// src/entities/SettingsState/model/slice/settingsApi.ts
import { createApi } from '@reduxjs/toolkit/query/react';
import { createBaseQueryWithAuth } from '../../../../app/api/baseQueryWithAuth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { 
    UserAppSettings, 
    UpdateAppSettingsRequest,
    AppLanguage 
} from '../types/settings.types';

const SETTINGS_CACHE_KEY = '@user_app_settings';

// Helper to cache settings locally
const cacheSettings = async (settings: UserAppSettings): Promise<void> => {
    try {
        await AsyncStorage.setItem(SETTINGS_CACHE_KEY, JSON.stringify(settings));
    } catch (error) {
        console.warn('Failed to cache app settings:', error);
    }
};

// Helper to get cached settings
export const getCachedSettings = async (): Promise<UserAppSettings | null> => {
    try {
        const cached = await AsyncStorage.getItem(SETTINGS_CACHE_KEY);
        return cached ? JSON.parse(cached) : null;
    } catch (error) {
        console.warn('Failed to get cached app settings:', error);
        return null;
    }
};

// Helper to clear cached settings (for logout)
export const clearCachedSettings = async (): Promise<void> => {
    try {
        await AsyncStorage.removeItem(SETTINGS_CACHE_KEY);
    } catch (error) {
        console.warn('Failed to clear cached app settings:', error);
    }
};

export const settingsApi = createApi({
    reducerPath: 'settingsApi',
    baseQuery: createBaseQueryWithAuth('http://10.0.2.2:8082/challenger/api'),
    tagTypes: ['AppSettings'],
    endpoints: (builder) => ({
        
        /**
         * Get user app settings (auto-creates if not exists)
         * Uses authenticated user from JWT token
         */
        getAppSettings: builder.query<UserAppSettings, void>({
            query: () => '/app-settings',
            providesTags: ['AppSettings'],
            // Cache to AsyncStorage on successful fetch
            onQueryStarted: async (_, { queryFulfilled }) => {
                try {
                    const { data } = await queryFulfilled;
                    await cacheSettings(data);
                    console.log('✅ App settings fetched and cached');
                } catch (error) {
                    console.warn('Failed to fetch app settings, will use cache');
                }
            },
        }),
        
        /**
         * Update app settings (partial update)
         */
        updateAppSettings: builder.mutation<UserAppSettings, UpdateAppSettingsRequest>({
            query: (request) => ({
                url: '/app-settings',
                method: 'PUT',
                body: request,
            }),
            invalidatesTags: ['AppSettings'],
            // Optimistic update + cache
            onQueryStarted: async (request, { dispatch, queryFulfilled }) => {
                // Optimistic update
                const patchResult = dispatch(
                    settingsApi.util.updateQueryData('getAppSettings', undefined, (draft) => {
                        if (request.language !== undefined) draft.language = request.language;
                        if (request.theme !== undefined) draft.theme = request.theme;
                        if (request.notificationsEnabled !== undefined) {
                            draft.notificationsEnabled = request.notificationsEnabled;
                        }
                    })
                );
                
                try {
                    const { data } = await queryFulfilled;
                    await cacheSettings(data);
                    console.log('✅ App settings updated and cached');
                } catch (error) {
                    // Revert optimistic update on failure
                    patchResult.undo();
                    console.error('❌ Failed to update app settings:', error);
                }
            },
        }),
        
        /**
         * Quick update for language only
         */
        updateLanguage: builder.mutation<UserAppSettings, AppLanguage>({
            query: (language) => ({
                url: '/app-settings/language',
                method: 'PATCH',
                params: { language },
            }),
            invalidatesTags: ['AppSettings'],
            onQueryStarted: async (language, { dispatch, queryFulfilled }) => {
                // Optimistic update
                const patchResult = dispatch(
                    settingsApi.util.updateQueryData('getAppSettings', undefined, (draft) => {
                        draft.language = language;
                    })
                );
                
                try {
                    const { data } = await queryFulfilled;
                    await cacheSettings(data);
                    console.log('✅ Language updated to:', language);
                } catch (error) {
                    patchResult.undo();
                    console.error('❌ Failed to update language:', error);
                }
            },
        }),
    }),
});

export const {
    useGetAppSettingsQuery,
    useUpdateAppSettingsMutation,
    useUpdateLanguageMutation,
} = settingsApi;
