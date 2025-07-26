// src/shared/config/app.ts
export const APP_CONFIG = {
    APP_NAME: 'Challenger',
    VERSION: '1.0.0',
    ENVIRONMENT: __DEV__ ? 'development' : 'production',
    STORAGE_KEYS: {
        AUTH_TOKEN: 'auth_token',
        REFRESH_TOKEN: 'refresh_token',
        USER_PREFERENCES: 'user_preferences',
        GAME_SETTINGS: 'game_settings',
    },
} as const;