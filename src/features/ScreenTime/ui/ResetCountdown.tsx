import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../../shared/ui/theme';

interface ResetCountdownProps {
    targetTime?: Date | string;
    onReset?: () => void;
}

export const ResetCountdown: React.FC<ResetCountdownProps> = ({
    targetTime,
    onReset,
}) => {
    const { theme } = useTheme();
    const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0 });
    
    useEffect(() => {
        const calculateTimeLeft = () => {
            let target: Date;
            
            if (targetTime) {
                target = typeof targetTime === 'string' ? new Date(targetTime) : targetTime;
            } else {
                // Default: next midnight
                target = new Date();
                target.setDate(target.getDate() + 1);
                target.setHours(0, 0, 0, 0);
            }
            
            const now = new Date();
            const diff = target.getTime() - now.getTime();
            
            if (diff <= 0) {
                onReset?.();
                return { hours: 0, minutes: 0, seconds: 0 };
            }
            
            return {
                hours: Math.floor(diff / (1000 * 60 * 60)),
                minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
                seconds: Math.floor((diff % (1000 * 60)) / 1000),
            };
        };
        
        setTimeLeft(calculateTimeLeft());
        
        const interval = setInterval(() => {
            setTimeLeft(calculateTimeLeft());
        }, 1000);
        
        return () => clearInterval(interval);
    }, [targetTime, onReset]);
    
    const formatNumber = (num: number) => num.toString().padStart(2, '0');
    
    return (
        <View style={styles.container}>
            <View style={styles.timeBlock}>
                <Text style={[styles.timeValue, { color: theme.colors.primary.main }]}>
                    {formatNumber(timeLeft.hours)}
                </Text>
                <Text style={[styles.timeLabel, { color: theme.colors.text.secondary }]}>
                    hours
                </Text>
            </View>
            
            <Text style={[styles.separator, { color: theme.colors.text.secondary }]}>:</Text>
            
            <View style={styles.timeBlock}>
                <Text style={[styles.timeValue, { color: theme.colors.primary.main }]}>
                    {formatNumber(timeLeft.minutes)}
                </Text>
                <Text style={[styles.timeLabel, { color: theme.colors.text.secondary }]}>
                    min
                </Text>
            </View>
            
            <Text style={[styles.separator, { color: theme.colors.text.secondary }]}>:</Text>
            
            <View style={styles.timeBlock}>
                <Text style={[styles.timeValue, { color: theme.colors.primary.main }]}>
                    {formatNumber(timeLeft.seconds)}
                </Text>
                <Text style={[styles.timeLabel, { color: theme.colors.text.secondary }]}>
                    sec
                </Text>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    timeBlock: {
        alignItems: 'center',
        minWidth: 50,
    },
    timeValue: {
        fontSize: 28,
        fontWeight: 'bold',
        fontVariant: ['tabular-nums'],
    },
    timeLabel: {
        fontSize: 10,
        textTransform: 'uppercase',
        marginTop: 2,
    },
    separator: {
        fontSize: 24,
        fontWeight: 'bold',
        marginHorizontal: 4,
        marginBottom: 16,
    },
});
