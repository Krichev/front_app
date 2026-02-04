import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

interface UnlockTransitionProps {
    isUnlocking: boolean;
    onComplete: () => void;
}

export const UnlockTransition: React.FC<UnlockTransitionProps> = ({
    isUnlocking,
    onComplete,
}) => {
    const scaleAnim = useRef(new Animated.Value(1)).current;
    const rotateAnim = useRef(new Animated.Value(0)).current;
    const fadeAnim = useRef(new Animated.Value(1)).current;
    
    useEffect(() => {
        if (isUnlocking) {
            Animated.sequence([
                // Shake/wiggle the lock
                Animated.sequence([
                    Animated.timing(rotateAnim, { toValue: 1, duration: 50, useNativeDriver: true }),
                    Animated.timing(rotateAnim, { toValue: -1, duration: 50, useNativeDriver: true }),
                    Animated.timing(rotateAnim, { toValue: 1, duration: 50, useNativeDriver: true }),
                    Animated.timing(rotateAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
                ]),
                // Scale up and fade out
                Animated.parallel([
                    Animated.timing(scaleAnim, {
                        toValue: 2,
                        duration: 300,
                        useNativeDriver: true,
                    }),
                    Animated.timing(fadeAnim, {
                        toValue: 0,
                        duration: 300,
                        useNativeDriver: true,
                    }),
                ]),
            ]).start(onComplete);
        }
    }, [isUnlocking]);
    
    if (!isUnlocking) return null;
    
    const rotate = rotateAnim.interpolate({
        inputRange: [-1, 0, 1],
        outputRange: ['-10deg', '0deg', '10deg'],
    });
    
    return (
        <Animated.View
            style={[
                styles.container,
                {
                    opacity: fadeAnim,
                    transform: [
                        { scale: scaleAnim },
                        { rotate },
                    ],
                },
            ]}
        >
            <MaterialCommunityIcons
                name="lock-open-variant"
                size={80}
                color="#4CAF50"
            />
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.95)',
    },
});
