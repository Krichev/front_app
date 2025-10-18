// src/screens/CreateWWWQuestScreen.tsx
// COMPLETE VERSION with Quiz Config and 2 Question Sources (App & User)

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
import {Picker} from '@react-native-picker/picker';
import {CreateChallengeRequest, useCreateChallengeMutation} from '../entities/ChallengeState/model/slice/challengeApi';
import {
    QuizConfig,
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

interface CustomQuestion {
    question: string;
    answer: string;
    difficulty: 'EASY' | 'MEDIUM' | 'HARD';
    topic?: string;
    additionalInfo?: string;
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
    const {user} = useSelector((state: RootState) => state.auth);

    // API hooks
    const [createChallenge, {isLoading: isCreatingChallenge}] = useCreateChallengeMutation();
    const [startQuizSession, {isLoading: isStartingSession}] = useStartQuizSessionMutation();

    // Basic Info
    const [title, setTitle] = useState('Quiz Challenge');
    const [description, setDescription] = useState('Test your knowledge in this team-based quiz game.');
    const [reward, setReward] = useState('Points and bragging rights!');

    // Quiz Configuration
    const [quizConfig, setQuizConfig] = useState<QuizConfig>({
        gameType: 'WWW',
        teamName: '',
        teamMembers: [],
        difficulty: 'Medium',
        roundTime: 60,
        roundCount: 10,
        enableAIHost: true,
        teamBased: false,
    });
    const [teamMemberInput, setTeamMemberInput] = useState('');

    // Custom Questions (for user-created questions)
    const [customQuestions, setCustomQuestions] = useState<CustomQuestion[]>([]);
    const [currentCustomQuestion, setCurrentCustomQuestion] = useState<CustomQuestion>({
        question: '',
        answer: '',
        difficulty: 'MEDIUM',
        topic: '',
        additionalInfo: '',
    });

    // Question Source (only 'app' or 'user')
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

    // Search filters
    const [searchKeyword, setSearchKeyword] = useState('');
    const [searchDifficulty, setSearchDifficulty] = useState<APIDifficulty | 'ALL'>('ALL');
    const [searchTopic, setSearchTopic] = useState('');
    const [availableTopics, setAvailableTopics] = useState<string[]>([]);
    const [showTopicPicker, setShowTopicPicker] = useState(false);

    // Pagination
    const [currentPage, setCurrentPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [totalQuestions, setTotalQuestions] = useState(0);

    // Selection (for app and saved user questions)
    const [selectedQuestionIds, setSelectedQuestionIds] = useState<Set<string>>(new Set());

    // Preview state
    const [showAnswers, setShowAnswers] = useState<Set<number>>(new Set());
    const [expandedQuestions, setExpandedQuestions] = useState<Set<number>>(new Set());
    const [isPreviewCollapsed, setIsPreviewCollapsed] = useState(false);
    const [previewPage, setPreviewPage] = useState(1);
    const questionsPerPreviewPage = 5;


    const [selectedAppQuestionIds, setSelectedAppQuestionIds] = useState<Set<string>>(new Set());
    const [selectedUserQuestionIds, setSelectedUserQuestionIds] = useState<Set<string>>(new Set());
    const [newCustomQuestions, setNewCustomQuestions] = useState<MultimediaQuestionData[]>([]);

    const selectedQuestionsArray = useMemo(() => {
        // Get selected app questions
        const selectedAppQuestions = (appQuestions ?? []).filter(q =>
            selectedAppQuestionIds.has(q?.id?.toString() ?? '')
        );

        // Get selected user questions
        const selectedUserQuestions = (userQuestions ?? []).filter(q =>
            selectedUserQuestionIds.has(q?.id?.toString() ?? '')
        );

        // Get custom questions
        const customQs = newCustomQuestions ?? [];

        // Combine all selected questions
        return [...selectedAppQuestions, ...selectedUserQuestions, ...customQs];
    }, [
        selectedAppQuestionIds,
        selectedUserQuestionIds,
        appQuestions,
        userQuestions,
        newCustomQuestions
    ]);

    const totalSelectedQuestions = selectedQuestionsArray.length;

    // Preview pagination
    const totalPreviewPages = Math.ceil(totalSelectedQuestions / questionsPerPreviewPage);
    const previewStartIndex = (previewPage - 1) * questionsPerPreviewPage;
    const previewEndIndex = previewStartIndex + questionsPerPreviewPage;
    const currentPreviewQuestions = selectedQuestionsArray.slice(previewStartIndex, previewEndIndex);

    useEffect(() => {
        loadAvailableTopics();
    }, []);

    useEffect(() => {
        if (questionSource === 'app') {
            searchAppQuestions();
        }
    }, [currentPage, questionSource]);

    const loadAvailableTopics = async () => {
        try {
            const topics = await QuestionService.getAvailableTopics();
            setAvailableTopics(['All Topics', ...topics]);
        } catch (error) {
            setAvailableTopics(['All Topics', 'History', 'Science', 'Geography', 'Sports']);
        }
    };

    const searchAppQuestions = async () => {
        setIsLoadingAppQuestions(true);
        setAppQuestionsError(null);

        try {
            const searchParams: any = {
                page: currentPage,
                size: 50,
                store: store,
                isUserCreated: false
            };

            if (searchKeyword?.trim()) searchParams.keyword = searchKeyword.trim();
            if (searchDifficulty !== 'ALL') searchParams.difficulty = searchDifficulty;
            if (searchTopic && searchTopic !== 'All Topics') searchParams.topic = searchTopic.trim();

            const result = await QuestionService.advancedSearchQuestions(searchParams);

            // ✅ FIX: Use 'content' instead of 'questions'
            setAppQuestions(result.content);
            setTotalPages(result.totalPages);
            setTotalQuestions(result.totalElements);

            // ✅ FIX: Check 'content' instead of 'questions'
            if (result.content.length === 0) {
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

    // Quiz Config helpers
    const addTeamMember = () => {
        if (teamMemberInput.trim()) {
            setQuizConfig({
                ...quizConfig,
                teamMembers: [...quizConfig.teamMembers, teamMemberInput.trim()]
            });
            setTeamMemberInput('');
        }
    };

    const removeTeamMember = (index: number) => {
        setQuizConfig({
            ...quizConfig,
            teamMembers: quizConfig.teamMembers.filter((_, i) => i !== index)
        });
    };

    // Custom question helpers (for user question source)
    const addCustomQuestion = () => {
        if (!currentCustomQuestion.question.trim()) {
            Alert.alert('Error', 'Please enter a question');
            return;
        }
        if (!currentCustomQuestion.answer.trim()) {
            Alert.alert('Error', 'Please enter an answer');
            return;
        }

        setCustomQuestions([...customQuestions, currentCustomQuestion]);
        setCurrentCustomQuestion({
            question: '',
            answer: '',
            difficulty: 'MEDIUM',
            topic: '',
            additionalInfo: '',
        });
        Alert.alert('Success', 'Question added!');
    };

    const removeCustomQuestion = (index: number) => {
        Alert.alert(
            'Remove Question',
            'Are you sure?',
            [
                {text: 'Cancel', style: 'cancel'},
                {
                    text: 'Remove',
                    style: 'destructive',
                    onPress: () => {
                        setCustomQuestions(customQuestions.filter((_, i) => i !== index));
                        // Adjust preview page if needed
                        const newTotal = selectedQuestionsArray.length - 1;
                        const newTotalPages = Math.ceil(newTotal / questionsPerPreviewPage);
                        if (previewPage > newTotalPages && newTotalPages > 0) {
                            setPreviewPage(newTotalPages);
                        }
                    }
                }
            ]
        );
    };

    const toggleQuestionSelection = (questionId: string) => {
        const newSelection = new Set(selectedQuestionIds);
        if (newSelection.has(questionId)) {
            newSelection.delete(questionId);
        } else {
            newSelection.add(questionId);
        }
        setSelectedQuestionIds(newSelection);
    };

    const toggleAnswerVisibility = (index: number) => {
        const globalIndex = previewStartIndex + index;
        setShowAnswers(prev => {
            const newSet = new Set(prev);
            newSet.has(globalIndex) ? newSet.delete(globalIndex) : newSet.add(globalIndex);
            return newSet;
        });
    };

    const toggleQuestionExpansion = (index: number) => {
        const globalIndex = previewStartIndex + index;
        setExpandedQuestions(prev => {
            const newSet = new Set(prev);
            newSet.has(globalIndex) ? newSet.delete(globalIndex) : newSet.add(globalIndex);
            return newSet;
        });
    };

    const getDifficultyColor = (difficulty: string | undefined): string => {
        switch (difficulty?.toUpperCase()) {
            case 'EASY':
                return '#4CAF50';
            case 'MEDIUM':
                return '#FF9800';
            case 'HARD':
                return '#F44336';
            default:
                return '#999';
        }
    };

    const validateForm = (): boolean => {
        if (!title.trim()) {
            Alert.alert('Error', 'Please enter a quiz title');
            return false;
        }
        if (!quizConfig.teamName.trim()) {
            Alert.alert('Error', 'Please enter a team name');
            return false;
        }
        if (quizConfig.teamMembers.length === 0) {
            Alert.alert('Error', 'Please add at least one team member');
            return false;
        }
        if (totalSelectedQuestions === 0) {
            Alert.alert('Error', 'Please select or create at least one question');
            return false;
        }
        return true;
    };

    const handleCreateQuest = async () => {
        if (!validateForm()) return;

        try {
            // Get selected question IDs (only for saved questions, not custom ones)
            const savedQuestionIds = Array.from(selectedQuestionIds).map(id => parseInt(id));

            const challengeRequest: CreateChallengeRequest = {
                title: title.trim(),
                description: description.trim(),
                type: 'QUIZ',
                visibility: 'PUBLIC',
                status: 'ACTIVE',
                reward: reward.trim(),
            };

            const challengeResponse = await createChallenge(challengeRequest).unwrap();

            const sessionRequest: StartQuizSessionRequest = {
                challengeId: challengeResponse.id,
                teamName: quizConfig.teamName,
                teamMembers: quizConfig.teamMembers,
                difficulty: quizConfig.difficulty === 'Easy' ? 'EASY' : quizConfig.difficulty === 'Medium' ? 'MEDIUM' : 'HARD',
                roundTimeSeconds: quizConfig.roundTime,
                totalRounds: totalSelectedQuestions,
                timePerRound: quizConfig.roundTime,
                enableAiHost: quizConfig.enableAIHost,
                questionSource: questionSource,
                customQuestionIds: savedQuestionIds,
            };

            const sessionResponse = await startQuizSession(sessionRequest).unwrap();

            Alert.alert(
                'Quest Created! 🎉',
                `Your "${title}" quest has been created with ${totalSelectedQuestions} questions.`,
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
                        onPress: () => navigation.navigate('Main', {screen: 'Challenges'})
                    }
                ]
            );
        } catch (error: any) {
            console.error('Error creating quest:', error);
            Alert.alert('Error', error.message || 'Failed to create quest.');
        }
    };

    const renderQuestionCard = ({item}: { item: QuestionData | CustomQuestion }) => {
        const questionId = 'id' in item ? item.id?.toString() : Math.random().toString();
        const isSelected = selectedQuestionIds.has(questionId || '');
        const isCustom = !('id' in item); // Custom questions don't have IDs from database

        return (
            <TouchableOpacity
                style={[styles.questionCard, isSelected && styles.questionCardSelected]}
                onPress={() => !isCustom && toggleQuestionSelection(questionId || '')}
                disabled={isCustom}
            >
                <View style={styles.questionHeader}>
                    <View style={styles.questionBadges}>
                        <View style={[styles.difficultyBadge, {backgroundColor: getDifficultyColor(item.difficulty)}]}>
                            <Text style={styles.badgeText}>{item.difficulty}</Text>
                        </View>
                        {item.topic && (
                            <View style={styles.topicBadge}>
                                <Text style={styles.topicBadgeText}>{item.topic}</Text>
                            </View>
                        )}
                        {isCustom && (
                            <View style={styles.customBadge}>
                                <Text style={styles.customBadgeText}>NEW</Text>
                            </View>
                        )}
                    </View>
                    {!isCustom && (
                        <MaterialCommunityIcons
                            name={isSelected ? 'checkbox-marked-circle' : 'checkbox-blank-circle-outline'}
                            size={28}
                            color={isSelected ? '#007AFF' : '#999'}
                        />
                    )}
                </View>
                <Text style={styles.questionText} numberOfLines={3}>{item.question}</Text>
                <Text style={styles.answerPreview}>Answer: {item.answer?.substring(0, 30)}...</Text>
            </TouchableOpacity>
        );
    };

    // Check if question is custom (not from database)
    const isCustomQuestion = (q: any, globalIndex: number): boolean => {
        if (questionSource === 'user') {
            const savedCount = userQuestions.filter(uq => selectedQuestionIds.has(uq.id?.toString() || '')).length;
            return globalIndex >= savedCount;
        }
        return false;
    };

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.flex}>
                <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                    {/* Header */}
                    <View style={styles.header}>
                        <Text style={styles.title}>Create Quiz Challenge</Text>
                        <Text style={styles.subtitle}>Configure your custom quiz game</Text>
                    </View>

                    {/* Basic Information */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Basic Information</Text>

                        <View style={styles.inputContainer}>
                            <Text style={styles.label}>Quiz Title *</Text>
                            <TextInput
                                style={styles.input}
                                value={title}
                                onChangeText={setTitle}
                                placeholder="e.g., Team Trivia Challenge"
                                placeholderTextColor="#999"
                            />
                        </View>

                        <View style={styles.inputContainer}>
                            <Text style={styles.label}>Description</Text>
                            <TextInput
                                style={[styles.input, styles.textArea]}
                                value={description}
                                onChangeText={setDescription}
                                placeholder="Describe your quiz challenge..."
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

                    {/* Quiz Configuration */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Quiz Configuration</Text>

                        <View style={styles.inputContainer}>
                            <Text style={styles.label}>Team Name *</Text>
                            <TextInput
                                style={styles.input}
                                value={quizConfig.teamName}
                                onChangeText={(text) => setQuizConfig({...quizConfig, teamName: text})}
                                placeholder="Enter your team name"
                                placeholderTextColor="#999"
                            />
                        </View>

                        <View style={styles.inputContainer}>
                            <Text style={styles.label}>Team Members *</Text>
                            {quizConfig.teamMembers.map((member, index) => (
                                <View key={index} style={styles.memberRow}>
                                    <Text style={styles.memberText}>{index + 1}. {member}</Text>
                                    <TouchableOpacity onPress={() => removeTeamMember(index)}>
                                        <MaterialCommunityIcons name="close-circle" size={24} color="#F44336"/>
                                    </TouchableOpacity>
                                </View>
                            ))}
                            <View style={styles.addMemberContainer}>
                                <TextInput
                                    style={[styles.input, styles.memberInput]}
                                    value={teamMemberInput}
                                    onChangeText={setTeamMemberInput}
                                    placeholder="Add team member"
                                    placeholderTextColor="#999"
                                />
                                <TouchableOpacity style={styles.addButton} onPress={addTeamMember}>
                                    <Text style={styles.addButtonText}>Add</Text>
                                </TouchableOpacity>
                            </View>
                        </View>

                        <View style={styles.inputContainer}>
                            <Text style={styles.label}>Difficulty</Text>
                            <View style={styles.filterContainer}>
                                {(['Easy', 'Medium', 'Hard'] as const).map((diff) => (
                                    <TouchableOpacity
                                        key={diff}
                                        style={[
                                            styles.filterChip,
                                            quizConfig.difficulty === diff && styles.filterChipSelected
                                        ]}
                                        onPress={() => setQuizConfig({...quizConfig, difficulty: diff})}
                                    >
                                        <Text style={[
                                            styles.filterChipText,
                                            quizConfig.difficulty === diff && styles.filterChipTextSelected
                                        ]}>
                                            {diff}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>

                        <View style={styles.inputContainer}>
                            <Text style={styles.label}>Time per Question (seconds)</Text>
                            <TextInput
                                style={styles.input}
                                value={quizConfig.roundTime.toString()}
                                onChangeText={(text) => setQuizConfig({...quizConfig, roundTime: parseInt(text) || 60})}
                                keyboardType="numeric"
                                placeholder="60"
                                placeholderTextColor="#999"
                            />
                        </View>

                        <View style={styles.inputContainer}>
                            <Text style={styles.label}>Number of Questions</Text>
                            <TextInput
                                style={styles.input}
                                value={quizConfig.roundCount.toString()}
                                onChangeText={(text) => setQuizConfig({
                                    ...quizConfig,
                                    roundCount: parseInt(text) || 10
                                })}
                                keyboardType="numeric"
                                placeholder="10"
                                placeholderTextColor="#999"
                            />
                        </View>

                        <View style={styles.toggleRow}>
                            <Text style={styles.label}>Enable AI Host</Text>
                            <TouchableOpacity
                                style={[styles.toggle, quizConfig.enableAIHost && styles.toggleActive]}
                                onPress={() => setQuizConfig({...quizConfig, enableAIHost: !quizConfig.enableAIHost})}
                            >
                                <View
                                    style={[styles.toggleThumb, quizConfig.enableAIHost && styles.toggleThumbActive]}/>
                            </TouchableOpacity>
                        </View>

                        <View style={styles.summaryBox}>
                            <Text style={styles.summaryTitle}>📋 Configuration Summary</Text>
                            <Text style={styles.summaryText}>• Team: {quizConfig.teamName || 'Not set'}</Text>
                            <Text style={styles.summaryText}>• Members: {quizConfig.teamMembers.length}</Text>
                            <Text style={styles.summaryText}>• Difficulty: {quizConfig.difficulty}</Text>
                            <Text style={styles.summaryText}>• Time per question: {quizConfig.roundTime}s</Text>
                            <Text style={styles.summaryText}>• Total questions: {quizConfig.roundCount}</Text>
                            <Text style={styles.summaryText}>• AI Host: {quizConfig.enableAIHost ? 'Yes' : 'No'}</Text>
                        </View>
                    </View>

                    {/* Selected Questions Preview */}
                    {totalSelectedQuestions > 0 && (
                        <View style={styles.section}>
                            <TouchableOpacity
                                style={styles.collapseHeader}
                                onPress={() => setIsPreviewCollapsed(!isPreviewCollapsed)}
                            >
                                <Text style={styles.sectionTitle}>
                                    Selected Questions ({totalSelectedQuestions})
                                </Text>
                                <MaterialCommunityIcons
                                    name={isPreviewCollapsed ? 'chevron-down' : 'chevron-up'}
                                    size={24}
                                    color="#666"
                                />
                            </TouchableOpacity>

                            {!isPreviewCollapsed && (
                                <>
                                    {currentPreviewQuestions.map((q, displayIndex) => {
                                        const globalIndex = previewStartIndex + displayIndex;
                                        const isAnswerVisible = showAnswers.has(globalIndex);
                                        const isExpanded = expandedQuestions.has(globalIndex);
                                        const isCustom = isCustomQuestion(q, globalIndex);

                                        return (
                                            <View key={globalIndex} style={styles.previewCard}>
                                                <View style={styles.previewHeader}>
                                                    <Text style={styles.questionNumber}>Q{globalIndex + 1}</Text>
                                                    {isCustom ? (
                                                        <TouchableOpacity onPress={() => {
                                                            const customIndex = globalIndex - (selectedQuestionsArray.length - customQuestions.length);
                                                            removeCustomQuestion(customIndex);
                                                        }}>
                                                            <MaterialCommunityIcons name="delete" size={24}
                                                                                    color="#F44336"/>
                                                        </TouchableOpacity>
                                                    ) : (
                                                        <TouchableOpacity
                                                            onPress={() => {
                                                                const qId = 'id' in q ? q.id?.toString() : '';
                                                                if (qId) toggleQuestionSelection(qId);
                                                            }}
                                                        >
                                                            <MaterialCommunityIcons name="close-circle" size={24}
                                                                                    color="#F44336"/>
                                                        </TouchableOpacity>
                                                    )}
                                                </View>

                                                <Text style={styles.previewQuestionText}>{q.question}</Text>

                                                <View style={styles.previewMetaRow}>
                                                    <View
                                                        style={[styles.difficultyBadge, {backgroundColor: getDifficultyColor(q.difficulty)}]}>
                                                        <Text style={styles.badgeText}>{q.difficulty}</Text>
                                                    </View>
                                                    {q.topic && <Text style={styles.topicText}>📚 {q.topic}</Text>}
                                                    {isCustom && (
                                                        <View style={styles.customBadge}>
                                                            <Text style={styles.customBadgeText}>NEW</Text>
                                                        </View>
                                                    )}
                                                </View>

                                                <TouchableOpacity
                                                    style={styles.showAnswerButton}
                                                    onPress={() => toggleAnswerVisibility(displayIndex)}
                                                >
                                                    <Text style={styles.showAnswerButtonText}>
                                                        {isAnswerVisible ? '👁️ Hide Answer' : '👁️‍🗨️ Show Answer'}
                                                    </Text>
                                                </TouchableOpacity>

                                                {isAnswerVisible && (
                                                    <View style={styles.answerContainer}>
                                                        <Text style={styles.answerLabel}>Answer:</Text>
                                                        <Text style={styles.answerText}>{q.answer}</Text>
                                                    </View>
                                                )}

                                                {q.additionalInfo && (
                                                    <>
                                                        <TouchableOpacity
                                                            style={styles.expandButton}
                                                            onPress={() => toggleQuestionExpansion(displayIndex)}
                                                        >
                                                            <Text style={styles.expandButtonText}>
                                                                {isExpanded ? '▲ Hide Details' : '▼ Show Details'}
                                                            </Text>
                                                        </TouchableOpacity>

                                                        {isExpanded && (
                                                            <View style={styles.additionalInfoContainer}>
                                                                <Text style={styles.additionalInfoLabel}>Additional
                                                                    Info:</Text>
                                                                <Text
                                                                    style={styles.additionalInfoText}>{q.additionalInfo}</Text>
                                                            </View>
                                                        )}
                                                    </>
                                                )}
                                            </View>
                                        );
                                    })}

                                    {totalPreviewPages > 1 && (
                                        <View style={styles.paginationContainer}>
                                            <TouchableOpacity
                                                style={[styles.paginationButton, previewPage === 1 && styles.paginationButtonDisabled]}
                                                onPress={() => setPreviewPage(previewPage - 1)}
                                                disabled={previewPage === 1}
                                            >
                                                <Text style={styles.paginationButtonText}>← Previous</Text>
                                            </TouchableOpacity>
                                            <Text
                                                style={styles.pageInfo}>Page {previewPage} of {totalPreviewPages}</Text>
                                            <TouchableOpacity
                                                style={[styles.paginationButton, previewPage === totalPreviewPages && styles.paginationButtonDisabled]}
                                                onPress={() => setPreviewPage(previewPage + 1)}
                                                disabled={previewPage === totalPreviewPages}
                                            >
                                                <Text style={styles.paginationButtonText}>Next →</Text>
                                            </TouchableOpacity>
                                        </View>
                                    )}
                                </>
                            )}
                        </View>
                    )}

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
                                <Text style={styles.radioText}>Application Questions</Text>
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
                                <Text style={styles.radioText}>User Questions</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Search Filters (for Application Questions) */}
                    {questionSource === 'app' && (
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Search Application Questions</Text>

                            <View style={styles.inputContainer}>
                                <Text style={styles.label}>Keyword</Text>
                                <TextInput
                                    style={styles.input}
                                    value={searchKeyword}
                                    onChangeText={setSearchKeyword}
                                    placeholder="Search questions..."
                                    placeholderTextColor="#999"
                                />
                            </View>

                            <View style={styles.inputContainer}>
                                <Text style={styles.label}>Difficulty</Text>
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

                            <View style={styles.searchActions}>
                                <TouchableOpacity
                                    style={styles.searchButton}
                                    onPress={() => {
                                        setCurrentPage(0);
                                        searchAppQuestions();
                                    }}
                                    disabled={isLoadingAppQuestions}
                                >
                                    <MaterialCommunityIcons name="magnify" size={20} color="#FFF"/>
                                    <Text style={styles.searchButtonText}>
                                        {isLoadingAppQuestions ? 'Searching...' : 'Search'}
                                    </Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={styles.clearButton}
                                    onPress={() => {
                                        setSearchKeyword('');
                                        setSearchDifficulty('ALL');
                                        setCurrentPage(0);
                                    }}
                                >
                                    <Text style={styles.clearButtonText}>Clear</Text>
                                </TouchableOpacity>
                            </View>

                            {totalQuestions > 0 && (
                                <Text style={styles.resultsCount}>
                                    Found {totalQuestions} questions (Page {currentPage + 1} of {totalPages})
                                </Text>
                            )}
                        </View>
                    )}

                    {/* User Questions Section */}
                    {questionSource === 'user' && (
                        <>
                            {/* Saved User Questions */}
                            <View style={styles.section}>
                                <Text style={styles.sectionTitle}>Your Saved Questions</Text>

                                {isLoadingUserQuestions ? (
                                    <View style={styles.loadingContainer}>
                                        <ActivityIndicator size="large" color="#007AFF"/>
                                        <Text style={styles.loadingText}>Loading your questions...</Text>
                                    </View>
                                ) : (
                                    <FlatList
                                        data={userQuestions}
                                        renderItem={renderQuestionCard}
                                        keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
                                        ListEmptyComponent={
                                            <View style={styles.emptyContainer}>
                                                <MaterialCommunityIcons name="file-question-outline" size={64}
                                                                        color="#999"/>
                                                <Text style={styles.emptyText}>No saved questions yet</Text>
                                                <Text style={styles.emptySubtext}>Create custom questions below</Text>
                                            </View>
                                        }
                                        scrollEnabled={false}
                                    />
                                )}
                            </View>

                            {/* Create Custom Questions Form */}
                            <View style={styles.section}>
                                <Text style={styles.sectionTitle}>Create Custom Questions</Text>

                                <View style={styles.inputContainer}>
                                    <Text style={styles.label}>Question *</Text>
                                    <TextInput
                                        style={[styles.input, styles.textArea]}
                                        value={currentCustomQuestion.question}
                                        onChangeText={(text) => setCurrentCustomQuestion({
                                            ...currentCustomQuestion,
                                            question: text
                                        })}
                                        placeholder="Enter your question..."
                                        placeholderTextColor="#999"
                                        multiline
                                        numberOfLines={3}
                                    />
                                </View>

                                <View style={styles.inputContainer}>
                                    <Text style={styles.label}>Answer *</Text>
                                    <TextInput
                                        style={styles.input}
                                        value={currentCustomQuestion.answer}
                                        onChangeText={(text) => setCurrentCustomQuestion({
                                            ...currentCustomQuestion,
                                            answer: text
                                        })}
                                        placeholder="Enter the answer..."
                                        placeholderTextColor="#999"
                                    />
                                </View>

                                <View style={styles.inputContainer}>
                                    <Text style={styles.label}>Difficulty</Text>
                                    <View style={styles.pickerContainer}>
                                        <Picker
                                            selectedValue={currentCustomQuestion.difficulty}
                                            onValueChange={(value) => setCurrentCustomQuestion({
                                                ...currentCustomQuestion,
                                                difficulty: value as 'EASY' | 'MEDIUM' | 'HARD'
                                            })}
                                            style={styles.picker}
                                        >
                                            <Picker.Item label="Easy" value="EASY"/>
                                            <Picker.Item label="Medium" value="MEDIUM"/>
                                            <Picker.Item label="Hard" value="HARD"/>
                                        </Picker>
                                    </View>
                                </View>

                                <View style={styles.inputContainer}>
                                    <Text style={styles.label}>Topic (Optional)</Text>
                                    <TextInput
                                        style={styles.input}
                                        value={currentCustomQuestion.topic}
                                        onChangeText={(text) => setCurrentCustomQuestion({
                                            ...currentCustomQuestion,
                                            topic: text
                                        })}
                                        placeholder="e.g., Science, History"
                                        placeholderTextColor="#999"
                                    />
                                </View>

                                <View style={styles.inputContainer}>
                                    <Text style={styles.label}>Additional Info (Optional)</Text>
                                    <TextInput
                                        style={[styles.input, styles.textArea]}
                                        value={currentCustomQuestion.additionalInfo}
                                        onChangeText={(text) => setCurrentCustomQuestion({
                                            ...currentCustomQuestion,
                                            additionalInfo: text
                                        })}
                                        placeholder="Any context or explanation..."
                                        placeholderTextColor="#999"
                                        multiline
                                        numberOfLines={3}
                                    />
                                </View>

                                <TouchableOpacity style={styles.addQuestionButton} onPress={addCustomQuestion}>
                                    <MaterialCommunityIcons name="plus-circle" size={20} color="#fff"/>
                                    <Text style={styles.addQuestionButtonText}>Add Custom Question</Text>
                                </TouchableOpacity>

                                {customQuestions.length > 0 && (
                                    <View style={styles.customQuestionsInfo}>
                                        <MaterialCommunityIcons name="check-circle" size={20} color="#2e7d32"/>
                                        <Text style={styles.customQuestionsInfoText}>
                                            {customQuestions.length} custom
                                            question{customQuestions.length !== 1 ? 's' : ''} created
                                        </Text>
                                    </View>
                                )}
                            </View>
                        </>
                    )}

                    {/* Application Questions List */}
                    {questionSource === 'app' && (
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Select Questions</Text>

                            {isLoadingAppQuestions ? (
                                <View style={styles.loadingContainer}>
                                    <ActivityIndicator size="large" color="#007AFF"/>
                                    <Text style={styles.loadingText}>Loading questions...</Text>
                                </View>
                            ) : (
                                <FlatList
                                    data={appQuestions}
                                    renderItem={renderQuestionCard}
                                    keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
                                    ListEmptyComponent={
                                        <View style={styles.emptyContainer}>
                                            <MaterialCommunityIcons name="alert-circle-outline" size={64} color="#999"/>
                                            <Text style={styles.emptyText}>No questions found</Text>
                                            <Text style={styles.emptySubtext}>Try different search filters</Text>
                                        </View>
                                    }
                                    scrollEnabled={false}
                                />
                            )}

                            {totalPages > 1 && (
                                <View style={styles.paginationContainer}>
                                    <TouchableOpacity
                                        style={[styles.paginationButton, currentPage === 0 && styles.paginationButtonDisabled]}
                                        onPress={() => setCurrentPage(currentPage - 1)}
                                        disabled={currentPage === 0}
                                    >
                                        <Text style={styles.paginationButtonText}>← Previous</Text>
                                    </TouchableOpacity>
                                    <Text style={styles.pageInfo}>Page {currentPage + 1} of {totalPages}</Text>
                                    <TouchableOpacity
                                        style={[styles.paginationButton, currentPage >= totalPages - 1 && styles.paginationButtonDisabled]}
                                        onPress={() => setCurrentPage(currentPage + 1)}
                                        disabled={currentPage >= totalPages - 1}
                                    >
                                        <Text style={styles.paginationButtonText}>Next →</Text>
                                    </TouchableOpacity>
                                </View>
                            )}
                        </View>
                    )}

                    <View style={styles.spacer}/>
                </ScrollView>

                {/* Create Button */}
                <View style={styles.footer}>
                    <TouchableOpacity
                        style={[styles.createButton, (isCreatingChallenge || isStartingSession) && styles.createButtonDisabled]}
                        onPress={handleCreateQuest}
                        disabled={isCreatingChallenge || isStartingSession}
                    >
                        {(isCreatingChallenge || isStartingSession) ? (
                            <ActivityIndicator color="#fff"/>
                        ) : (
                            <>
                                <MaterialCommunityIcons name="trophy" size={24} color="#fff"/>
                                <Text style={styles.createButtonText}>
                                    Create Quest ({totalSelectedQuestions})
                                </Text>
                            </>
                        )}
                    </TouchableOpacity>
                </View>

                {/* Topic Picker Modal */}
                <Modal visible={showTopicPicker} transparent animationType="slide">
                    <View style={styles.modalOverlay}>
                        <View style={styles.modalContent}>
                            <Text style={styles.modalTitle}>Select Topic</Text>
                            <ScrollView style={styles.topicList}>
                                {availableTopics.map((topic) => (
                                    <TouchableOpacity
                                        key={topic}
                                        style={styles.topicItem}
                                        onPress={() => {
                                            setSearchTopic(topic);
                                            setShowTopicPicker(false);
                                        }}
                                    >
                                        <Text style={styles.topicItemText}>{topic}</Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                            <TouchableOpacity
                                style={styles.modalCloseButton}
                                onPress={() => setShowTopicPicker(false)}
                            >
                                <Text style={styles.modalCloseButtonText}>Close</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </Modal>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    flex: {
        flex: 1,
    },
    scrollView: {
        flex: 1,
    },
    header: {
        padding: 20,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    title: {
        fontSize: 28,
        fontWeight: '700',
        color: '#333',
        marginBottom: 4,
    },
    subtitle: {
        fontSize: 16,
        color: '#666',
    },
    section: {
        backgroundColor: '#fff',
        marginTop: 16,
        padding: 16,
        borderTopWidth: 1,
        borderBottomWidth: 1,
        borderColor: '#e0e0e0',
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#333',
        marginBottom: 16,
    },
    collapseHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    inputContainer: {
        marginBottom: 16,
    },
    label: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 8,
    },
    input: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        backgroundColor: '#fff',
    },
    textArea: {
        height: 80,
        textAlignVertical: 'top',
    },
    memberRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#f8f8f8',
        padding: 12,
        borderRadius: 8,
        marginBottom: 8,
    },
    memberText: {
        fontSize: 16,
        color: '#333',
    },
    addMemberContainer: {
        flexDirection: 'row',
        gap: 8,
    },
    memberInput: {
        flex: 1,
    },
    addButton: {
        backgroundColor: '#4CAF50',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 8,
        justifyContent: 'center',
    },
    addButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
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
        backgroundColor: '#f0f0f0',
        borderWidth: 1,
        borderColor: '#ddd',
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
        color: '#fff',
    },
    toggleRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    toggle: {
        width: 50,
        height: 28,
        borderRadius: 14,
        backgroundColor: '#ccc',
        padding: 2,
    },
    toggleActive: {
        backgroundColor: '#4CAF50',
    },
    toggleThumb: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: '#fff',
    },
    toggleThumbActive: {
        transform: [{translateX: 22}],
    },
    summaryBox: {
        backgroundColor: '#f8f8f8',
        padding: 16,
        borderRadius: 8,
        marginTop: 8,
    },
    summaryTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#333',
        marginBottom: 8,
    },
    summaryText: {
        fontSize: 14,
        color: '#666',
        marginBottom: 4,
    },
    radioGroup: {
        flexDirection: 'row',
        gap: 16,
        flexWrap: 'wrap',
    },
    radioButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    radioText: {
        fontSize: 16,
        color: '#333',
    },
    pickerContainer: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        backgroundColor: '#fff',
        overflow: 'hidden',
    },
    picker: {
        height: 50,
    },
    addQuestionButton: {
        flexDirection: 'row',
        backgroundColor: '#4CAF50',
        padding: 14,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    addQuestionButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    customQuestionsInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#e8f5e9',
        padding: 12,
        borderRadius: 8,
        marginTop: 12,
        gap: 8,
    },
    customQuestionsInfoText: {
        fontSize: 14,
        color: '#2e7d32',
        fontWeight: '600',
    },
    searchActions: {
        flexDirection: 'row',
        gap: 12,
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
        color: '#fff',
    },
    clearButton: {
        paddingHorizontal: 20,
        paddingVertical: 12,
        backgroundColor: '#f0f0f0',
        borderRadius: 8,
    },
    clearButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#666',
    },
    resultsCount: {
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
        marginTop: 12,
    },
    questionCard: {
        backgroundColor: '#f8f8f8',
        borderRadius: 12,
        padding: 14,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#e0e0e0',
    },
    questionCardSelected: {
        backgroundColor: '#e5f1ff',
        borderColor: '#007AFF',
        borderWidth: 2,
    },
    questionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    questionBadges: {
        flexDirection: 'row',
        gap: 8,
    },
    difficultyBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    badgeText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '600',
    },
    topicBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        backgroundColor: '#e0e0e0',
    },
    topicBadgeText: {
        color: '#666',
        fontSize: 12,
        fontWeight: '600',
    },
    customBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        backgroundColor: '#4CAF50',
    },
    customBadgeText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '600',
    },
    questionText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 8,
        lineHeight: 22,
    },
    answerPreview: {
        fontSize: 14,
        color: '#666',
    },
    previewCard: {
        backgroundColor: '#f8f8f8',
        borderRadius: 8,
        padding: 14,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#e0e0e0',
    },
    previewHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    questionNumber: {
        fontSize: 18,
        fontWeight: '700',
        color: '#2196F3',
    },
    previewQuestionText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 10,
        lineHeight: 24,
    },
    previewMetaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 10,
    },
    topicText: {
        fontSize: 13,
        color: '#666',
    },
    showAnswerButton: {
        backgroundColor: '#2196F3',
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 6,
        alignSelf: 'flex-start',
        marginBottom: 8,
    },
    showAnswerButtonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
    },
    answerContainer: {
        backgroundColor: '#fff',
        borderWidth: 2,
        borderColor: '#4CAF50',
        borderRadius: 8,
        padding: 12,
        marginTop: 8,
    },
    answerLabel: {
        fontSize: 13,
        fontWeight: '700',
        color: '#4CAF50',
        marginBottom: 4,
    },
    answerText: {
        fontSize: 15,
        color: '#333',
        lineHeight: 22,
    },
    expandButton: {
        backgroundColor: '#9E9E9E',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 6,
        alignSelf: 'flex-start',
        marginTop: 6,
    },
    expandButtonText: {
        color: '#fff',
        fontSize: 13,
        fontWeight: '600',
    },
    additionalInfoContainer: {
        backgroundColor: '#f0f0f0',
        borderRadius: 6,
        padding: 10,
        marginTop: 8,
    },
    additionalInfoLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: '#666',
        marginBottom: 4,
    },
    additionalInfoText: {
        fontSize: 14,
        color: '#555',
        lineHeight: 20,
    },
    paginationContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 16,
        paddingHorizontal: 8,
    },
    paginationButton: {
        backgroundColor: '#007AFF',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 6,
    },
    paginationButtonDisabled: {
        backgroundColor: '#ccc',
    },
    paginationButtonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
    },
    pageInfo: {
        fontSize: 14,
        color: '#666',
        fontWeight: '500',
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
    emptyContainer: {
        padding: 40,
        alignItems: 'center',
    },
    emptyText: {
        marginTop: 12,
        fontSize: 16,
        color: '#666',
        fontWeight: '600',
    },
    emptySubtext: {
        marginTop: 4,
        fontSize: 14,
        color: '#999',
    },
    footer: {
        padding: 16,
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderTopColor: '#e0e0e0',
    },
    createButton: {
        flexDirection: 'row',
        backgroundColor: '#4CAF50',
        padding: 16,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    createButtonDisabled: {
        backgroundColor: '#ccc',
    },
    createButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '700',
    },
    spacer: {
        height: 100,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        padding: 20,
        maxHeight: '70%',
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#333',
        marginBottom: 16,
    },
    topicList: {
        maxHeight: 400,
    },
    topicItem: {
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    topicItemText: {
        fontSize: 16,
        color: '#333',
    },
    modalCloseButton: {
        backgroundColor: '#007AFF',
        padding: 16,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 16,
    },
    modalCloseButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
});

export default CreateWWWQuestScreen;