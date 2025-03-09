import React, {memo, ReactNode, useEffect, useRef, useState,} from 'react';
import {Text, TextInput, TextInputProps, TextStyle, View, ViewStyle,} from 'react-native';
import styles from "./Input.styles.ts";

interface InputProps extends TextInputProps {
    className?: string;
    label?: string;
    containerStyle?: ViewStyle;
    inputStyle?: TextStyle;
    autofocus?: boolean;
    readonly?: boolean;
    addonLeft?: ReactNode;
    addonRight?: ReactNode;
    size?: 's' | 'm' | 'l';
}

export const Input = memo((props: InputProps) => {
    const {
        value,
        onChangeText,
        label,
        placeholder,
        autofocus,
        readonly,
        addonLeft,
        addonRight,
        size = 'm',
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

    const handleFocus = () => setIsFocused(true);
    const handleBlur = () => setIsFocused(false);

    const getSizeStyle = () => {
        switch (size) {
            case 's': return styles.sizeS;
            case 'm': return styles.sizeM;
            case 'l': return styles.sizeL;
        }
    };

    const inputContainer = (
        <View style={[
            styles.inputWrapper,
            getSizeStyle(),
            isFocused && styles.focused,
            readonly && styles.readonly,
            containerStyle,
        ]}>
            {addonLeft && <View style={styles.addonLeft}>{addonLeft}</View>}
            <TextInput
                ref={ref}
                value={value?.toString()}
                onChangeText={onChangeText}
                style={[
                    styles.input,
                    inputStyle,
                    style,
                ]}
                placeholder={placeholder}
                placeholderTextColor="#888"
                editable={!readonly}
                onFocus={handleFocus}
                onBlur={handleBlur}
                {...otherProps}
            />
            {addonRight && <View style={styles.addonRight}>{addonRight}</View>}
        </View>
    );

    if (label) {
        return (
            <View style={[styles.labelContainer, containerStyle]}>
                <Text style={styles.label}>{label}</Text>
                {inputContainer}
            </View>
        );
    }

    return inputContainer;
});

