import { StyleSheet } from 'react-native';
import { Theme } from '../../../../shared/ui/theme/types';

export const phaseStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      padding: theme.spacing['2xl'],
    },
    icon: {
      alignSelf: 'center',
      marginBottom: theme.spacing['2xl'],
    },
    title: {
      ...theme.typography.heading.h5,
      fontWeight: theme.typography.fontWeight.bold,
      textAlign: 'center',
      color: theme.colors.text.primary,
      marginBottom: theme.spacing.lg,
    },
    text: {
      ...theme.typography.body.medium,
      textAlign: 'center',
      color: theme.colors.text.secondary,
      lineHeight: 24,
      marginBottom: theme.spacing['3xl'],
    },
    button: {
      backgroundColor: theme.colors.success.main,
      paddingVertical: theme.spacing.md,
      paddingHorizontal: theme.spacing['2xl'],
      borderRadius: theme.layout.borderRadius.md,
      alignItems: 'center',
      marginTop: theme.spacing.lg,
    },
    buttonText: {
      color: theme.colors.text.inverse,
      ...theme.typography.body.medium,
      fontWeight: theme.typography.fontWeight.bold,
    },
    disabledButton: {
      opacity: 0.7,
      backgroundColor: theme.colors.success.light,
    },
    timerContainer: {
      marginBottom: theme.spacing.lg,
    },
    timerText: {
      ...theme.typography.body.medium,
      fontWeight: theme.typography.fontWeight.bold,
      color: theme.colors.text.primary,
      marginBottom: theme.spacing.sm,
      textAlign: 'center',
    },
    timerBar: {
      height: 10,
      backgroundColor: theme.colors.background.tertiary,
      borderRadius: 5,
      overflow: 'hidden',
    },
    timerProgress: {
      height: '100%',
      backgroundColor: theme.colors.success.main,
    },
    input: {
      borderWidth: 1,
      borderColor: theme.colors.border.light,
      borderRadius: theme.layout.borderRadius.md,
      padding: theme.spacing.md,
      minHeight: 120,
      textAlignVertical: 'top',
      color: theme.colors.text.primary,
      marginBottom: theme.spacing.lg,
    },
    label: {
      ...theme.typography.body.small,
      color: theme.colors.text.secondary,
      marginBottom: theme.spacing.sm,
    },
    resultContainer: {
      backgroundColor: theme.colors.background.tertiary,
      padding: theme.spacing.lg,
      borderRadius: theme.layout.borderRadius.md,
      marginBottom: theme.spacing.lg,
    },
    resultRow: {
      marginBottom: theme.spacing.md,
    },
    resultLabel: {
      ...theme.typography.body.small,
      color: theme.colors.text.secondary,
      marginBottom: 4,
    },
    resultValue: {
      ...theme.typography.body.medium,
      color: theme.colors.text.primary,
      fontWeight: theme.typography.fontWeight.medium,
    },
    badge: {
      alignSelf: 'flex-start',
      paddingVertical: 4,
      paddingHorizontal: theme.spacing.md,
      borderRadius: theme.layout.borderRadius.lg,
      marginTop: theme.spacing.sm,
    },
    badgeText: {
      color: theme.colors.text.inverse,
      fontWeight: theme.typography.fontWeight.bold,
      fontSize: 12,
    },
    correctBadge: {
      backgroundColor: theme.colors.success.main,
    },
    incorrectBadge: {
      backgroundColor: theme.colors.error.main,
    },
  });
