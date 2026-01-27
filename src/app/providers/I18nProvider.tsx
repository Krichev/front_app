// src/app/providers/I18nProvider.tsx
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../providers/StoreProvider/store';
import i18n, { initI18n, changeAppLanguage, getCurrentLanguage } from '../../shared/config/i18n/i18n';
import { 
    useGetAppSettingsQuery, 
    useUpdateLanguageMutation,
    getCachedSettings,
} from '../../entities/SettingsState/model/slice/settingsApi';
import { AppLanguage, AVAILABLE_LANGUAGES } from '../../entities/SettingsState/model/types/settings.types';

interface I18nContextType {
    isInitialized: boolean;
    currentLanguage: AppLanguage;
    availableLanguages: typeof AVAILABLE_LANGUAGES;
    changeLanguage: (language: AppLanguage) => Promise<void>;
    isChangingLanguage: boolean;
}

const I18nContext = createContext<I18nContextType>({
    isInitialized: false,
    currentLanguage: 'en',
    availableLanguages: AVAILABLE_LANGUAGES,
    changeLanguage: async () => {},
    isChangingLanguage: false,
});

export const useI18n = () => useContext(I18nContext);

interface I18nProviderProps {
    children: React.ReactNode;
}

export const I18nProvider: React.FC<I18nProviderProps> = ({ children }) => {
    const [isInitialized, setIsInitialized] = useState(false);
    const [isChangingLanguage, setIsChangingLanguage] = useState(false);
    const [currentLanguage, setCurrentLanguage] = useState<AppLanguage>('en');
    
    // Get current user from auth state
    const authState = useSelector((state: RootState) => state.auth);
    const isAuthenticated = authState?.isAuthenticated || false;
    
    // Fetch user settings from DB (only if authenticated)
    const { data: settings } = useGetAppSettingsQuery(undefined, {
        skip: !isAuthenticated,
    });
    
    // Mutation to update language in DB
    const [updateLanguageInDb] = useUpdateLanguageMutation();

    // Initialize i18n on mount
    useEffect(() => {
        const init = async () => {
            try {
                // First, try to get cached settings for faster startup
                const cached = await getCachedSettings();
                await initI18n(cached?.language || null);
                setCurrentLanguage(getCurrentLanguage());
                setIsInitialized(true);
                console.log('✅ I18n initialized with language:', i18n.language);
            } catch (error) {
                console.error('Failed to initialize i18n:', error);
                // Initialize with default language on error
                await initI18n('en');
                setCurrentLanguage('en');
                setIsInitialized(true);
            }
        };
        init();
    }, []);

    // Listen for i18n language changes
    useEffect(() => {
        if (!isInitialized) return;

        const handleLanguageChange = (lng: string) => {
            setCurrentLanguage(lng as AppLanguage);
        };

        i18n.on('languageChanged', handleLanguageChange);
        return () => {
            i18n.off('languageChanged', handleLanguageChange);
        };
    }, [isInitialized]);

    // Sync with DB settings when they load
    useEffect(() => {
        if (isInitialized && settings?.language && settings.language !== i18n.language) {
            console.log('Syncing language from DB:', settings.language);
            changeAppLanguage(settings.language);
        }
    }, [settings?.language, isInitialized]);

    // Change language handler - updates both local and DB
    const handleChangeLanguage = useCallback(async (language: AppLanguage) => {
        if (language === i18n.language) {
            console.log('Language already set to:', language);
            return;
        }
        
        setIsChangingLanguage(true);
        try {
            // Update local immediately for instant feedback
            await changeAppLanguage(language);
            
            // Sync to DB if authenticated
            if (isAuthenticated) {
                try {
                    await updateLanguageInDb(language).unwrap();
                    console.log('✅ Language synced to DB:', language);
                } catch (dbError) {
                    // Don't revert local change - DB sync failed but local works
                    console.warn('Failed to sync language to DB:', dbError);
                }
            }
        } catch (error) {
            console.error('Failed to change language:', error);
        } finally {
            setIsChangingLanguage(false);
        }
    }, [isAuthenticated, updateLanguageInDb]);

    const contextValue: I18nContextType = {
        isInitialized,
        currentLanguage,
        availableLanguages: AVAILABLE_LANGUAGES,
        changeLanguage: handleChangeLanguage,
        isChangingLanguage,
    };

    // Show nothing until i18n is initialized (prevents flash)
    if (!isInitialized) {
        return null;
    }

    return (
        <I18nContext.Provider value={contextValue}>
            {children}
        </I18nContext.Provider>
    );
};