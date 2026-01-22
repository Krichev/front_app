import {StyleSheet} from 'react-native';
import type {Theme} from '../theme/types';

export const screenStyles = (theme: Theme) =>
    StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: theme.colors.background.primary,
        },
        safeArea: {
            flex: 1,
            backgroundColor: theme.colors.background.primary,
        },
        header: {
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: theme.spacing.lg,
            paddingVertical: theme.spacing.md,
            borderBottomWidth: 1,
            borderBottomColor: theme.colors.border.light,
            backgroundColor: theme.colors.background.primary,
        },
        headerTitle: {
            ...theme.typography.heading.h4,
            color: theme.colors.text.primary,
            flex: 1,
            textAlign: 'center',
        },
        content: {
            flex: 1,
            padding: theme.spacing.lg,
        },
        scrollContent: {
            flexGrow: 1,
            padding: theme.spacing.lg,
        },
        footer: {
            padding: theme.spacing.lg,
            borderTopWidth: 1,
            borderTopColor: theme.colors.border.light,
            backgroundColor: theme.colors.background.primary,
        },
        loadingContainer: {
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: theme.colors.background.primary,
        },
        errorContainer: {
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            padding: theme.spacing.xl,
            backgroundColor: theme.colors.background.primary,
        },
        centerContent: {
            justifyContent: 'center',
            alignItems: 'center',
        },
    });
