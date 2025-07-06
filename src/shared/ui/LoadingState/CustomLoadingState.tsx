// src/shared/ui/LoadingState/CustomLoadingState.tsx
import React from 'react';
import {ActivityIndicator, StyleSheet, Text, View} from 'react-native';
import {theme} from '../../styles/theme';

interface CustomLoadingStateProps {
    text?: string;
    size?: 'small' | 'large';
}

export const CustomLoadingState: React.FC<CustomLoadingStateProps> = ({
                                                                          text = 'Loading...',
                                                                          size = 'large'
                                                                      }) => {
    return (
        <View style={styles.container}>
            <ActivityIndicator size={size} color={theme.colors.primary} />
            <Text style={styles.text}>{text}</Text>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: theme.spacing.xl,
    },
    text: {
        fontSize: theme.fontSize.md,
        color: theme.colors.text.secondary,
        marginTop: theme.spacing.md,
        textAlign: 'center',
    },
});