// src/screens/CreateWWWQuestScreen.tsx
// COMPLETE VERSION WITH SEARCH FILTERS

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
import {RootState} from '../app/providers/StoreProvider/store';
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import {APIDifficulty, QuestionData, QuestionService, UIDifficulty} from '../services/wwwGame/questionService';

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
    const [difficulty, setDifficulty] = useState<UIDifficulty>('Medium');
    const [roundTime, setRoundTime] = useState('60');
    const [enableAIHost, setEnableAIHost] = useState(true);

    // Team info state
    const [teamName, setTeamName] = useState('My Quiz Team');
    const [teamMembers, setTeamMembers] = useState<string[]>(['']);

    // Load topics on mount
    useEffect(() => {
        loadAvailableTopics();
    }, []);

    // Search when filters change
    useEffect(() => {
        if (questionSource === 'app') {
            searchAppQuestions();
        }
    }, [questionSource, searchDifficulty, searchTopic, currentPage]);

    /**
     * Load available topics for filtering
     */
    const loadAvailableTopics = async () => {
        try {
            const topics = await QuestionService.getAvailableTopics();
            setAvailableTopics(['All Topics', ...topics]);
        } catch (error) {
            console.error('Error loading topics:', error);
        }
    };

    /**
     * Search app questions with filters
     */
    const searchAppQuestions = async () => {
        try {
            setIsLoadingAppQuestions(true);
            setAppQuestionsError(null);

            const result = await QuestionService.searchQuestions({
                keyword: searchKeyword.trim(),
                difficulty: searchDifficulty === 'ALL' ? undefined : searchDifficulty,
                topic: searchTopic === 'All Topics' ? '' : searchTopic,
                page: currentPage,
                size: 50
            });

            setAppQuestions(result.questions);
            setTotalPages(result.totalPages);
            setTotalQuestions(result.totalElements);

            if (result.questions.length === 0) {
                setAppQuestionsError('No questions found. Try different search criteria.');
            }
        } catch (error: any) {
            console.error('Error searching questions:', error);
            setAppQuestionsError(error.message || 'Failed to search questions. Please try again.');
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

    // Custom question management
    const addCustomQuestion = () => {
        setNewCustomQuestions([
            ...newCustomQuestions,
            {
                question: '',
                answer: '',
                difficulty: 'MEDIUM',
                questionType: 'text'
            }
        ]);
    };

    const updateCustomQuestion = (index: number, field: keyof MultimediaQuestionData, value: any) => {
        const updated = [...newCustomQuestions];
        updated[index] = { ...updated[index], [field]: value };
        setNewCustomQuestions(updated);
    };

    const removeCustomQuestion = (index: number) => {
        setNewCustomQuestions(newCustomQuestions.filter((_, i) => i !== index));
    };

    // Team members management
    const addTeamMember = () => {
        setTeamMembers([...teamMembers, '']);
    };

    const updateTeamMember = (index: number, value: string) => {
        const updated = [...teamMembers];
        updated[index] = value;
        setTeamMembers(updated);
    };

    const removeTeamMember = (index: number) => {
        setTeamMembers(teamMembers.filter((_, i) => i !== index));
    };

    // Calculate total selected questions
    const totalSelectedQuestions = useMemo(() => {
        return selectedAppQuestionIds.size + selectedUserQuestionIds.size + newCustomQuestions.length;
    }, [selectedAppQuestionIds, selectedUserQuestionIds, newCustomQuestions]);

    // Validate and create quest
    const handleCreateQuest = async () => {
        if (totalSelectedQuestions === 0) {
            Alert.alert('Error', 'Please select or create at least one question');
            return;
        }

        if (!title.trim()) {
            Alert.alert('Error', 'Please enter a quiz title');
            return;
        }

        try {
            // Prepare selected questions
            const selectedQuestions = [
                ...Array.from(selectedAppQuestionIds).map(id =>
                    appQuestions.find(q => q.id === id)!.id
                ),
                ...Array.from(selectedUserQuestionIds)
            ];

            // Create challenge
            const challengeRequest: CreateChallengeRequest = {
                status: "",
                type: "",
                visibility: "",
                title,
                description,
                reward,
                verificationMethod: JSON.stringify({
                    type: 'QUIZ',
                    details: {
                        difficulty,
                        roundTime: parseInt(roundTime),
                        enableAIHost,
                        questionCount: totalSelectedQuestions
                    }
                })
            };

            const challengeResult = await createChallenge(challengeRequest).unwrap();

            // Start quiz session
            const sessionRequest: StartQuizSessionRequest = {
                challengeId: "",
                enableAiHost: false,
                roundTimeSeconds: 0,
                teamMembers: [],
                teamName: "",
                difficulty: difficulty === 'Easy' ? 'EASY' : difficulty === 'Medium' ? 'MEDIUM' : 'HARD',
                totalRounds: totalSelectedQuestions,
                timePerRound: parseInt(roundTime),
                questionSource: questionSource === 'app' ? 'app' : 'user',
                customQuestionIds: selectedQuestions.map(id => parseInt(id))
            };

            const sessionResult = await startQuizSession(sessionRequest).unwrap();

            Alert.alert(
                'Quest Created!',
                'Your quiz challenge is ready to play.',
                [
                    {
                        text: 'Start Game',
                        onPress: () => navigation.navigate('WWWGamePlay', {
                            sessionId: sessionResult.id,
                            challengeId: challengeResult.id,
                        }),
                    },
                ]
            );
        } catch (error) {
            console.error('Error creating quest:', error);
            Alert.alert('Error', 'Failed to create quest. Please try again.');
        }
    };

    // Render functions
    const renderAppQuestion = ({ item }: { item: QuestionData }) => {
        const isSelected = selectedAppQuestionIds.has(item.id);
        return (
            <TouchableOpacity
                style={[styles.questionItem, isSelected && styles.questionItemSelected]}
                onPress={() => toggleAppQuestionSelection(item.id)}
            >
                <View style={styles.questionContent}>
                    <Text style={styles.questionText} numberOfLines={2}>{item.question}</Text>
                    <Text style={styles.questionMeta}>
                        {item.difficulty} • {item.topic || 'General'}
                    </Text>
                </View>
                <MaterialCommunityIcons
                    name={isSelected ? 'checkbox-marked' : 'checkbox-blank-outline'}
                    size={24}
                    color={isSelected ? '#007AFF' : '#999'}
                />
            </TouchableOpacity>
        );
    };

    const renderUserQuestion = ({ item }: { item: any }) => {
        const isSelected = selectedUserQuestionIds.has(item.id.toString());
        return (
            <TouchableOpacity
                style={[styles.questionItem, isSelected && styles.questionItemSelected]}
                onPress={() => toggleUserQuestionSelection(item.id.toString())}
            >
                <View style={styles.questionContent}>
                    <Text style={styles.questionText} numberOfLines={2}>{item.question}</Text>
                    <Text style={styles.questionMeta}>
                        {item.difficulty} • {item.topic || 'General'}
                    </Text>
                </View>
                <MaterialCommunityIcons
                    name={isSelected ? 'checkbox-marked' : 'checkbox-blank-outline'}
                    size={24}
                    color={isSelected ? '#007AFF' : '#999'}
                />
            </TouchableOpacity>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.container}
            >
                <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                    {/* Header */}
                    <View style={styles.header}>
                        <Text style={styles.title}>Create Quiz Challenge</Text>
                        <Text style={styles.subtitle}>
                            Set up your WWW Quiz game
                        </Text>
                    </View>

                    {/* Basic Info Section */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Basic Information</Text>

                        <View style={styles.inputContainer}>
                            <Text style={styles.label}>Quiz Title</Text>
                            <TextInput
                                style={styles.input}
                                value={title}
                                onChangeText={setTitle}
                                placeholder="Enter quiz title"
                                placeholderTextColor="#999"
                            />
                        </View>

                        <View style={styles.inputContainer}>
                            <Text style={styles.label}>Description</Text>
                            <TextInput
                                style={[styles.input, styles.textArea]}
                                value={description}
                                onChangeText={setDescription}
                                placeholder="Describe your quiz"
                                placeholderTextColor="#999"
                                multiline
                                numberOfLines={3}
                            />
                        </View>

                        <View style={styles.inputContainer}>
                            <Text style={styles.label}>Reward</Text>
                            <TextInput
                                style={styles.input}
                                value={reward}
                                onChangeText={setReward}
                                placeholder="What will winners get?"
                                placeholderTextColor="#999"
                            />
                        </View>
                    </View>

                    {/* Game Settings Section */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Game Settings</Text>

                        <View style={styles.inputContainer}>
                            <Text style={styles.label}>Difficulty</Text>
                            <View style={styles.difficultyContainer}>
                                {(['Easy', 'Medium', 'Hard'] as UIDifficulty[]).map((diff) => (
                                    <TouchableOpacity
                                        key={diff}
                                        style={[
                                            styles.difficultyButton,
                                            difficulty === diff && styles.difficultyButtonSelected
                                        ]}
                                        onPress={() => setDifficulty(diff)}
                                    >
                                        <Text
                                            style={[
                                                styles.difficultyButtonText,
                                                difficulty === diff && styles.difficultyButtonTextSelected
                                            ]}
                                        >
                                            {diff}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>

                        <View style={styles.inputContainer}>
                            <Text style={styles.label}>Time per Round (seconds)</Text>
                            <TextInput
                                style={styles.input}
                                value={roundTime}
                                onChangeText={setRoundTime}
                                placeholder="60"
                                placeholderTextColor="#999"
                                keyboardType="numeric"
                            />
                        </View>

                        <View style={styles.toggleContainer}>
                            <View style={styles.toggleButton}>
                                <MaterialCommunityIcons
                                    name={enableAIHost ? 'check-circle' : 'checkbox-blank-circle-outline'}
                                    size={24}
                                    color={enableAIHost ? '#007AFF' : '#999'}
                                />
                                <Text style={styles.toggleText}>Enable AI Host</Text>
                            </View>
                            <TouchableOpacity onPress={() => setEnableAIHost(!enableAIHost)}>
                                <MaterialCommunityIcons
                                    name={enableAIHost ? 'toggle-switch' : 'toggle-switch-off'}
                                    size={40}
                                    color={enableAIHost ? '#007AFF' : '#999'}
                                />
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Question Source Section */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Question Source</Text>

                        <View style={styles.radioGroup}>
                            <TouchableOpacity
                                style={styles.radioOption}
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
                                style={styles.radioOption}
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
                                    <MaterialCommunityIcons name="magnify" size={20} color="#999" />
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
                                            <MaterialCommunityIcons name="close-circle" size={20} color="#999" />
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
                                            <Text
                                                style={[
                                                    styles.filterChipText,
                                                    searchDifficulty === diff && styles.filterChipTextSelected
                                                ]}
                                            >
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
                                    <MaterialCommunityIcons name="chevron-down" size={24} color="#666" />
                                </TouchableOpacity>
                            </View>

                            {/* Search Actions */}
                            <View style={styles.searchActions}>
                                <TouchableOpacity
                                    style={styles.searchButton}
                                    onPress={handleSearch}
                                >
                                    <MaterialCommunityIcons name="magnify" size={20} color="#FFF" />
                                    <Text style={styles.searchButtonText}>Search</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={styles.clearButton}
                                    onPress={handleClearFilters}
                                >
                                    <MaterialCommunityIcons name="filter-remove" size={20} color="#666" />
                                    <Text style={styles.clearButtonText}>Clear</Text>
                                </TouchableOpacity>
                            </View>

                            {/* Results Count */}
                            {totalQuestions > 0 && (
                                <Text style={styles.resultsCount}>
                                    Found {totalQuestions} question{totalQuestions !== 1 ? 's' : ''}
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
                                    <ActivityIndicator size="large" color="#007AFF" />
                                    <Text style={styles.loadingText}>Searching questions...</Text>
                                </View>
                            ) : appQuestionsError ? (
                                <View style={styles.errorContainer}>
                                    <MaterialCommunityIcons name="alert-circle" size={48} color="#FF3B30" />
                                    <Text style={styles.errorText}>{appQuestionsError}</Text>
                                    <TouchableOpacity
                                        style={styles.retryButton}
                                        onPress={handleSearch}
                                    >
                                        <Text style={styles.retryButtonText}>Retry Search</Text>
                                    </TouchableOpacity>
                                </View>
                            ) : (
                                <>
                                    <FlatList
                                        data={appQuestions}
                                        renderItem={renderAppQuestion}
                                        keyExtractor={(item) => item.id}
                                        scrollEnabled={false}
                                        ListEmptyComponent={
                                            <View style={styles.emptyContainer}>
                                                <MaterialCommunityIcons name="magnify" size={64} color="#CCC" />
                                                <Text style={styles.emptyText}>
                                                    Use search filters to find questions
                                                </Text>
                                            </View>
                                        }
                                    />

                                    {/* Pagination Controls */}
                                    {totalPages > 1 && (
                                        <View style={styles.paginationContainer}>
                                            <TouchableOpacity
                                                style={[styles.paginationButton, currentPage === 0 && styles.paginationButtonDisabled]}
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
                                                style={[styles.paginationButton, currentPage >= totalPages - 1 && styles.paginationButtonDisabled]}
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
                            )
                        ) : (
                            isLoadingUserQuestions ? (
                                <View style={styles.loadingContainer}>
                                    <ActivityIndicator size="large" color="#007AFF" />
                                    <Text style={styles.loadingText}>Loading your questions...</Text>
                                </View>
                            ) : userQuestions.length === 0 ? (
                                <View style={styles.emptyContainer}>
                                    <MaterialCommunityIcons name="help-circle-outline" size={64} color="#CCC" />
                                    <Text style={styles.emptyText}>
                                        You haven't created any questions yet
                                    </Text>
                                    <TouchableOpacity
                                        style={styles.createButton}
                                        onPress={() => {/* Navigate to create question */}}
                                    >
                                        <Text style={styles.createButtonText}>Create Question</Text>
                                    </TouchableOpacity>
                                </View>
                            ) : (
                                <FlatList
                                    data={userQuestions}
                                    renderItem={renderUserQuestion}
                                    keyExtractor={(item) => item.id.toString()}
                                    scrollEnabled={false}
                                />
                            )
                        )}
                    </View>

                    {/* Create Quest Button */}
                    <View style={styles.section}>
                        <TouchableOpacity
                            style={[
                                styles.createQuestButton,
                                (isCreatingChallenge || isStartingSession || totalSelectedQuestions === 0) &&
                                styles.createButtonDisabled
                            ]}
                            onPress={handleCreateQuest}
                            disabled={isCreatingChallenge || isStartingSession || totalSelectedQuestions === 0}
                        >
                            {isCreatingChallenge || isStartingSession ? (
                                <ActivityIndicator color="#FFF" />
                            ) : (
                                <Text style={styles.createQuestButtonText}>
                                    Create Quest ({totalSelectedQuestions} question{totalSelectedQuestions !== 1 ? 's' : ''})
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
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => setShowTopicPicker(false)}
                >
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Select Topic</Text>
                            <TouchableOpacity onPress={() => setShowTopicPicker(false)}>
                                <MaterialCommunityIcons name="close" size={24} color="#666" />
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={styles.topicList}>
                            {availableTopics.map((topic) => (
                                <TouchableOpacity
                                    key={topic}
                                    style={[
                                        styles.topicItem,
                                        searchTopic === topic && styles.topicItemSelected
                                    ]}
                                    onPress={() => {
                                        setSearchTopic(topic === 'All Topics' ? '' : topic);
                                        setShowTopicPicker(false);
                                    }}
                                >
                                    <Text style={[
                                        styles.topicItemText,
                                        searchTopic === topic && styles.topicItemTextSelected
                                    ]}>
                                        {topic}
                                    </Text>
                                    {searchTopic === topic && (
                                        <MaterialCommunityIcons name="check" size={20} color="#007AFF" />
                                    )}
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>
                </TouchableOpacity>
            </Modal>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F5F7',
    },
    scrollView: {
        flex: 1,
    },
    header: {
        padding: 20,
        backgroundColor: '#FFF',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E5E7',
    },
    title: {
        fontSize: 28,
        fontWeight: '700',
        color: '#1D1D1F',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        color: '#666',
    },
    section: {
        backgroundColor: '#FFF',
        padding: 20,
        marginTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#E5E5E7',
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: '600',
        color: '#1D1D1F',
        marginBottom: 16,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    inputContainer: {
        marginBottom: 20,
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
        color: '#FFF',
        fontSize: 16,
        fontWeight: '600',
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
        color: '#666',
        fontSize: 16,
        fontWeight: '500',
    },
    resultsCount: {
        marginTop: 12,
        fontSize: 14,
        color: '#666',
        fontStyle: 'italic',
    },
    difficultyContainer: {
        flexDirection: 'row',
        gap: 12,
    },
    difficultyButton: {
        flex: 1,
        backgroundColor: '#FFF',
        borderRadius: 8,
        padding: 12,
        borderWidth: 1,
        borderColor: '#E5E5E7',
        alignItems: 'center',
    },
    difficultyButtonSelected: {
        backgroundColor: '#007AFF',
        borderColor: '#007AFF',
    },
    difficultyButtonText: {
        fontSize: 14,
        fontWeight: '500',
        color: '#333',
    },
    difficultyButtonTextSelected: {
        color: '#FFF',
    },
    toggleContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 12,
        backgroundColor: '#F9F9F9',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#E5E5E7',
    },
    toggleButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    toggleText: {
        fontSize: 16,
        color: '#333',
    },
    radioGroup: {
        gap: 12,
    },
    radioOption: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    radioText: {
        fontSize: 16,
        color: '#333',
    },
    selectionCount: {
        fontSize: 14,
        color: '#666',
        fontWeight: '600',
    },
    questionItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#E5E5E7',
        marginBottom: 8,
        backgroundColor: '#FFF',
    },
    questionItemSelected: {
        backgroundColor: '#E5F1FF',
        borderColor: '#007AFF',
    },
    questionContent: {
        flex: 1,
        marginRight: 12,
    },
    questionText: {
        fontSize: 16,
        color: '#1D1D1F',
        marginBottom: 4,
    },
    questionMeta: {
        fontSize: 14,
        color: '#666',
    },
    loadingContainer: {
        padding: 40,
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 12,
        fontSize: 16,
        color: '#666',
    },
    errorContainer: {
        padding: 40,
        alignItems: 'center',
    },
    errorText: {
        fontSize: 16,
        color: '#FF3B30',
        marginTop: 12,
        marginBottom: 16,
        textAlign: 'center',
    },
    retryButton: {
        backgroundColor: '#007AFF',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 8,
    },
    retryButtonText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: '500',
    },
    emptyContainer: {
        padding: 40,
        alignItems: 'center',
    },
    emptyText: {
        fontSize: 16,
        color: '#666',
        marginTop: 16,
        marginBottom: 16,
        textAlign: 'center',
    },
    createButton: {
        backgroundColor: '#007AFF',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 8,
    },
    createButtonText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: '500',
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