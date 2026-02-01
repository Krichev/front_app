import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useTheme } from '../../../shared/ui/theme';
import { useGetScreenTimeBudgetQuery } from '../../../entities/WagerState/model/slice/wagerApi';
import Svg, { Circle } from 'react-native-svg';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

export const ScreenTimeBudgetWidget: React.FC = () => {
    const { theme } = useTheme();
    const { data: budget, isLoading } = useGetScreenTimeBudgetQuery();

    if (isLoading) {
        return (
            <View style={[styles.container, styles.center, { backgroundColor: theme.colors.background.primary }]}>
                <ActivityIndicator color={theme.colors.primary.main} />
            </View>
        );
    }

    if (!budget) return null;

    const size = 100;
    const strokeWidth = 8;
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const percentage = (budget.availableMinutes / budget.dailyBudgetMinutes) * 100;
    const strokeDashoffset = circumference - (circumference * percentage) / 100;

    const getProgressColor = () => {
        if (percentage > 60) return theme.colors.success.main;
        if (percentage > 30) return theme.colors.warning.main;
        return theme.colors.error.main;
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.background.primary, borderColor: theme.colors.border.light }]}>
            <View style={styles.header}>
                <MaterialCommunityIcons name="clock-outline" size={20} color={theme.colors.text.secondary} />
                <Text style={[styles.title, { color: theme.colors.text.primary }]}>Screen Time Budget</Text>
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
                            {budget.availableMinutes}
                        </Text>
                        <Text style={[styles.minLabel, { color: theme.colors.text.secondary }]}>min</Text>
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
    }
});
