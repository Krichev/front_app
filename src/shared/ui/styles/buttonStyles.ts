import {StyleSheet} from 'react-native';
import type {Theme} from '../theme/types';

export const buttonStyles = (theme: Theme) =>
    StyleSheet.create({
        primaryButton: {
            backgroundColor: theme.colors.primary.main,
            paddingVertical: theme.spacing.md,
            paddingHorizontal: theme.spacing.xl,
            borderRadius: theme.layout.borderRadius.md,
            alignItems: 'center',
            justifyContent: 'center',
        },
        primaryButtonText: {
            ...theme.typography.button,
            color: theme.colors.text.inverse,
        },
        secondaryButton: {
            backgroundColor: 'transparent',
            paddingVertical: theme.spacing.md,
            paddingHorizontal: theme.spacing.xl,
            borderRadius: theme.layout.borderRadius.md,
            borderWidth: 1,
            borderColor: theme.colors.primary.main,
            alignItems: 'center',
        },
        secondaryButtonText: {
            ...theme.typography.button,
            color: theme.colors.primary.main,
        },
        disabledButton: {
            backgroundColor: theme.colors.background.tertiary,
            opacity: 0.7,
        },
        iconButton: {
            padding: theme.spacing.sm,
            borderRadius: theme.layout.borderRadius.full,
        },
    });
