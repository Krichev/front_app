// src/shared/ui/Timer/Timer.tsx
import React, {useRef} from 'react'
import {Animated, StyleSheet, Text, View, ViewStyle} from 'react-native'
import {theme} from '../../styles/theme'

interface TimerProps {
    timeRemaining: number
    totalTime: number
    style?: ViewStyle
    showProgress?: boolean
    size?: 'sm' | 'md' | 'lg'
}

export const CustomTimer: React.FC<TimerProps> = ({
                                                timeRemaining,
                                                totalTime,
                                                style,
                                                showProgress = true,
                                                size = 'md'
                                            }) => {
    const progress = totalTime > 0 ? timeRemaining / totalTime : 0
    const animatedValue = useRef(new Animated.Value(progress)).current

    React.useEffect(() => {
        Animated.timing(animatedValue, {
            toValue: progress,
            duration: 1000,
            useNativeDriver: false,
        }).start()
    }, [progress])

    const formatTime = (seconds: number): string => {
        const mins = Math.floor(seconds / 60)
        const secs = seconds % 60
        return `${mins}:${secs.toString().padStart(2, '0')}`
    }

    const getTimerColor = (): string => {
        if (progress > 0.5) return theme.colors.success
        if (progress > 0.25) return theme.colors.warning
        return theme.colors.error
    }

    return (
        <View style={[styles.container, styles[size], style]}>
            <Text style={[styles.timeText, styles[`${size}Text`], {color: getTimerColor()}]}>
                {timeRemaining > 60 ? formatTime(timeRemaining) : `${timeRemaining}s`}
            </Text>

            {showProgress && (
                <View style={[styles.progressBar, styles[`${size}Bar`]]}>
                    <Animated.View
                        style={[
                            styles.progressFill,
                            {
                                width: animatedValue.interpolate({
                                    inputRange: [0, 1],
                                    outputRange: ['0%', '100%'],
                                }),
                                backgroundColor: getTimerColor(),
                            }
                        ]}
                    />
                </View>
            )}
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
    },
    sm: {
        marginBottom: theme.spacing.sm,
    },
    md: {
        marginBottom: theme.spacing.md,
    },
    lg: {
        marginBottom: theme.spacing.lg,
    },
    timeText: {
        fontWeight: theme.fontWeight.bold,
        textAlign: 'center',
    },
    smText: {
        fontSize: theme.fontSize.sm,
        marginBottom: theme.spacing.xs,
    },
    mdText: {
        fontSize: theme.fontSize.md,
        marginBottom: theme.spacing.sm,
    },
    lgText: {
        fontSize: theme.fontSize.lg,
        marginBottom: theme.spacing.md,
    },
    progressBar: {
        backgroundColor: theme.colors.borderLight,
        borderRadius: theme.borderRadius.sm,
        overflow: 'hidden',
        width: '100%',
    },
    smBar: {
        height: 4,
    },
    mdBar: {
        height: 6,
    },
    lgBar: {
        height: 8,
    },
    progressFill: {
        height: '100%',
        borderRadius: theme.borderRadius.sm,
    },
})