import {StyleSheet} from 'react-native';
import {theme} from './index';

/**
 * Helper function to create styles with theme access
 * @param {Function} stylesFn - Function that receives theme and returns styles
 * @returns {Object} - StyleSheet object
 */
const createStyles = (stylesFn) => {
    const styles = stylesFn(theme);
    return StyleSheet.create(styles);
};

export default createStyles;