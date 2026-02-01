import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useAppStyles } from '../../../../shared/ui/hooks/useAppStyles';
import { phaseStyles } from './phases.styles';
import { QuizRound } from '../../../../entities/QuizState/model/slice/quizApi';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

interface FeedbackPhaseProps {
  roundData: QuizRound;
  isCorrect: boolean;
  isLastRound: boolean;
  onNextRound: () => void;
  onComplete?: () => void; // Optional if handled by onNextRound for last round logic
}

export const FeedbackPhase: React.FC<FeedbackPhaseProps> = ({
  roundData,
  isCorrect,
  isLastRound,
  onNextRound,
  onComplete,
}) => {
  const { theme } = useAppStyles();
  const styles = phaseStyles(theme);

  const handlePress = () => {
    if (isLastRound && onComplete) {
      onComplete();
    } else {
      onNextRound();
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Round Results</Text>

      <View style={styles.resultContainer}>
        <View style={styles.resultRow}>
          <Text style={styles.resultLabel}>Question:</Text>
          <Text style={styles.resultValue}>{roundData.question.question}</Text>
        </View>

        <View style={styles.resultRow}>
          <Text style={styles.resultLabel}>Your Answer:</Text>
          <Text style={styles.resultValue}>{roundData.teamAnswer}</Text>
        </View>

        <View style={styles.resultRow}>
          <Text style={styles.resultLabel}>Correct Answer:</Text>
          <Text style={styles.resultValue}>{roundData.question.answer}</Text>
        </View>

        <View style={[styles.badge, isCorrect ? styles.correctBadge : styles.incorrectBadge]}>
          <Text style={styles.badgeText}>
            {isCorrect ? 'CORRECT' : 'INCORRECT'}
          </Text>
        </View>
      </View>

      {roundData['aiAccepted'] && (
        <View style={{ backgroundColor: theme.colors.success.background, padding: theme.spacing.md, borderRadius: theme.layout.borderRadius.md, marginBottom: theme.spacing.lg, flexDirection: 'row', alignItems: 'center' }}>
          <MaterialCommunityIcons name="robot" size={24} color={theme.colors.success.main} style={{ marginRight: theme.spacing.md }} />
          <View style={{ flex: 1 }}>
            <Text style={{ ...theme.typography.body.small, color: theme.colors.success.dark, fontWeight: theme.typography.fontWeight.bold }}>
              ✅ Accepted as equivalent (AI)
            </Text>
            {roundData['aiConfidence'] && (
              <Text style={{ ...theme.typography.caption, color: theme.colors.success.main }}>
                Confidence: {Math.round(roundData['aiConfidence'] * 100)}%
              </Text>
            )}
          </View>
        </View>
      )}

      {roundData['aiFeedback'] && (
        <View style={{ backgroundColor: theme.colors.info.background, padding: theme.spacing.lg, borderRadius: theme.layout.borderRadius.md, marginBottom: theme.spacing.lg }}>
          <Text style={{ ...theme.typography.body.small, color: theme.colors.info.dark, fontWeight: theme.typography.fontWeight.bold, marginBottom: theme.spacing.sm }}>
            AI Host Feedback:
          </Text>
          <Text style={{ color: theme.colors.text.primary }}>{roundData['aiFeedback']}</Text>
        </View>
      )}

      <TouchableOpacity
        style={styles.button}
        onPress={handlePress}
      >
        <Text style={styles.buttonText}>
          {isLastRound ? 'Finish Game' : 'Next Question'}
        </Text>
      </TouchableOpacity>
    </View>
  );
};