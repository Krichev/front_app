import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../../shared/ui/theme/ThemeProvider';

interface QuizHeaderProps {
  currentQuestionIndex: number;
  totalQuestions: number;
  score: number;
}

export const QuizHeader: React.FC<QuizHeaderProps> = ({
  currentQuestionIndex,
  totalQuestions,
  score,
}) => {
  const { theme } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background.secondary }]}>
      <View style={styles.leftContainer}>
        <Text style={[styles.label, { color: theme.colors.text.secondary }]}>
          Question
        </Text>
        <Text style={[styles.value, { color: theme.colors.text.primary }]}>
          {currentQuestionIndex} / {totalQuestions}
        </Text>
      </View>

      <View style={styles.rightContainer}>
        <Text style={[styles.label, { color: theme.colors.text.secondary }]}>
          Score
        </Text>
        <Text style={[styles.value, { color: theme.colors.primary.main }]}>
          {score}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  leftContainer: {
    alignItems: 'flex-start',
  },
  rightContainer: {
    alignItems: 'flex-end',
  },
  label: {
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  value: {
    fontSize: 18,
    fontWeight: 'bold',
  },
});