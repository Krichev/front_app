import React, { createContext, useContext, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { initI18n, changeLanguage, getCurrentLanguage, getAvailableLanguages } from '../../shared/config/i18n/i18n';

interface I18nContextType {
  isInitialized: boolean;
  currentLanguage: string;
  availableLanguages: { code: string; name: string; nativeName: string }[];
  changeLanguage: (language: string) => Promise<void>;
}

const I18nContext = createContext<I18nContextType>({
  isInitialized: false,
  currentLanguage: 'en',
  availableLanguages: getAvailableLanguages(),
  changeLanguage: async () => {},
});

export const useI18n = () => useContext(I18nContext);

export const I18nProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isInitialized, setIsInitialized] = useState(false);
  const { i18n } = useTranslation();

  useEffect(() => {
    const init = async () => {
      await initI18n();
      setIsInitialized(true);
    };
    init();
  }, []);

  const handleChangeLanguage = async (language: string) => {
    await changeLanguage(language);
  };

  const contextValue: I18nContextType = {
    isInitialized,
    currentLanguage: i18n.language || getCurrentLanguage(),
    availableLanguages: getAvailableLanguages(),
    changeLanguage: handleChangeLanguage,
  };

  if (!isInitialized) {
    return null; // Or a loading spinner
  }

  return (
    <I18nContext.Provider value={contextValue}>
      {children}
    </I18nContext.Provider>
  );
};
