import i18next from 'i18next';

export const getLanguageHeader = () => {
  const language = i18next.language || 'en';
  // Normalize 'en-US' -> 'en', 'ru-RU' -> 'ru'
  const languageCode = language.split('-')[0];
  return {
    'Accept-Language': languageCode,
  };
};
