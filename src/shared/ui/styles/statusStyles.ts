import {StyleSheet} from 'react-native';
import type {Theme} from '../theme/types';

export const statusStyles = (theme: Theme) =>
    StyleSheet.create({
        successBadge: {
            backgroundColor: theme.colors.success.main,
            paddingVertical: theme.spacing.xs,
            paddingHorizontal: theme.spacing.md,
            borderRadius: theme.layout.borderRadius.full,
        },
        errorBadge: {
            backgroundColor: theme.colors.error.main,
            paddingVertical: theme.spacing.xs,
            paddingHorizontal: theme.spacing.md,
            borderRadius: theme.layout.borderRadius.full,
        },
        warningBadge: {
            backgroundColor: theme.colors.warning.main,
            paddingVertical: theme.spacing.xs,
            paddingHorizontal: theme.spacing.md,
            borderRadius: theme.layout.borderRadius.full,
        },
        infoBadge: {
            backgroundColor: theme.colors.info.main,
            paddingVertical: theme.spacing.xs,
            paddingHorizontal: theme.spacing.md,
            borderRadius: theme.layout.borderRadius.full,
        },
        badgeText: {
            ...theme.typography.caption,
            color: theme.colors.text.inverse,
            fontWeight: theme.typography.fontWeight.bold,
        },
        progressBar: {
            height: theme.spacing.sm,
            backgroundColor: theme.colors.background.tertiary,
            borderRadius: theme.layout.borderRadius.full,
            overflow: 'hidden',
        },
        progressFill: {
            height: '100%',
            backgroundColor: theme.colors.primary.main,
        },
    });
