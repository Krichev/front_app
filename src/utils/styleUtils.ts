// src/shared/utils/styleUtils.ts
import {ImageStyle, StyleSheet, TextStyle, ViewStyle} from 'react-native'

/**
 * Safely combines multiple styles, filtering out falsy values
 * Useful for conditional styling
 */
export function combineStyles<T extends ViewStyle | TextStyle | ImageStyle>(
    ...styles: (T | T[] | false | undefined | null)[]
): T {
    const validStyles = styles
        .flat()
        .filter((style): style is T => Boolean(style))

    return StyleSheet.flatten(validStyles) as T
}

/**
 * Creates a style array that can be safely passed to React Native components
 * Filters out falsy values automatically
 */
export function createStyleArray<T extends ViewStyle | TextStyle | ImageStyle>(
    ...styles: (T | false | undefined | null)[]
): T[] {
    return styles.filter((style): style is T => Boolean(style))
}

/**
 * Hook for managing conditional styles
 */
export function useConditionalStyle<T extends ViewStyle | TextStyle | ImageStyle>(
    baseStyle: T,
    conditions: Array<{
        condition: boolean
        style: T
    }>
): T {
    const conditionalStyles = conditions
        .filter(({ condition }) => condition)
        .map(({ style }) => style)

    return combineStyles(baseStyle, ...conditionalStyles)
}

// Example usage:
/*
// Instead of this (which can cause TypeScript errors):
const questionCardStyle = [
    styles.card,
    isSelected && styles.selectedCard,
    hasError && styles.errorCard,
    customStyle
]

// Use this:
const questionCardStyle = combineStyles(
    styles.card,
    isSelected && styles.selectedCard,
    hasError && styles.errorCard,
    customStyle
)

// Or this with the hook:
const questionCardStyle = useConditionalStyle(styles.card, [
    { condition: isSelected, style: styles.selectedCard },
    { condition: hasError, style: styles.errorCard }
])
*/