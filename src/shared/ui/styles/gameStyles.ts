import {StyleSheet} from 'react-native';
import type {Theme} from '../theme/types';

export const gameStyles = (theme: Theme) =>
    StyleSheet.create({
        darkContainer: {
            backgroundColor: theme.colors.background.dark || '#1a1a1a',
            borderRadius: theme.layout.borderRadius.lg,
            padding: theme.spacing.lg,
        },
        scoreContainer: {
            alignItems: 'center',
            padding: theme.spacing.lg,
        },
        scoreText: {
            ...theme.typography.heading.h2,
            color: theme.colors.primary.main,
        },
        timerText: {
            ...theme.typography.heading.h4,
            color: theme.colors.text.primary,
        },
        recordButton: {
            width: 60,
            height: 60,
            borderRadius: 30,
            justifyContent: 'center',
            alignItems: 'center',
            ...theme.shadows.medium,
        },
        recordButtonIdle: {
            backgroundColor: theme.colors.primary.main,
        },
        recordButtonActive: {
            backgroundColor: theme.colors.error.main,
        },
    });
