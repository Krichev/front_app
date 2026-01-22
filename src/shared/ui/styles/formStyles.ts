import {StyleSheet} from 'react-native';
import type {Theme} from '../theme/types';

export const formStyles = (theme: Theme) =>
    StyleSheet.create({
        section: {
            backgroundColor: theme.colors.background.primary,
            borderRadius: theme.layout.borderRadius.lg,
            padding: theme.spacing.lg,
            marginBottom: theme.spacing.lg,
            ...theme.shadows.small,
        },
        sectionHeader: {
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: theme.spacing.md,
            gap: theme.spacing.sm,
        },
        sectionTitle: {
            ...theme.typography.heading.h6,
            color: theme.colors.text.primary,
        },
        formGroup: {
            marginBottom: theme.spacing.lg,
        },
        label: {
            ...theme.typography.body.medium,
            fontWeight: theme.typography.fontWeight.semibold,
            color: theme.colors.text.primary,
            marginBottom: theme.spacing.sm,
        },
        input: {
            backgroundColor: theme.colors.background.secondary,
            borderWidth: 1,
            borderColor: theme.colors.border.light,
            borderRadius: theme.layout.borderRadius.md,
            padding: theme.spacing.md,
            ...theme.typography.body.medium,
            color: theme.colors.text.primary,
        },
        textArea: {
            minHeight: 100,
            textAlignVertical: 'top',
        },
        inputError: {
            borderColor: theme.colors.error.main,
        },
        helperText: {
            ...theme.typography.caption,
            color: theme.colors.text.secondary,
            marginTop: theme.spacing.xs,
        },
        errorText: {
            ...theme.typography.caption,
            color: theme.colors.error.main,
            marginTop: theme.spacing.xs,
        },
        submitButton: {
            backgroundColor: theme.colors.primary.main,
            paddingVertical: theme.spacing.md,
            paddingHorizontal: theme.spacing.xl,
            borderRadius: theme.layout.borderRadius.md,
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'row',
            gap: theme.spacing.sm,
        },
        submitButtonDisabled: {
            backgroundColor: theme.colors.background.tertiary,
            opacity: 0.7,
        },
        submitButtonText: {
            ...theme.typography.button,
            color: theme.colors.text.inverse,
        },
        row: {
            flexDirection: 'row',
            gap: theme.spacing.md,
        },
        pickerContainer: {
            backgroundColor: theme.colors.background.secondary,
            borderWidth: 1,
            borderColor: theme.colors.border.light,
            borderRadius: theme.layout.borderRadius.md,
            overflow: 'hidden',
        },
        picker: {
            height: 50,
            color: theme.colors.text.primary,
        },
    });
