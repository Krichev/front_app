import React, { useEffect, useRef } from 'react';
import { StyleSheet, Text, TouchableOpacity, Animated, Platform, Vibration } from 'react-native';
import ReactNativeHapticFeedback, { HapticFeedbackTypes } from 'react-native-haptic-feedback';

// Configure haptic options
const hapticOptions = {
    enableVibrateFallback: true, // Falls back to Vibration API if haptics unavailable
    ignoreAndroidSystemSettings: false,
};

// Helper function with fallback
const triggerHaptic = (type: HapticFeedbackTypes = HapticFeedbackTypes.impactHeavy) => {
    try {
        ReactNativeHapticFeedback.trigger(type, hapticOptions);
    } catch (error) {
        // Fallback to basic vibration
        Vibration.vibrate(Platform.OS === 'ios' ? 10 : 50);
    }
};

interface BuzzButtonProps {
    onPress: () => void;
    disabled?: boolean;
    isActive?: boolean;
}

export const BuzzButton: React.FC<BuzzButtonProps> = ({ onPress, disabled, isActive }) => {
    const pulseAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        if (isActive && !disabled) {
            Animated.loop(
                Animated.sequence([
                    Animated.timing(pulseAnim, {
                        toValue: 1.1,
                        duration: 500,
                        useNativeDriver: true,
                    }),
                    Animated.timing(pulseAnim, {
                        toValue: 1,
                        duration: 500,
                        useNativeDriver: true,
                    }),
                ])
            ).start();
        } else {
            pulseAnim.setValue(1);
            pulseAnim.stopAnimation();
        }
    }, [isActive, disabled, pulseAnim]);

    const handlePress = () => {
        if (!disabled) {
            if (Platform.OS !== 'web') {
                triggerHaptic(HapticFeedbackTypes.impactHeavy);
            }
            onPress();
        }
    };

    return (
        <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
            <TouchableOpacity
                style={[
                    styles.button,
                    disabled ? styles.disabled : styles.active,
                    isActive && !disabled && styles.pulsing
                ]}
                onPress={handlePress}
                disabled={disabled}
                activeOpacity={0.8}
            >
                <Text style={styles.text}>BUZZ!</Text>
            </TouchableOpacity>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    button: {
        width: 200,
        height: 200,
        borderRadius: 100,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
    },
    active: {
        backgroundColor: '#FF0000',
    },
    disabled: {
        backgroundColor: '#666',
    },
    pulsing: {
        borderWidth: 4,
        borderColor: '#FFAAAA',
    },
    text: {
        color: '#FFF',
        fontSize: 32,
        fontWeight: 'bold',
    },
});
