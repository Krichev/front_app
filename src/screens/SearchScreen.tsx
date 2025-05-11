// src/screens/SearchScreen.tsx
import React, {useEffect, useState} from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Image,
    SafeAreaView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {ApiChallenge, useSearchChallengesQuery} from '../entities/ChallengeState/model/slice/challengeApi';
import {UserProfile, useSearchUsersQuery} from '../entities/UserState/model/slice/userApi';
import {RootStackParamList} from '../navigation/AppNavigator';
import QuizChallengeCard from '../entities/ChallengeState/ui/QuizChallengeCard';
import {FormatterService} from '../services/verification/ui/Services';

// Define types
type SearchScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;
type SearchCategory = 'challenges' | 'users' | 'quizzes';

const SearchScreen: React.FC = () => {
    const navigation = useNavigation<SearchScreenNavigationProp>();

    // State
    const [searchQuery, setSearchQuery] = useState('');
    const [category, setCategory] = useState<SearchCategory>('challenges');
    const [debouncedQuery, setDebouncedQuery] = useState('');
    const [recentSearches, setRecentSearches] = useState<string[]>([]);

    // RTK Query hooks
    const {
        data: challengeResults,
        isLoading: loadingChallenges,
        error: challengesError,
    } = useSearchChallengesQuery(debouncedQuery, {
        skip: debouncedQuery.length < 2 || category === 'users',
    });

    const {
        data: userResults,
        isLoading: loadingUsers,
        error: usersError,
    } = useSearchUsersQuery(debouncedQuery, {
        skip: debouncedQuery.length < 2 || category !== 'users',
    });

    // Filter quiz challenges
    const quizResults = React.useMemo(() => {
        if (!challengeResults) return [];

        return challengeResults.filter(challenge => {
            if (category !== 'quizzes') return false;
            return challenge.type === 'QUIZ';
        });
    }, [challengeResults, category]);

    // Standard challenge results (non-quiz)
    const standardChallengeResults = React.useMemo(() => {
        if (!challengeResults) return [];

        return challengeResults.filter(challenge => {
            if (category !== 'challenges') return false;
            return challenge.type !== 'QUIZ';
        });
    }, [challengeResults, category]);

    // Debouncing search query
    useEffect(() => {
        const handler = setTimeout(() => {
            if (searchQuery.length >= 2) {
                setDebouncedQuery(searchQuery);

                // Save to recent searches
                if (!recentSearches.includes(searchQuery)) {
                    setRecentSearches(prev => [searchQuery, ...prev.slice(0, 4)]);
                }
            }
        }, 500);

        return () => {
            clearTimeout(handler);
        };
    }, [searchQuery, recentSearches]);

    // Handle clearing search
    const clearSearch = () => {
        setSearchQuery('');
        setDebouncedQuery('');
    };

    // Navigate to challenge details
    const navigateToChallengeDetails = (challengeId: string) => {
        try {
            if (!challengeId) {
                console.error('Cannot navigate: Challenge ID is undefined');
                Alert.alert('Error', 'Cannot open this challenge (missing ID)');
                return;
            }

            console.log('Navigating to challenge details with ID:', challengeId);
            navigation.navigate('ChallengeDetails', { challengeId });
        } catch (error) {
            console.error('Navigation error:', error);
            Alert.alert('Error', 'Could not open challenge details');
        }
    };

    // Navigate to user profile
    const navigateToUserProfile = (userId: string) => {
        navigation.navigate('UserProfile', {userId});
    };

    // Render challenge item
    const renderChallengeItem = ({item}: { item: ApiChallenge }) => {
        // Use QuizChallengeCard component for quiz type challenges

        if (!item || !item.id) {
            console.warn('Invalid challenge item:', item);
            return null;
        }
        const isQuizChallenge = item.type === 'QUIZ';

        if (isQuizChallenge) {
            return (
                <QuizChallengeCard
                    challenge={item}
                    onPress={() => {
                        console.log('Opening quiz challenge:', item.id);
                        navigateToChallengeDetails(item.id);
                    }}
                />
            );
        }

        // Regular challenge card
        return (
            <TouchableOpacity
                style={styles.challengeItem}
                onPress={() => {
                    console.log('Opening challenge:', item.id);
                    navigateToChallengeDetails(item.id);
                }}
            >
                <View style={styles.challengeHeader}>
                    <Text style={styles.challengeTitle}>{item.title}</Text>
                    <View style={[styles.statusBadge, getStatusStyle(item.status)]}>
                        <Text style={styles.statusText}>{item.status.toUpperCase()}</Text>
                    </View>
                </View>

                {item.description && (
                    <Text style={styles.challengeDesc} numberOfLines={2}>
                        {item.description}
                    </Text>
                )}

                <View style={styles.challengeFooter}>
                    <View style={styles.challengeType}>
                        <MaterialCommunityIcons
                            name={getChallengeTypeIcon(item.type)}
                            size={16}
                            color="#4CAF50"
                            style={styles.typeIcon}
                        />
                        <Text style={styles.challengeTypeText}>{item.type}</Text>
                    </View>

                    {item.created_at && (
                        <Text style={styles.dateText}>
                            {FormatterService.formatDate(item.created_at)}
                        </Text>
                    )}
                </View>
            </TouchableOpacity>
        );
    };

    // Render user item
    const renderUserItem = ({item}: { item: UserProfile }) => (
        <TouchableOpacity
            style={styles.userItem}
            onPress={() => navigateToUserProfile(item.id)}
        >
            <View style={styles.userAvatar}>
                {item.avatar ? (
                    <Image source={{uri: item.avatar}} style={styles.avatarImage}/>
                ) : (
                    <Text style={styles.avatarInitial}>
                        {item.username.charAt(0).toUpperCase()}
                    </Text>
                )}
            </View>
            <View style={styles.userInfo}>
                <Text style={styles.userName}>{item.username}</Text>
                <Text style={styles.userEmail}>{item.email}</Text>
                {item.bio && (
                    <Text style={styles.userBio} numberOfLines={2}>
                        {item.bio}
                    </Text>
                )}
            </View>
        </TouchableOpacity>
    );

    // Helper to get status badge style
    const getStatusStyle = (status: string) => {
        switch (status.toLowerCase()) {
            case 'active':
            case 'open':
                return styles.statusActive;
            case 'completed':
                return styles.statusCompleted;
            case 'failed':
                return styles.statusFailed;
            default:
                return {};
        }
    };

    // Helper to get icon for challenge type
    const getChallengeTypeIcon = (type: string) => {
        switch (type) {
            case 'QUEST':
                return 'trophy';
            case 'QUIZ':
                return 'help-circle';
            case 'ACTIVITY_PARTNER':
                return 'account-group';
            case 'FITNESS_TRACKING':
                return 'run';
            case 'HABIT_BUILDING':
                return 'calendar-check';
            default:
                return 'checkbox-marked-circle-outline';
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            {/* Search Header */}
            <View style={styles.searchHeader}>
                <View style={styles.searchBar}>
                    <MaterialCommunityIcons
                        name="magnify"
                        size={24}
                        color="#888"
                        style={styles.searchIcon}
                    />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search..."
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        returnKeyType="search"
                    />
                    {searchQuery.length > 0 && (
                        <TouchableOpacity onPress={clearSearch} style={styles.clearButton}>
                            <MaterialCommunityIcons name="close" size={18} color="#888"/>
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            {/* Category Selection */}
            <View style={styles.categoryTabs}>
                <TouchableOpacity
                    style={[styles.categoryTab, category === 'challenges' && styles.activeTab]}
                    onPress={() => setCategory('challenges')}
                >
                    <MaterialCommunityIcons
                        name="trophy-outline"
                        size={20}
                        color={category === 'challenges' ? '#4CAF50' : '#888'}
                    />
                    <Text
                        style={[
                            styles.categoryTabText,
                            category === 'challenges' && styles.activeTabText,
                        ]}
                    >
                        Challenges
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.categoryTab, category === 'users' && styles.activeTab]}
                    onPress={() => setCategory('users')}
                >
                    <MaterialCommunityIcons
                        name="account-search-outline"
                        size={20}
                        color={category === 'users' ? '#4CAF50' : '#888'}
                    />
                    <Text
                        style={[
                            styles.categoryTabText,
                            category === 'users' && styles.activeTabText,
                        ]}
                    >
                        Users
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.categoryTab, category === 'quizzes' && styles.activeTab]}
                    onPress={() => setCategory('quizzes')}
                >
                    <MaterialCommunityIcons
                        name="brain"
                        size={20}
                        color={category === 'quizzes' ? '#4CAF50' : '#888'}
                    />
                    <Text
                        style={[
                            styles.categoryTabText,
                            category === 'quizzes' && styles.activeTabText,
                        ]}
                    >
                        Quizzes
                    </Text>
                </TouchableOpacity>
            </View>

            {/* Recent Searches (show only if no search is active) */}
            {debouncedQuery.length === 0 && recentSearches.length > 0 && (
                <View style={styles.recentSearchesContainer}>
                    <Text style={styles.recentSearchesTitle}>Recent Searches</Text>
                    {recentSearches.map((term, index) => (
                        <TouchableOpacity
                            key={index}
                            style={styles.recentSearchItem}
                            onPress={() => setSearchQuery(term)}
                        >
                            <MaterialCommunityIcons name="history" size={16} color="#888"/>
                            <Text style={styles.recentSearchText}>{term}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            )}

            {/* Search Results */}
            <View style={styles.resultsContainer}>
                {debouncedQuery.length < 2 ? (
                    <View style={styles.placeholderContainer}>
                        {debouncedQuery.length === 0 ? (
                            <>
                                <MaterialCommunityIcons name="magnify" size={64} color="#e0e0e0"/>
                                <Text style={styles.placeholderText}>Search for challenges, users or quizzes</Text>
                            </>
                        ) : (
                            <Text style={styles.placeholderText}>Type at least 2 characters to search</Text>
                        )}
                    </View>
                ) : (
                    <>
                        {category === 'challenges' && (
                            <>
                                {loadingChallenges ? (
                                    <View style={styles.loadingContainer}>
                                        <ActivityIndicator size="large" color="#4CAF50"/>
                                        <Text style={styles.loadingText}>Searching challenges...</Text>
                                    </View>
                                ) : standardChallengeResults.length > 0 ? (
                                    <FlatList<ApiChallenge>
                                        data={standardChallengeResults}
                                        renderItem={renderChallengeItem}
                                        keyExtractor={(item) => item.id}
                                        contentContainerStyle={styles.listContainer}
                                    />
                                ) : (
                                    <View style={styles.emptyResultsContainer}>
                                        <MaterialCommunityIcons name="trophy-broken" size={64} color="#e0e0e0"/>
                                        <Text style={styles.emptyResultsText}>
                                            No challenges found matching "{debouncedQuery}"
                                        </Text>
                                    </View>
                                )}
                            </>
                        )}

                        {category === 'users' && (
                            <>
                                {loadingUsers ? (
                                    <View style={styles.loadingContainer}>
                                        <ActivityIndicator size="large" color="#4CAF50"/>
                                        <Text style={styles.loadingText}>Searching users...</Text>
                                    </View>
                                ) : userResults && userResults.length > 0 ? (
                                    <FlatList<UserProfile>
                                        data={userResults}
                                        renderItem={renderUserItem}
                                        keyExtractor={(item) => item.id}
                                        contentContainerStyle={styles.listContainer}
                                    />
                                ) : (
                                    <View style={styles.emptyResultsContainer}>
                                        <MaterialCommunityIcons name="account-question" size={64} color="#e0e0e0"/>
                                        <Text style={styles.emptyResultsText}>
                                            No users found matching "{debouncedQuery}"
                                        </Text>
                                    </View>
                                )}
                            </>
                        )}

                        {category === 'quizzes' && (
                            <>
                                {loadingChallenges ? (
                                    <View style={styles.loadingContainer}>
                                        <ActivityIndicator size="large" color="#4CAF50"/>
                                        <Text style={styles.loadingText}>Searching quizzes...</Text>
                                    </View>
                                ) : quizResults.length > 0 ? (
                                    <FlatList<ApiChallenge>
                                        data={quizResults}
                                        renderItem={renderChallengeItem}
                                        keyExtractor={(item) => item.id}
                                        contentContainerStyle={styles.listContainer}
                                    />
                                ) : (
                                    <View style={styles.emptyResultsContainer}>
                                        <MaterialCommunityIcons name="help-circle" size={64} color="#e0e0e0"/>
                                        <Text style={styles.emptyResultsText}>
                                            No quizzes found matching "{debouncedQuery}"
                                        </Text>
                                    </View>
                                )}
                            </>
                        )}
                    </>
                )}
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    searchHeader: {
        backgroundColor: '#4CAF50',
        padding: 16,
        paddingBottom: 24,
    },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'white',
        borderRadius: 8,
        paddingHorizontal: 12,
        height: 44,
    },
    searchIcon: {
        marginRight: 8,
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
        color: '#333',
    },
    clearButton: {
        padding: 4,
    },
    categoryTabs: {
        flexDirection: 'row',
        backgroundColor: 'white',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 2},
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    categoryTab: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 8,
        borderBottomWidth: 2,
        borderBottomColor: 'transparent',
    },
    activeTab: {
        borderBottomColor: '#4CAF50',
    },
    categoryTabText: {
        marginLeft: 4,
        fontSize: 14,
        fontWeight: '500',
        color: '#888',
    },
    activeTabText: {
        color: '#4CAF50',
    },
    recentSearchesContainer: {
        backgroundColor: 'white',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    recentSearchesTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#555',
        marginBottom: 8,
    },
    recentSearchItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    recentSearchText: {
        marginLeft: 8,
        fontSize: 14,
        color: '#333',
    },
    resultsContainer: {
        flex: 1,
    },
    listContainer: {
        padding: 16,
    },
    placeholderContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    placeholderText: {
        marginTop: 16,
        fontSize: 16,
        color: '#888',
        textAlign: 'center',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    loadingText: {
        marginTop: 12,
        fontSize: 16,
        color: '#555',
    },
    emptyResultsContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    emptyResultsText: {
        marginTop: 16,
        fontSize: 16,
        color: '#888',
        textAlign: 'center',
    },
    challengeItem: {
        backgroundColor: 'white',
        borderRadius: 8,
        padding: 16,
        marginBottom: 12,
        elevation: 1,
        shadowOpacity: 0.1,
        shadowRadius: 2,
        shadowOffset: {width: 0, height: 1},
    },
    challengeHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 8,
    },
    challengeTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
        flex: 1,
        marginRight: 8,
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
        backgroundColor: '#f0f0f0',
    },
    statusActive: {
        backgroundColor: '#E8F5E9',
    },
    statusCompleted: {
        backgroundColor: '#E3F2FD',
    },
    statusFailed: {
        backgroundColor: '#FFEBEE',
    },
    statusText: {
        fontSize: 10,
        fontWeight: 'bold',
        color: '#555',
    },
    challengeDesc: {
        fontSize: 14,
        color: '#757575',
        marginBottom: 12,
    },
    challengeFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 8,
    },
    challengeType: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#E8F5E9',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
    },
    typeIcon: {
        marginRight: 4,
    },
    challengeTypeText: {
        fontSize: 12,
        color: '#4CAF50',
        fontWeight: '500',
    },
    dateText: {
        fontSize: 12,
        color: '#888',
    },
    userItem: {
        backgroundColor: 'white',
        borderRadius: 8,
        padding: 16,
        marginBottom: 12,
        flexDirection: 'row',
        elevation: 1,
        shadowOpacity: 0.1,
        shadowRadius: 2,
        shadowOffset: {width: 0, height: 1},
    },
    userAvatar: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: '#4CAF50',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    avatarImage: {
        width: 50,
        height: 50,
        borderRadius: 25,
    },
    avatarInitial: {
        fontSize: 20,
        fontWeight: 'bold',
        color: 'white',
    },
    userInfo: {
        flex: 1,
    },
    userName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 4,
    },
    userEmail: {
        fontSize: 14,
        color: '#666',
        marginBottom: 4,
    },
    userBio: {
        fontSize: 14,
        color: '#888',
    },
});

export default SearchScreen;