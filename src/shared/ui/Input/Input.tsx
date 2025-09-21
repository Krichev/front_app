import React, {memo, ReactNode, useEffect, useRef, useState} from 'react';
import {Text, TextInput, TextInputProps, TextStyle, View, ViewStyle} from 'react-native';
import {getAddonStyles, getInputStyle, getPlaceholderTextColor} from './Input.styles';

// Input size enumeration
export enum InputSize {
    SMALL = 'small',
    MEDIUM = 'medium',
    LARGE = 'large',
}

// Input variant enumeration
export enum InputVariant {
    DEFAULT = 'default',
    OUTLINE = 'outline',
    FILLED = 'filled',
    UNDERLINE = 'underline',
}

// Input state enumeration
export enum InputState {
    DEFAULT = 'default',
    FOCUSED = 'focused',
    ERROR = 'error',
    DISABLED = 'disabled',
    READONLY = 'readonly',
}

// Input component props interface
export interface InputProps extends Omit<TextInputProps, 'style'> {
    className?: string;
    label?: string;
    helperText?: string;
    errorText?: string;
    containerStyle?: ViewStyle;
    inputStyle?: TextStyle;
    style?: TextStyle;
    autofocus?: boolean;
    readonly?: boolean;
    disabled?: boolean;
    error?: boolean;
    addonLeft?: ReactNode;
    addonRight?: ReactNode;
    size?: InputSize;
    variant?: InputVariant;
}

export const Input = memo((props: InputProps) => {
    const {
        value,
        onChangeText,
        label,
        helperText,
        errorText,
        placeholder,
        autofocus,
        readonly = false,
        disabled = false,
        error = false,
        addonLeft,
        addonRight,
        size = InputSize.MEDIUM,
        variant = InputVariant.DEFAULT,
        containerStyle,
        inputStyle,
        style,
        ...otherProps
    } = props;

    const ref = useRef<TextInput>(null);
    const [isFocused, setIsFocused] = useState(false);

    useEffect(() => {
        if (autofocus) {
            setIsFocused(true);
            ref.current?.focus();
        }
    }, [autofocus]);

    const handleFocus = () => {
        if (!disabled && !readonly) {
            setIsFocused(true);
        }
    };

    const handleBlur = () => setIsFocused(false);

    // Determine current state
    const getCurrentState = (): InputState => {
        if (disabled) return InputState.DISABLED;
        if (readonly) return InputState.READONLY;
        if (error) return InputState.ERROR;
        if (isFocused) return InputState.FOCUSED;
        return InputState.DEFAULT;
    };

    const currentState = getCurrentState();
    const hasAddons = !!(addonLeft || addonRight);
    const supportText = errorText || helperText;
    const isErrorText = !!errorText;

    // Get computed styles
    const computedStyles = getInputStyle(variant, size, currentState, hasAddons, isErrorText);
    const placeholderColor = getPlaceholderTextColor(currentState);

    // Build the input field
    const inputField = (
        <View style={[computedStyles.field, containerStyle]}>
            {addonLeft && (
                <View style={[computedStyles.addon, getAddonStyles('left')]}>
                    {addonLeft}
                </View>
            )}

            <TextInput
                ref={ref}
                value={value?.toString()}
                onChangeText={onChangeText}
                style={[
                    computedStyles.text,
                    inputStyle,
                    style,
                ]}
                placeholder={placeholder}
                placeholderTextColor={placeholderColor}
                editable={!readonly && !disabled}
                onFocus={handleFocus}
                onBlur={handleBlur}
                {...otherProps}
            />

            {addonRight && (
                <View style={[computedStyles.addon, getAddonStyles('right')]}>
                    {addonRight}
                </View>
            )}
        </View>
    );

    // Return with label if provided
    if (label) {
        return (
            <View style={computedStyles.container}>
                <Text style={computedStyles.label}>
                    {label}
                </Text>
                {inputField}
                {supportText && (
                    <Text style={computedStyles.supportText}>
                        {supportText}
                    </Text>
                )}
            </View>
        );
    }

    // Return input field only
    return (
        <View>
            {inputField}
            {supportText && (
                <Text style={computedStyles.supportText}>
                    {supportText}
                </Text>
            )}
        </View>
    );
});

// Display name for debugging
Input.displayName = 'Input';