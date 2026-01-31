import React, {useEffect, useState} from 'react';
import {StyleSheet, Text, TextInputProps, TouchableOpacity, View, TextStyle} from 'react-native';
import {useTranslation} from 'react-i18next';
import {useI18n} from '../../../app/providers/I18nProvider';
import {createStyles} from '../theme';
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

const LATIN_REGEX = /[a-zA-Z]/;
const CYRILLIC_REGEX = /[а-яА-ЯёЁ]/;

const themeStyles = createStyles(theme => ({
  container: {
    width: '100%',
  },
  label: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
  },
  tabsContainer: {
    flexDirection: 'row',
    marginBottom: theme.spacing.sm,
  },
  tab: {
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.layout.borderRadius.lg,
    borderWidth: theme.layout.borderWidth.thin,
    borderColor: theme.colors.border.main,
    marginRight: theme.spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: theme.colors.primary.main,
    borderColor: theme.colors.primary.main,
  },
  tabText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.primary,
  },
  activeTabText: {
    color: theme.colors.text.inverse,
  },
  indicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: theme.colors.warning.main,
    marginLeft: theme.spacing.xs,
  },
  mismatchWarning: {
    marginTop: theme.spacing.xs,
    paddingVertical: 2,
  },
  mismatchWarningText: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.warning.main,
  },
  mismatchAction: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.primary.main,
    textDecorationLine: 'underline',
  },
}));

const LocalizedInput: React.FC<LocalizedInputProps> = ({
  value,
  onChangeLocalized,
  label,
  placeholder,
  multiline,
  numberOfLines,
  required,
  requireBoth,
  error,
  disabled,
  style,
  ...rest
}) => {
  const { t } = useTranslation();
  const { currentLanguage: appLanguage } = useI18n();
  const [activeLang, setActiveLang] = useState<AppLanguage>(appLanguage);
  const [mismatchWarning, setMismatchWarning] = useState<string | undefined>();
  const styles = themeStyles;

  useEffect(() => {
    setActiveLang(appLanguage);
  }, [appLanguage]);

  useEffect(() => {
    setMismatchWarning(undefined);
  }, [activeLang]);

  const handleTextChange = (text: string) => {
    onChangeLocalized({ ...value, [activeLang]: text });

    // Detect language mismatch after 2+ chars
    if (text.length >= 2) {
      const hasLatin = LATIN_REGEX.test(text);
      const hasCyrillic = CYRILLIC_REGEX.test(text);

      if (activeLang === 'ru' && hasLatin && !hasCyrillic) {
        setMismatchWarning(t('common:localizedInput.mismatchLatinOnRu'));
      } else if (activeLang === 'en' && hasCyrillic && !hasLatin) {
        setMismatchWarning(t('common:localizedInput.mismatchCyrillicOnEn'));
      } else {
        setMismatchWarning(undefined);
      }
    } else {
      setMismatchWarning(undefined);
    }
  };

  const handleAutoSwitchLang = () => {
    const targetLang = activeLang === 'ru' ? 'en' : 'ru';
    const currentText = value[activeLang] || '';

    // Move text to the correct language slot
    onChangeLocalized({
      ...value,
      [activeLang]: '', // Clear current slot
      [targetLang]: (value[targetLang] || '') + currentText, // Append to target slot
    });

    setActiveLang(targetLang);
    setMismatchWarning(undefined);
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
  
  const keyboardHint = activeLang === 'ru' 
    ? t('common:localizedInput.switchToRussianKeyboard')
    : undefined;

  const fallbackHint = !value[activeLang] && value[fallbackLang] 
    ? t('common:localizedInput.emptyLanguageHint', { fallback: t(`common:localizedInput.${fallbackLang === 'en' ? 'english' : 'russian'}`) })
    : undefined;

  const helperText = keyboardHint || fallbackHint;

  const flattenedStyle = StyleSheet.flatten(style) as TextStyle;

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
        error={!!error}
        errorText={error}
        helperText={helperText}
        style={flattenedStyle}
        {...rest}
      />
      {mismatchWarning && !disabled && (
        <TouchableOpacity onPress={handleAutoSwitchLang} style={styles.mismatchWarning}>
          <Text style={styles.mismatchWarningText}>
            {mismatchWarning} <Text style={styles.mismatchAction}>{t('common:localizedInput.tapToSwitch')}</Text>
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

export { LocalizedInput };
export type { LocalizedInputProps };
