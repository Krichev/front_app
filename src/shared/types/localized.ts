import { AppLanguage } from '../../entities/SettingsState/model/types/settings.types';

export interface LocalizedString {
  en: string;
  ru: string;
}

export const EMPTY_LOCALIZED_STRING: LocalizedString = {
  en: '',
  ru: '',
};

export const createLocalizedString = (value: string, language: AppLanguage): LocalizedString => ({
  en: language === 'en' ? value : '',
  ru: language === 'ru' ? value : '',
});

export const getLocalizedValue = (
  localized: LocalizedString | string | undefined,
  language: AppLanguage,
  fallbackLanguage: AppLanguage = 'en'
): string => {
  if (typeof localized === 'string') return localized;
  if (!localized) return '';
  return localized[language] || localized[fallbackLanguage] || '';
};

export const isLocalizedStringEmpty = (localized: LocalizedString): boolean => {
  return !localized.en.trim() && !localized.ru.trim();
};

export const hasAtLeastOneLanguage = (localized: LocalizedString): boolean => {
  return !!localized.en.trim() || !!localized.ru.trim();
};
