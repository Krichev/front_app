import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

interface LockAnimationProps {
    size?: number;
    color?: string;
}

export const LockAnimation: React.FC<LockAnimationProps> = ({ 
    size = 120,
    color = '#FFFFFF'
}) => {
    const scaleAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(scaleAnim, {
                    toValue: 1.1,
                    duration: 1500,
                    useNativeDriver: true,
                }),
                Animated.timing(scaleAnim, {
                    toValue: 1,
                    duration: 1500,
                    useNativeDriver: true,
                }),
            ])
        ).start();
    }, [scaleAnim]);

    return (
        <View style={[styles.container, { width: size, height: size }]}>
            <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
                <MaterialCommunityIcons name="lock" size={size} color={color} />
            </Animated.View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        justifyContent: 'center',
        alignItems: 'center',
    },
});
