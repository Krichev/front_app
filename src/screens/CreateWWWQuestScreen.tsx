// src/screens/CreateWWWQuestScreen.tsx
// COMPLETE VERSION USING QuizQuestionSearchController.advancedSearch

import React, {useEffect, useMemo, useState} from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    KeyboardAvoidingView,
    Modal,
    Platform,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {CreateChallengeRequest, useCreateChallengeMutation} from '../entities/ChallengeState/model/slice/challengeApi';
import {
    StartQuizSessionRequest,
    useGetUserQuestionsQuery,
    useStartQuizSessionMutation
} from '../entities/QuizState/model/slice/quizApi';
import {useSelector} from 'react-redux';
import {RootState, store} from '../app/providers/StoreProvider/store';
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import {APIDifficulty, QuestionData, QuestionService} from '../services/wwwGame/questionService';

export type QuestionType = 'text' | 'audio' | 'video';

interface MultimediaQuestionData {
    id?: string;
    question: string;
    answer: string;
    difficulty: 'EASY' | 'MEDIUM' | 'HARD';
    topic?: string;
    additionalInfo?: string;
    questionType: QuestionType;
}

type RootStackParamList = {
    Main: { screen?: string; params?: any };
    WWWGamePlay: {
        sessionId?: string;
        challengeId?: string;
    };
};

type CreateWWWQuestScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;

const CreateWWWQuestScreen: React.FC = () => {
    const navigation = useNavigation<CreateWWWQuestScreenNavigationProp>();
    const { user } = useSelector((state: RootState) => state.auth);

    // API hooks
    const [createChallenge, { isLoading: isCreatingChallenge }] = useCreateChallengeMutation();
    const [startQuizSession, { isLoading: isStartingSession }] = useStartQuizSessionMutation();

    // Question source state
    const [questionSource, setQuestionSource] = useState<'app' | 'user'>('app');

    // User questions query
    const {
        data: userQuestions = [],
        isLoading: isLoadingUserQuestions
    } = useGetUserQuestionsQuery(undefined, {
        skip: questionSource !== 'user'
    });

    // App questions state
    const [appQuestions, setAppQuestions] = useState<QuestionData[]>([]);
    const [isLoadingAppQuestions, setIsLoadingAppQuestions] = useState(false);
    const [appQuestionsError, setAppQuestionsError] = useState<string | null>(null);

    // Search filters state
    const [searchKeyword, setSearchKeyword] = useState('');
    const [searchDifficulty, setSearchDifficulty] = useState<APIDifficulty | 'ALL'>('ALL');
    const [searchTopic, setSearchTopic] = useState('');
    const [availableTopics, setAvailableTopics] = useState<string[]>([]);
    const [showTopicPicker, setShowTopicPicker] = useState(false);

    // Pagination state
    const [currentPage, setCurrentPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [totalQuestions, setTotalQuestions] = useState(0);

    // Selection state
    const [selectedAppQuestionIds, setSelectedAppQuestionIds] = useState<Set<string>>(new Set());
    const [selectedUserQuestionIds, setSelectedUserQuestionIds] = useState<Set<string>>(new Set());
    const [newCustomQuestions, setNewCustomQuestions] = useState<MultimediaQuestionData[]>([]);

    // Form state
    const [title, setTitle] = useState('WWWW Quiz');
    const [description, setDescription] = useState('Test your knowledge in this team-based quiz game.');
    const [reward, setReward] = useState('Points and bragging rights!');

    // Load available topics on mount
    useEffect(() => {
        loadAvailableTopics();
    }, []);

    // Auto-search when page changes
    useEffect(() => {
        if (questionSource === 'app') {
            searchAppQuestions();
        }
    }, [currentPage, questionSource]);

    /**
     * Load available topics from backend
     */
    const loadAvailableTopics = async () => {
        try {
            const topics = await QuestionService.getAvailableTopics(store);
            setAvailableTopics(['All Topics', ...topics]);
        } catch (error) {
            console.error('Error loading topics:', error);
            setAvailableTopics(['All Topics', 'History', 'Science', 'Geography', 'Sports', 'Arts', 'Literature']);
        }
    };

    /**
     * Search app questions using QuizQuestionSearchController.advancedSearch
     */
    const searchAppQuestions = async () => {
        setIsLoadingAppQuestions(true);
        setAppQuestionsError(null);

        try {
            // Prepare search parameters
            const searchParams: {
                keyword?: string;
                difficulty?: APIDifficulty;
                topic?: string;
                isUserCreated?: boolean;
                page: number;
                size: number;
                store: any;
            } = {
                page: currentPage,
                size: 50,
                store: store,
                isUserCreated: false  // Only search app questions
            };

            // Add optional filters only if they have values
            if (searchKeyword && searchKeyword.trim()) {
                searchParams.keyword = searchKeyword.trim();
            }

            if (searchDifficulty && searchDifficulty !== 'ALL') {
                searchParams.difficulty = searchDifficulty;
            }

            if (searchTopic && searchTopic !== 'All Topics' && searchTopic.trim()) {
                searchParams.topic = searchTopic.trim();
            }

            console.log('Searching with params:', searchParams);

            // Call the advancedSearchQuestions method
            const result = await QuestionService.advancedSearchQuestions(searchParams);

            console.log('Search results:', result);

            setAppQuestions(result.questions);
            setTotalPages(result.totalPages);
            setTotalQuestions(result.totalElements);

            if (result.questions.length === 0) {
                setAppQuestionsError('No questions found. Try different search criteria.');
            }
        } catch (error: any) {
            console.error('Error searching questions:', error);
            setAppQuestionsError(error.message || 'Failed to search questions. Please try again.');
            setAppQuestions([]);
            setTotalPages(0);
            setTotalQuestions(0);
        } finally {
            setIsLoadingAppQuestions(false);
        }
    };

    /**
     * Handle search button click
     */
    const handleSearch = () => {
        setCurrentPage(0); // Reset to first page
        searchAppQuestions();
    };

    /**
     * Clear all filters
     */
    const handleClearFilters = () => {
        setSearchKeyword('');
        setSearchDifficulty('ALL');
        setSearchTopic('');
        setCurrentPage(0);
    };

    /**
     * Load next page
     */
    const loadNextPage = () => {
        if (currentPage < totalPages - 1) {
            setCurrentPage(currentPage + 1);
        }
    };

    /**
     * Load previous page
     */
    const loadPreviousPage = () => {
        if (currentPage > 0) {
            setCurrentPage(currentPage - 1);
        }
    };

    // Toggle question selection
    const toggleAppQuestionSelection = (questionId: string) => {
        const newSelection = new Set(selectedAppQuestionIds);
        if (newSelection.has(questionId)) {
            newSelection.delete(questionId);
        } else {
            newSelection.add(questionId);
        }
        setSelectedAppQuestionIds(newSelection);
    };

    const toggleUserQuestionSelection = (questionId: string) => {
        const newSelection = new Set(selectedUserQuestionIds);
        if (newSelection.has(questionId)) {
            newSelection.delete(questionId);
        } else {
            newSelection.add(questionId);
        }
        setSelectedUserQuestionIds(newSelection);
    };

    // Calculate total selected questions
    const totalSelectedQuestions = useMemo(() => {
        return selectedAppQuestionIds.size + selectedUserQuestionIds.size + newCustomQuestions.length;
    }, [selectedAppQuestionIds, selectedUserQuestionIds, newCustomQuestions]);

    // Create quest/challenge
    const handleCreateQuest = async () => {
        if (totalSelectedQuestions === 0) {
            Alert.alert('No Questions Selected', 'Please select at least one question to create a quest.');
            return;
        }

        if (!title.trim()) {
            Alert.alert('Missing Title', 'Please provide a title for the quest.');
            return;
        }

        try {
            // Gather all selected question IDs
            const selectedQuestionIds = [
                ...Array.from(selectedAppQuestionIds).map(id => parseInt(id)),
                ...Array.from(selectedUserQuestionIds).map(id => parseInt(id))
            ];

            // Create challenge request
            const challengeRequest: CreateChallengeRequest = {
                title,
                description,
                reward,
                type: 'QUIZ',
                difficulty: 'MEDIUM',
                startDate: new Date().toISOString(),
                endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
                maxParticipants: 100,
                isTeamBased: true
            };

            const challengeResponse = await createChallenge(challengeRequest).unwrap();

            // Start quiz session with selected questions
            const sessionRequest: StartQuizSessionRequest = {
                challengeId: challengeResponse.id,
                questionIds: selectedQuestionIds,
                difficulty: searchDifficulty !== 'ALL' ? searchDifficulty : 'MEDIUM',
                timeLimit: 60,
                randomizeQuestions: true
            };

            const sessionResponse = await startQuizSession(sessionRequest).unwrap();

            Alert.alert(
                'Quest Created!',
                `Your "${title}" quest has been created successfully with ${totalSelectedQuestions} questions.`,
                [
                    {
                        text: 'Start Now',
                        onPress: () => navigation.navigate('WWWGamePlay', {
                            sessionId: sessionResponse.id,
                            challengeId: challengeResponse.id
                        })
                    },
                    {
                        text: 'OK',
                        onPress: () => navigation.navigate('Main', { screen: 'Challenges' })
                    }
                ]
            );
        } catch (error: any) {
            console.error('Error creating quest:', error);
            Alert.alert('Error', error.message || 'Failed to create quest. Please try again.');
        }
    };

    // Render question item
    const renderQuestionItem = ({item, isUserQuestion = false}: {
        item: QuestionData | any,
        isUserQuestion?: boolean
    }) => {
        const questionId = item.id?.toString();
        const isSelected = isUserQuestion
            ? selectedUserQuestionIds.has(questionId)
            : selectedAppQuestionIds.has(questionId);

        const toggleSelection = isUserQuestion
            ? toggleUserQuestionSelection
            : toggleAppQuestionSelection;

        return (
            <TouchableOpacity
                style={[styles.questionCard, isSelected && styles.questionCardSelected]}
                onPress={() => toggleSelection(questionId)}
            >
                <View style={styles.questionHeader}>
                    <MaterialCommunityIcons
                        name={isSelected ? 'checkbox-marked' : 'checkbox-blank-outline'}
                        size={24}
                        color={isSelected ? '#007AFF' : '#999'}
                    />
                    <View style={styles.questionBadges}>
                        <View style={[styles.difficultyBadge, {
                            backgroundColor:
                                item.difficulty === 'Easy' || item.difficulty === 'EASY' ? '#4CAF50' :
                                    item.difficulty === 'Medium' || item.difficulty === 'MEDIUM' ? '#FF9800' : '#F44336'
                        }]}>
                            <Text style={styles.difficultyText}>
                                {item.difficulty}
                            </Text>
                        </View>
                        {item.topic && (
                            <View style={styles.topicBadge}>
                                <Text style={styles.topicText}>{item.topic}</Text>
                            </View>
                        )}
                    </View>
                </View>

                <Text style={styles.questionText} numberOfLines={2}>
                    {item.question}
                </Text>
                <Text style={styles.answerText} numberOfLines={1}>
                    Answer: {item.answer}
                </Text>

                {item.additionalInfo && (
                    <Text style={styles.additionalInfoText} numberOfLines={1}>
                        {item.additionalInfo}
                    </Text>
                )}
            </TouchableOpacity>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView
                style={{flex: 1}}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
                <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                    {/* Header */}
                    <View style={styles.header}>
                        <TouchableOpacity
                            style={styles.backButton}
                            onPress={() => navigation.goBack()}
                        >
                            <MaterialCommunityIcons name="arrow-left" size={24} color="#1D1D1F"/>
                        </TouchableOpacity>
                        <Text style={styles.headerTitle}>Create WWW Quest</Text>
                        <View style={{width: 40}}/>
                    </View>

                    {/* Quest Details Form */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Quest Details</Text>

                        <View style={styles.inputContainer}>
                            <Text style={styles.label}>Title</Text>
                            <TextInput
                                style={styles.input}
                                value={title}
                                onChangeText={setTitle}
                                placeholder="Enter quest title"
                                placeholderTextColor="#999"
                            />
                        </View>

                        <View style={styles.inputContainer}>
                            <Text style={styles.label}>Description</Text>
                            <TextInput
                                style={[styles.input, styles.textArea]}
                                value={description}
                                onChangeText={setDescription}
                                placeholder="Enter quest description"
                                placeholderTextColor="#999"
                                multiline
                            />
                        </View>

                        <View style={styles.inputContainer}>
                            <Text style={styles.label}>Reward</Text>
                            <TextInput
                                style={styles.input}
                                value={reward}
                                onChangeText={setReward}
                                placeholder="Enter reward description"
                                placeholderTextColor="#999"
                            />
                        </View>
                    </View>

                    {/* Question Source Selection */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Question Source</Text>
                        <View style={styles.radioGroup}>
                            <TouchableOpacity
                                style={styles.radioButton}
                                onPress={() => setQuestionSource('app')}
                            >
                                <MaterialCommunityIcons
                                    name={questionSource === 'app' ? 'radiobox-marked' : 'radiobox-blank'}
                                    size={24}
                                    color="#007AFF"
                                />
                                <Text style={styles.radioText}>App Questions</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.radioButton}
                                onPress={() => setQuestionSource('user')}
                            >
                                <MaterialCommunityIcons
                                    name={questionSource === 'user' ? 'radiobox-marked' : 'radiobox-blank'}
                                    size={24}
                                    color="#007AFF"
                                />
                                <Text style={styles.radioText}>My Questions</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Search Filters Section (only for app questions) */}
                    {questionSource === 'app' && (
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Search Filters</Text>

                            {/* Keyword Search */}
                            <View style={styles.inputContainer}>
                                <Text style={styles.label}>Search Keyword</Text>
                                <View style={styles.searchContainer}>
                                    <MaterialCommunityIcons name="magnify" size={20} color="#999"/>
                                    <TextInput
                                        style={styles.searchInput}
                                        value={searchKeyword}
                                        onChangeText={setSearchKeyword}
                                        placeholder="Search in questions..."
                                        placeholderTextColor="#999"
                                        onSubmitEditing={handleSearch}
                                        returnKeyType="search"
                                    />
                                    {searchKeyword.length > 0 && (
                                        <TouchableOpacity onPress={() => setSearchKeyword('')}>
                                            <MaterialCommunityIcons name="close-circle" size={20} color="#999"/>
                                        </TouchableOpacity>
                                    )}
                                </View>
                            </View>

                            {/* Difficulty Filter */}
                            <View style={styles.inputContainer}>
                                <Text style={styles.label}>Filter by Difficulty</Text>
                                <View style={styles.filterContainer}>
                                    {(['ALL', 'EASY', 'MEDIUM', 'HARD'] as const).map((diff) => (
                                        <TouchableOpacity
                                            key={diff}
                                            style={[
                                                styles.filterChip,
                                                searchDifficulty === diff && styles.filterChipSelected
                                            ]}
                                            onPress={() => setSearchDifficulty(diff)}
                                        >
                                            <Text style={[
                                                styles.filterChipText,
                                                searchDifficulty === diff && styles.filterChipTextSelected
                                            ]}>
                                                {diff === 'ALL' ? 'All' : diff.charAt(0) + diff.slice(1).toLowerCase()}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>

                            {/* Topic Filter */}
                            <View style={styles.inputContainer}>
                                <Text style={styles.label}>Filter by Topic</Text>
                                <TouchableOpacity
                                    style={styles.topicSelector}
                                    onPress={() => setShowTopicPicker(true)}
                                >
                                    <Text style={styles.topicSelectorText}>
                                        {searchTopic || 'All Topics'}
                                    </Text>
                                    <MaterialCommunityIcons name="chevron-down" size={24} color="#666"/>
                                </TouchableOpacity>
                            </View>

                            {/* Search Actions */}
                            <View style={styles.searchActions}>
                                <TouchableOpacity
                                    style={styles.searchButton}
                                    onPress={handleSearch}
                                    disabled={isLoadingAppQuestions}
                                >
                                    <MaterialCommunityIcons name="magnify" size={20} color="#FFF"/>
                                    <Text style={styles.searchButtonText}>
                                        {isLoadingAppQuestions ? 'Searching...' : 'Search'}
                                    </Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={styles.clearButton}
                                    onPress={handleClearFilters}
                                    disabled={isLoadingAppQuestions}
                                >
                                    <MaterialCommunityIcons name="filter-remove" size={20} color="#666"/>
                                    <Text style={styles.clearButtonText}>Clear</Text>
                                </TouchableOpacity>
                            </View>

                            {/* Results Count */}
                            {totalQuestions > 0 && (
                                <Text style={styles.resultsCount}>
                                    Found {totalQuestions} question{totalQuestions !== 1 ? 's' : ''}
                                    {totalPages > 1 && ` (Page ${currentPage + 1} of ${totalPages})`}
                                </Text>
                            )}
                        </View>
                    )}

                    {/* Questions Selection Section */}
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>
                                {questionSource === 'app' ? 'Search Results' : 'My Questions'}
                            </Text>
                            <Text style={styles.selectionCount}>
                                {totalSelectedQuestions} selected
                            </Text>
                        </View>

                        {questionSource === 'app' ? (
                            isLoadingAppQuestions ? (
                                <View style={styles.loadingContainer}>
                                    <ActivityIndicator size="large" color="#007AFF"/>
                                    <Text style={styles.loadingText}>Searching questions...</Text>
                                </View>
                            ) : appQuestionsError ? (
                                <View style={styles.errorContainer}>
                                    <MaterialCommunityIcons name="alert-circle" size={48} color="#F44336"/>
                                    <Text style={styles.errorText}>{appQuestionsError}</Text>
                                    <TouchableOpacity style={styles.retryButton} onPress={handleSearch}>
                                        <Text style={styles.retryButtonText}>Retry</Text>
                                    </TouchableOpacity>
                                </View>
                            ) : appQuestions.length > 0 ? (
                                <>
                                    <FlatList
                                        data={appQuestions}
                                        renderItem={({item}) => renderQuestionItem({item, isUserQuestion: false})}
                                        keyExtractor={(item) => item.id.toString()}
                                        scrollEnabled={false}
                                    />

                                    {/* Pagination Controls */}
                                    {totalPages > 1 && (
                                        <View style={styles.paginationContainer}>
                                            <TouchableOpacity
                                                style={[
                                                    styles.paginationButton,
                                                    currentPage === 0 && styles.paginationButtonDisabled
                                                ]}
                                                onPress={loadPreviousPage}
                                                disabled={currentPage === 0}
                                            >
                                                <MaterialCommunityIcons
                                                    name="chevron-left"
                                                    size={24}
                                                    color={currentPage === 0 ? '#CCC' : '#007AFF'}
                                                />
                                            </TouchableOpacity>

                                            <Text style={styles.paginationText}>
                                                Page {currentPage + 1} of {totalPages}
                                            </Text>

                                            <TouchableOpacity
                                                style={[
                                                    styles.paginationButton,
                                                    currentPage >= totalPages - 1 && styles.paginationButtonDisabled
                                                ]}
                                                onPress={loadNextPage}
                                                disabled={currentPage >= totalPages - 1}
                                            >
                                                <MaterialCommunityIcons
                                                    name="chevron-right"
                                                    size={24}
                                                    color={currentPage >= totalPages - 1 ? '#CCC' : '#007AFF'}
                                                />
                                            </TouchableOpacity>
                                        </View>
                                    )}
                                </>
                            ) : (
                                <View style={styles.emptyContainer}>
                                    <MaterialCommunityIcons name="magnify" size={64} color="#CCC"/>
                                    <Text style={styles.emptyText}>
                                        Enter search criteria and tap "Search" to find questions
                                    </Text>
                                </View>
                            )
                        ) : (
                            isLoadingUserQuestions ? (
                                <View style={styles.loadingContainer}>
                                    <ActivityIndicator size="large" color="#007AFF"/>
                                    <Text style={styles.loadingText}>Loading your questions...</Text>
                                </View>
                            ) : userQuestions.length > 0 ? (
                                <FlatList
                                    data={userQuestions}
                                    renderItem={({item}) => renderQuestionItem({item, isUserQuestion: true})}
                                    keyExtractor={(item) => item.id.toString()}
                                    scrollEnabled={false}
                                />
                            ) : (
                                <View style={styles.emptyContainer}>
                                    <MaterialCommunityIcons name="file-question" size={64} color="#CCC"/>
                                    <Text style={styles.emptyText}>
                                        You haven't created any questions yet
                                    </Text>
                                </View>
                            )
                        )}
                    </View>

                    {/* Create Quest Button */}
                    <View style={styles.section}>
                        <TouchableOpacity
                            style={[
                                styles.createQuestButton,
                                (totalSelectedQuestions === 0 || isCreatingChallenge || isStartingSession) && styles.createButtonDisabled
                            ]}
                            onPress={handleCreateQuest}
                            disabled={totalSelectedQuestions === 0 || isCreatingChallenge || isStartingSession}
                        >
                            {isCreatingChallenge || isStartingSession ? (
                                <ActivityIndicator color="#FFF"/>
                            ) : (
                                <Text style={styles.createQuestButtonText}>
                                    Create Quest ({totalSelectedQuestions} questions)
                                </Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>

            {/* Topic Picker Modal */}
            <Modal
                visible={showTopicPicker}
                transparent
                animationType="slide"
                onRequestClose={() => setShowTopicPicker(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Select Topic</Text>
                            <TouchableOpacity onPress={() => setShowTopicPicker(false)}>
                                <MaterialCommunityIcons name="close" size={24} color="#666"/>
                            </TouchableOpacity>
                        </View>
                        <FlatList
                            data={availableTopics}
                            renderItem={({item}) => (
                                <TouchableOpacity
                                    style={[
                                        styles.topicItem,
                                        searchTopic === item && styles.topicItemSelected
                                    ]}
                                    onPress={() => {
                                        setSearchTopic(item === 'All Topics' ? '' : item);
                                        setShowTopicPicker(false);
                                    }}
                                >
                                    <Text style={[
                                        styles.topicItemText,
                                        searchTopic === item && styles.topicItemTextSelected
                                    ]}>
                                        {item}
                                    </Text>
                                    {searchTopic === item && (
                                        <MaterialCommunityIcons name="check" size={24} color="#007AFF"/>
                                    )}
                                </TouchableOpacity>
                            )}
                            keyExtractor={(item) => item}
                            style={styles.topicList}
                        />
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFF',
    },
    scrollView: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E5E7',
    },
    backButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '600',
        color: '#1D1D1F',
    },
    section: {
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F5F5F7',
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#1D1D1F',
        marginBottom: 16,
    },
    selectionCount: {
        fontSize: 14,
        fontWeight: '500',
        color: '#007AFF',
    },
    inputContainer: {
        marginBottom: 16,
    },
    label: {
        fontSize: 16,
        fontWeight: '500',
        color: '#1D1D1F',
        marginBottom: 8,
    },
    input: {
        backgroundColor: '#F9F9F9',
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        borderWidth: 1,
        borderColor: '#E5E5E7',
        color: '#1D1D1F',
    },
    textArea: {
        height: 80,
        textAlignVertical: 'top',
    },
    radioGroup: {
        flexDirection: 'row',
        gap: 16,
    },
    radioButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    radioText: {
        fontSize: 16,
        color: '#1D1D1F',
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F9F9F9',
        borderRadius: 8,
        paddingHorizontal: 12,
        borderWidth: 1,
        borderColor: '#E5E5E7',
        gap: 8,
    },
    searchInput: {
        flex: 1,
        padding: 12,
        fontSize: 16,
        color: '#1D1D1F',
    },
    filterContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    filterChip: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: '#F9F9F9',
        borderWidth: 1,
        borderColor: '#E5E5E7',
    },
    filterChipSelected: {
        backgroundColor: '#007AFF',
        borderColor: '#007AFF',
    },
    filterChipText: {
        fontSize: 14,
        fontWeight: '500',
        color: '#666',
    },
    filterChipTextSelected: {
        color: '#FFF',
    },
    topicSelector: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#F9F9F9',
        borderRadius: 8,
        padding: 12,
        borderWidth: 1,
        borderColor: '#E5E5E7',
    },
    topicSelectorText: {
        fontSize: 16,
        color: '#1D1D1F',
    },
    searchActions: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 8,
    },
    searchButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#007AFF',
        borderRadius: 8,
        padding: 12,
        gap: 8,
    },
    searchButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FFF',
    },
    clearButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#F9F9F9',
        borderRadius: 8,
        padding: 12,
        gap: 8,
        borderWidth: 1,
        borderColor: '#E5E5E7',
    },
    clearButtonText: {
        fontSize: 16,
        fontWeight: '500',
        color: '#666',
    },
    resultsCount: {
        fontSize: 14,
        color: '#666',
        marginTop: 12,
        textAlign: 'center',
    },
    questionCard: {
        backgroundColor: '#F9F9F9',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#E5E5E7',
    },
    questionCardSelected: {
        backgroundColor: '#E5F1FF',
        borderColor: '#007AFF',
    },
    questionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    questionBadges: {
        flexDirection: 'row',
        gap: 8,
    },
    difficultyBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    difficultyText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#FFF',
    },
    topicBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        backgroundColor: '#E5E5E7',
    },
    topicText: {
        fontSize: 12,
        fontWeight: '500',
        color: '#666',
    },
    questionText: {
        fontSize: 16,
        fontWeight: '500',
        color: '#1D1D1F',
        marginBottom: 4,
    },
    answerText: {
        fontSize: 14,
        color: '#666',
        marginBottom: 4,
    },
    additionalInfoText: {
        fontSize: 12,
        color: '#999',
        fontStyle: 'italic',
    },
    loadingContainer: {
        padding: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    loadingText: {
        marginTop: 12,
        fontSize: 16,
        color: '#666',
    },
    errorContainer: {
        padding: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    errorText: {
        marginTop: 16,
        marginBottom: 16,
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
    },
    retryButton: {
        backgroundColor: '#007AFF',
        borderRadius: 8,
        paddingHorizontal: 24,
        paddingVertical: 12,
    },
    retryButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FFF',
    },
    emptyContainer: {
        padding: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    emptyText: {
        marginTop: 16,
        fontSize: 16,
        color: '#999',
        textAlign: 'center',
    },
    paginationContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 20,
        gap: 20,
    },
    paginationButton: {
        padding: 8,
        borderRadius: 8,
        backgroundColor: '#F9F9F9',
        borderWidth: 1,
        borderColor: '#E5E5E7',
    },
    paginationButtonDisabled: {
        opacity: 0.5,
    },
    paginationText: {
        fontSize: 16,
        color: '#666',
        fontWeight: '500',
    },
    createQuestButton: {
        backgroundColor: '#007AFF',
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
    },
    createButtonDisabled: {
        backgroundColor: '#CCC',
    },
    createQuestButtonText: {
        fontSize: 18,
        fontWeight: '600',
        color: '#FFF',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#FFF',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        maxHeight: '70%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E5E7',
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '600',
        color: '#1D1D1F',
    },
    topicList: {
        maxHeight: 400,
    },
    topicItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F5F5F7',
    },
    topicItemSelected: {
        backgroundColor: '#E5F1FF',
    },
    topicItemText: {
        fontSize: 16,
        color: '#1D1D1F',
    },
    topicItemTextSelected: {
        fontWeight: '600',
        color: '#007AFF',
    },
});

export default CreateWWWQuestScreen;