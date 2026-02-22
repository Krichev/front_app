import { createStyles } from '../../../shared/ui/theme/createStyles';

export const themeStyles = createStyles(theme => ({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background.secondary,
    },
    keyboardAvoidContainer: {
        flex: 1,
    },
    header: {
        backgroundColor: theme.colors.success.main,
        padding: theme.spacing.md,
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: theme.typography.fontSize.xl,
        fontWeight: theme.typography.fontWeight.bold,
        color: theme.colors.text.inverse,
    },
    headerSubtitle: {
        fontSize: theme.typography.fontSize.sm,
        color: theme.colors.overlay.medium,
        marginTop: theme.spacing.xs,
    },
    searchSection: {
        padding: theme.spacing.md,
        flexDirection: 'row',
    },
    searchInput: {
        flex: 1,
        height: 44,
        backgroundColor: theme.colors.neutral.white,
        borderWidth: 1,
        borderColor: theme.colors.border.light,
        borderRadius: theme.layout.borderRadius.sm,
        paddingHorizontal: theme.spacing.sm,
    },
    searchButton: {
        backgroundColor: theme.colors.success.main,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: theme.spacing.md,
        marginLeft: theme.spacing.sm,
        borderRadius: theme.layout.borderRadius.sm,
    },
    recentSearches: {
        paddingHorizontal: theme.spacing.md,
        marginBottom: theme.spacing.sm,
    },
    sectionLabel: {
        fontSize: theme.typography.fontSize.xs,
        fontWeight: theme.typography.fontWeight.bold,
        color: theme.colors.text.secondary,
        marginBottom: theme.spacing.sm,
    },
    recentSearchItem: {
        backgroundColor: theme.colors.neutral.gray[300],
        paddingHorizontal: theme.spacing.sm,
        paddingVertical: theme.spacing.xs,
        borderRadius: theme.layout.borderRadius.xl,
        marginRight: theme.spacing.sm,
    },
    recentSearchText: {
        fontSize: theme.typography.fontSize.sm,
        color: theme.colors.text.primary,
    },
    difficultyFilter: {
        paddingHorizontal: theme.spacing.md,
        marginBottom: theme.spacing.md,
    },
    difficultyButtons: {
        flexDirection: 'row',
    },
    difficultyButton: {
        backgroundColor: theme.colors.neutral.gray[100],
        paddingHorizontal: theme.spacing.md,
        paddingVertical: theme.spacing.sm,
        borderRadius: theme.layout.borderRadius.sm,
        marginRight: theme.spacing.sm,
    },
    selectedDifficulty: {
        backgroundColor: theme.colors.success.main,
    },
    difficultyText: {
        fontSize: theme.typography.fontSize.sm,
        color: theme.colors.text.secondary,
    },
    selectedDifficultyText: {
        color: theme.colors.text.inverse,
        fontWeight: theme.typography.fontWeight.bold,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: theme.spacing.sm,
        fontSize: theme.typography.fontSize.base,
        color: theme.colors.text.secondary,
    },
    questionsList: {
        flex: 1,
    },
    questionsContainer: {
        paddingHorizontal: theme.spacing.md,
        paddingBottom: theme.spacing.md,
    },
    questionItem: {
        backgroundColor: theme.colors.neutral.white,
        borderRadius: theme.layout.borderRadius.sm,
        padding: theme.spacing.md,
        marginBottom: theme.spacing.sm,
        borderWidth: 1,
        borderColor: theme.colors.border.light,
    },
    selectedItem: {
        borderColor: theme.colors.success.main,
        borderWidth: 2,
        backgroundColor: theme.colors.success.background,
    },
    questionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: theme.spacing.sm,
    },
    questionDifficulty: {
        fontSize: theme.typography.fontSize.xs,
        fontWeight: theme.typography.fontWeight.bold,
        color: theme.colors.text.secondary,
        backgroundColor: theme.colors.neutral.gray[100],
        paddingHorizontal: theme.spacing.sm,
        paddingVertical: theme.spacing.xs,
        borderRadius: theme.layout.borderRadius.xs,
    },
    questionTopic: {
        fontSize: theme.typography.fontSize.xs,
        color: theme.colors.text.disabled,
        fontStyle: 'italic',
    },
    questionText: {
        fontSize: theme.typography.fontSize.base,
        color: theme.colors.text.primary,
        marginBottom: theme.spacing.md,
    },
    questionFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    answerPreview: {
        fontSize: theme.typography.fontSize.sm,
        color: theme.colors.text.secondary,
        fontStyle: 'italic',
    },
    selectButton: {
        backgroundColor: theme.colors.neutral.gray[300],
        paddingHorizontal: theme.spacing.sm,
        paddingVertical: theme.spacing.xs,
        borderRadius: theme.layout.borderRadius.xs,
    },
    selectButtonText: {
        fontSize: theme.typography.fontSize.xs,
        color: theme.colors.text.primary,
        fontWeight: theme.typography.fontWeight.medium,
    },
    actionButtons: {
        flexDirection: 'row',
        padding: theme.spacing.md,
        borderTopWidth: 1,
        borderTopColor: theme.colors.border.light,
        backgroundColor: theme.colors.neutral.white,
    },
    primaryButton: {
        flex: 2,
        backgroundColor: theme.colors.success.main,
        paddingVertical: theme.spacing.sm,
        borderRadius: theme.layout.borderRadius.sm,
        alignItems: 'center',
    },
    secondaryButton: {
        flex: 1,
        backgroundColor: theme.colors.neutral.gray[100],
        paddingVertical: theme.spacing.sm,
        borderRadius: theme.layout.borderRadius.sm,
        alignItems: 'center',
        marginRight: theme.spacing.md,
    },
    disabledButton: {
        backgroundColor: theme.colors.neutral.gray[400],
    },
    buttonText: {
        color: theme.colors.text.inverse,
        fontSize: theme.typography.fontSize.base,
        fontWeight: theme.typography.fontWeight.bold,
    },
    secondaryButtonText: {
        color: theme.colors.text.primary,
        fontSize: theme.typography.fontSize.sm,
        fontWeight: theme.typography.fontWeight.medium,
    },
}));
