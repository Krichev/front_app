// src/shared/ui/theme/components.ts
import {colors} from './colors';
import {typography} from './typography';
import {extendedLayout, layout, spacing} from './spacing';
import type {Components} from './types';

export const components: Components = {
    // Button styles
    button: {
        base: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            paddingHorizontal: spacing.xl,
            paddingVertical: spacing.md,
            borderRadius: layout.borderRadius.md,
            borderWidth: layout.borderWidth.none,
        },

        variants: {
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
            },

            disabled: {
                backgroundColor: colors.neutral.gray[200],
            },
        },

        sizes: {
            small: {
                paddingHorizontal: spacing.md,
                paddingVertical: spacing.sm,
                borderRadius: layout.borderRadius.sm,
            },

            medium: {
                paddingHorizontal: spacing.xl,
                paddingVertical: spacing.md,
                borderRadius: layout.borderRadius.md,
            },

            large: {
                paddingHorizontal: spacing['2xl'],
                paddingVertical: spacing.lg,
                borderRadius: layout.borderRadius.lg,
            },
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
        },

        disabledText: {
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
            paddingHorizontal: extendedLayout.screenPadding,
            backgroundColor: colors.neutral.white,
            borderBottomWidth: extendedLayout.borderWidthExtended.hairline,
            borderBottomColor: colors.border.light,
        },

        itemSelected: {
            backgroundColor: colors.primary.light,
        },

        separator: {
            height: extendedLayout.borderWidthExtended.hairline,
            backgroundColor: colors.border.light,
            marginLeft: extendedLayout.screenPadding,
        },

        header: {
            backgroundColor: colors.background.secondary,
            paddingVertical: spacing.sm,
            paddingHorizontal: extendedLayout.screenPadding,
        },

        footer: {
            backgroundColor: colors.background.secondary,
            paddingVertical: spacing.sm,
            paddingHorizontal: extendedLayout.screenPadding,
        },
    },

    // Card styles
    card: {
        base: {
            backgroundColor: colors.neutral.white,
            borderRadius: layout.borderRadius.lg,
            padding: extendedLayout.cardPadding,
            marginBottom: spacing.md,
        },

        header: {
            borderBottomWidth: layout.borderWidth.thin,
            borderBottomColor: colors.border.light,
            paddingBottom: spacing.md,
            marginBottom: spacing.md,
        },

        content: {
            flex: 1,
        },

        footer: {
            borderTopWidth: layout.borderWidth.thin,
            borderTopColor: colors.border.light,
            paddingTop: spacing.md,
            marginTop: spacing.md,
        },

        elevated: {
            shadowColor: colors.neutral.black,
            shadowOffset: {
                width: 0,
                height: 2,
            },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 3,
        },
    },
};