import React, {memo} from 'react';
import {StyleProp, StyleSheet, Text, TextStyle, TouchableOpacity, ViewStyle} from 'react-native';
import {useNavigation, useRoute} from '@react-navigation/native';
import {NativeStackNavigationProp} from "react-native-screens/native-stack";

// Define your navigation stack types
type RootStackParamList = {
    Home: undefined;
    Profile: undefined;
    // Add all your screen names here
};

export type AppLinkVariant = 'primary' | 'red';

interface AppLinkProps {
    to: keyof RootStackParamList;
    style?: StyleProp<ViewStyle>;
    variant?: AppLinkVariant;
    activeStyle?: StyleProp<ViewStyle>;
    textStyle?: StyleProp<TextStyle>;
    activeTextStyle?: StyleProp<TextStyle>;
    children: React.ReactNode;
}

const styles = StyleSheet.create({
    appLink: {
        padding: 8,
    },
    primary: {},
    red: {},
    text: {
        fontSize: 16,
    },
    primaryText: {
        color: 'blue',
    },
    redText: {
        color: 'red',
    },
});

export const AppLink = memo((props: AppLinkProps) => {
    const {
        to,
        style,
        variant = 'primary',
        activeStyle,
        textStyle,
        activeTextStyle,
        children,
        ...otherProps
    } = props;

    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
    const route = useRoute();
    const isActive = route.name === to;

    const handlePress = () => {
        navigation.navigate(to);
    };

    return (
        <TouchableOpacity
            onPress={handlePress}
            style={[
                styles.appLink,
                styles[variant],
                isActive && activeStyle,
                style,
            ]}
            {...otherProps}
        >
            <Text style={[
                styles.text,
                styles[`${variant}Text` as const],
                textStyle,
                isActive && activeTextStyle,
            ]}>
                {children}
            </Text>
        </TouchableOpacity>
    );
});