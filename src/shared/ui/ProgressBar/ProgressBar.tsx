// src/shared/ui/ProgressBar/ProgressBar.tsx
import React from 'react'
import {StyleSheet, Text, View, ViewStyle} from 'react-native'
import {theme} from '../../styles/theme'

interface ProgressBarProps {
    progress: number // 0 to 1
    style?: ViewStyle
    showLabel?: boolean
    label?: string
    height?: number
    color?: string
    backgroundColor?: string
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
                                                            progress,
                                                            style,
                                                            showLabel = false,
                                                            label,
                                                            height = 6,
                                                            color = theme.colors.primary,
                                                            backgroundColor = theme.colors.borderLight
                                                        }) => {
    const percentage = Math.round(progress * 100)

    return (
        <View style={[styles.container, style]}>
            {(showLabel || label) && (
                <Text style={styles.label}>
                    {label || `${percentage}%`}
                </Text>
            )}
            <View style={[styles.track, {height, backgroundColor}]}>
                <View
                    style={[
                        styles.fill,
                        {
                            width: `${percentage}%`,
                            backgroundColor: color,
                            height
                        }
                    ]}
                />
            </View>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        width: '100%',
    },
    label: {
        fontSize: theme.fontSize.sm,
        color: theme.colors.text.secondary,
        marginBottom: theme.spacing.xs,
        textAlign: 'center',
    },
    track: {
        borderRadius: theme.borderRadius.sm,
        overflow: 'hidden',
    },
    fill: {
        borderRadius: theme.borderRadius.sm,
    },
})