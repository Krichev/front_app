import {StyleSheet} from 'react-native';
import type {Theme} from '../theme/types';

export const cardStyles = (theme: Theme) =>
    StyleSheet.create({
        base: {
            backgroundColor: theme.colors.background.primary,
            borderRadius: theme.layout.borderRadius.lg,
            ...theme.shadows.small,
            overflow: 'hidden',
            marginBottom: theme.spacing.md,
        },
        header: {
            padding: theme.spacing.md,
            borderBottomWidth: 1,
            borderBottomColor: theme.colors.border.light,
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
        },
        content: {
            padding: theme.spacing.md,
        },
        footer: {
            padding: theme.spacing.md,
            borderTopWidth: 1,
            borderTopColor: theme.colors.border.light,
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
        },
        mediaCard: {
            backgroundColor: theme.colors.background.secondary,
            borderRadius: theme.layout.borderRadius.md,
            padding: theme.spacing.md,
            borderWidth: 1,
            borderColor: theme.colors.border.main,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
        },
        questionCard: {
            backgroundColor: theme.colors.background.primary,
            borderRadius: theme.layout.borderRadius.md,
            padding: theme.spacing.lg,
            marginBottom: theme.spacing.md,
            borderWidth: 1,
            borderColor: theme.colors.border.light,
        },
        selectedCard: {
            borderColor: theme.colors.primary.main,
            borderWidth: 2,
            backgroundColor: theme.colors.success.background,
        },
    });
