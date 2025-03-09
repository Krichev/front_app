import React from 'react';
import {useTranslation} from "react-i18next";
import {Button, ButtonTheme} from "../Button/Button.tsx";

interface LangSwitcherProps {
    style?: any;
    short?: boolean;
}

export const LangSwitcher: React.FC<LangSwitcherProps> = ({ style, short }) => {
    const { t, i18n } = useTranslation();

    const toggle = async () => {
        await i18n.changeLanguage(i18n.language === 'ru' ? 'en' : 'ru');
    };

    return (
        <Button
            style={style}
            theme={ButtonTheme.CLEAR}
            onPress={toggle}
        >
            {t(short ? 'Короткий язык' : 'Язык')}
        </Button>
    );
};