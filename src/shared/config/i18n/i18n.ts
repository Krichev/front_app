// src/shared/config/i18n/i18n.ts
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NativeModules, Platform } from 'react-native';
import en from './locales/en';
import ru from './locales/ru';
import { AppLanguage } from '../../../entities/SettingsState/model/types/settings.types';

const LANGUAGE_CACHE_KEY = '@app_language';

/**
 * Get device language code
 */
const getDeviceLanguage = (): AppLanguage => {
    try {
        const deviceLanguage =
            Platform.OS === 'ios'
                ? NativeModules.SettingsManager?.settings?.AppleLocale ||
                  NativeModules.SettingsManager?.settings?.AppleLanguages?.[0]
                : NativeModules.I18nManager?.localeIdentifier;

        const languageCode = deviceLanguage?.split(/[-_]/)?.[0]?.toLowerCase() || 'en';
        
        // Return only supported languages
        return ['en', 'ru'].includes(languageCode) ? (languageCode as AppLanguage) : 'en';
    } catch (error) {
        console.warn('Failed to get device language:', error);
        return 'en';
    }
};

/**
 * Initialize i18n with optional saved language
 */
export const initI18n = async (savedLanguage?: AppLanguage | null): Promise<typeof i18n> => {
    let language = savedLanguage;

    // Try to get cached language if not provided
    if (!language) {
        try {
            const cached = await AsyncStorage.getItem(LANGUAGE_CACHE_KEY);
            if (cached && ['en', 'ru'].includes(cached)) {
                language = cached as AppLanguage;
            }
        } catch (error) {
            console.warn('Failed to load cached language:', error);
        }
    }

    // Fall back to device language
    const defaultLanguage = language || getDeviceLanguage();
    console.log('Initializing i18n with language:', defaultLanguage);

    await i18n.use(initReactI18next).init({
        resources: {
            en: { translation: en },
            ru: { translation: ru },
        },
        lng: defaultLanguage,
        fallbackLng: 'en',
        interpolation: {
            escapeValue: false,
        },
        react: {
            useSuspense: false,
        },
        // Development: warn about missing keys
        saveMissing: __DEV__,
        missingKeyHandler: __DEV__
            ? (lngs, ns, key) => {
                console.warn(`Missing translation key: "${key}" [${lngs}/${ns}]`);
            }
            : undefined,
    });

    return i18n;
};

/**
 * Change language and cache it locally
 */
export const changeAppLanguage = async (language: AppLanguage): Promise<void> => {
    try {
        await AsyncStorage.setItem(LANGUAGE_CACHE_KEY, language);
        await i18n.changeLanguage(language);
        console.log('Language changed to:', language);
    } catch (error) {
        console.error('Failed to change language:', error);
        throw error;
    }
};

/**
 * Get current language
 */
export const getCurrentLanguage = (): AppLanguage => {
    return (i18n.language as AppLanguage) || 'en';
};

export default i18n;