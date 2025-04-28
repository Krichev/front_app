import React, {useEffect, useMemo, useState} from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    SafeAreaView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import {RouteProp, useNavigation, useRoute} from '@react-navigation/native';
import {NativeStackNavigationProp} from "@react-navigation/native-stack";
import {Challenge, useGetChallengesQuery} from "../entities/ChallengeState/model/slice/challengeApi";
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import ChallengeFilters from './components/ChallengeFilters';
import QuizChallengeCard from '../entities/ChallengeState/ui/QuizChallengeCard';
import {useSelector} from 'react-redux';
import {RootState} from '../app/providers/StoreProvider/store';
import {FormatterService} from '../services/verification/ui/Services';

// Define the types for the navigation parameters
type RootStackParamList = {
    Challenges: { initialFilter?: string };
    ChallengeDetails: { challengeId: string };
    CreateChallenge: undefined;
    CreateWWWQuest: undefined;
};

type MainTabParamList = {
    Challenges: { initialFilter?: string };
};

type ChallengesScreenRouteProp = RouteProp<MainTabParamList, 'Challenges'>;
type ChallengesScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Challenges'>;

const ChallengesScreen: React.FC = () => {
    const route = useRoute<ChallengesScreenRouteProp>();
    const navigation = useNavigation<ChallengesScreenNavigationProp>();
    const {user} = useSelector((state: RootState) => state.auth);

    // If the screen was navigated to with an initial filter, use it
    const initialFilterType = route.params?.initialFilter || null;
    const [selectedType, setSelectedType] = useState<string | null>(initialFilterType);

    // RTK Query call to fetch challenges
    const {data: challenges, error, isLoading, refetch} = useGetChallengesQuery({
        page: 1,
        limit: 50, // Increase limit to get more challenges
        type: selectedType === 'WWW_QUIZ' ? 'QUIZ' : selectedType, // Special handling for WWW filter
        participant_id: user?.id ?? undefined // Convert null to undefined using nullish coalescing
    });

    // Update filter if route params change
    useEffect(() => {
        if (route.params?.initialFilter) {
            setSelectedType(route.params.initialFilter);
        }
    }, [route.params?.initialFilter]);

    // Filter challenges based on selected type
    const filteredChallenges = useMemo(() => {
        if (!challenges) return [];

        if (selectedType === 'WWW_QUIZ') {
            // Filter to show only WWW type quiz challenges
            return challenges.filter(challenge => {
                try {
                    if (!challenge.quizConfig) return false;
                    const quizConfig = JSON.parse(challenge.quizConfig);
                    return challenge.type === 'QUIZ' && quizConfig?.gameType === 'WWW';
                } catch (error) {
                    return false;
                }
            });
        }

        return challenges;
    }, [challenges, selectedType]);

    // Renders each challenge item in the list
    const renderChallengeItem = ({item}: { item: Challenge }) => {
        // Detect if this is a quiz challenge
        const isQuizChallenge = item.type === 'QUIZ';

        if (isQuizChallenge) {
            return (
                <QuizChallengeCard
                    challenge={item}
                    onPress={() => navigation.navigate('ChallengeDetails', {challengeId: item.id})}
                />
            );
        }

        // Use the original challenge item UI for non-quiz challenges
        return (
            <TouchableOpacity
                style={styles.challengeItem}
                onPress={() => navigation.navigate('ChallengeDetails', {challengeId: item.id})}
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

    // Helper to get status badge style
    const getStatusStyle = (status: string) => {
        switch (status.toLowerCase()) {
            case 'active':
                return styles.statusActive;
            case 'completed':
                return styles.statusCompleted;
            case 'failed':
                return styles.statusFailed;
            case 'open':
                return styles.statusActive; // Reuse active style
            case 'in_progress':
                return {}; // Add a style if needed
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

    // Navigate to create challenge or WWW quiz specifically
    const handleCreateChallenge = () => {
        // Show action menu to choose challenge type
        Alert.alert(
            'Create Challenge',
            'What type of challenge would you like to create?',
            [
                {
                    text: 'What? Where? When? Quiz',
                    onPress: () => navigation.navigate('CreateWWWQuest')
                },
                {
                    text: 'Standard Challenge',
                    onPress: () => navigation.navigate('CreateChallenge')
                },
                {
                    text: 'Cancel',
                    style: 'cancel'
                }
            ]
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            {/* Screen Header */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Challenges</Text>

                <TouchableOpacity
                    style={styles.refreshButton}
                    onPress={() => refetch()}
                >
                    <MaterialCommunityIcons name="refresh" size={24} color="white"/>
                </TouchableOpacity>
            </View>

            {/* Challenge Filters */}
            <ChallengeFilters
                selectedType={selectedType}
                onSelectType={setSelectedType}
            />

            {/* Main content area */}
            <View style={styles.content}>
                {isLoading ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color="#4CAF50"/>
                        <Text style={styles.loadingText}>Loading challenges...</Text>
                    </View>
                ) : error ? (
                    <View style={styles.errorContainer}>
                        <MaterialCommunityIcons name="alert-circle" size={48} color="#F44336"/>
                        <Text style={styles.errorText}>Failed to load challenges.</Text>
                        <TouchableOpacity style={styles.retryButton} onPress={() => refetch()}>
                            <Text style={styles.retryButtonText}>Retry</Text>
                        </TouchableOpacity>
                    </View>
                ) : filteredChallenges && filteredChallenges.length > 0 ? (
                    <FlatList
                        data={filteredChallenges}
                        keyExtractor={(item) => item.id}
                        renderItem={renderChallengeItem}
                        contentContainerStyle={styles.challengeList}
                        showsVerticalScrollIndicator={false}
                    />
                ) : (
                    <View style={styles.emptyContainer}>
                        <MaterialCommunityIcons name="bulletin-board" size={60} color="#e0e0e0"/>
                        <Text style={styles.noDataText}>
                            {selectedType ?
                                `No ${selectedType === 'WWW_QUIZ' ? 'What? Where? When?' : selectedType} challenges found.` :
                                'No challenges available.'}
                        </Text>
                        <TouchableOpacity
                            style={styles.createFirstButton}
                            onPress={handleCreateChallenge}
                        >
                            <Text style={styles.createFirstButtonText}>
                                Create Your First {selectedType === 'WWW_QUIZ' ? 'Quiz' : 'Challenge'}
                            </Text>
                        </TouchableOpacity>
                    </View>
                )}
            </View>

            {/* Floating Action Button to create a new challenge */}
            <TouchableOpacity style={styles.fab} onPress={handleCreateChallenge}>
                <Text style={styles.fabText}>+</Text>
            </TouchableOpacity>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        backgroundColor: '#4CAF50',
        elevation: 4,
        shadowOpacity: 0.2,
        shadowRadius: 3,
        shadowOffset: {width: 0, height: 2},
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: 'white',
    },
    refreshButton: {
        padding: 8,
    },
    content: {
        flex: 1,
        padding: 16,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 12,
        fontSize: 16,
        color: '#555',
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    errorText: {
        marginTop: 12,
        fontSize: 16,
        color: '#555',
        marginBottom: 16,
    },
    retryButton: {
        backgroundColor: '#4CAF50',
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 8,
    },
    retryButtonText: {
        color: 'white',
        fontWeight: 'bold',
    },
    challengeList: {
        paddingBottom: 80, // Space for FAB
    },
    challengeItem: {
        backgroundColor: 'white',
        borderRadius: 8,
        padding: 16,
        marginBottom: 12,
        elevation: 2,
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
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        flex: 1,
        marginRight: 8,
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
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
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
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    noDataText: {
        fontSize: 16,
        color: '#757575',
        textAlign: 'center',
        marginTop: 20,
        marginBottom: 20,
    },
    createFirstButton: {
        backgroundColor: '#4CAF50',
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 8,
    },
    createFirstButtonText: {
        color: 'white',
        fontWeight: 'bold',
    },
    fab: {
        position: 'absolute',
        bottom: 24,
        right: 24,
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: '#4CAF50',
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 6,
        shadowOpacity: 0.3,
        shadowRadius: 4,
        shadowOffset: {width: 0, height: 3},
    },
    fabText: {
        fontSize: 24,
        fontWeight: 'bold',
        color: 'white',
    },
});

export default ChallengesScreen;