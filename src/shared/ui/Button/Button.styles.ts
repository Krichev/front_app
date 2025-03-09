import {StyleSheet, TextStyle, ViewStyle} from "react-native";
import {ButtonSize, ButtonTheme} from "./Button.tsx";

// Define the ButtonStyle type
interface ButtonStyle {
    container: ViewStyle;
    text: TextStyle;
}

// Helper function to generate size-specific styles
const getSizeStyles = (size: ButtonSize): ViewStyle => {
    const sizeStyles: Record<ButtonSize, ViewStyle> = {
        [ButtonSize.M]: { width: 50, height: 50 },
        [ButtonSize.L]: { width: 70, height: 70 },
        [ButtonSize.XL]: { width: 90, height: 90 },
    };
    return sizeStyles[size];
};

// Helper function to generate text-specific styles
const getTextStyles = (size: ButtonSize): TextStyle => {
    const textStyles: Record<ButtonSize, TextStyle> = {
        [ButtonSize.M]: { fontSize: 16 },
        [ButtonSize.L]: { fontSize: 20 },
        [ButtonSize.XL]: { fontSize: 24 },
    };
    return textStyles[size];
};

// Helper function to generate theme-specific styles
const getThemeStyles = (theme: ButtonTheme): ViewStyle => {
    const themeStyles: Record<ButtonTheme, ViewStyle> = {
        clear: {
            padding: 0,
            backgroundColor: 'transparent',
            borderWidth: 0,
        },
        clearInverted: {
            padding: 0,
            backgroundColor: 'transparent',
            borderWidth: 0,
        },
        outline: {
            borderWidth: 1,
            borderColor: '#007AFF', // Replace with your primary color
            backgroundColor: 'transparent',
        },
        background: {
            backgroundColor: '#007AFF', // Replace with your bg color
        },
        backgroundInverted: {
            backgroundColor: '#FFFFFF', // Replace with your inverted bg color
        },
    };
    return themeStyles[theme];
};

// Main function to generate button styles
export const getButtonStyle = (theme: ButtonTheme, size: ButtonSize, square: boolean): ButtonStyle => {
    const baseStyles: ViewStyle = {
        justifyContent: 'center',
        alignItems: 'center',
        padding: square ? 0 : 10,
        borderRadius: square ? 5 : 8,
    };

    const sizeStyles = getSizeStyles(size);
    const themeStyles = getThemeStyles(theme);
    const textStyles = getTextStyles(size);

    return {
        container: StyleSheet.create({ button: { ...baseStyles, ...sizeStyles, ...themeStyles } }).button,
        text: StyleSheet.create({ text: textStyles }).text,
    };
};
