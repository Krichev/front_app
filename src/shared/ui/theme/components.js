import {colors} from './colors';
import {typography} from './typography';
import {layout, spacing} from './spacing';
import {shadows} from './shadows';

export const components = {
    // Container styles
    container: {
        flex: 1,
        backgroundColor: colors.background.primary,
    },

    safeArea: {
        flex: 1,
        backgroundColor: colors.background.primary,
    },

    screen: {
        flex: 1,
        padding: layout.screenPadding,
        backgroundColor: colors.background.primary,
    },

    scrollView: {
        flexGrow: 1,
        padding: layout.screenPadding,
    },

    // Card styles
    card: {
        backgroundColor: colors.neutral.white,
        borderRadius: layout.borderRadius.lg,
        padding: layout.cardPadding,
        marginBottom: spacing.md,
        ...shadows.card,
    },

    // Button styles
    button: {
        base: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            paddingHorizontal: spacing.xl,
            paddingVertical: spacing.md,
            borderRadius: layout.borderRadius.md,
            ...shadows.button,
        },

        primary: {
            backgroundColor: colors.primary.main,
        },

        secondary: {
            backgroundColor: colors.secondary.main,
        },

        outline: {
            backgroundColor: 'transparent',
            borderWidth: layout.borderWidth.thin,
            borderColor: colors.primary.main,
        },

        ghost: {
            backgroundColor: 'transparent',
            shadowColor: 'transparent',
            elevation: 0,
        },

        disabled: {
            backgroundColor: colors.neutral.gray[200],
            shadowColor: 'transparent',
            elevation: 0,
        },

        text: {
            primary: {
                ...typography.button,
                color: colors.neutral.white,
            },
            secondary: {
                ...typography.button,
                color: colors.neutral.white,
            },
            outline: {
                ...typography.button,
                color: colors.primary.main,
            },
            ghost: {
                ...typography.button,
                color: colors.primary.main,
            },
            disabled: {
                ...typography.button,
                color: colors.text.disabled,
            },
        },
    },

    // Input styles
    input: {
        container: {
            marginBottom: spacing.lg,
        },

        label: {
            ...typography.body.small,
            color: colors.text.secondary,
            marginBottom: spacing.xs,
        },

        field: {
            borderWidth: layout.borderWidth.thin,
            borderColor: colors.border.main,
            borderRadius: layout.borderRadius.md,
            paddingHorizontal: spacing.md,
            paddingVertical: spacing.sm,
            fontSize: typography.fontSize.base,
            color: colors.text.primary,
            backgroundColor: colors.neutral.white,
        },

        focused: {
            borderColor: colors.primary.main,
        },

        error: {
            borderColor: colors.error.main,
        },

        disabled: {
            backgroundColor: colors.neutral.gray[100],
            color: colors.text.disabled,
        },

        helperText: {
            ...typography.caption,
            marginTop: spacing.xs,
        },

        errorText: {
            ...typography.caption,
            color: colors.error.main,
            marginTop: spacing.xs,
        },
    },

    // List styles
    list: {
        container: {
            backgroundColor: colors.background.primary,
        },

        item: {
            flexDirection: 'row',
            alignItems: 'center',
            paddingVertical: spacing.md,
            paddingHorizontal: layout.screenPadding,
            backgroundColor: colors.neutral.white,
            borderBottomWidth: layout.borderWidth.hairline,
            borderBottomColor: colors.border.light,
        },

        separator: {
            height: layout.borderWidth.hairline,
            backgroundColor: colors.border.light,
            marginLeft: layout.screenPadding,
        },

        header: {
            backgroundColor: colors.background.secondary,
            paddingVertical: spacing.sm,
            paddingHorizontal: layout.screenPadding,
        },

        headerText: {
            ...typography.body.small,
            color: colors.text.secondary,
            fontWeight: typography.fontWeight.medium,
        },
    },

    // Badge styles
    badge: {
        container: {
            paddingHorizontal: spacing.sm,
            paddingVertical: spacing.xs / 2,
            borderRadius: layout.borderRadius.full,
            alignSelf: 'flex-start',
        },

        text: {
            ...typography.caption,
            fontWeight: typography.fontWeight.medium,
        },

        primary: {
            backgroundColor: colors.primary.main,
            color: colors.primary.contrast,
        },

        success: {
            backgroundColor: colors.success.background,
            color: colors.success.dark,
        },

        warning: {
            backgroundColor: colors.warning.background,
            color: colors.warning.dark,
        },

        error: {
            backgroundColor: colors.error.background,
            color: colors.error.dark,
        },

        info: {
            backgroundColor: colors.info.background,
            color: colors.info.dark,
        },
    },

    // Modal styles
    modal: {
        backdrop: {
            flex: 1,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            justifyContent: 'center',
            alignItems: 'center',
            padding: spacing.xl,
        },

        content: {
            backgroundColor: colors.neutral.white,
            borderRadius: layout.borderRadius.xl,
            padding: spacing.xl,
            width: '100%',
            maxWidth: 400,
            ...shadows.xl,
        },

        title: {
            ...typography.heading.h4,
            marginBottom: spacing.md,
            textAlign: 'center',
        },

        body: {
            ...typography.body.regular,
            marginBottom: spacing.xl,
        },

        footer: {
            flexDirection: 'row',
            justifyContent: 'space-between',
        },
    },

    // Tab styles
    tabs: {
        container: {
            flexDirection: 'row',
            borderBottomWidth: layout.borderWidth.hairline,
            borderBottomColor: colors.border.light,
            backgroundColor: colors.background.primary,
        },

        tab: {
            flex: 1,
            paddingVertical: spacing.md,
            alignItems: 'center',
            borderBottomWidth: layout.borderWidth.medium,
            borderBottomColor: 'transparent',
        },

        activeTab: {
            borderBottomColor: colors.primary.main,
        },

        tabText: {
            ...typography.body.small,
            color: colors.text.secondary,
            fontWeight: typography.fontWeight.medium,
        },

        activeTabText: {
            color: colors.primary.main,
        },
    },

    // Avatar styles
    avatar: {
        small: {
            width: 32,
            height: 32,
            borderRadius: 16,
        },

        medium: {
            width: 48,
            height: 48,
            borderRadius: 24,
        },

        large: {
            width: 64,
            height: 64,
            borderRadius: 32,
        },

        xlarge: {
            width: 96,
            height: 96,
            borderRadius: 48,
        },
    },
};