import React from 'react';
import { View, TouchableOpacity, Text } from 'react-native';
import { useTheme } from '../../../shared/ui/theme/ThemeProvider';
import { createStyles } from './AnswerOptions.styles';
import { AnswerOption } from '../model/types';

interface AnswerOptionsProps {
  options: AnswerOption[];
  onSelect: (answer: string) => void;
  selectedAnswer: string | null;
  correctAnswer?: string | null; // Provided during feedback
  disabled: boolean;
}

export const AnswerOptions: React.FC<AnswerOptionsProps> = ({
  options,
  onSelect,
  selectedAnswer,
  correctAnswer,
  disabled,
}) => {
  const { theme } = useTheme();
  const styles = React.useMemo(() => createStyles(theme), [theme]);

  const renderButton = (option: AnswerOption) => {
    const isSelected = selectedAnswer === option.title;
    const isCorrect = correctAnswer === option.title;
    const isWrong = isSelected && correctAnswer && !isCorrect;

    let backgroundColor = theme.colors.background.secondary;
    let textColor = theme.colors.text.primary;
    let borderColor = 'transparent';
    let borderWidth = 0;

    if (correctAnswer) {
      // Feedback Phase
      if (isCorrect) {
        backgroundColor = theme.colors.success.main;
        textColor = theme.colors.success.contrast;
      } else if (isWrong) {
        backgroundColor = theme.colors.error.main;
        textColor = theme.colors.error.contrast;
      } else {
        // Dim other options
        backgroundColor = theme.colors.background.primary;
        textColor = theme.colors.text.disabled;
      }
    } else {
      // Guessing Phase
      if (isSelected) {
        backgroundColor = theme.colors.primary.light;
        textColor = theme.colors.primary.contrast;
        borderColor = theme.colors.primary.main;
        borderWidth = 2;
      }
    }

    return (
      <View
        key={option.title}
        style={[
          styles.buttonContainer,
          { backgroundColor, borderColor, borderWidth },
        ]}
      >
        <TouchableOpacity
          style={styles.button}
          onPress={() => onSelect(option.title)}
          disabled={disabled}
          activeOpacity={0.7}
        >
          <Text
            style={[styles.text, { color: textColor }]}
            numberOfLines={3}
            adjustsFontSizeToFit
          >
            {option.title}
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  // Grid layout: 2 rows of 2
  const row1 = options.slice(0, 2);
  const row2 = options.slice(2, 4);

  return (
    <View style={styles.container}>
      <View style={styles.row}>{row1.map(renderButton)}</View>
      <View style={styles.row}>{row2.map(renderButton)}</View>
    </View>
  );
};