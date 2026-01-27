// src/entities/SettingsState/model/types/settings.types.ts

export type AppLanguage = 'en' | 'ru';
export type AppTheme = 'light' | 'dark' | 'system';

export interface UserAppSettings {
    id: number;
    userId: number;
    language: AppLanguage;
    theme: AppTheme;
    notificationsEnabled: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface UpdateAppSettingsRequest {
    language?: AppLanguage;
    theme?: AppTheme;
    notificationsEnabled?: boolean;
}

export interface LanguageOption {
    code: AppLanguage;
    name: string;
    nativeName: string;
    flag: string;
}

export interface ThemeOption {
    code: AppTheme;
    name: string;
    nameRu: string;
    icon: string;
}

export const AVAILABLE_LANGUAGES: LanguageOption[] = [
    { code: 'en', name: 'English', nativeName: 'English', flag: '🇺🇸' },
    { code: 'ru', name: 'Russian', nativeName: 'Русский', flag: '🇷🇺' },
];

export const AVAILABLE_THEMES: ThemeOption[] = [
    { code: 'light', name: 'Light', nameRu: 'Светлая', icon: 'white-balance-sunny' },
    { code: 'dark', name: 'Dark', nameRu: 'Тёмная', icon: 'moon-waning-crescent' },
    { code: 'system', name: 'System', nameRu: 'Системная', icon: 'cellphone' },
];
