// ===== FILE 2: src/types/global.d.ts =====
// Global type definitions for the app

// Extend the global namespace if needed
declare global {
    namespace NodeJS {
        interface ProcessEnv {
            NODE_ENV: 'development' | 'production' | 'test';
            // Add other env variables here
        }
    }
}

// Module declarations for packages without types
declare module 'react-native-vector-icons/MaterialIcons' {
    import {Component} from 'react';
    import {TextProps} from 'react-native';

    interface IconProps extends TextProps {
        name: string;
        size?: number;
        color?: string;
    }

    export default class MaterialIcons extends Component<IconProps> {}
}

// Add other module declarations as needed
declare module '*.png' {
    const value: any;
    export = value;
}

declare module '*.jpg' {
    const value: any;
    export = value;
}

declare module '*.jpeg' {
    const value: any;
    export = value;
}

declare module '*.svg' {
    import React from 'react';
    import {SvgProps} from 'react-native-svg';
    const content: React.FC<SvgProps>;
    export default content;
}

// Export empty object to make this a module
export {};