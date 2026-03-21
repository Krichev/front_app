import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useAppStyles } from '../../../../shared/ui/hooks/useAppStyles';
import { createStyles } from '../../../../shared/ui/theme/createStyles';
import { WaypointTask } from '../../../../entities/LocationQuest/model/types';

interface TriviaQuestionTaskProps {
  task: WaypointTask;
  onComplete: (proof: undefined, answer: string) => void;
}

const TriviaQuestionTask: React.FC<TriviaQuestionTaskProps> = ({ task, onComplete }) => {
  const { t } = useTranslation();
  const { theme, button, form } = useAppStyles();
  const styles = themeStyles;

  const [answer, setAnswer] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = () => {
    if (!answer.trim()) return;
    
    setIsSubmitting(true);
    onComplete(undefined, answer.trim());
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t('locationQuest.tasks.triviaQuestion.title')}</Text>
      
      <View style={styles.questionContainer}>
        <Text style={styles.questionText}>{task.questionText || task.instructions}</Text>
      </View>

      <TextInput
        style={[form.input, task.multiline && styles.multilineInput]}
        placeholder={t('locationQuest.tasks.triviaQuestion.answerPlaceholder')}
        placeholderTextColor={theme.colors.text.disabled}
        value={answer}
        onChangeText={setAnswer}
        multiline={task.multiline}
        numberOfLines={task.multiline ? 4 : 1}
        autoFocus
      />

      <TouchableOpacity 
        style={[button.primaryButton, styles.submitButton, !answer.trim() && button.disabledButton]} 
        onPress={handleSubmit}
        disabled={!answer.trim() || isSubmitting}
      >
        {isSubmitting ? (
          <ActivityIndicator color={theme.colors.neutral.white} />
        ) : (
          <Text style={button.primaryButtonText}>{t('locationQuest.tasks.triviaQuestion.submit')}</Text>
        )}
      </TouchableOpacity>
    </View>
  );
};

const themeStyles = createStyles(theme => ({
  container: {
    padding: theme.spacing.xl,
    width: '100%',
  },
  title: {
    ...theme.typography.heading.h6,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.lg,
    textAlign: 'center',
  },
  questionContainer: {
    backgroundColor: theme.colors.background.tertiary,
    padding: theme.spacing.md,
    borderRadius: theme.layout.borderRadius.md,
    marginBottom: theme.spacing.xl,
  },
  questionText: {
    ...theme.typography.body.large,
    color: theme.colors.text.primary,
    lineHeight: 24,
  },
  multilineInput: {
    height: 100,
    textAlignVertical: 'top',
    paddingTop: theme.spacing.sm,
  },
  submitButton: {
    marginTop: theme.spacing.xl,
    width: '100%',
  },
}));

export default TriviaQuestionTask;
