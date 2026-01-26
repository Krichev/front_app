import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NativeModules, Platform } from 'react-native';
import en from './locales/en';
import ru from './locales/ru';

const LANGUAGE_STORAGE_KEY = '@app_language';

// Get device language
const getDeviceLanguage = (): string => {
  const deviceLanguage =
    Platform.OS === 'ios'
      ? NativeModules.SettingsManager?.settings?.AppleLocale ||
        NativeModules.SettingsManager?.settings?.AppleLanguages?.[0]
      : NativeModules.I18nManager?.localeIdentifier;

  // Extract language code (e.g., 'en_US' -> 'en', 'ru_RU' -> 'ru')
  const languageCode = deviceLanguage?.split(/[-_]/)?.[0] || 'en';
  
  // Return only supported languages
  return ['en', 'ru'].includes(languageCode) ? languageCode : 'en';
};

// Initialize i18n
const initI18n = async () => {
  let savedLanguage: string | null = null;

  try {
    savedLanguage = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
  } catch (error) {
    console.warn('Failed to load saved language:', error);
  }

  const defaultLanguage = savedLanguage || getDeviceLanguage();

  if (!i18n.isInitialized) {
    await i18n
      .use(initReactI18next)
      .init({
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
        // Development only: warn about missing keys
        saveMissing: __DEV__,
        missingKeyHandler: __DEV__
          ? (lng, ns, key) => {
              console.warn(`Missing translation key: ${key} [${lng}/${ns}]`);
            }
          : undefined,
      });
  }

  return i18n;
};

// Helper to change and persist language
export const changeLanguage = async (language: string): Promise<void> => {
  try {
    await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, language);
    await i18n.changeLanguage(language);
  } catch (error) {
    console.error('Failed to change language:', error);
    throw error;
  }
};

// Helper to get current language
export const getCurrentLanguage = (): string => {
  return i18n.language || 'en';
};

// Helper to get available languages
export const getAvailableLanguages = () => [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'ru', name: 'Russian', nativeName: 'Русский' },
];

export { initI18n };
export default i18n;
