import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { StakeType } from '../../../entities/WagerState/model/types';
import { useTheme } from '../../../shared/ui/theme';

interface StakeSelectorProps {
    selectedType: StakeType;
    onSelect: (type: StakeType) => void;
}

const STAKE_TYPES: { type: StakeType; label: string; icon: string }[] = [
    { type: 'POINTS', label: 'Points', icon: '💎' },
    { type: 'SCREEN_TIME', label: 'Time', icon: '⏳' },
    { type: 'MONEY', label: 'Money', icon: '💵' },
    { type: 'SOCIAL_QUEST', label: 'Quest', icon: '🎭' },
];

export const StakeSelector: React.FC<StakeSelectorProps> = ({ selectedType, onSelect }) => {
    const { theme } = useTheme();

    return (
        <View style={styles.container}>
            <Text style={[styles.label, { color: theme.colors.text.primary }]}>Select Stake Type</Text>
            <View style={styles.grid}>
                {STAKE_TYPES.map((item) => (
                    <TouchableOpacity
                        key={item.type}
                        style={[
                            styles.item,
                            {
                                backgroundColor: selectedType === item.type 
                                    ? theme.colors.primary.main 
                                    : theme.colors.background.paper,
                                borderColor: theme.colors.divider,
                            },
                        ]}
                        onPress={() => onSelect(item.type)}
                    >
                        <Text style={styles.icon}>{item.icon}</Text>
                        <Text
                            style={[
                                styles.itemLabel,
                                {
                                    color: selectedType === item.type
                                        ? theme.colors.primary.contrastText
                                        : theme.colors.text.primary,
                                },
                            ]}
                        >
                            {item.label}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginVertical: 12,
    },
    label: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 8,
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    item: {
        width: '23%',
        aspectRatio: 1,
        borderRadius: 12,
        borderWidth: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 4,
    },
    icon: {
        fontSize: 24,
        marginBottom: 4,
    },
    itemLabel: {
        fontSize: 10,
        fontWeight: '500',
        textAlign: 'center',
    },
});
