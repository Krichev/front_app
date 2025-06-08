// src/shared/config/index.ts
export { theme } from '../styles/theme';
export { gameStyles } from '../styles/gameStyles';
export { formStyles } from '../styles/formStyles';
export { modalStyles } from '../styles/modalStyles';

// App configuration
export const APP_CONFIG = {
    API_BASE_URL: 'http://10.0.2.2:8082/challenger/api',
    API_TIMEOUT: 10000,
    STORAGE_KEYS: {
        AUTH_TOKEN: 'auth_token',
        USER_PREFERENCES: 'user_preferences',
        GAME_SETTINGS: 'game_settings',
    },
    VALIDATION: {
        MIN_PASSWORD_LENGTH: 8,
        MAX_USERNAME_LENGTH: 50,
        MAX_BIO_LENGTH: 500,
    },
} as const;