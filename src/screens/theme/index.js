import {colors} from './colors';
import {typography} from './typography';
import {layout, spacing} from './spacing';
import {shadows} from './shadows';
import {components} from './components';
import {combineStyles, globalStyles, utilities} from './globalStyles';

// Theme object containing all style properties
export const theme = {
    colors,
    typography,
    spacing,
    layout,
    shadows,
    components,
    utilities,
};

// Export individual modules for direct import
export {
    colors,
    typography,
    spacing,
    layout,
    shadows,
    components,
    globalStyles,
    utilities,
    combineStyles,
};

// Export helper functions
export { default as createStyles } from './createStyles';