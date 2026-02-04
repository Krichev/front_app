import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Dimensions } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from '../../../shared/ui/theme';
import { useScreenTime } from '../../../shared/hooks/useScreenTime';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface LowTimeWarningBannerProps {
    thresholdMinutes?: number;
    reappearIntervalMinutes?: number;
}

export const LowTimeWarningBanner: React.FC<LowTimeWarningBannerProps> = ({ 
    thresholdMinutes = 15,
    reappearIntervalMinutes = 5
}) => {
    const { availableSeconds, isLocked } = useScreenTime();
    const { theme } = useTheme();
    const insets = useSafeAreaInsets();
    
    const [visible, setVisible] = useState(false);
    const [dismissedAt, setDismissedAt] = useState<number | null>(null);
    const slideAnim = useRef(new Animated.Value(-100)).current;

    useEffect(() => {
        const availableMinutes = availableSeconds / 60;
        
        // Don't show if locked or plenty of time
        if (isLocked || availableMinutes > thresholdMinutes) {
            if (visible) hideBanner();
            return;
        }

        // Check if should show based on dismiss logic
        if (dismissedAt) {
            const minutesSinceDismiss = (Date.now() - dismissedAt) / 60000;
            if (minutesSinceDismiss < reappearIntervalMinutes) {
                return;
            }
        }

        if (!visible && availableMinutes <= thresholdMinutes) {
            showBanner();
        }

    }, [availableSeconds, isLocked, dismissedAt]);

    const showBanner = () => {
        setVisible(true);
        Animated.spring(slideAnim, {
            toValue: insets.top,
            useNativeDriver: true,
            friction: 8,
        }).start();
    };

    const hideBanner = () => {
        Animated.timing(slideAnim, {
            toValue: -100,
            duration: 300,
            useNativeDriver: true,
        }).start(() => setVisible(false));
    };

    const handleDismiss = () => {
        setDismissedAt(Date.now());
        hideBanner();
    };

    if (!visible) return null;

    return (
        <Animated.View 
            style={[
                styles.container, 
                { 
                    backgroundColor: theme.colors.warning.main,
                    transform: [{ translateY: slideAnim }]
                }
            ]}
        >
            <View style={styles.content}>
                <MaterialCommunityIcons name="timer-sand" size={24} color="#000" />
                <View style={styles.textContainer}>
                    <Text style={styles.title}>Low Screen Time</Text>
                    <Text style={styles.message}>
                        Less than {Math.ceil(availableSeconds / 60)} minutes remaining
                    </Text>
                </View>
                <TouchableOpacity onPress={handleDismiss} style={styles.closeButton}>
                    <MaterialCommunityIcons name="close" size={20} color="#000" />
                </TouchableOpacity>
            </View>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
        margin: 16,
        borderRadius: 12,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
    },
    content: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
    },
    textContainer: {
        flex: 1,
        marginLeft: 12,
    },
    title: {
        fontWeight: 'bold',
        color: '#000',
        fontSize: 14,
    },
    message: {
        color: '#000',
        fontSize: 12,
    },
    closeButton: {
        padding: 4,
    }
});
