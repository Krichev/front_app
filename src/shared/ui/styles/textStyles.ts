import {StyleSheet} from 'react-native';
import type {Theme} from '../theme/types';

export const textStyles = (theme: Theme) =>
    StyleSheet.create({
        pageTitle: {
            ...theme.typography.heading.h3,
            color: theme.colors.text.primary,
            marginBottom: theme.spacing.lg,
        },
        sectionTitle: {
            ...theme.typography.heading.h5,
            color: theme.colors.text.primary,
            marginBottom: theme.spacing.md,
        },
        bodyText: {
            ...theme.typography.body.medium,
            color: theme.colors.text.primary,
            marginBottom: theme.spacing.sm,
        },
        caption: {
            ...theme.typography.caption,
            color: theme.colors.text.secondary,
        },
        link: {
            ...theme.typography.body.medium,
            color: theme.colors.primary.main,
            textDecorationLine: 'underline',
        },
        errorText: {
            ...theme.typography.body.small,
            color: theme.colors.error.main,
        },
        successText: {
            ...theme.typography.body.small,
            color: theme.colors.success.main,
        },
        label: {
            ...theme.typography.body.medium,
            fontWeight: theme.typography.fontWeight.medium,
            color: theme.colors.text.primary,
        },
        buttonText: {
            ...theme.typography.button,
            color: theme.colors.text.inverse,
        },
    });
