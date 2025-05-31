// src/shared/styles/gameStyles.ts
import {StyleSheet} from 'react-native'
import {theme} from './theme'

export const gameStyles = StyleSheet.create({
    // Header styles
    gameHeader: {
        backgroundColor: theme.colors.primary,
        padding: theme.spacing.lg,
    },
    headerTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: theme.spacing.sm,
    },
    teamName: {
        fontSize: theme.fontSize.lg,
        fontWeight: theme.fontWeight.bold,
        color: theme.colors.text.inverse,
    },
    scoreText: {
        fontSize: theme.fontSize.lg,
        fontWeight: theme.fontWeight.bold,
        color: theme.colors.text.inverse,
    },
    gameTimeText: {
        fontSize: theme.fontSize.xs,
        color: 'rgba(255, 255, 255, 0.8)',
        textAlign: 'center',
        marginTop: theme.spacing.xs,
    },

    // Phase container
    phaseContainer: {
        backgroundColor: theme.colors.surface,
        borderRadius: theme.borderRadius.lg,
        padding: theme.spacing.lg,
        margin: theme.spacing.lg,
        ...theme.shadow.medium,
    },

    // Question styles
    questionNumber: {
        fontSize: theme.fontSize.sm,
        color: theme.colors.text.light,
        marginBottom: theme.spacing.sm,
    },
    question: {
        fontSize: theme.fontSize.xl,
        fontWeight: theme.fontWeight.bold,
        color: theme.colors.text.primary,
        marginBottom: theme.spacing.xl,
        lineHeight: 28,
    },

    // Result styles
    resultContainer: {
        backgroundColor: theme.colors.background,
        padding: theme.spacing.lg,
        borderRadius: theme.borderRadius.md,
        marginBottom: theme.spacing.lg,
    },
    resultLabel: {
        fontSize: theme.fontSize.sm,
        color: theme.colors.text.light,
        marginBottom: theme.spacing.xs,
    },
    resultValue: {
        fontSize: theme.fontSize.md,
        color: theme.colors.text.primary,
        fontWeight: theme.fontWeight.medium,
        marginBottom: theme.spacing.md,
    },
    resultBadge: {
        alignSelf: 'flex-start',
        paddingVertical: theme.spacing.xs,
        paddingHorizontal: theme.spacing.md,
        borderRadius: theme.borderRadius.round,
        marginBottom: theme.spacing.md,
        flexDirection: 'row',
        alignItems: 'center',
    },
    correctBadge: {
        backgroundColor: theme.colors.success,
    },
    incorrectBadge: {
        backgroundColor: theme.colors.error,
    },
    resultBadgeText: {
        color: theme.colors.text.inverse,
        fontWeight: theme.fontWeight.bold,
        fontSize: theme.fontSize.xs,
        marginLeft: theme.spacing.xs,
    },

    // Modal styles
    modalOverlay: {
        flex: 1,
        backgroundColor: theme.colors.overlay,
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        backgroundColor: theme.colors.surface,
        borderRadius: theme.borderRadius.lg,
        padding: theme.spacing.xl,
        width: '80%',
        alignItems: 'center',
        ...theme.shadow.large,
    },
    modalTitle: {
        fontSize: theme.fontSize.xl,
        fontWeight: theme.fontWeight.bold,
        color: theme.colors.text.primary,
        marginTop: theme.spacing.lg,
        marginBottom: theme.spacing.lg,
        textAlign: 'center',
    },
    modalText: {
        fontSize: theme.fontSize.md,
        color: theme.colors.text.secondary,
        marginBottom: theme.spacing.sm,
        textAlign: 'center',
    },
    modalScore: {
        fontSize: theme.fontSize.lg,
        fontWeight: theme.fontWeight.bold,
        color: theme.colors.primary,
        marginBottom: theme.spacing.xl,
        textAlign: 'center',
    },

    // Button variations for games
    primaryGameButton: {
        backgroundColor: theme.colors.primary,
        paddingVertical: theme.spacing.md,
        paddingHorizontal: theme.spacing.xl,
        borderRadius: theme.borderRadius.md,
        alignItems: 'center',
        flexDirection: 'row',
        justifyContent: 'center',
        ...theme.shadow.small,
    },
    secondaryGameButton: {
        backgroundColor: theme.colors.warning,
        paddingVertical: theme.spacing.md,
        paddingHorizontal: theme.spacing.xl,
        borderRadius: theme.borderRadius.md,
        alignItems: 'center',
        flexDirection: 'row',
        justifyContent: 'center',
    },
    gameButtonText: {
        color: theme.colors.text.inverse,
        fontSize: theme.fontSize.md,
        fontWeight: theme.fontWeight.bold,
        marginLeft: theme.spacing.sm,
    },

    // Input styles for games
    gameInput: {
        borderWidth: 1,
        borderColor: theme.colors.border,
        borderRadius: theme.borderRadius.md,
        padding: theme.spacing.md,
        fontSize: theme.fontSize.md,
        backgroundColor: theme.colors.surface,
        color: theme.colors.text.primary,
    },
    gameTextArea: {
        minHeight: 120,
        textAlignVertical: 'top',
    },

    // Loading and error states
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: theme.spacing.xl,
    },
    errorText: {
        fontSize: theme.fontSize.lg,
        color: theme.colors.error,
        fontWeight: theme.fontWeight.bold,
        marginTop: theme.spacing.lg,
        marginBottom: theme.spacing.sm,
        textAlign: 'center',
    },
    errorSubtext: {
        fontSize: theme.fontSize.sm,
        color: theme.colors.text.light,
        marginBottom: theme.spacing.xl,
        textAlign: 'center',
    },
})