import {StyleSheet} from 'react-native';
import type {Theme} from '../theme/types';

export const modalStyles = (theme: Theme) =>
    StyleSheet.create({
        overlay: {
            flex: 1,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            justifyContent: 'center',
            alignItems: 'center',
            padding: theme.spacing.lg,
        },
        container: {
            backgroundColor: theme.colors.background.primary,
            borderRadius: theme.layout.borderRadius.xl,
            width: '100%',
            maxHeight: '90%',
            ...theme.shadows.large,
            overflow: 'hidden',
        },
        header: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: theme.spacing.lg,
            borderBottomWidth: 1,
            borderBottomColor: theme.colors.border.light,
        },
        headerTitle: {
            ...theme.typography.heading.h5,
            color: theme.colors.text.primary,
            flex: 1,
        },
        content: {
            padding: theme.spacing.lg,
        },
        footer: {
            flexDirection: 'row',
            justifyContent: 'flex-end',
            padding: theme.spacing.lg,
            borderTopWidth: 1,
            borderTopColor: theme.colors.border.light,
            gap: theme.spacing.md,
        },
        closeButton: {
            padding: theme.spacing.xs,
        },
        actionButton: {
            backgroundColor: theme.colors.primary.main,
            paddingVertical: theme.spacing.md,
            paddingHorizontal: theme.spacing.lg,
            borderRadius: theme.layout.borderRadius.md,
            alignItems: 'center',
            justifyContent: 'center',
        },
        actionButtonText: {
            ...theme.typography.button,
            color: theme.colors.text.inverse,
        },
        cancelButton: {
            backgroundColor: theme.colors.background.secondary,
            paddingVertical: theme.spacing.md,
            paddingHorizontal: theme.spacing.lg,
            borderRadius: theme.layout.borderRadius.md,
            alignItems: 'center',
            justifyContent: 'center',
        },
        cancelButtonText: {
            ...theme.typography.button,
            color: theme.colors.text.primary,
        },
    });
