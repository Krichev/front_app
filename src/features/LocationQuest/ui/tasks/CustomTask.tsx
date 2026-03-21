import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useAppStyles } from '../../../../shared/ui/hooks/useAppStyles';
import { createStyles } from '../../../../shared/ui/theme/createStyles';
import { WaypointTask } from '../../../../entities/LocationQuest/model/types';

interface CustomTaskProps {
  task: WaypointTask;
  onComplete: (proof: undefined, note: string) => void;
}

const CustomTask: React.FC<CustomTaskProps> = ({ task, onComplete }) => {
  const { t } = useTranslation();
  const { theme, button, form } = useAppStyles();
  const styles = themeStyles;

  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = () => {
    setIsSubmitting(true);
    onComplete(undefined, note.trim());
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t('locationQuest.tasks.custom.title')}</Text>
      
      <View style={styles.instructionsContainer}>
        <Text style={styles.instructions}>{task.instructions}</Text>
      </View>

      {task.requiresNote && (
        <TextInput
          style={[form.input, styles.noteInput]}
          placeholder={t('locationQuest.tasks.custom.notePlaceholder')}
          placeholderTextColor={theme.colors.text.disabled}
          value={note}
          onChangeText={setNote}
          multiline
          numberOfLines={3}
        />
      )}

      <TouchableOpacity 
        style={[button.primaryButton, styles.submitButton]} 
        onPress={handleSubmit}
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          <ActivityIndicator color={theme.colors.neutral.white} />
        ) : (
          <Text style={button.primaryButtonText}>{t('locationQuest.tasks.custom.markComplete')}</Text>
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
  instructionsContainer: {
    backgroundColor: theme.colors.background.tertiary,
    padding: theme.spacing.md,
    borderRadius: theme.layout.borderRadius.md,
    marginBottom: theme.spacing.xl,
  },
  instructions: {
    ...theme.typography.body.large,
    color: theme.colors.text.primary,
    lineHeight: 24,
  },
  noteInput: {
    height: 80,
    textAlignVertical: 'top',
    paddingTop: theme.spacing.sm,
  },
  submitButton: {
    marginTop: theme.spacing.xl,
    width: '100%',
  },
}));

export default CustomTask;
