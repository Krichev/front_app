import React from 'react';
import { useTranslation } from 'react-i18next';
import { useI18n } from '../../../app/providers/I18nProvider';
import { Button, ButtonTheme } from '../Button/Button.tsx';

interface LangSwitcherProps {
  style?: any;
  short?: boolean;
}

export const LangSwitcher: React.FC<LangSwitcherProps> = ({ style, short }) => {
  const { t } = useTranslation();
  const { currentLanguage, changeLanguage } = useI18n();

  const toggle = async () => {
    const newLang = currentLanguage === 'ru' ? 'en' : 'ru';
    await changeLanguage(newLang);
  };

  return (
    <Button
      style={style}
      variant={ButtonTheme.CLEAR}
      onPress={toggle}
    >
      {t(short ? 'common.languageShort' : 'common.language')}
    </Button>
  );
};