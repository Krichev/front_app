// src/shared/styles/modalStyles.ts
import {StyleSheet} from 'react-native'
import {theme} from './theme'

export const modalStyles = StyleSheet.create({
    // Overlay and backdrop
    overlay: {
        flex: 1,
        backgroundColor: theme.colors.overlay,
        justifyContent: 'center',
        alignItems: 'center',
        padding: theme.spacing.lg,
    },
    backdrop: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },

    // Modal containers
    modalContainer: {
        backgroundColor: theme.colors.surface,
        borderRadius: theme.borderRadius.lg,
        width: '90%',
        maxWidth: 400,
        maxHeight: '80%',
        ...theme.shadow.large,
    },
    fullScreenModal: {
        width: '95%',
        height: '90%',
        maxHeight: '90%',
    },
    smallModal: {
        width: '70%',
        maxWidth: 300,
    },

    // Header section
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: theme.spacing.lg,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.borderLight,
    },
    modalHeaderWithIcon: {
        flexDirection: 'column',
        alignItems: 'center',
        padding: theme.spacing.xl,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.borderLight,
    },
    modalTitle: {
        fontSize: theme.fontSize.lg,
        fontWeight: theme.fontWeight.bold,
        color: theme.colors.text.primary,
        flex: 1,
    },
    modalSubtitle: {
        fontSize: theme.fontSize.sm,
        color: theme.colors.text.secondary,
        marginTop: theme.spacing.xs,
        textAlign: 'center',
    },
    modalIcon: {
        marginBottom: theme.spacing.md,
    },
    closeButton: {
        padding: theme.spacing.xs,
        borderRadius: theme.borderRadius.sm,
        backgroundColor: 'transparent',
    },

    // Content section
    modalContent: {
        padding: theme.spacing.lg,
        flex: 1,
    },
    modalContentScrollable: {
        padding: theme.spacing.lg,
        maxHeight: 400,
    },
    modalText: {
        fontSize: theme.fontSize.md,
        color: theme.colors.text.primary,
        lineHeight: 22,
        marginBottom: theme.spacing.md,
        textAlign: 'center',
    },
    modalDescription: {
        fontSize: theme.fontSize.sm,
        color: theme.colors.text.secondary,
        lineHeight: 20,
        marginBottom: theme.spacing.lg,
        textAlign: 'center',
    },

    // Action section
    modalActions: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        padding: theme.spacing.lg,
        borderTopWidth: 1,
        borderTopColor: theme.colors.borderLight,
        gap: theme.spacing.md,
    },
    modalActionsVertical: {
        flexDirection: 'column',
        padding: theme.spacing.lg,
        borderTopWidth: 1,
        borderTopColor: theme.colors.borderLight,
    },
    modalActionsSingle: {
        justifyContent: 'center',
    },

    // Button styles for modals
    modalButton: {
        paddingVertical: theme.spacing.md,
        paddingHorizontal: theme.spacing.lg,
        borderRadius: theme.borderRadius.md,
        alignItems: 'center',
        justifyContent: 'center',
        minWidth: 100,
        flexDirection: 'row',
    },
    modalButtonPrimary: {
        backgroundColor: theme.colors.primary,
    },
    modalButtonSecondary: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    modalButtonDanger: {
        backgroundColor: theme.colors.error,
    },
    modalButtonText: {
        fontSize: theme.fontSize.md,
        fontWeight: theme.fontWeight.medium,
    },
    modalButtonTextPrimary: {
        color: theme.colors.text.inverse,
    },
    modalButtonTextSecondary: {
        color: theme.colors.text.secondary,
    },
    modalButtonTextDanger: {
        color: theme.colors.text.inverse,
    },
    modalButtonIcon: {
        marginRight: theme.spacing.sm,
    },

    // Alert modal styles
    alertModal: {
        alignItems: 'center',
        padding: theme.spacing.xl,
    },
    alertIcon: {
        marginBottom: theme.spacing.lg,
    },
    alertTitle: {
        fontSize: theme.fontSize.lg,
        fontWeight: theme.fontWeight.bold,
        color: theme.colors.text.primary,
        marginBottom: theme.spacing.md,
        textAlign: 'center',
    },
    alertMessage: {
        fontSize: theme.fontSize.md,
        color: theme.colors.text.secondary,
        lineHeight: 22,
        marginBottom: theme.spacing.xl,
        textAlign: 'center',
    },

    // Confirmation modal styles
    confirmationModal: {
        alignItems: 'center',
        padding: theme.spacing.xl,
    },
    confirmationIcon: {
        marginBottom: theme.spacing.lg,
    },
    confirmationTitle: {
        fontSize: theme.fontSize.lg,
        fontWeight: theme.fontWeight.bold,
        color: theme.colors.text.primary,
        marginBottom: theme.spacing.md,
        textAlign: 'center',
    },
    confirmationMessage: {
        fontSize: theme.fontSize.md,
        color: theme.colors.text.secondary,
        lineHeight: 22,
        marginBottom: theme.spacing.xl,
        textAlign: 'center',
    },
    confirmationActions: {
        flexDirection: 'row',
        gap: theme.spacing.md,
    },

    // Success modal styles
    successModal: {
        alignItems: 'center',
        padding: theme.spacing.xl,
    },
    successIcon: {
        marginBottom: theme.spacing.lg,
    },
    successTitle: {
        fontSize: theme.fontSize.lg,
        fontWeight: theme.fontWeight.bold,
        color: theme.colors.success,
        marginBottom: theme.spacing.md,
        textAlign: 'center',
    },
    successMessage: {
        fontSize: theme.fontSize.md,
        color: theme.colors.text.secondary,
        lineHeight: 22,
        marginBottom: theme.spacing.xl,
        textAlign: 'center',
    },

    // Error modal styles
    errorModal: {
        alignItems: 'center',
        padding: theme.spacing.xl,
    },
    errorIcon: {
        marginBottom: theme.spacing.lg,
    },
    errorTitle: {
        fontSize: theme.fontSize.lg,
        fontWeight: theme.fontWeight.bold,
        color: theme.colors.error,
        marginBottom: theme.spacing.md,
        textAlign: 'center',
    },
    errorMessage: {
        fontSize: theme.fontSize.md,
        color: theme.colors.text.secondary,
        lineHeight: 22,
        marginBottom: theme.spacing.xl,
        textAlign: 'center',
    },

    // Loading modal styles
    loadingModal: {
        alignItems: 'center',
        padding: theme.spacing.xl,
    },
    loadingContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    loadingText: {
        fontSize: theme.fontSize.md,
        color: theme.colors.text.secondary,
        marginLeft: theme.spacing.md,
    },

    // Input modal styles
    inputModal: {
        padding: theme.spacing.lg,
    },
    inputModalField: {
        marginBottom: theme.spacing.lg,
    },
    inputModalLabel: {
        fontSize: theme.fontSize.md,
        fontWeight: theme.fontWeight.medium,
        color: theme.colors.text.secondary,
        marginBottom: theme.spacing.sm,
    },
    inputModalInput: {
        backgroundColor: theme.colors.background,
        borderWidth: 1,
        borderColor: theme.colors.border,
        borderRadius: theme.borderRadius.md,
        padding: theme.spacing.md,
        fontSize: theme.fontSize.md,
        color: theme.colors.text.primary,
    },
})