import {useState} from 'react';
import {EMPTY_LOCALIZED_STRING, hasAtLeastOneLanguage, LocalizedString} from '../../types/localized';
import {useI18n} from '../../../app/providers/I18nProvider';
import {AppLanguage} from '../../../entities/SettingsState/model/types/settings.types';

export const useLocalizedInput = (initialValue: LocalizedString = EMPTY_LOCALIZED_STRING) => {
  const [value, setValue] = useState<LocalizedString>(initialValue);
  const { currentLanguage } = useI18n();
  
  const updateLanguage = (lang: AppLanguage, text: string) => {
    setValue((prev: any) => ({ ...prev, [lang]: text }));
  };
  
  const getCurrentValue = () => value[currentLanguage] || value.en || value.ru;
  
  const isValid = (requireBoth: boolean = false) => {
    if (requireBoth) {
      return !!value.en.trim() && !!value.ru.trim();
    }
    return hasAtLeastOneLanguage(value);
  };
  
  return { value, setValue, updateLanguage, getCurrentValue, isValid };
};
