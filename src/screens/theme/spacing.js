// Base spacing unit (4px)
const base = 4;

export const spacing = {
    xs: base,        // 4
    sm: base * 2,    // 8
    md: base * 3,    // 12
    lg: base * 4,    // 16
    xl: base * 5,    // 20
    '2xl': base * 6, // 24
    '3xl': base * 8, // 32
    '4xl': base * 10, // 40
    '5xl': base * 12, // 48
    '6xl': base * 16, // 64
};

export const layout = {
    screenPadding: spacing.lg,
    cardPadding: spacing.lg,
    sectionSpacing: spacing['3xl'],
    itemSpacing: spacing.md,

    borderRadius: {
        none: 0,
        sm: 4,
        md: 8,
        lg: 12,
        xl: 16,
        '2xl': 24,
        full: 9999,
    },

    borderWidth: {
        none: 0,
        hairline: 0.5,
        thin: 1,
        medium: 2,
        thick: 3,
    },
};