// src/widgets/challenge-list/ui/ChallengeFilters.tsx
import React from 'react';
import {ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View} from 'react-native';
import {MaterialCommunityIcons} from '@expo/vector-icons';

interface ChallengeFiltersProps {
    selectedType?: string | null;
    selectedStatus?: string | null;
    searchQuery?: string;
    onSelectType: (type: string | null) => void;
    onSelectStatus: (status: string | null) => void;
    onSearch: (query: string) => void;
}

export const ChallengeFilters: React.FC<ChallengeFiltersProps> = ({
                                                                      selectedType,
                                                                      selectedStatus,
                                                                      searchQuery = '',
                                                                      onSelectType,
                                                                      onSelectStatus,
                                                                      onSearch,
                                                                  }) => {
    const challengeTypes = [
        { id: 'fitness', label: 'Fitness', icon: 'run', color: '#ff6b6b' },
        { id: 'learning', label: 'Learning', icon: 'book-open', color: '#4dabf7' },
        { id: 'social', label: 'Social', icon: 'account-group', color: '#51cf66' },
        { id: 'creative', label: 'Creative', icon: 'palette', color: '#9c88ff' },
        { id: 'wellness', label: 'Wellness', icon: 'heart', color: '#ff8cc8' },
    ];

    const statusTypes = [
        { id: 'active', label: 'Active', color: '#51cf66' },
        { id: 'upcoming', label: 'Upcoming', color: '#4dabf7' },
        { id: 'completed', label: 'Completed', color: '#666' },
    ];

    return (
        <View style={styles.container}>
            {/* Search Bar */}
            <View style={styles.searchContainer}>
                <CustomIcon name="magnify" size={20} color="#666" />
                <TextInput
                    style={styles.searchInput}
                    placeholder="Search challenges..."
                    value={searchQuery}
                    onChangeText={onSearch}
                />
                {searchQuery.length > 0 && (
                    <TouchableOpacity onPress={() => onSearch('')}>
                        <CustomIcon name="close" size={20} color="#666" />
                    </TouchableOpacity>
                )}
            </View>

            {/* Type Filters */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Categories</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
                    <View style={styles.filtersContainer}>
                        {challengeTypes.map((type) => (
                            <TouchableOpacity
                                key={type.id}
                                style={[
                                    styles.filterButton,
                                    selectedType === type.id && {
                                        backgroundColor: `${type.color}20`,
                                        borderColor: type.color,
                                    },
                                ]}
                                onPress={() => onSelectType(selectedType === type.id ? null : type.id)}
                            >
                                <CustomIcon
                                    name={type.icon}
                                    size={16}
                                    color={selectedType === type.id ? type.color : '#666'}
                                />
                                <Text style={[
                                    styles.filterText,
                                    selectedType === type.id && { color: type.color },
                                ]}>
                                    {type.label}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </ScrollView>
            </View>

            {/* Status Filters */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Status</Text>
                <View style={styles.statusFilters}>
                    {statusTypes.map((status) => (
                        <TouchableOpacity
                            key={status.id}
                            style={[
                                styles.statusButton,
                                selectedStatus === status.id && {
                                    backgroundColor: `${status.color}20`,
                                    borderColor: status.color,
                                },
                            ]}
                            onPress={() => onSelectStatus(selectedStatus === status.id ? null : status.id)}
                        >
                            <Text style={[
                                styles.statusText,
                                selectedStatus === status.id && { color: status.color },
                            ]}>
                                {status.label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: 'white',
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f8f9fa',
        marginHorizontal: 16,
        paddingHorizontal: 12,
        borderRadius: 8,
        marginBottom: 16,
        gap: 8,
    },
    searchInput: {
        flex: 1,
        paddingVertical: 12,
        fontSize: 16,
        color: '#333',
    },
    section: {
        marginBottom: 12,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
        marginLeft: 16,
        marginBottom: 8,
    },
    filterScroll: {
        paddingLeft: 16,
    },
    filtersContainer: {
        flexDirection: 'row',
        gap: 8,
        paddingRight: 16,
    },
    filterButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 16,
        backgroundColor: '#f8f9fa',
        borderWidth: 1,
        borderColor: '#e0e0e0',
        gap: 6,
    },
    filterText: {
        fontSize: 12,
        color: '#666',
        fontWeight: '500',
    },
    statusFilters: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        gap: 8,
    },
    statusButton: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: 8,
        borderRadius: 8,
        backgroundColor: '#f8f9fa',
        borderWidth: 1,
        borderColor: '#e0e0e0',
    },
    statusText: {
        fontSize: 12,
        color: '#666',
        fontWeight: '500',
    },
});