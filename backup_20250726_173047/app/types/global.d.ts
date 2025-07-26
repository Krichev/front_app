// // Declare module for SCSS files (not used in React Native, but kept for compatibility)
// declare module '*.scss' {
//     const classNames: Record<string, string>;
//     export default classNames;
// }

// Declare module for PNG, JPG, and JPEG files
declare module '*.png' {
    const content: any;
    export default content;
}

declare module '*.jpg' {
    const content: any;
    export default content;
}

declare module '*.jpeg' {
    const content: any;
    export default content;
}

// Declare module for SVG files (using react-native-svg)
declare module '*.svg' {
    import React from 'react';
    import {SvgProps} from 'react-native-svg';
    const SVG: React.FC<SvgProps>;
    export default SVG;
}

// Declare a constant for development mode
declare const __IS_DEV__: boolean;