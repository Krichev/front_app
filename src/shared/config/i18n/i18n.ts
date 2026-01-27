// src/shared/config/i18n/i18n.ts
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NativeModules, Platform } from 'react-native';
import en from './locales/en';
import ru from './locales/ru';
import { AppLanguage } from '../../../entities/SettingsState/model/types/settings.types';

const LANGUAGE_CACHE_KEY = '@app_language';

// Language detector for React Native
const languageDetector = {
  type: 'languageDetector' as const,
  async: true,
  detect: async (callback: (lng: string) => void) => {
    try {
      const savedLanguage = await AsyncStorage.getItem(LANGUAGE_CACHE_KEY);
      if (savedLanguage && ['en', 'ru'].includes(savedLanguage)) {
          callback(savedLanguage);
          return;
      }
    } catch (error) {
      console.warn('Failed to load cached language:', error);
    }
    
    // Fallback to device language
    try {
        const deviceLanguage =
            Platform.OS === 'ios'
                ? NativeModules.SettingsManager?.settings?.AppleLocale ||
                  NativeModules.SettingsManager?.settings?.AppleLanguages?.[0]
                : NativeModules.I18nManager?.localeIdentifier;

        const languageCode = deviceLanguage?.split(/[-_]/)?.[0]?.toLowerCase() || 'en';
        callback(['en', 'ru'].includes(languageCode) ? languageCode : 'en');
    } catch {
        callback('en');
    }
  },
  init: () => {},
  cacheUserLanguage: async (lng: string) => {
    try {
      await AsyncStorage.setItem(LANGUAGE_CACHE_KEY, lng);
    } catch (error) {
      console.error('Failed to cache language:', error);
    }
  },
};

/**
 * Initialize i18n with optional saved language
 */
export const initI18n = async (savedLanguage?: AppLanguage | null): Promise<typeof i18n> => {
    if (i18n.isInitialized) {
        if (savedLanguage && savedLanguage !== i18n.language) {
             await i18n.changeLanguage(savedLanguage);
        }
        return i18n;
    }

    const options: any = {
        resources: {
            en: { translation: en },
            ru: { translation: ru },
        },
        fallbackLng: 'en',
        interpolation: {
            escapeValue: false,
        },
        react: {
            useSuspense: false,
            bindI18n: 'languageChanged',
            bindI18nStore: 'added removed',
        },
        // Development: warn about missing keys
        saveMissing: __DEV__,
        missingKeyHandler: __DEV__
            ? (lngs: any, ns: any, key: any) => {
                console.warn(`Missing translation key: "${key}" [${lngs}/${ns}]`);
            }
            : undefined,
    };

    if (savedLanguage) {
        options.lng = savedLanguage;
    }

    await i18n
        .use(languageDetector)
        .use(initReactI18next)
        .init(options);

    console.log('Initializing i18n. Language:', i18n.language);

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