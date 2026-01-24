// src/shared/ui/theme/types.ts
import {ImageStyle, TextStyle, ViewStyle} from 'react-native';

/**
 * Base style types for React Native
 */
export type Style = ViewStyle | TextStyle | ImageStyle;
export type StyleFunction<T = any> = (theme: Theme) => T;
export type StylesObject = Record<string, Style>;

/**
 * React Native FontWeight type
 */
export type FontWeightValue =
    | 'normal'
    | 'bold'
    | '100'
    | '200'
    | '300'
    | '400'
    | '500'
    | '600'
    | '700'
    | '800'
    | '900';

/**
 * Color definitions for the theme system
 */
export interface ColorScheme {
    main: string;
    light: string;
    dark: string;
    contrast: string;
}

export interface GrayScale {
    50: string;
    100: string;
    200: string;
    300: string;
    400: string;
    500: string;
    600: string;
    700: string;
    800: string;
    900: string;
}

export interface SemanticColor {
    main: string;
    light: string;
    dark: string;
    background: string;
}

export interface Colors {
    // Primary colors
    primary: ColorScheme;
    secondary: ColorScheme;
    accent: ColorScheme;

    // Neutral colors
    neutral: {
        white: string;
        black: string;
        gray: GrayScale;
    };

    // Semantic colors
    success: SemanticColor;
    error: SemanticColor;
    warning: SemanticColor;
    info: SemanticColor;

    // Background colors
    background: {
        primary: string;
        secondary: string;
        tertiary: string;
        dark: string;
    };

    // Overlay colors
    overlay: {
        light: string;
        medium: string;
        dark: string;
    };

    // Text colors
    text: {
        primary: string;
        secondary: string;
        disabled: string;
        inverse: string;
    };

    // Border colors
    border: {
        light: string;
        main: string;
        dark: string;
    };
}

/**
 * Typography system definitions
 */
export interface FontWeight {
    light: FontWeightValue;
    regular: FontWeightValue;
    medium: FontWeightValue;
    semibold: FontWeightValue;
    bold: FontWeightValue;
}

export interface FontSize {
    xs: number;
    sm: number;
    base: number;
    lg: number;
    xl: number;
    '2xl': number;
    '3xl': number;
    '4xl': number;
    '5xl': number;
}

export interface LineHeight {
    tight: number;
    normal: number;
    relaxed: number;
    loose: number;
}

export interface LetterSpacing {
    tighter: number;
    tight: number;
    normal: number;
    wide: number;
    wider: number;
    widest: number;
}

export interface HeadingStyle extends TextStyle {
    fontSize: number;
    fontWeight: FontWeightValue;
    lineHeight: number;
    letterSpacing: number;
}

export interface BodyStyle extends TextStyle {
    fontSize: number;
    fontWeight: FontWeightValue;
    lineHeight: number;
}

export interface Typography {
    fontFamily: {
        primary: string;
        secondary: string;
        mono: string;
    };
    fontWeight: FontWeight;
    fontSize: FontSize;
    lineHeight: LineHeight;
    letterSpacing: LetterSpacing;

    // Predefined text styles
    heading: {
        h1: HeadingStyle;
        h2: HeadingStyle;
        h3: HeadingStyle;
        h4: HeadingStyle;
        h5: HeadingStyle;
        h6: HeadingStyle;
    };

    body: {
        large: BodyStyle;
        medium: BodyStyle;
        small: BodyStyle;
    };

    caption: TextStyle;
    button: TextStyle;
}

/**
 * Spacing and layout system
 */
export interface Spacing {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
    '2xl': number;
    '3xl': number;
    '4xl': number;
    '5xl': number;
}

export interface BorderRadius {
    none: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
    '2xl': number;
    '3xl': number;
    full: number;
}

export interface BorderWidth {
    none: number;
    thin: number;
    thick: number;
}

export interface Layout {
    borderRadius: BorderRadius;
    borderWidth: BorderWidth;
    maxWidth: {
        xs: number;
        sm: number;
        md: number;
        lg: number;
        xl: number;
        '2xl': number;
        full: string;
    };
}

/**
 * Shadow system
 */
export interface Shadow extends ViewStyle {
    shadowColor: string;
    shadowOffset: {
        width: number;
        height: number;
    };
    shadowOpacity: number;
    shadowRadius: number;
    elevation: number;
}

export interface Shadows {
    none: Shadow;
    small: Shadow;
    medium: Shadow;
    large: Shadow;
    xlarge: Shadow;
}

/**
 * Component-specific styles
 */
export interface ButtonStyles {
    base: ViewStyle;
    variants: {
        primary: ViewStyle;
        secondary: ViewStyle;
        outline: ViewStyle;
        ghost: ViewStyle;
        disabled: ViewStyle;
    };
    sizes: {
        small: ViewStyle;
        medium: ViewStyle;
        large: ViewStyle;
    };
    text: {
        primary: TextStyle;
        secondary: TextStyle;
        outline: TextStyle;
        ghost: TextStyle;
        disabled: TextStyle;
    };
}

export interface InputStyles {
    container: ViewStyle;
    label: TextStyle;
    field: ViewStyle & TextStyle; // Combined for input fields
    focused: ViewStyle;
    error: ViewStyle;
    disabled: ViewStyle;
    disabledText: TextStyle; // Separate text style for disabled state
    helperText: TextStyle;
    errorText: TextStyle;
}

export interface ListStyles {
    container: ViewStyle;
    item: ViewStyle;
    itemSelected: ViewStyle;
    separator: ViewStyle;
    header: ViewStyle;
    footer: ViewStyle;
}

export interface CardStyles {
    base: ViewStyle;
    header: ViewStyle;
    content: ViewStyle;
    footer: ViewStyle;
    elevated: ViewStyle;
}

export interface Components {
    button: ButtonStyles;
    input: InputStyles;
    list: ListStyles;
    card: CardStyles;
    // Add more component styles as needed
}

/**
 * Utility classes
 */
export interface UtilityStyles {
    flex: Record<string, ViewStyle>;
    margin: Record<string, ViewStyle>;
    padding: Record<string, ViewStyle>;
    text: Record<string, TextStyle>;
    display: Record<string, ViewStyle>;
    size: Record<string, ViewStyle>;
}

/**
 * Main Theme interface
 */
export interface Theme {
    colors: Colors;
    typography: Typography;
    spacing: Spacing;
    layout: Layout;
    shadows: Shadows;
    components: Components;
    utilities: UtilityStyles;
}

/**
 * Theme mode type (light/dark)
 */
export enum ThemeMode {
    LIGHT = 'light',
    DARK = 'dark',
}

/**
 * Extended theme with mode support
 */
export interface ThemedColors extends Colors {
    mode: ThemeMode;
}

export interface ThemedTheme extends Omit<Theme, 'colors'> {
    colors: ThemedColors;
    mode: ThemeMode;
}

/**
 * Style creation function type
 */
export type CreateStylesFunction<T extends StylesObject = StylesObject> = (
    theme: Theme
) => T;

/**
 * Hook types for theme usage
 */
export interface UseThemeResult {
    theme: Theme;
    colors: Colors;
    spacing: Spacing;
    typography: Typography;
    layout: Layout;
    shadows: Shadows;
    components: Components;
    utilities: UtilityStyles;
}

/**
 * Theme configuration options
 */
export interface ThemeConfig {
    mode?: ThemeMode;
    customColors?: Partial<Colors>;
    customTypography?: Partial<Typography>;
    customSpacing?: Partial<Spacing>;
    customComponents?: Partial<Components>;
}

/**
 * Theme provider props
 */
export interface ThemeProviderProps {
    children: React.ReactNode;
    theme?: Theme;
    config?: ThemeConfig;
}