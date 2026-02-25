import React from 'react';
import {StyleSheet, Text, TextInputProps, View, TextStyle} from 'react-native';
import {useI18n} from '../../../app/providers/I18nProvider';
import {createStyles} from '../theme';
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
  error?: string;
  disabled?: boolean;
}

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
}));

const LocalizedInput: React.FC<LocalizedInputProps> = ({
  value,
  onChangeLocalized,
  label,
  placeholder,
  multiline,
  numberOfLines,
  required,
  error,
  disabled,
  style,
  ...rest
}) => {
  const { currentLanguage: appLanguage } = useI18n();
  const styles = themeStyles;

  const handleTextChange = (text: string) => {
    onChangeLocalized({ ...value, [appLanguage]: text });
  };

  const currentPlaceholder = placeholder ? placeholder[appLanguage] : '';
  const flattenedStyle = StyleSheet.flatten(style) as TextStyle;

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      <Input
        value={value[appLanguage] || ''}
        onChangeText={handleTextChange}
        placeholder={currentPlaceholder}
        multiline={multiline}
        numberOfLines={multiline ? numberOfLines : 1}
        disabled={disabled}
        error={!!error}
        errorText={error}
        style={flattenedStyle}
        keyboardType="default"
        autoCapitalize="sentences"
        autoCorrect={true}
        {...rest}
      />
    </View>
  );
};

export { LocalizedInput };
export type { LocalizedInputProps };