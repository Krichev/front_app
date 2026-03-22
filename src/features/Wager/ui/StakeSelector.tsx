import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { StakeType } from '../../../entities/WagerState/model/types';
import { useAppStyles } from '../../../shared/ui/hooks/useAppStyles';
import { createStyles } from '../../../shared/ui/theme/createStyles';

interface StakeSelectorProps {
    selectedType: StakeType;
    onSelect: (type: StakeType) => void;
}

const STAKE_TYPES: { type: StakeType; icon: string }[] = [
    { type: 'POINTS', icon: 'diamond-stone' },
    { type: 'SCREEN_TIME', icon: 'clock-outline' },
    { type: 'MONEY', icon: 'cash' },
    { type: 'SOCIAL_QUEST', icon: 'drama-masks' },
];

export const StakeSelector: React.FC<StakeSelectorProps> = ({ selectedType, onSelect }) => {
    const { t } = useTranslation();
    const { theme } = useAppStyles();
    const styles = themeStyles;

    return (
        <View style={styles.container}>
            <Text style={styles.label}>{t('wager.setup.selectStakeType')}</Text>
            <View style={styles.grid}>
                {STAKE_TYPES.map((item) => {
                    const isSelected = selectedType === item.type;
                    return (
                        <TouchableOpacity
                            key={item.type}
                            style={[
                                styles.item,
                                isSelected && styles.itemSelected,
                            ]}
                            onPress={() => onSelect(item.type)}
                        >
                            <MaterialCommunityIcons 
                                name={item.icon} 
                                size={24} 
                                color={isSelected ? theme.colors.primary.contrastText : theme.colors.text.primary} 
                            />
                            <Text
                                style={[
                                    styles.itemLabel,
                                    isSelected && styles.itemLabelSelected,
                                ]}
                            >
                                {t(`wager.setup.stakeTypes.${item.type}`)}
                            </Text>
                        </TouchableOpacity>
                    );
                })}
            </View>
        </View>
    );
};

const themeStyles = createStyles(theme => ({
    container: {
        marginVertical: theme.spacing.md,
    },
    label: {
        fontSize: theme.typography.fontSize.base,
        fontWeight: theme.typography.fontWeight.semibold,
        marginBottom: theme.spacing.sm,
        color: theme.colors.text.primary,
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        gap: theme.spacing.xs,
    },
    item: {
        width: '23%',
        aspectRatio: 1,
        borderRadius: theme.layout.borderRadius.md,
        borderWidth: theme.layout.borderWidth.thin,
        borderColor: theme.colors.border.main,
        backgroundColor: theme.colors.background.paper,
        justifyContent: 'center',
        alignItems: 'center',
        padding: theme.spacing.xs,
    },
    itemSelected: {
        backgroundColor: theme.colors.primary.main,
        borderColor: theme.colors.primary.main,
    },
    itemLabel: {
        fontSize: theme.typography.fontSize.xs,
        fontWeight: theme.typography.fontWeight.medium,
        textAlign: 'center',
        marginTop: theme.spacing.xs,
        color: theme.colors.text.primary,
    },
    itemLabelSelected: {
        color: theme.colors.primary.contrastText,
    },
}));
