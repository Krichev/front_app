import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useTheme } from '../../../shared/ui/theme';
import Svg, { Circle } from 'react-native-svg';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useScreenTime, useFormattedScreenTime } from '../../../shared/hooks/useScreenTime';

export const ScreenTimeBudgetWidget: React.FC = () => {
    const { theme } = useTheme();
    const { budget, isTracking, isLocked } = useScreenTime();
    const { formatted, urgencyLevel, minutes: availableMinutes } = useFormattedScreenTime();

    if (!budget) {
        return (
            <View style={[styles.container, styles.center, { backgroundColor: theme.colors.background.primary }]}>
                <ActivityIndicator color={theme.colors.primary.main} />
            </View>
        );
    }

    const size = 100;
    const strokeWidth = 8;
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    
    // Calculate percentage based on available vs daily (capped at 100)
    // Note: availableMinutes from hook is based on seconds, so we convert back to check percentage
    const currentAvailableMinutes = parseInt(formatted.split(':')[0]) * 60 + parseInt(formatted.split(':')[1]);
    const percentage = Math.min(100, Math.max(0, (currentAvailableMinutes / budget.dailyBudgetMinutes) * 100));
    
    const strokeDashoffset = circumference - (circumference * percentage) / 100;

    const getProgressColor = () => {
        if (urgencyLevel === 'critical') return theme.colors.error.main;
        if (urgencyLevel === 'warning') return theme.colors.warning.main;
        return theme.colors.success.main;
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.background.primary, borderColor: theme.colors.border.light }]}>
            <View style={styles.header}>
                <MaterialCommunityIcons name="clock-outline" size={20} color={theme.colors.text.secondary} />
                <Text style={[styles.title, { color: theme.colors.text.primary }]}>Screen Time Budget</Text>
                {isTracking && (
                    <View style={styles.liveIndicator}>
                        <View style={[styles.dot, { backgroundColor: theme.colors.success.main }]} />
                        <Text style={[styles.liveText, { color: theme.colors.success.main }]}>LIVE</Text>
                    </View>
                )}
            </View>

            <View style={styles.content}>
                <View style={styles.chartContainer}>
                    <Svg width={size} height={size}>
                        <Circle
                            cx={size / 2}
                            cy={size / 2}
                            r={radius}
                            stroke={theme.colors.background.secondary}
                            strokeWidth={strokeWidth}
                            fill="none"
                        />
                        <Circle
                            cx={size / 2}
                            cy={size / 2}
                            r={radius}
                            stroke={getProgressColor()}
                            strokeWidth={strokeWidth}
                            strokeDasharray={circumference}
                            strokeDashoffset={strokeDashoffset}
                            strokeLinecap="round"
                            fill="none"
                            transform={`rotate(-90 ${size / 2} ${size / 2})`}
                        />
                    </Svg>
                    <View style={styles.chartTextContainer}>
                        <Text style={[styles.availableText, { color: theme.colors.text.primary }]}>
                            {formatted}
                        </Text>
                        <Text style={[styles.minLabel, { color: theme.colors.text.secondary }]}>
                            {isLocked ? 'LOCKED' : 'remaining'}
                        </Text>
                    </View>
                </View>

                <View style={styles.stats}>
                    <View style={styles.statItem}>
                        <MaterialCommunityIcons name="lock" size={16} color={theme.colors.warning.main} />
                        <Text style={[styles.statLabel, { color: theme.colors.text.secondary }]}>Locked:</Text>
                        <Text style={[styles.statValue, { color: theme.colors.text.primary }]}>{budget.lockedMinutes}m</Text>
                    </View>
                    <View style={styles.statItem}>
                        <MaterialCommunityIcons name="trending-down" size={16} color={theme.colors.error.main} />
                        <Text style={[styles.statLabel, { color: theme.colors.text.secondary }]}>Lost:</Text>
                        <Text style={[styles.statValue, { color: theme.colors.text.primary }]}>{budget.lostMinutes}m</Text>
                    </View>
                    <View style={styles.statItem}>
                        <MaterialCommunityIcons name="calendar-today" size={16} color={theme.colors.info.main} />
                        <Text style={[styles.statLabel, { color: theme.colors.text.secondary }]}>Daily:</Text>
                        <Text style={[styles.statValue, { color: theme.colors.text.primary }]}>{budget.dailyBudgetMinutes}m</Text>
                    </View>
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        margin: 16,
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    title: {
        fontSize: 16,
        fontWeight: 'bold',
        marginLeft: 8,
    },
    content: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-around',
    },
    chartContainer: {
        width: 100,
        height: 100,
        justifyContent: 'center',
        alignItems: 'center',
    },
    chartTextContainer: {
        position: 'absolute',
        alignItems: 'center',
    },
    availableText: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    minLabel: {
        fontSize: 10,
    },
    stats: {
        flex: 1,
        marginLeft: 20,
    },
    statItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    statLabel: {
        fontSize: 12,
        marginLeft: 4,
        flex: 1,
    },
    statValue: {
        fontSize: 12,
        fontWeight: '600',
    },
    center: {
        justifyContent: 'center',
        alignItems: 'center',
        height: 140,
    },
    liveIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
        marginLeft: 'auto',
        backgroundColor: 'rgba(0,0,0,0.05)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    dot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        marginRight: 4,
    },
    liveText: {
        fontSize: 10,
        fontWeight: 'bold',
    }
});
