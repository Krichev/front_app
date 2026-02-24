import {StyleSheet} from 'react-native';
import {Theme} from '../../../../shared/ui/theme/types';

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
        videoContainer: {
            marginBottom: theme.spacing.lg,
            backgroundColor: theme.colors.background.tertiary,
            borderRadius: theme.layout.borderRadius.lg,
            overflow: 'hidden',
            width: '100%',
        },
        mediaContainer: {
            width: '100%',
            aspectRatio: 16 / 9,
            overflow: 'hidden',
            borderRadius: 8
        },
        mediaContainerFlexible: {
            width: '100%',
            overflow: 'hidden',
            borderRadius: 8,
        },
        mediaHeader: {
            flexDirection: 'row',
            alignItems: 'center',
            padding: theme.spacing.md,
            backgroundColor: theme.colors.background.tertiary,
            gap: theme.spacing.sm,
        },
        voiceRecorderContainer: {
            marginBottom: theme.spacing.lg,
            backgroundColor: theme.colors.background.tertiary,
            padding: theme.spacing.md,
            borderRadius: theme.layout.borderRadius.md,
        },
        transcriptionContainer: {
            marginTop: theme.spacing.sm,
            backgroundColor: theme.colors.background.tertiary,
            padding: theme.spacing.md,
            borderRadius: theme.layout.borderRadius.md,
        },
        transcriptionLabel: {
            ...theme.typography.body.small,
            fontWeight: theme.typography.fontWeight.bold,
            color: theme.colors.text.secondary,
            marginBottom: 4,
        },
        transcriptionText: {
            ...theme.typography.body.small,
            color: theme.colors.text.primary,
            fontStyle: 'italic',
        },
        questionContent: {
            width: '100%',
            marginBottom: theme.spacing.lg,
        },
        readingContainer: {
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            padding: theme.spacing.xl,
        },
        readingCountdown: {
            ...theme.typography.heading.h2,
            color: theme.colors.success.main,
            marginVertical: theme.spacing.lg,
        },
        skipButton: {
            backgroundColor: theme.colors.background.tertiary,
            paddingVertical: theme.spacing.md,
            paddingHorizontal: theme.spacing.xl,
            borderRadius: theme.layout.borderRadius.lg,
            marginTop: theme.spacing.xl,
        },
        skipButtonText: {
            color: theme.colors.text.secondary,
            ...theme.typography.body.medium,
            fontWeight: theme.typography.fontWeight.bold,
        },
        mediaPlaybackContainer: {
            flex: 1,
        },
        playbackProgress: {
            marginTop: theme.spacing.lg,
        },
        replayButton: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: theme.spacing.sm,
            padding: theme.spacing.md,
            marginTop: theme.spacing.lg,
            backgroundColor: theme.colors.background.tertiary,
            borderRadius: theme.layout.borderRadius.md,
        },
        continueButton: {
            backgroundColor: theme.colors.success.main,
            paddingVertical: theme.spacing.md,
            paddingHorizontal: theme.spacing['2xl'],
            borderRadius: theme.layout.borderRadius.md,
            alignItems: 'center',
            marginTop: theme.spacing.lg,
        },
        continueButtonText: {
            color: theme.colors.text.inverse,
            ...theme.typography.body.medium,
            fontWeight: theme.typography.fontWeight.bold,
        },
    });
