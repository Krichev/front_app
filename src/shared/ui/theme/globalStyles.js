import {StyleSheet} from 'react-native';
import {spacing} from './spacing';
import {components} from './components';

// Utility styles
export const utilities = {
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

    // Position utilities
    position: {
        absolute: { position: 'absolute' },
        relative: { position: 'relative' },
        absoluteFill: StyleSheet.absoluteFillObject,
        top0: { top: 0 },
        right0: { right: 0 },
        bottom0: { bottom: 0 },
        left0: { left: 0 },
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
        center: { textAlign: 'center' },
        left: { textAlign: 'left' },
        right: { textAlign: 'right' },
        justify: { textAlign: 'justify' },
        uppercase: { textTransform: 'uppercase' },
        lowercase: { textTransform: 'lowercase' },
        capitalize: { textTransform: 'capitalize' },
    },

    // Display utilities
    display: {
        hidden: { display: 'none' },
        visible: { display: 'flex' },
    },

    // Size utilities
    size: {
        w100: { width: '100%' },
        h100: { height: '100%' },
        wAuto: { width: 'auto' },
        hAuto: { height: 'auto' },
    },
};

// Create global styles
export const globalStyles = StyleSheet.create({
    ...components,
    ...utilities,
});

// Export a helper function to combine styles
export const combineStyles = (...styles) => {
    return StyleSheet.flatten(styles);
};