// src/screens/components/ChallengeFilters.tsx
import React from 'react';
import {ScrollView, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

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
    const typeFilters: FilterOption[] = [
        { id: 'ALL', label: 'All', icon: 'view-grid', color: '#607D8B' },
        { id: 'QUEST', label: 'Quests', icon: 'trophy', color: '#FF9800' },
        { id: 'QUIZ', label: 'Quizzes', icon: 'help-circle', color: '#4CAF50' },
        { id: 'ACTIVITY_PARTNER', label: 'Activity', icon: 'account-group', color: '#2196F3' },
        { id: 'FITNESS_TRACKING', label: 'Fitness', icon: 'run', color: '#F44336' },
        { id: 'HABIT_BUILDING', label: 'Habits', icon: 'calendar-check', color: '#9C27B0' },
    ];

    // Special filter just for WWW quizzes
    const wwwFilter: FilterOption = {
        id: 'WWW_QUIZ',
        label: 'What? Where? When?',
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

const styles = StyleSheet.create({
    container: {
        marginBottom: 16,
    },
    title: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
        marginLeft: 16,
        marginBottom: 8,
    },
    filtersContainer: {
        paddingHorizontal: 16,
    },
    filterButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 16,
        marginRight: 8,
        backgroundColor: 'white',
        borderWidth: 1,
        borderColor: '#e0e0e0',
    },
    filterText: {
        fontSize: 14,
        color: '#555',
        marginLeft: 4,
    },
    wwwFilter: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 16,
        marginTop: 12,
        marginHorizontal: 16,
        backgroundColor: 'white',
        borderWidth: 1,
        borderColor: '#e0e0e0',
        alignSelf: 'flex-start',
    },
    wwwFilterText: {
        fontSize: 14,
        color: '#555',
        marginLeft: 8,
        fontWeight: '500',
    },
});

export default ChallengeFilters;