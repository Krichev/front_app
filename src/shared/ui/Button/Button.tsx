import React from 'react';
import {Text, TouchableOpacity} from 'react-native';
import {getButtonStyle} from "./Button.styles.ts";

export enum ButtonTheme {
    CLEAR = 'clear',
    CLEAR_INVERTED = 'clearInverted',
    OUTLINE = 'outline',
    BACKGROUND = 'background',
    BACKGROUND_INVERTED = 'backgroundInverted',
}

export enum ButtonSize {
    M = 'size_m',
    L = 'size_l',
    XL = 'size_xl',
}

interface ButtonProps {
    children: React.ReactNode;
    theme?: ButtonTheme;
    square?: boolean;
    size?: ButtonSize;
    onPress?: () => void;
    style?: any; // Additional styles
}

export const Button: React.FC<ButtonProps> = ({
                                                  children,
                                                  theme = ButtonTheme.BACKGROUND,
                                                  square = false,
                                                  size = ButtonSize.M,
                                                  onPress,
                                                  style,
                                              }) => {
    const buttonStyle = getButtonStyle(theme, size, square);

    return (
        <TouchableOpacity style={[buttonStyle, style]} onPress={onPress}>
            <Text style={{ color: theme === ButtonTheme.BACKGROUND_INVERTED ? '#000000' : '#FFFFFF' }}>
                {children}
            </Text>
        </TouchableOpacity>
    );
};