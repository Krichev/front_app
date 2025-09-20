// src/shared/ui/theme/globalStyles.ts
import {StyleSheet} from 'react-native';
import {spacing} from './spacing';
import {colors} from './colors.ts';
import {typography} from './typography';
import type {Style, UtilityStyles} from './types';

// Utility styles
export const utilities: UtilityStyles = {
    // Flex utilities
    flex: {
        flex1: { flex: 1 },
        flexRow: { flexDirection: 'row' },
        flexColumn: { flexDirection: 'column' },
        justifyCenter: { justifyContent: 'center' },
        justifyBetween: { justifyContent: 'space-between' },
        justifyAround: { justifyContent: 'space-around' },
        justifyEvenly: { justifyContent: 'space-evenly' },
        justifyStart: { justifyContent: 'flex-start' },
        justifyEnd: { justifyContent: 'flex-end' },
        alignCenter: { alignItems: 'center' },
        alignStart: { alignItems: 'flex-start' },
        alignEnd: { alignItems: 'flex-end' },
        alignStretch: { alignItems: 'stretch' },
        selfCenter: { alignSelf: 'center' },
        selfStart: { alignSelf: 'flex-start' },
        selfEnd: { alignSelf: 'flex-end' },
        selfStretch: { alignSelf: 'stretch' },
    },

    // Spacing utilities
    margin: Object.entries(spacing).reduce((acc, [key, value]) => ({
        ...acc,
        [`m${key.charAt(0).toUpperCase() + key.slice(1)}`]: { margin: value },
        [`mt${key.charAt(0).toUpperCase() + key.slice(1)}`]: { marginTop: value },
        [`mr${key.charAt(0).toUpperCase() + key.slice(1)}`]: { marginRight: value },
        [`mb${key.charAt(0).toUpperCase() + key.slice(1)}`]: { marginBottom: value },
        [`ml${key.charAt(0).toUpperCase() + key.slice(1)}`]: { marginLeft: value },
        [`mx${key.charAt(0).toUpperCase() + key.slice(1)}`]: { marginHorizontal: value },
        [`my${key.charAt(0).toUpperCase() + key.slice(1)}`]: { marginVertical: value },
    }), {}),

    padding: Object.entries(spacing).reduce((acc, [key, value]) => ({
        ...acc,
        [`p${key.charAt(0).toUpperCase() + key.slice(1)}`]: { padding: value },
        [`pt${key.charAt(0).toUpperCase() + key.slice(1)}`]: { paddingTop: value },
        [`pr${key.charAt(0).toUpperCase() + key.slice(1)}`]: { paddingRight: value },
        [`pb${key.charAt(0).toUpperCase() + key.slice(1)}`]: { paddingBottom: value },
        [`pl${key.charAt(0).toUpperCase() + key.slice(1)}`]: { paddingLeft: value },
        [`px${key.charAt(0).toUpperCase() + key.slice(1)}`]: { paddingHorizontal: value },
        [`py${key.charAt(0).toUpperCase() + key.slice(1)}`]: { paddingVertical: value },
    }), {}),

    // Text utilities
    text: {
        left: { textAlign: 'left' },
        center: { textAlign: 'center' },
        right: { textAlign: 'right' },
        justify: { textAlign: 'justify' },
        primary: { color: colors.text.primary },
        secondary: { color: colors.text.secondary },
        disabled: { color: colors.text.disabled },
        inverse: { color: colors.text.inverse },
        bold: { fontWeight: typography.fontWeight.bold },
        semibold: { fontWeight: typography.fontWeight.semibold },
        medium: { fontWeight: typography.fontWeight.medium },
        regular: { fontWeight: typography.fontWeight.regular },
        light: { fontWeight: typography.fontWeight.light },
    },

    // Display utilities
    display: {
        none: { display: 'none' },
        flex: { display: 'flex' },
    },

    // Size utilities
    size: {
        full: { width: '100%', height: '100%' },
        fullWidth: { width: '100%' },
        fullHeight: { height: '100%' },
        square50: { width: 50, height: 50 },
        square100: { width: 100, height: 100 },
        square150: { width: 150, height: 150 },
        square200: { width: 200, height: 200 },
    },
};

// Global styles
export const globalStyles = StyleSheet.create({
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
        padding: spacing.lg, // Using spacing.lg instead of layout.screenPadding
        backgroundColor: colors.background.primary,
    },

    scrollView: {
        flexGrow: 1,
        padding: spacing.lg, // Using spacing.lg instead of layout.screenPadding
    },

    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },

    row: {
        flexDirection: 'row',
        alignItems: 'center',
    },

    column: {
        flexDirection: 'column',
    },
});

/**
 * Helper function to combine multiple styles
 * @param styles Array of style objects to combine
 * @returns Flattened style object
 */
export function combineStyles(...styles: (Style | Style[] | undefined)[]): Style {
    return StyleSheet.flatten(styles.filter(Boolean));
}