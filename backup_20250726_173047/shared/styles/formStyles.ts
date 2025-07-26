// src/shared/styles/formStyles.ts
import {StyleSheet} from 'react-native'
import {theme} from './theme'

export const formStyles = StyleSheet.create({
    // Container styles
    formContainer: {
        padding: theme.spacing.lg,
    },
    formSection: {
        backgroundColor: theme.colors.surface,
        borderRadius: theme.borderRadius.md,
        padding: theme.spacing.lg,
        marginBottom: theme.spacing.lg,
        ...theme.shadow.small,
    },
    formGroup: {
        marginBottom: theme.spacing.lg,
    },

    // Header styles
    sectionTitle: {
        fontSize: theme.fontSize.lg,
        fontWeight: theme.fontWeight.bold,
        color: theme.colors.text.primary,
        marginBottom: theme.spacing.lg,
    },
    sectionSubtitle: {
        fontSize: theme.fontSize.sm,
        color: theme.colors.text.secondary,
        marginBottom: theme.spacing.md,
    },

    // Input styles
    label: {
        fontSize: theme.fontSize.md,
        fontWeight: theme.fontWeight.medium,
        color: theme.colors.text.secondary,
        marginBottom: theme.spacing.sm,
    },
    labelRequired: {
        color: theme.colors.error,
    },
    input: {
        backgroundColor: theme.colors.background,
        borderWidth: 1,
        borderColor: theme.colors.border,
        borderRadius: theme.borderRadius.md,
        padding: theme.spacing.md,
        fontSize: theme.fontSize.md,
        color: theme.colors.text.primary,
        minHeight: 44,
    },
    inputError: {
        borderColor: theme.colors.error,
        backgroundColor: theme.colors.errorLight,
    },
    inputFocused: {
        borderColor: theme.colors.primary,
        borderWidth: 2,
    },
    textArea: {
        minHeight: 100,
        textAlignVertical: 'top',
    },

    // Button styles
    primaryButton: {
        backgroundColor: theme.colors.primary,
        paddingVertical: theme.spacing.md,
        paddingHorizontal: theme.spacing.xl,
        borderRadius: theme.borderRadius.md,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        minHeight: 48,
        ...theme.shadow.small,
    },
    secondaryButton: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: theme.colors.primary,
        paddingVertical: theme.spacing.md,
        paddingHorizontal: theme.spacing.xl,
        borderRadius: theme.borderRadius.md,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        minHeight: 48,
    },
    dangerButton: {
        backgroundColor: theme.colors.error,
        paddingVertical: theme.spacing.md,
        paddingHorizontal: theme.spacing.xl,
        borderRadius: theme.borderRadius.md,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        minHeight: 48,
    },
    disabledButton: {
        backgroundColor: theme.colors.disabled,
        opacity: 0.7,
    },
    buttonText: {
        fontSize: theme.fontSize.md,
        fontWeight: theme.fontWeight.bold,
        color: theme.colors.text.inverse,
        marginLeft: theme.spacing.sm,
    },
    secondaryButtonText: {
        color: theme.colors.primary,
    },
    buttonIcon: {
        marginRight: theme.spacing.sm,
    },

    // Selection styles
    selectionContainer: {
        backgroundColor: theme.colors.background,
        borderRadius: theme.borderRadius.md,
        borderWidth: 1,
        borderColor: theme.colors.border,
        overflow: 'hidden',
    },
    selectionOption: {
        paddingVertical: theme.spacing.md,
        paddingHorizontal: theme.spacing.lg,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.borderLight,
        flexDirection: 'row',
        alignItems: 'center',
    },
    selectedOption: {
        backgroundColor: theme.colors.primaryLight,
        borderColor: theme.colors.primary,
    },
    optionText: {
        fontSize: theme.fontSize.md,
        color: theme.colors.text.primary,
        flex: 1,
    },
    selectedOptionText: {
        color: theme.colors.primary,
        fontWeight: theme.fontWeight.bold,
    },
    optionIcon: {
        marginRight: theme.spacing.md,
    },

    // List styles
    listContainer: {
        backgroundColor: theme.colors.background,
        borderRadius: theme.borderRadius.md,
        borderWidth: 1,
        borderColor: theme.colors.border,
        maxHeight: 200,
    },
    listItem: {
        paddingVertical: theme.spacing.sm,
        paddingHorizontal: theme.spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.borderLight,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    selectedListItem: {
        backgroundColor: theme.colors.primaryLight,
    },
    listItemText: {
        fontSize: theme.fontSize.sm,
        color: theme.colors.text.primary,
        flex: 1,
    },
    listItemAction: {
        padding: theme.spacing.xs,
    },

    // Add/Remove controls
    addItemContainer: {
        flexDirection: 'row',
        marginTop: theme.spacing.md,
    },
    addItemInput: {
        flex: 1,
        height: 40,
        borderWidth: 1,
        borderColor: theme.colors.border,
        borderRadius: theme.borderRadius.sm,
        paddingHorizontal: theme.spacing.md,
        backgroundColor: theme.colors.surface,
        marginRight: theme.spacing.sm,
    },
    addButton: {
        width: 40,
        height: 40,
        borderRadius: theme.borderRadius.sm,
        backgroundColor: theme.colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
    },
    removeButton: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: theme.colors.error,
        alignItems: 'center',
        justifyContent: 'center',
    },
    addButtonText: {
        fontSize: 20,
        color: theme.colors.text.inverse,
        fontWeight: theme.fontWeight.bold,
    },
    removeButtonText: {
        fontSize: 16,
        color: theme.colors.text.inverse,
        fontWeight: theme.fontWeight.bold,
    },

    // Helper text styles
    helperText: {
        fontSize: theme.fontSize.xs,
        color: theme.colors.text.light,
        marginTop: theme.spacing.xs,
        fontStyle: 'italic',
    },
    errorText: {
        fontSize: theme.fontSize.xs,
        color: theme.colors.error,
        marginTop: theme.spacing.xs,
        fontWeight: theme.fontWeight.medium,
    },
    successText: {
        fontSize: theme.fontSize.xs,
        color: theme.colors.success,
        marginTop: theme.spacing.xs,
        fontWeight: theme.fontWeight.medium,
    },
    warningText: {
        fontSize: theme.fontSize.xs,
        color: theme.colors.warning,
        marginTop: theme.spacing.xs,
        fontWeight: theme.fontWeight.medium,
    },

    // Loading states
    loadingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: theme.spacing.md,
    },
    loadingText: {
        marginLeft: theme.spacing.sm,
        fontSize: theme.fontSize.sm,
        color: theme.colors.text.secondary,
    },

    // Empty states
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: theme.spacing.xl,
    },
    emptyText: {
        fontSize: theme.fontSize.md,
        color: theme.colors.text.light,
        textAlign: 'center',
        marginTop: theme.spacing.md,
    },
    emptyIcon: {
        marginBottom: theme.spacing.md,
    },
})