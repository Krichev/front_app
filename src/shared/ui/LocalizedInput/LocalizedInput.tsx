import React, {useEffect, useState} from 'react';
import {Text, TextInputProps, TouchableOpacity, View} from 'react-native';
import {useTranslation} from 'react-i18next';
import {useI18n} from '../../../app/providers/I18nProvider';
import {createStyles, useStyles} from '../theme';
import {AppLanguage} from '../../../entities/SettingsState/model/types/settings.types';
import {LocalizedString} from '../../types/localized';
import {Input} from '../Input/Input';

interface LocalizedInputProps extends Omit<TextInputProps, 'value' | 'onChangeText' | 'placeholder'> {
  value: LocalizedString;
  onChangeLocalized: (value: LocalizedString) => void;
  label?: string;
  placeholder?: LocalizedString;
  multiline?: boolean;
  numberOfLines?: number;
  required?: boolean;
  requireBoth?: boolean;
  error?: string;
  disabled?: boolean;
}

const LocalizedInput: React.FC<LocalizedInputProps> = ({
  value,
  onChangeLocalized,
  label,
  placeholder,
  multiline,
  required,
  requireBoth,
  error,
  disabled,
  ...rest
}) => {
  const { t } = useTranslation();
  const { currentLanguage: appLanguage } = useI18n();
  const [activeLang, setActiveLang] = useState<AppLanguage>(appLanguage);
  const { styles } = useStyles(themeStyles);

  useEffect(() => {
    setActiveLang(appLanguage);
  }, [appLanguage]);

  const handleTextChange = (text: string) => {
    onChangeLocalized({ ...value, [activeLang]: text });
  };

  const languages: AppLanguage[] = ['en', 'ru'];
  const otherLang = languages.find(l => l !== activeLang) as AppLanguage;

  const renderTab = (lang: AppLanguage) => {
    const isActive = lang === activeLang;
    const hasContent = value[lang]?.trim().length > 0;
    const otherHasContent = value[otherLang]?.trim().length > 0;
    const showIndicator = !hasContent && otherHasContent;

    return (
      <TouchableOpacity
        key={lang}
        style={[styles.tab, isActive && styles.activeTab]}
        onPress={() => setActiveLang(lang)}
        disabled={disabled}
      >
        <Text style={[styles.tabText, isActive && styles.activeTabText]}>
          {t(`common:localizedInput.${lang === 'en' ? 'english' : 'russian'}`)}
        </Text>
        {showIndicator && <View style={styles.indicator} />}
      </TouchableOpacity>
    );
  };

  const currentPlaceholder = placeholder ? placeholder[activeLang] : '';
  const fallbackLang = activeLang === 'en' ? 'ru' : 'en';
  const hint = !value[activeLang] && value[fallbackLang] 
    ? t('common:localizedInput.emptyLanguageHint', { fallback: t(`common:localizedInput.${fallbackLang === 'en' ? 'english' : 'russian'}`) })
    : undefined;

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={styles.tabsContainer}>
        {languages.map(renderTab)}
      </View>
      <Input
        value={value[activeLang] || ''}
        onChangeText={handleTextChange}
        placeholder={currentPlaceholder}
        multiline={multiline}
        numberOfLines={multiline ? numberOfLines : 1}
        disabled={disabled}
        error={error}
        hint={hint}
        {...rest}
      />
    </View>
  );
};

const themeStyles = createStyles(theme => ({
  container: {
    width: '100%',
  },
  label: {
    fontSize: 16,
    color: theme.colors.text,
    marginBottom: 8,
  },
  tabsContainer: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  tab: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginRight: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  tabText: {
    fontSize: 14,
    color: theme.colors.text,
  },
  activeTabText: {
    color: theme.colors.onPrimary,
  },
  indicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: theme.colors.accent,
    marginLeft: 6,
  },
}));

export { LocalizedInput };
export type { LocalizedInputProps };
