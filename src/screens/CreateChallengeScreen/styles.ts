import { createStyles } from '../../shared/ui/theme';
import { Theme } from '../../shared/ui/theme/types';

export const styles = createStyles((theme: Theme) => ({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background.secondary,
    },
    keyboardAvoidingView: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        paddingBottom: theme.spacing.xl,
    },
    header: {
        backgroundColor: theme.colors.success.main,
        padding: theme.spacing.xl,
        paddingTop: theme.spacing['3xl'],
    },
    title: {
        ...theme.typography.heading.h5,
        fontWeight: theme.typography.fontWeight.bold,
        color: theme.colors.text.inverse,
        marginBottom: theme.spacing.xs,
    },
    subtitle: {
        ...theme.typography.body.medium,
        color: 'rgba(255, 255, 255, 0.9)',
    },
    form: {
        flex: 1,
        backgroundColor: theme.colors.background.primary,
        margin: theme.spacing.lg,
        borderRadius: theme.layout.borderRadius.lg,
        padding: theme.spacing.xl,
        ...theme.shadows.small,
    },
    formGroup: {
        marginBottom: theme.spacing.xl,
    },
    label: {
        ...theme.typography.body.medium,
        fontWeight: theme.typography.fontWeight.semibold,
        marginBottom: theme.spacing.sm,
        color: theme.colors.text.primary,
    },
    input: {
        borderWidth: 1,
        borderColor: theme.colors.border.light,
        borderRadius: theme.layout.borderRadius.md,
        padding: theme.spacing.md,
        ...theme.typography.body.medium,
        backgroundColor: theme.colors.background.secondary,
        color: theme.colors.text.primary,
    },
    textArea: {
        height: 80,
        textAlignVertical: 'top',
    },
    pickerContainer: {
        borderWidth: 1,
        borderColor: theme.colors.border.light,
        borderRadius: theme.layout.borderRadius.md,
        backgroundColor: theme.colors.background.secondary,
    },
    picker: {
        height: 50,
    },
    sectionToggle: {
        backgroundColor: theme.colors.background.tertiary,
        padding: theme.spacing.md,
        borderRadius: theme.layout.borderRadius.md,
        marginVertical: theme.spacing.sm,
        alignItems: 'center',
    },
    sectionToggleText: {
        ...theme.typography.body.medium,
        fontWeight: theme.typography.fontWeight.medium,
        color: theme.colors.success.main,
    },
    sectionTitle: {
        ...theme.typography.heading.h6,
        fontWeight: theme.typography.fontWeight.semibold,
        marginBottom: theme.spacing.lg,
        color: theme.colors.text.primary,
    },
    verificationContainer: {
        backgroundColor: theme.colors.background.tertiary,
        padding: theme.spacing.lg,
        borderRadius: theme.layout.borderRadius.md,
        marginVertical: theme.spacing.sm,
    },
    verificationDetailsContainer: {
        marginTop: theme.spacing.lg,
        padding: theme.spacing.md,
        backgroundColor: theme.colors.background.primary,
        borderRadius: theme.layout.borderRadius.md,
        borderWidth: 1,
        borderColor: theme.colors.border.light,
    },
    switchContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginVertical: theme.spacing.md,
    },
    locationButton: {
        backgroundColor: theme.colors.success.main,
        padding: theme.spacing.md,
        borderRadius: theme.layout.borderRadius.md,
        alignItems: 'center',
        marginVertical: theme.spacing.sm,
    },
    locationButtonText: {
        color: theme.colors.text.inverse,
        fontWeight: theme.typography.fontWeight.semibold,
        fontSize: theme.typography.fontSize.base,
    },
    locationInfo: {
        backgroundColor: theme.colors.success.background,
        padding: theme.spacing.sm,
        borderRadius: theme.layout.borderRadius.sm,
        marginVertical: theme.spacing.sm,
    },
    locationText: {
        ...theme.typography.body.small,
        color: theme.colors.success.dark,
        fontFamily: theme.typography.fontFamily.mono,
    },
    dateContainer: {
        backgroundColor: theme.colors.background.tertiary,
        padding: theme.spacing.lg,
        borderRadius: theme.layout.borderRadius.md,
        marginVertical: theme.spacing.sm,
    },
    dateButton: {
        borderWidth: 1,
        borderColor: theme.colors.border.light,
        borderRadius: theme.layout.borderRadius.md,
        padding: theme.spacing.md,
        backgroundColor: theme.colors.background.secondary,
        alignItems: 'center',
    },
    dateButtonText: {
        ...theme.typography.body.medium,
        color: theme.colors.text.primary,
    },
    advancedContainer: {
        backgroundColor: theme.colors.background.tertiary,
        padding: theme.spacing.lg,
        borderRadius: theme.layout.borderRadius.md,
        marginVertical: theme.spacing.sm,
    },
    tagsPreview: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginTop: theme.spacing.sm,
    },
    tag: {
        backgroundColor: theme.colors.info.background,
        paddingHorizontal: theme.spacing.sm,
        paddingVertical: theme.spacing.xs,
        borderRadius: theme.layout.borderRadius.md,
        margin: 2,
    },
    tagText: {
        ...theme.typography.caption,
        color: theme.colors.info.dark,
    },
    submitButton: {
        backgroundColor: theme.colors.success.main,
        padding: theme.spacing.lg,
        borderRadius: theme.layout.borderRadius.md,
        alignItems: 'center',
        marginTop: theme.spacing.xl,
    },
    submitButtonDisabled: {
        backgroundColor: theme.colors.success.light,
        opacity: 0.7,
    },
    submitButtonText: {
        color: theme.colors.text.inverse,
        ...theme.typography.body.large,
        fontWeight: theme.typography.fontWeight.bold,
    },
}));
