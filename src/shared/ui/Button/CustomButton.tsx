// components/CustomButton.tsx - Fixed version

import React from 'react';
import {StyleProp, StyleSheet, Text, TextStyle, TouchableOpacity, ViewStyle} from 'react-native';

interface Props {
    title: string;
    onPress: () => void;
    disabled?: boolean;
    loading?: boolean;
    style?: StyleProp<ViewStyle>;
    textStyle?: StyleProp<TextStyle>;
    variant?: 'primary' | 'secondary' | 'outline';
    size?: 'small' | 'medium' | 'large';
}

const CustomButton: React.FC<Props> = ({
                                           title,
                                           onPress,
                                           disabled = false,
                                           loading = false,
                                           style,
                                           textStyle,
                                           variant = 'primary',
                                           size = 'medium',
                                           ...props
                                       }) => {
    // Solution 1: Filter out falsy values
    const buttonStyle = [
        styles.button,
        styles[variant],
        styles[size],
        disabled && styles.disabled,
        loading && styles.loading,
        style
    ].filter(Boolean);

    const combinedTextStyle = [
        styles.text,
        styles[`${variant}Text` as keyof typeof styles],
        disabled && styles.disabledText,
        textStyle
    ].filter(Boolean);

    return (
        <TouchableOpacity
            style={buttonStyle}
            onPress={onPress}
            disabled={disabled || loading}
            activeOpacity={0.7}
            {...props}
        >
            <Text style={combinedTextStyle}>
                {loading ? 'Loading...' : title}
            </Text>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    button: {
        paddingVertical: 15,
        paddingHorizontal: 25,
        borderRadius: 25,
        alignItems: 'center',
        marginVertical: 15,
    },

    // Variants
    primary: {
        backgroundColor: '#1E90FF',
    },
    secondary: {
        backgroundColor: '#6C757D',
    },
    outline: {
        backgroundColor: 'transparent',
        borderWidth: 2,
        borderColor: '#1E90FF',
    },

    // Sizes
    small: {
        paddingVertical: 8,
        paddingHorizontal: 16,
        minHeight: 32,
    },
    medium: {
        paddingVertical: 12,
        paddingHorizontal: 20,
        minHeight: 44,
    },
    large: {
        paddingVertical: 16,
        paddingHorizontal: 24,
        minHeight: 52,
    },

    // States
    disabled: {
        backgroundColor: '#CCCCCC',
        opacity: 0.6,
    },
    loading: {
        opacity: 0.7,
    },

    // Text styles
    text: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#FFFFFF',
    },
    primaryText: {
        color: '#FFFFFF',
    },
    secondaryText: {
        color: '#FFFFFF',
    },
    outlineText: {
        color: '#1E90FF',
    },
    disabledText: {
        color: '#999999',
    },
});

export default CustomButton;