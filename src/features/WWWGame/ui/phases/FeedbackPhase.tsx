import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();
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
      <Text style={styles.title}>{t('wwwPhases.feedback.title')}</Text>

      <View style={styles.resultContainer}>
        <View style={styles.resultRow}>
          <Text style={styles.resultLabel}>{t('wwwPhases.feedback.question')}</Text>
          <Text style={styles.resultValue}>{roundData.question.question}</Text>
        </View>

        <View style={styles.resultRow}>
          <Text style={styles.resultLabel}>{t('wwwPhases.feedback.yourAnswer')}</Text>
          <Text style={styles.resultValue}>{roundData.teamAnswer}</Text>
        </View>

        <View style={styles.resultRow}>
          <Text style={styles.resultLabel}>{t('wwwPhases.feedback.correctAnswer')}</Text>
          <Text style={styles.resultValue}>{roundData.question.answer}</Text>
        </View>

        <View style={[styles.badge, isCorrect ? styles.correctBadge : styles.incorrectBadge]}>
          <Text style={styles.badgeText}>
            {isCorrect ? t('wwwPhases.feedback.correct') : t('wwwPhases.feedback.incorrect')}
          </Text>
        </View>
      </View>

      {roundData['aiFeedback'] && (
        <View style={{ backgroundColor: theme.colors.info.background, padding: theme.spacing.lg, borderRadius: theme.layout.borderRadius.md, marginBottom: theme.spacing.lg }}>
          <Text style={{ ...theme.typography.body.small, color: theme.colors.info.dark, fontWeight: theme.typography.fontWeight.bold, marginBottom: theme.spacing.sm }}>
            {t('wwwPhases.feedback.aiHostFeedback')}
          </Text>
          <Text style={{ color: theme.colors.text.primary }}>{roundData['aiFeedback']}</Text>
        </View>
      )}

      {roundData.aiAccepted && (
        <View style={{
            backgroundColor: '#E3F2FD',
            padding: theme.spacing.md,
            borderRadius: theme.layout.borderRadius.md,
            marginBottom: theme.spacing.lg,
            flexDirection: 'row',
            alignItems: 'center',
        }}>
            <Text style={{ fontSize: 18, marginRight: theme.spacing.sm }}>🤖</Text>
            <View style={{ flex: 1 }}>
                <Text style={{
                    ...theme.typography.body.small,
                    color: '#1565C0',
                    fontWeight: theme.typography.fontWeight.bold,
                    marginBottom: 2,
                }}>
                    {t('game.aiAcceptedBadge')}
                </Text>
                {roundData.aiExplanation && (
                    <Text style={{ ...theme.typography.body.small, color: '#1976D2' }}>
                        {roundData.aiExplanation}
                    </Text>
                )}
            </View>
        </View>
      )}

      <TouchableOpacity
        style={styles.button}
        onPress={handlePress}
      >
        <Text style={styles.buttonText}>
          {isLastRound ? t('wwwPhases.feedback.finishGame') : t('wwwPhases.feedback.nextQuestion')}
        </Text>
      </TouchableOpacity>
    </View>
  );
};