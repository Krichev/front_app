// src/shared/ui/theme/createStyles.ts
import {StyleSheet} from 'react-native';
import type {CreateStylesFunction, Style, StylesObject, Theme} from './types';

/**
 * Create styles with theme access and full TypeScript support
 * @param stylesFn Function that receives theme and returns styles object
 * @returns StyleSheet object with proper typing
 */
export function createStyles<T extends StylesObject>(
    stylesFn: CreateStylesFunction<T>
): T {
    // Import theme locally to avoid circular dependencies
    const { theme }: { theme: Theme } = require('./index.ts');

    const styles = stylesFn(theme);
    return StyleSheet.create(styles) as T;
}

/**
 * Create styles with static object (no theme access)
 * @param styles Static styles object
 * @returns StyleSheet object with proper typing
 */
export function createStaticStyles<T extends StylesObject>(styles: T): T {
    return StyleSheet.create(styles) as T;
}

/**
 * Hook-like pattern for creating styles with theme
 * @param stylesFn Function that receives theme and returns styles
 * @returns StyleSheet object with proper typing
 */
export function useStyles<T extends StylesObject>(
    stylesFn: CreateStylesFunction<T>
): T {
    return createStyles(stylesFn);
}

/**
 * Helper function to combine multiple styles
 * @param styles Array of style objects to combine
 * @returns Flattened style object
 */
export function combineStyles(...styles: (Style | Style[] | undefined)[]): Style {
    return StyleSheet.flatten(styles.filter(Boolean));
}

/**
 * Create conditional styles based on theme properties
 * @param condition Boolean or function that receives theme
 * @param trueStyles Styles to apply when condition is true
 * @param falseStyles Styles to apply when condition is false
 * @returns Style object
 */
export function createConditionalStyles<T extends Style>(
    condition: boolean | ((theme: Theme) => boolean),
    trueStyles: T | ((theme: Theme) => T),
    falseStyles?: T | ((theme: Theme) => T)
): (theme: Theme) => T | undefined {
    return (theme: Theme) => {
        const isConditionTrue = typeof condition === 'function'
            ? condition(theme)
            : condition;

        if (isConditionTrue) {
            return typeof trueStyles === 'function'
                ? trueStyles(theme)
                : trueStyles;
        } else if (falseStyles) {
            return typeof falseStyles === 'function'
                ? falseStyles(theme)
                : falseStyles;
        }

        return undefined;
    };
}

/**
 * Create responsive styles based on screen dimensions
 * @param breakpoints Object with breakpoint keys and style values
 * @returns Function that returns appropriate style for current screen
 */
export function createResponsiveStyles<T extends Style>(
    breakpoints: {
        xs?: T | ((theme: Theme) => T);
        sm?: T | ((theme: Theme) => T);
        md?: T | ((theme: Theme) => T);
        lg?: T | ((theme: Theme) => T);
        xl?: T | ((theme: Theme) => T);
    }
): (theme: Theme, screenWidth: number) => T | undefined {
    return (theme: Theme, screenWidth: number) => {
        // Define breakpoint values (customize as needed)
        const breakpointValues = {
            xs: 0,
            sm: 576,
            md: 768,
            lg: 992,
            xl: 1200,
        };

        // Find the appropriate breakpoint
        let currentBreakpoint: keyof typeof breakpoints = 'xs';

        Object.entries(breakpointValues).forEach(([key, value]) => {
            if (screenWidth >= value && breakpoints[key as keyof typeof breakpoints]) {
                currentBreakpoint = key as keyof typeof breakpoints;
            }
        });

        const styleValue = breakpoints[currentBreakpoint];

        if (!styleValue) return undefined;

        return typeof styleValue === 'function'
            ? styleValue(theme)
            : styleValue;
    };
}

// Default export for backward compatibility
export default createStyles;