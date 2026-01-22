// src/screens/components/RhythmTapPad.tsx
import React, { useRef, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Pressable,
    Animated,
    Vibration,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

interface RhythmTapPadProps {
    isActive: boolean;
    onTap: () => void;
    tapCount: number;
    totalExpectedTaps?: number;
    showHint?: boolean;
}

/**
 * Large tappable area for rhythm input
 * Provides visual and haptic feedback on each tap
 */
export const RhythmTapPad: React.FC<RhythmTapPadProps> = ({
    isActive,
    onTap,
    tapCount,
    totalExpectedTaps,
    showHint = true,
}) => {
    const scaleAnim = useRef(new Animated.Value(1)).current;
    const rippleAnim = useRef(new Animated.Value(0)).current;
    const opacityAnim = useRef(new Animated.Value(0)).current;
    
    // Pulse animation when waiting for input
    useEffect(() => {
        if (isActive) {
            const pulse = Animated.loop(
                Animated.sequence([
                    Animated.timing(scaleAnim, {
                        toValue: 1.02,
                        duration: 800,
                        useNativeDriver: true,
                    }),
                    Animated.timing(scaleAnim, {
                        toValue: 1,
                        duration: 800,
                        useNativeDriver: true,
                    }),
                ])
            );
            pulse.start();
            return () => pulse.stop();
        } else {
            scaleAnim.setValue(1);
        }
    }, [isActive, scaleAnim]);
    
    const handlePress = useCallback(() => {
        if (!isActive) return;
        
        // Haptic feedback
        Vibration.vibrate(10);
        
        // Ripple animation
        rippleAnim.setValue(0);
        opacityAnim.setValue(1);
        
        Animated.parallel([
            Animated.timing(rippleAnim, {
                toValue: 1,
                duration: 300,
                useNativeDriver: true,
            }),
            Animated.timing(opacityAnim, {
                toValue: 0,
                duration: 300,
                useNativeDriver: true,
            }),
        ]).start();
        
        // Quick scale feedback
        Animated.sequence([
            Animated.timing(scaleAnim, {
                toValue: 0.95,
                duration: 50,
                useNativeDriver: true,
            }),
            Animated.timing(scaleAnim, {
                toValue: 1,
                duration: 100,
                useNativeDriver: true,
            }),
        ]).start();
        
        // Record the tap
        onTap();
    }, [isActive, onTap, rippleAnim, opacityAnim, scaleAnim]);
    
    const rippleScale = rippleAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [0.5, 2],
    });
    
    return (
        <View style={styles.container}>
            <Pressable
                onPress={handlePress}
                disabled={!isActive}
                style={styles.pressableContainer}
            >
                <Animated.View
                    style={[
                        styles.tapPad,
                        isActive ? styles.tapPadActive : styles.tapPadInactive,
                        { transform: [{ scale: scaleAnim }] },
                    ]}
                >
                    {/* Ripple effect */}
                    <Animated.View
                        style={[
                            styles.ripple,
                            {
                                transform: [{ scale: rippleScale }],
                                opacity: opacityAnim,
                            },
                        ]}
                    />
                    
                    {/* Icon */}
                    <MaterialCommunityIcons
                        name={isActive ? 'gesture-tap' : 'gesture-tap-hold'}
                        size={80}
                        color={isActive ? '#fff' : '#666'}
                    />
                    
                    {/* Tap count */}
                    <View style={styles.tapCountContainer}>
                        <Text style={styles.tapCountText}>
                            {tapCount}
                            {totalExpectedTaps ? ` / ${totalExpectedTaps}` : ''}
                        </Text>
                        <Text style={styles.tapCountLabel}>taps</Text>
                    </View>
                    
                    {/* Hint text */}
                    {showHint && isActive && (
                        <Text style={styles.hintText}>
                            Tap to the rhythm!
                        </Text>
                    )}
                </Animated.View>
            </Pressable>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    pressableContainer: {
        width: '100%',
        aspectRatio: 1,
        maxWidth: 300,
        maxHeight: 300,
    },
    tapPad: {
        flex: 1,
        borderRadius: 150,
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
    },
    tapPadActive: {
        backgroundColor: '#4CAF50',
        shadowColor: '#4CAF50',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 10,
        elevation: 8,
    },
    tapPadInactive: {
        backgroundColor: '#333',
        opacity: 0.5,
    },
    ripple: {
        position: 'absolute',
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: 'rgba(255, 255, 255, 0.3)',
    },
    tapCountContainer: {
        marginTop: 16,
        alignItems: 'center',
    },
    tapCountText: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#fff',
    },
    tapCountLabel: {
        fontSize: 14,
        color: 'rgba(255, 255, 255, 0.8)',
    },
    hintText: {
        marginTop: 12,
        fontSize: 16,
        color: 'rgba(255, 255, 255, 0.9)',
        fontStyle: 'italic',
    },
});

export default RhythmTapPad;
