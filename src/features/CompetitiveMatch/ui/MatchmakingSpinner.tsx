// src/features/CompetitiveMatch/ui/MatchmakingSpinner.tsx
import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { useTheme } from '../../../shared/ui/theme';

interface MatchmakingSpinnerProps {
    estimatedWait?: number;
    queuePosition?: number;
}

export const MatchmakingSpinner: React.FC<MatchmakingSpinnerProps> = ({ estimatedWait, queuePosition }) => {
    const { theme } = useTheme();
    const spinValue = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.loop(
            Animated.timing(spinValue, {
                toValue: 1,
                duration: 2000,
                easing: Easing.linear,
                useNativeDriver: true,
            })
        ).start();
    }, []);

    const spin = spinValue.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '360deg'],
    });

    return (
        <View style={styles.container}>
            <Animated.View style={[styles.circle, { borderColor: theme.colors.primary.main, transform: [{ rotate: spin }] }]}>
                <Text style={styles.icon}>🔍</Text>
            </Animated.View>
            <Text style={[styles.text, { color: theme.colors.text.primary }]}>Looking for opponent...</Text>
            {queuePosition !== undefined && (
                <Text style={[styles.subtext, { color: theme.colors.text.secondary }]}>
                    Position in queue: {queuePosition}
                </Text>
            )}
            {estimatedWait !== undefined && (
                <Text style={[styles.subtext, { color: theme.colors.text.secondary }]}>
                    Estimated wait: ~{estimatedWait}s
                </Text>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: 32,
    },
    circle: {
        width: 100,
        height: 100,
        borderRadius: 50,
        borderWidth: 4,
        borderStyle: 'dashed',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 24,
    },
    icon: {
        fontSize: 40,
    },
    text: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    subtext: {
        fontSize: 14,
    },
});
