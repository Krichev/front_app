// src/features/www-game-discussion/ui/DiscussionTimer.tsx
import React, {useEffect, useRef} from 'react';
import {Animated, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {MaterialCommunityIcons} from '@expo/vector-icons';

interface DiscussionTimerProps {
    timeRemaining: number;
    totalTime: number;
    isActive: boolean;
    onStart: () => void;
    onPause: () => void;
    onResume: () => void;
    onTimeUp?: () => void;
}

export const DiscussionTimer: React.FC<DiscussionTimerProps> = ({
                                                                    timeRemaining,
                                                                    totalTime,
                                                                    isActive,
                                                                    onStart,
                                                                    onPause,
                                                                    onResume,
                                                                    onTimeUp,
                                                                }) => {
    const pulseAnim = useRef(new Animated.Value(1)).current;
    const progressAnim = useRef(new Animated.Value(0)).current;

    // Handle time up
    useEffect(() => {
        if (timeRemaining === 0 && onTimeUp) {
            onTimeUp();
        }
    }, [timeRemaining, onTimeUp]);

    // Pulse animation for low time
    useEffect(() => {
        if (timeRemaining <= 10 && timeRemaining > 0 && isActive) {
            const pulse = Animated.loop(
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
            );
            pulse.start();
            return () => pulse.stop();
        } else {
            pulseAnim.setValue(1);
        }
    }, [timeRemaining, isActive, pulseAnim]);

    // Progress animation
    useEffect(() => {
        const progress = totalTime > 0 ? ((totalTime - timeRemaining) / totalTime) : 0;
        Animated.timing(progressAnim, {
            toValue: progress,
            duration: 500,
            useNativeDriver: false,
        }).start();
    }, [timeRemaining, totalTime, progressAnim]);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const getTimerColor = () => {
        if (timeRemaining <= 10) return '#ff4444';
        if (timeRemaining <= 30) return '#ffd43b';
        return '#51cf66';
    };

    const handleToggle = () => {
        if (timeRemaining === totalTime) {
            onStart();
        } else if (isActive) {
            onPause();
        } else {
            onResume();
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.progressContainer}>
                <Animated.View
                    style={[
                        styles.progressBar,
                        {
                            width: progressAnim.interpolate({
                                inputRange: [0, 1],
                                outputRange: ['0%', '100%'],
                            }),
                            backgroundColor: getTimerColor(),
                        }
                    ]}
                />
            </View>

            <Animated.View style={[styles.timerContainer, { transform: [{ scale: pulseAnim }] }]}>
                <Text style={[styles.timerText, { color: getTimerColor() }]}>
                    {formatTime(timeRemaining)}
                </Text>
            </Animated.View>

            <TouchableOpacity style={styles.controlButton} onPress={handleToggle}>
                <CustomIcon
                    name={
                        timeRemaining === totalTime
                            ? 'play'
                            : isActive
                                ? 'pause'
                                : 'play'
                    }
                    size={24}
                    color="#4dabf7"
                />
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 20,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    progressContainer: {
        width: '100%',
        height: 6,
        backgroundColor: '#f0f0f0',
        borderRadius: 3,
        marginBottom: 16,
        overflow: 'hidden',
    },
    progressBar: {
        height: '100%',
        borderRadius: 3,
    },
    timerContainer: {
        marginBottom: 16,
    },
    timerText: {
        fontSize: 32,
        fontWeight: 'bold',
        fontFamily: 'monospace',
    },
    controlButton: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: '#f0f8ff',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#4dabf7',
    },
});