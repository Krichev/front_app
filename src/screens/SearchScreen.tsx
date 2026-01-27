import React, { useEffect, useState, useMemo } from 'react';
import {
    ActivityIndicator,
    Image,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useSearchChallengesQuery } from '../entities/ChallengeState/model/slice/challengeApi';
import { useSearchUsersQuery } from '../entities/UserState/model/slice/userApi';
import { RootStackParamList } from '../navigation/AppNavigator';
import { UserSearchResult } from '../entities/QuizState/model/types/question.types';

type SearchScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;

const PREVIEW_LIMIT = 3;

const SearchScreen: React.FC = () => {
    const navigation = useNavigation<SearchScreenNavigationProp>();
    const { t } = useTranslation();

    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedQuery, setDebouncedQuery] = useState('');
    const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
        users: false,
        quizzes: false,
        challenges: false,
    });
    const [recentSearches, setRecentSearches] = useState<string[]>([]);

    // Fetch ALL types when query is valid
    const shouldSearch = debouncedQuery.length >= 2;

    const {
        data: challengeResults,
        isLoading: loadingChallenges,
    } = useSearchChallengesQuery({ q: debouncedQuery }, { skip: !shouldSearch });

    const {
        data: userResults,
        isLoading: loadingUsers,
    } = useSearchUsersQuery(
        { q: debouncedQuery, limit: 20 },
        { skip: !shouldSearch }
    );

    // Separate quizzes from challenges
    const quizResults = useMemo(() => {
        return challengeResults?.filter(c => c.type === 'QUIZ') || [];
    }, [challengeResults]);

    const challengeOnlyResults = useMemo(() => {
        return challengeResults?.filter(c => c.type !== 'QUIZ') || [];
    }, [challengeResults]);

    const users = userResults?.content || [];

    // Debounce
    useEffect(() => {
        const handler = setTimeout(() => {
            if (searchQuery.length >= 2) {
                setDebouncedQuery(searchQuery);
                // eslint-disable-next-line react-hooks/exhaustive-deps
                if (!recentSearches.includes(searchQuery)) {
                    setRecentSearches(prev => [searchQuery, ...prev.slice(0, 4)]);
                }
            } else {
                setDebouncedQuery('');
            }
        }, 400);
        return () => clearTimeout(handler);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchQuery]);

    const isLoading = loadingChallenges || loadingUsers;
    const hasResults = users.length > 0 || quizResults.length > 0 || challengeOnlyResults.length > 0;
    const totalResults = users.length + quizResults.length + challengeOnlyResults.length;

    const toggleSection = (section: string) => {
        setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
    };

    const navigateToUserProfile = (userId: string) => {
        navigation.navigate('UserProfile', { userId });
    };

    const navigateToChallengeDetails = (challengeId: string) => {
        navigation.navigate('ChallengeDetails', { challengeId });
    };

    // Render section header
    const renderSectionHeader = (
        title: string,
        icon: string,
        count: number,
        sectionKey: string
    ) => {
        const isExpanded = expandedSections[sectionKey];
        const showToggle = count > PREVIEW_LIMIT;

        return (
            <TouchableOpacity
                style={styles.sectionHeader}
                onPress={() => showToggle && toggleSection(sectionKey)}
                disabled={!showToggle}
            >
                <View style={styles.sectionHeaderLeft}>
                    <MaterialCommunityIcons name={icon} size={22} color='#007AFF' />
                    <Text style={styles.sectionTitle}>{title}</Text>
                    <View style={styles.countBadge}>
                        <Text style={styles.countText}>{count}</Text>
                    </View>
                </View>
                {showToggle && (
                    <MaterialCommunityIcons
                        name={isExpanded ? 'chevron-up' : 'chevron-down'}
                        size={24}
                        color='#666'
                    />
                )}
            </TouchableOpacity>
        );
    };

    // Render user card
    const renderUserCard = (user: UserSearchResult) => (
        <TouchableOpacity
            key={user.id}
            style={styles.resultCard}
            onPress={() => navigateToUserProfile(user.id)}
        >
            <View style={styles.avatarContainer}>
                {user.avatar ? (
                    <Image source={{ uri: user.avatar }} style={styles.avatar} />
                ) : (
                    <View style={styles.avatarPlaceholder}>
                        <Text style={styles.avatarInitial}>
                            {user.username.charAt(0).toUpperCase()}
                        </Text>
                    </View>
                )}
            </View>
            <View style={styles.cardContent}>
                <View style={styles.cardHeader}>
                    <Text style={styles.cardTitle}>{user.username}</Text>
                    {user.connectionStatus && user.connectionStatus !== 'NONE' && (
                        <View style={[
                            styles.statusBadge,
                            user.connectionStatus === 'ACCEPTED' ? styles.statusConnected : styles.statusPending
                        ]}>
                            <Text style={styles.statusText}>
                                {user.connectionStatus === 'ACCEPTED' ? 'Connected' : 'Pending'}
                            </Text>
                        </View>
                    )}
                </View>
                {user.bio && (
                    <Text style={styles.cardSubtitle} numberOfLines={1}>{user.bio}</Text>
                )}
            </View>
            <MaterialCommunityIcons name='chevron-right' size={20} color='#ccc' />
        </TouchableOpacity>
    );

    // Render challenge/quiz card
    const renderChallengeCard = (challenge: any, isQuiz: boolean) => (
        <TouchableOpacity
            key={challenge.id}
            style={styles.resultCard}
            onPress={() => navigateToChallengeDetails(challenge.id)}
        >
            <View style={[styles.iconContainer, isQuiz ? styles.quizIcon : styles.challengeIcon]}>
                <MaterialCommunityIcons
                    name={isQuiz ? 'brain' : 'trophy'}
                    size={24}
                    color='#fff'
                />
            </View>
            <View style={styles.cardContent}>
                <Text style={styles.cardTitle} numberOfLines={1}>{challenge.title}</Text>
                <Text style={styles.cardSubtitle} numberOfLines={1}>
                    {challenge.description || (isQuiz ? 'Quiz Challenge' : 'Challenge')}
                </Text>
            </View>
            <MaterialCommunityIcons name='chevron-right' size={20} color='#ccc' />
        </TouchableOpacity>
    );

    // Render section content
    const renderSection = (
        title: string,
        icon: string,
        items: any[],
        sectionKey: string,
        renderItem: (item: any) => React.ReactNode
    ) => {
        if (items.length === 0) return null;

        const isExpanded = expandedSections[sectionKey];
        const displayItems = isExpanded ? items : items.slice(0, PREVIEW_LIMIT);

        return (
            <View style={styles.section}>
                {renderSectionHeader(title, icon, items.length, sectionKey)}
                <View style={styles.sectionContent}>
                    {displayItems.map(renderItem)}
                </View>
                {!isExpanded && items.length > PREVIEW_LIMIT && (
                    <TouchableOpacity
                        style={styles.seeAllButton}
                        onPress={() => toggleSection(sectionKey)}
                    >
                        <Text style={styles.seeAllText}>
                            See all {items.length} {title.toLowerCase()}
                        </Text>
                    </TouchableOpacity>
                )}
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            {/* Search Input */}
            <View style={styles.searchContainer}>
                <View style={styles.searchInputWrapper}>
                    <MaterialCommunityIcons name='magnify' size={22} color='#888' />
                    <TextInput
                        style={styles.searchInput}
                        placeholder={t('search.placeholder')}
                        placeholderTextColor='#999'
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        autoCapitalize='none'
                        returnKeyType='search'
                    />
                    {searchQuery.length > 0 && (
                        <TouchableOpacity onPress={() => setSearchQuery('')}>
                            <MaterialCommunityIcons name='close-circle' size={20} color='#888' />
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            {/* Results */}
            <ScrollView
                style={styles.resultsContainer}
                showsVerticalScrollIndicator={false}
            >
                {/* Loading State */}
                {isLoading && debouncedQuery.length >= 2 && (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size='large' color='#007AFF' />
                        <Text style={styles.loadingText}>{t('search.loading')}</Text>
                    </View>
                )}

                {/* Empty Query State */}
                {debouncedQuery.length < 2 && searchQuery.length === 0 && (
                    <View style={styles.emptyState}>
                        <MaterialCommunityIcons name='magnify' size={64} color='#ddd' />
                        <Text style={styles.emptyStateTitle}>{t('search.title')}</Text>
                        <Text style={styles.emptyStateText}>
                            {t('search.subtitle')}
                        </Text>

                        {/* Recent Searches */}
                        {recentSearches.length > 0 && (
                            <View style={styles.recentContainer}>
                                <Text style={styles.recentTitle}>{t('search.recent')}</Text>
                                {recentSearches.map((term, i) => (
                                    <TouchableOpacity
                                        key={i}
                                        style={styles.recentItem}
                                        onPress={() => setSearchQuery(term)}
                                    >
                                        <MaterialCommunityIcons name='history' size={18} color='#888' />
                                        <Text style={styles.recentText}>{term}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        )}
                    </View>
                )}

                {/* Min chars hint */}
                {searchQuery.length > 0 && searchQuery.length < 2 && (
                    <View style={styles.hintContainer}>
                        <Text style={styles.hintText}>{t('search.minChars')}</Text>
                    </View>
                )}

                {/* No Results */}
                {!isLoading && debouncedQuery.length >= 2 && !hasResults && (
                    <View style={styles.emptyState}>
                        <MaterialCommunityIcons name='emoticon-sad-outline' size={64} color='#ddd' />
                        <Text style={styles.emptyStateTitle}>{t('search.noResults')}</Text>
                        <Text style={styles.emptyStateText}>
                            {t('search.tryDifferent')}
                        </Text>
                    </View>
                )}

                {/* Results Summary */}
                {!isLoading && hasResults && (
                    <View style={styles.summaryContainer}>
                        <Text style={styles.summaryText}>
                            {t('search.foundResults', { count: totalResults, plural: totalResults !== 1 ? 's' : '', query: debouncedQuery })}
                        </Text>
                    </View>
                )}

                {/* Users Section */}
                {!isLoading && renderSection(
                    t('search.users'),
                    'account-group',
                    users,
                    'users',
                    (user) => renderUserCard(user)
                )}

                {/* Quizzes Section */}
                {!isLoading && renderSection(
                    t('search.quizzes'),
                    'brain',
                    quizResults,
                    'quizzes',
                    (quiz) => renderChallengeCard(quiz, true)
                )}

                {/* Challenges Section */}
                {!isLoading && renderSection(
                    t('search.challenges'),
                    'trophy',
                    challengeOnlyResults,
                    'challenges',
                    (challenge) => renderChallengeCard(challenge, false)
                )}

                <View style={{ height: 40 }} />
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },
    searchContainer: {
        padding: 16,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    searchInputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f5f5f5',
        borderRadius: 12,
        paddingHorizontal: 14,
        paddingVertical: 12,
    },
    searchInput: {
        flex: 1,
        marginLeft: 10,
        fontSize: 16,
        color: '#333',
    },
    resultsContainer: {
        flex: 1,
    },
    loadingContainer: {
        padding: 40,
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 12,
        color: '#666',
        fontSize: 14,
    },
    emptyState: {
        padding: 40,
        alignItems: 'center',
    },
    emptyStateTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
        marginTop: 16,
    },
    emptyStateText: {
        fontSize: 14,
        color: '#888',
        marginTop: 8,
        textAlign: 'center',
    },
    hintContainer: {
        padding: 20,
        alignItems: 'center',
    },
    hintText: {
        color: '#888',
        fontSize: 14,
    },
    summaryContainer: {
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    summaryText: {
        color: '#666',
        fontSize: 13,
    },
    section: {
        marginBottom: 8,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    sectionHeaderLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginLeft: 10,
    },
    countBadge: {
        backgroundColor: '#e8f4fd',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 10,
        marginLeft: 8,
    },
    countText: {
        fontSize: 12,
        color: '#007AFF',
        fontWeight: '600',
    },
    sectionContent: {
        backgroundColor: '#fff',
    },
    resultCard: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#f5f5f5',
    },
    avatarContainer: {
        width: 44,
        height: 44,
        marginRight: 12,
    },
    avatar: {
        width: 44,
        height: 44,
        borderRadius: 22,
    },
    avatarPlaceholder: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#007AFF',
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarInitial: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '600',
    },
    iconContainer: {
        width: 44,
        height: 44,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    quizIcon: {
        backgroundColor: '#9c27b0',
    },
    challengeIcon: {
        backgroundColor: '#ff9800',
    },
    cardContent: {
        flex: 1,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    cardTitle: {
        fontSize: 15,
        fontWeight: '600',
        color: '#333',
    },
    cardSubtitle: {
        fontSize: 13,
        color: '#888',
        marginTop: 2,
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 10,
        marginLeft: 8,
    },
    statusConnected: {
        backgroundColor: '#e8f5e9',
    },
    statusPending: {
        backgroundColor: '#fff3e0',
    },
    statusText: {
        fontSize: 11,
        fontWeight: '500',
        color: '#666',
    },
    seeAllButton: {
        paddingVertical: 12,
        alignItems: 'center',
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    seeAllText: {
        color: '#007AFF',
        fontSize: 14,
        fontWeight: '500',
    },
    recentContainer: {
        width: '100%',
        marginTop: 24,
        paddingHorizontal: 16,
    },
    recentTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#666',
        marginBottom: 12,
    },
    recentItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    recentText: {
        marginLeft: 10,
        fontSize: 15,
        color: '#333',
    },
});

export default SearchScreen;