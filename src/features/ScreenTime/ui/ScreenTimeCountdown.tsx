import React, { useEffect, useRef } from 'react';
import { TouchableOpacity, Text, StyleSheet, Animated } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from '../../../shared/ui/theme';
import { useFormattedScreenTime } from '../../../shared/hooks/useScreenTime';

interface ScreenTimeCountdownProps {
    compact?: boolean;
    onPress?: () => void;
    showIcon?: boolean;
}

export const ScreenTimeCountdown: React.FC<ScreenTimeCountdownProps> = ({ 
    compact = false, 
    onPress,
    showIcon = true 
}) => {
    const { formatted, urgencyLevel } = useFormattedScreenTime();
    const { theme } = useTheme();
    const pulseAnim = useRef(new Animated.Value(1)).current;

    const getColor = () => {
        switch (urgencyLevel) {
            case 'critical': return theme.colors.error.main;
            case 'warning': return theme.colors.warning.main;
            default: return theme.colors.success.main;
        }
    };

    useEffect(() => {
        if (urgencyLevel === 'critical') {
            Animated.loop(
                Animated.sequence([
                    Animated.timing(pulseAnim, {
                        toValue: 0.5,
                        duration: 1000,
                        useNativeDriver: true,
                    }),
                    Animated.timing(pulseAnim, {
                        toValue: 1,
                        duration: 1000,
                        useNativeDriver: true,
                    }),
                ])
            ).start();
        } else {
            pulseAnim.setValue(1);
        }
    }, [urgencyLevel]);

    return (
        <TouchableOpacity 
            onPress={onPress} 
            disabled={!onPress}
            style={[styles.container, compact && styles.compactContainer]}
        >
            <Animated.View style={{ opacity: pulseAnim, flexDirection: 'row', alignItems: 'center' }}>
                {showIcon && (
                    <MaterialCommunityIcons 
                        name="timer-outline" 
                        size={compact ? 16 : 24} 
                        color={getColor()} 
                        style={{ marginRight: 4 }}
                    />
                )}
                <Text style={[
                    styles.text, 
                    compact ? styles.compactText : styles.fullText,
                    { color: getColor() }
                ]}>
                    {formatted}
                </Text>
            </Animated.View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 8,
    },
    compactContainer: {
        padding: 4,
    },
    text: {
        fontWeight: 'bold',
        fontVariant: ['tabular-nums'],
    },
    compactText: {
        fontSize: 14,
    },
    fullText: {
        fontSize: 24,
    }
});
