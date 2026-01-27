// src/shared/ui/LangSwitcher/LangSwitcher.tsx
import React from 'react';
import { ActivityIndicator, ViewStyle } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useI18n } from '../../../app/providers/I18nProvider';
import { Button, ButtonTheme } from '../Button/Button';
import { AppLanguage } from '../../../entities/SettingsState/model/types/settings.types';

interface LangSwitcherProps {
    style?: ViewStyle;
    short?: boolean;
}

export const LangSwitcher: React.FC<LangSwitcherProps> = ({ style, short = false }) => {
    const { t } = useTranslation();
    const { currentLanguage, changeLanguage, isChangingLanguage } = useI18n();

    const toggle = async () => {
        const newLang: AppLanguage = currentLanguage === 'ru' ? 'en' : 'ru';
        await changeLanguage(newLang);
    };

    if (isChangingLanguage) {
        return <ActivityIndicator size="small" style={style} />;
    }

    const displayText = short 
        ? (currentLanguage === 'ru' ? '🇷🇺 RU' : '🇺🇸 EN')
        : t('settings.language');

    return (
        <Button
            style={style}
            variant={ButtonTheme.CLEAR}
            onPress={toggle}
        >
            {displayText}
        </Button>
    );
};
