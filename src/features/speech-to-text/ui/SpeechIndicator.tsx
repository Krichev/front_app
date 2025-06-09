// src/features/speech-to-text/ui/SpeechIndicator.tsx
import React, {useEffect, useRef} from 'react';
import {Animated, StyleSheet, Text, View, ViewStyle} from 'react-native';
import {MaterialCommunityIcons} from '@expo/vector-icons';
import {useSpeechToText} from '../lib/hooks';

interface SpeechIndicatorProps {
    style?: ViewStyle;
    showText?: boolean;
    compact?: boolean;
}

export const SpeechIndicator: React.FC<SpeechIndicatorProps> = ({
                                                                    style,
                                                                    showText = true,
                                                                    compact = false,
                                                                }) => {
    const { isRecording, quality, connectionStatus, hasError } = useSpeechToText();
    const pulseAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        if (isRecording) {
            const pulse = Animated.loop(
                Animated.sequence([
                    Animated.timing(pulseAnim, {
                        toValue: 1.2,
                        duration: 600,
                        useNativeDriver: true,
                    }),
                    Animated.timing(pulseAnim, {
                        toValue: 1,
                        duration: 600,
                        useNativeDriver: true,
                    }),
                ])
            );
            pulse.start();
            return () => pulse.stop();
        } else {
            pulseAnim.setValue(1);
        }
    }, [isRecording, pulseAnim]);

    if (!isRecording && !hasError) {
        return null;
    }

    const getStatusColor = () => {
        if (hasError) return '#ff4444';
        if (connectionStatus === 'connecting') return '#ffd43b';
        if (quality > 0.8) return '#51cf66';
        if (quality > 0.5) return '#ffd43b';
        return '#ff6b6b';
    };

    const getStatusText = () => {
        if (hasError) return 'Error';
        if (connectionStatus === 'connecting') return 'Connecting...';
        if (isRecording) return 'Listening...';
        return '';
    };

    return (
        <View style={[styles.container, compact && styles.compact, style]}>
            <Animated.View style={[{ transform: [{ scale: pulseAnim }] }]}>
                <MaterialCommunityIcons
                    name={hasError ? 'microphone-off' : 'microphone'}
                    size={compact ? 16 : 20}
                    color={getStatusColor()}
                />
            </Animated.View>

            {showText && !compact && (
                <Text style={[styles.statusText, { color: getStatusColor() }]}>
                    {getStatusText()}
                </Text>
            )}

            {isRecording && quality > 0 && (
                <View style={styles.qualityIndicator}>
                    <View
                        style={[
                            styles.qualityBar,
                            {
                                width: `${quality * 100}%`,
                                backgroundColor: getStatusColor(),
                            },
                        ]}
                    />
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.05)',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
    },
    compact: {
        paddingHorizontal: 6,
        paddingVertical: 4,
    },
    statusText: {
        marginLeft: 8,
        fontSize: 14,
        fontWeight: '500',
    },
    qualityIndicator: {
        marginLeft: 8,
        width: 40,
        height: 4,
        backgroundColor: 'rgba(0, 0, 0, 0.1)',
        borderRadius: 2,
        overflow: 'hidden',
    },
    qualityBar: {
        height: '100%',
        borderRadius: 2,
    },
});
