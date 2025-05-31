// src/shared/styles/index.ts

import {theme} from './theme'

// Core theme and styles
export { theme } from './theme'

// Specialized style collections
export { gameStyles } from './gameStyles'
export { formStyles } from './formStyles'
export { modalStyles } from './modalStyles'

// Re-export commonly used style utilities
export const commonStyles = {
    // Spacing utilities
    spacing: theme.spacing,

    // Border radius utilities
    borderRadius: theme.borderRadius,

    // Shadow utilities
    shadow: theme.shadow,

    // Color utilities
    colors: theme.colors,

    // Typography utilities
    fontSize: theme.fontSize,
    fontWeight: theme.fontWeight,

    // Common container styles
    screenContainer: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },

    centerContainer: {
        flex: 1,
        justifyContent: 'center' as const,
        alignItems: 'center' as const,
        padding: theme.spacing.xl,
    },

    // Common text styles
    title: {
        fontSize: theme.fontSize.xl,
        fontWeight: theme.fontWeight.bold,
        color: theme.colors.text.primary,
        textAlign: 'center' as const,
    },

    subtitle: {
        fontSize: theme.fontSize.lg,
        fontWeight: theme.fontWeight.medium,
        color: theme.colors.text.secondary,
        textAlign: 'center' as const,
    },

    body: {
        fontSize: theme.fontSize.md,
        color: theme.colors.text.primary,
        lineHeight: 22,
    },

    caption: {
        fontSize: theme.fontSize.sm,
        color: theme.colors.text.light,
    },

    // Common layout styles
    row: {
        flexDirection: 'row' as const,
        alignItems: 'center' as const,
    },

    column: {
        flexDirection: 'column' as const,
    },

    spaceBetween: {
        justifyContent: 'space-between' as const,
    },

    spaceAround: {
        justifyContent: 'space-around' as const,
    },

    spaceEvenly: {
        justifyContent: 'space-evenly' as const,
    },

    center: {
        justifyContent: 'center' as const,
        alignItems: 'center' as const,
    },
}