// src/screens/ChallengeSearchScreen.tsx
import React, {useState} from 'react';
import {ActivityIndicator, FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View,} from 'react-native';
import {useSearchChallengesQuery} from '../entities/ChallengeState/model/slice/challengeApi';
import {ChallengeCard} from '../components/ChallengeCard/ChallengeCard';
import {ApiChallenge} from '../entities/ChallengeState/model/types/challenge.types';

interface ChallengeSearchScreenProps {
    navigation: any;
}

export const ChallengeSearchScreen: React.FC<ChallengeSearchScreenProps> = ({ navigation }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [activeFilter, setActiveFilter] = useState<'all' | 'free' | 'paid' | 'private'>('all');
    const [debouncedQuery, setDebouncedQuery] = useState('');

    // Debounce search query
    React.useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedQuery(searchQuery);
        }, 500);

        return () => clearTimeout(timer);
    }, [searchQuery]);

    const { data: challenges, isLoading, error, refetch } = useSearchChallengesQuery(
        { q: debouncedQuery || 'fitness', page: 0, size: 50 },
        { skip: !debouncedQuery && activeFilter === 'all' }
    );

    const filterChallenges = (challenges: ApiChallenge[] | undefined) => {
        if (!challenges) return [];

        switch (activeFilter) {
            case 'free':
                return challenges.filter(c => !c.hasEntryFee || c.paymentType === 'FREE');
            case 'paid':
                return challenges.filter(c => c.hasEntryFee);
            case 'private':
                return challenges.filter(c => c.visibility === 'PRIVATE');
            default:
                return challenges;
        }
    };

    const filteredChallenges = filterChallenges(challenges);

    const handleChallengePress = (challenge: ApiChallenge) => {
        navigation.navigate('ChallengeDetails', { challengeId: challenge.id });
    };

    const renderFilterButton = (
        label: string,
        filter: 'all' | 'free' | 'paid' | 'private',
        emoji?: string
    ) => (
        <TouchableOpacity
            style={[styles.filterButton, activeFilter === filter && styles.activeFilterButton]}
            onPress={() => setActiveFilter(filter)}
        >
            <Text style={[styles.filterText, activeFilter === filter && styles.activeFilterText]}>
                {emoji && `${emoji} `}{label}
            </Text>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            {/* Search Header */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Search Challenges</Text>
                <TextInput
                    style={styles.searchInput}
                    placeholder="Search by title or description..."
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    placeholderTextColor="#999"
                />
            </View>

            {/* Filter Buttons */}
            <View style={styles.filterContainer}>
                {renderFilterButton('All', 'all')}
                {renderFilterButton('Free', 'free', '🆓')}
                {renderFilterButton('Paid', 'paid', '💰')}
                {renderFilterButton('Private', 'private', '🔒')}
            </View>

            {/* Results Count */}
            {filteredChallenges.length > 0 && (
                <View style={styles.resultsCount}>
                    <Text style={styles.resultsCountText}>
                        {filteredChallenges.length} challenge{filteredChallenges.length !== 1 ? 's' : ''} found
                    </Text>
                </View>
            )}

            {/* Challenge List */}
            {isLoading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#2196F3" />
                    <Text style={styles.loadingText}>Searching challenges...</Text>
                </View>
            ) : error ? (
                <View style={styles.errorContainer}>
                    <Text style={styles.errorText}>Failed to load challenges</Text>
                    <TouchableOpacity style={styles.retryButton} onPress={() => refetch()}>
                        <Text style={styles.retryButtonText}>Retry</Text>
                    </TouchableOpacity>
                </View>
            ) : filteredChallenges.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <Text style={styles.emptyEmoji}>🔍</Text>
                    <Text style={styles.emptyTitle}>No challenges found</Text>
                    <Text style={styles.emptyDescription}>
                        {searchQuery
                            ? `No challenges match "${searchQuery}"`
                            : 'Try searching for something else'}
                    </Text>
                </View>
            ) : (
                <FlatList
                    data={filteredChallenges}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => (
                        <ChallengeCard challenge={item} onPress={() => handleChallengePress(item)} />
                    )}
                    contentContainerStyle={styles.listContainer}
                    showsVerticalScrollIndicator={false}
                    refreshing={isLoading}
                    onRefresh={refetch}
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    header: {
        backgroundColor: '#FFFFFF',
        padding: 16,
        paddingTop: 48,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: '700',
        color: '#1a1a1a',
        marginBottom: 12,
    },
    searchInput: {
        backgroundColor: '#f5f5f5',
        borderRadius: 12,
        padding: 12,
        fontSize: 16,
        color: '#1a1a1a',
    },
    filterContainer: {
        flexDirection: 'row',
        padding: 16,
        gap: 8,
        backgroundColor: '#FFFFFF',
    },
    filterButton: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: '#f5f5f5',
        borderWidth: 1,
        borderColor: '#e0e0e0',
    },
    activeFilterButton: {
        backgroundColor: '#2196F3',
        borderColor: '#2196F3',
    },
    filterText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#666',
    },
    activeFilterText: {
        color: '#FFFFFF',
    },
    resultsCount: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    resultsCountText: {
        fontSize: 13,
        color: '#666',
    },
    listContainer: {
        padding: 16,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 12,
        fontSize: 14,
        color: '#666',
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    errorText: {
        fontSize: 16,
        color: '#f44336',
        marginBottom: 16,
    },
    retryButton: {
        backgroundColor: '#2196F3',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 8,
    },
    retryButtonText: {
        color: '#FFFFFF',
        fontWeight: '600',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 32,
    },
    emptyEmoji: {
        fontSize: 64,
        marginBottom: 16,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#1a1a1a',
        marginBottom: 8,
    },
    emptyDescription: {
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
    },
});