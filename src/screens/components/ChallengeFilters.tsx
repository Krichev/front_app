// src/screens/components/ChallengeFilters.tsx
import React from 'react';
import {ScrollView, Text, TouchableOpacity, View} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { createStyles } from '../../shared/ui/theme';
import { useTranslation } from 'react-i18next';

interface FilterOption {
    id: string;
    label: string;
    icon: string;
    color: string;
}

interface ChallengeFiltersProps {
    selectedType: string | null;
    onSelectType: (type: string | null) => void;
}

const ChallengeFilters: React.FC<ChallengeFiltersProps> = ({
                                                               selectedType,
                                                               onSelectType
                                                           }) => {
    const { t } = useTranslation();
    const styles = themeStyles;

    const typeFilters: FilterOption[] = [
        { id: 'ALL', label: t('common.all'), icon: 'view-grid', color: '#607D8B' },
        { id: 'QUEST', label: 'Quests', icon: 'trophy', color: '#FF9800' },
        { id: 'QUIZ', label: 'Quizzes', icon: 'help-circle', color: '#4CAF50' },
        { id: 'ACTIVITY_PARTNER', label: 'Activity', icon: 'account-group', color: '#2196F3' },
        { id: 'FITNESS_TRACKING', label: 'Fitness', icon: 'run', color: '#F44336' },
        { id: 'HABIT_BUILDING', label: 'Habits', icon: 'calendar-check', color: '#9C27B0' },
    ];

    // Special filter just for WWW quizzes
    const wwwFilter: FilterOption = {
        id: 'WWW_QUIZ',
        label: 'WWW',
        icon: 'brain',
        color: '#4CAF50'
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Filter By Type</Text>

            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.filtersContainer}
            >
                {typeFilters.map((filter) => (
                    <TouchableOpacity
                        key={filter.id}
                        style={[
                            styles.filterButton,
                            selectedType === filter.id && {
                                backgroundColor: `${filter.color}20`, // 20% opacity
                                borderColor: filter.color,
                            },
                        ]}
                        onPress={() => onSelectType(filter.id === 'ALL' ? null : filter.id)}
                    >
                        <MaterialCommunityIcons
                            name={filter.icon}
                            size={20}
                            color={filter.color}
                        />
                        <Text style={[
                            styles.filterText,
                            selectedType === filter.id && { color: filter.color },
                        ]}>
                            {filter.label}
                        </Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>

            {/* WWW Quick Filter */}
            <TouchableOpacity
                style={[
                    styles.wwwFilter,
                    selectedType === wwwFilter.id && {
                        backgroundColor: `${wwwFilter.color}20`, // 20% opacity
                        borderColor: wwwFilter.color,
                    },
                ]}
                onPress={() => onSelectType(selectedType === wwwFilter.id ? null : wwwFilter.id)}
            >
                <MaterialCommunityIcons
                    name={wwwFilter.icon}
                    size={20}
                    color={wwwFilter.color}
                />
                <Text style={[
                    styles.wwwFilterText,
                    selectedType === wwwFilter.id && { color: wwwFilter.color },
                ]}>
                    {wwwFilter.label} Quizzes
                </Text>
            </TouchableOpacity>
        </View>
    );
};

const themeStyles = createStyles(theme => ({
    container: {
        marginBottom: theme.spacing.lg,
    },
    title: {
        fontSize: theme.typography.fontSize.base,
        fontWeight: theme.typography.fontWeight.bold,
        color: theme.colors.text.primary,
        marginLeft: theme.spacing.lg,
        marginBottom: theme.spacing.sm,
    },
    filtersContainer: {
        paddingHorizontal: theme.spacing.lg,
        paddingRight: theme.spacing['3xl'],
    },
    filterButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: theme.spacing.sm,
        paddingHorizontal: theme.spacing.md,
        borderRadius: theme.layout.borderRadius.full,
        marginRight: theme.spacing.sm,
        backgroundColor: theme.colors.background.paper,
        borderWidth: theme.layout.borderWidth.thin,
        borderColor: theme.colors.border.light,
        minHeight: 44,
    },
    filterText: {
        fontSize: theme.typography.fontSize.sm,
        color: theme.colors.text.secondary,
        marginLeft: theme.spacing.xs,
    },
    wwwFilter: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: theme.spacing.sm,
        paddingHorizontal: theme.spacing.lg,
        borderRadius: theme.layout.borderRadius.full,
        marginTop: theme.spacing.md,
        marginHorizontal: theme.spacing.lg,
        backgroundColor: theme.colors.background.paper,
        borderWidth: theme.layout.borderWidth.thin,
        borderColor: theme.colors.border.light,
        alignSelf: 'flex-start',
        minHeight: 44,
    },
    wwwFilterText: {
        fontSize: theme.typography.fontSize.sm,
        color: theme.colors.text.secondary,
        marginLeft: theme.spacing.sm,
        fontWeight: theme.typography.fontWeight.medium,
    },
}));

export default ChallengeFilters;
