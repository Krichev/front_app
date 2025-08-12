// src/screens/CreateWWWQuestScreen.tsx - Enhanced with question reading and selection
import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    KeyboardAvoidingView,
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
import {useGetUserQuestionsQuery, useStartQuizSessionMutation} from '../entities/QuizState/model/slice/quizApi';
import {useSelector} from 'react-redux';
import {RootState} from '../app/providers/StoreProvider/store';
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import {QuestionData, QuestionService} from '../services/wwwGame/questionService';
import {ChallengeStatus, ChallengeVisibility} from '../app/types';

// Enhanced interfaces for question saving
interface AppQuestionData {
    question: string;
    answer: string;
    difficulty: 'EASY' | 'MEDIUM' | 'HARD';
    topic?: string;
    additionalInfo?: string;
    externalId?: string;
    source?: string;
}

interface CreateQuestionRequest {
    question: string;
    answer: string;
    difficulty: 'EASY' | 'MEDIUM' | 'HARD';
    topic?: string;
    additionalInfo?: string;
}

// Enhanced StartQuizSessionRequest with question saving
interface EnhancedStartQuizSessionRequest {
    challengeId: string;
    teamName: string;
    teamMembers: string[];
    difficulty: 'EASY' | 'MEDIUM' | 'HARD';
    roundTimeSeconds: number;
    totalRounds: number;
    enableAiHost: boolean;
    questionSource: 'app' | 'user';
    customQuestionIds?: number[];
    newCustomQuestions?: CreateQuestionRequest[];
    appQuestions?: AppQuestionData[];
}

// API Difficulty type mapping
type UIDifficulty = 'Easy' | 'Medium' | 'Hard';
type APIDifficulty = 'EASY' | 'MEDIUM' | 'HARD';

const DIFFICULTY_MAPPING: Record<UIDifficulty, APIDifficulty> = {
    'Easy': 'EASY',
    'Medium': 'MEDIUM',
    'Hard': 'HARD'
};

type RootStackParamList = {
    Challenges: undefined;
    UserQuestions: undefined;
    WWWGamePlay: {
        sessionId: string;
        challengeId?: string;
    };
};

type CreateWWWQuestScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;

const CreateWWWQuestScreen: React.FC = () => {
    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
    const { user } = useSelector((state: RootState) => state.auth);

    // API hooks
    const [createChallenge, { isLoading: isCreatingChallenge }] = useCreateChallengeMutation();
    const [startQuizSession, { isLoading: isStartingSession }] = useStartQuizSessionMutation();

    // Question source state
    const [questionSource, setQuestionSource] = useState<'app' | 'user'>('app');

    // User questions query (only when needed)
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

    // Selection state - which questions are checked/selected
    const [selectedAppQuestionIds, setSelectedAppQuestionIds] = useState<Set<string>>(new Set());
    const [selectedUserQuestionIds, setSelectedUserQuestionIds] = useState<Set<number>>(new Set());
    const [newCustomQuestions, setNewCustomQuestions] = useState<CreateQuestionRequest[]>([]);

    // Form state
    const [title, setTitle] = useState('What? Where? When? Quiz');
    const [description, setDescription] = useState('Test your knowledge in this team-based quiz game.');
    const [reward, setReward] = useState('Points and bragging rights!');
    const [difficulty, setDifficulty] = useState<UIDifficulty>('Medium');
    const [teamName, setTeamName] = useState('');
    const [teamMembers, setTeamMembers] = useState<string[]>(['']);
    const [roundTime, setRoundTime] = useState(60);
    const [enableAIHost, setEnableAIHost] = useState(false);

    // Load app questions when difficulty changes
    useEffect(() => {
        if (questionSource === 'app') {
            loadAppQuestions();
        }
    }, [difficulty, questionSource]);

    const loadAppQuestions = useCallback(async () => {
        setIsLoadingAppQuestions(true);
        setAppQuestionsError(null);
        setSelectedAppQuestionIds(new Set()); // Clear previous selections

        try {
            // Load more questions than needed so user can choose
            const questions = await QuestionService.getQuestionsByDifficulty(difficulty, 50);
            if (questions && questions.length > 0) {
                setAppQuestions(questions);
            } else {
                setAppQuestions([]);
                setAppQuestionsError('No questions available for this difficulty level');
            }
        } catch (error) {
            console.error('Error loading app questions:', error);
            setAppQuestionsError('Failed to load questions. Please try again.');
            setAppQuestions([]);
        } finally {
            setIsLoadingAppQuestions(false);
        }
    }, [difficulty]);

    // Toggle app question selection with limit check
    const toggleAppQuestionSelection = useCallback((questionId: string) => {
        setSelectedAppQuestionIds(prev => {
            const newSet = new Set(prev);
            if (newSet.has(questionId)) {
                newSet.delete(questionId);
            } else {
                // Optional: Add a limit check
                if (newSet.size < 50) { // Max 50 questions
                    newSet.add(questionId);
                } else {
                    Alert.alert('Limit Reached', 'You can select up to 50 questions maximum.');
                    return prev;
                }
            }
            return newSet;
        });
    }, []);

    // Toggle user question selection with limit check
    const toggleUserQuestionSelection = useCallback((questionId: number) => {
        setSelectedUserQuestionIds(prev => {
            const newSet = new Set(prev);
            if (newSet.has(questionId)) {
                newSet.delete(questionId);
            } else {
                // Optional: Add a limit check
                if (newSet.size < 50) { // Max 50 questions
                    newSet.add(questionId);
                } else {
                    Alert.alert('Limit Reached', 'You can select up to 50 questions maximum.');
                    return prev;
                }
            }
            return newSet;
        });
    }, []);

    // Select all / Deselect all app questions
    const toggleSelectAllAppQuestions = useCallback(() => {
        if (selectedAppQuestionIds.size === appQuestions.length) {
            // Deselect all
            setSelectedAppQuestionIds(new Set());
        } else {
            // Select all (up to limit)
            const questionIds = appQuestions.slice(0, 50).map(q => q.id);
            setSelectedAppQuestionIds(new Set(questionIds));
        }
    }, [selectedAppQuestionIds.size, appQuestions]);

    // Select all / Deselect all user questions
    const toggleSelectAllUserQuestions = useCallback(() => {
        if (selectedUserQuestionIds.size === userQuestions.length) {
            // Deselect all
            setSelectedUserQuestionIds(new Set());
        } else {
            // Select all (up to limit)
            const questionIds = userQuestions.slice(0, 50).map(q => q.id);
            setSelectedUserQuestionIds(new Set(questionIds));
        }
    }, [selectedUserQuestionIds.size, userQuestions]);

    // Add new custom question
    const addNewCustomQuestion = () => {
        const apiDifficulty = DIFFICULTY_MAPPING[difficulty];
        setNewCustomQuestions(prev => [...prev, {
            question: '',
            answer: '',
            difficulty: apiDifficulty,
            topic: '',
            additionalInfo: ''
        }]);
    };

    // Remove custom question
    const removeCustomQuestion = (index: number) => {
        setNewCustomQuestions(prev => prev.filter((_, i) => i !== index));
    };

    // Update custom question
    const updateCustomQuestion = (index: number, field: keyof CreateQuestionRequest, value: string) => {
        setNewCustomQuestions(prev => prev.map((q, i) =>
            i === index ? { ...q, [field]: value } : q
        ));
    };

    // Add team member
    const addTeamMember = () => {
        setTeamMembers(prev => [...prev, '']);
    };

    // Remove team member
    const removeTeamMember = (index: number) => {
        if (teamMembers.length > 1) {
            setTeamMembers(prev => prev.filter((_, i) => i !== index));
        }
    };

    // Update team member
    const updateTeamMember = (index: number, value: string) => {
        setTeamMembers(prev => prev.map((member, i) => i === index ? value : member));
    };

    // Get selected app questions data
    const selectedAppQuestions = useMemo(() => {
        return appQuestions.filter(q => selectedAppQuestionIds.has(q.id));
    }, [appQuestions, selectedAppQuestionIds]);

    // Get valid custom questions
    const validCustomQuestions = useMemo(() => {
        return newCustomQuestions.filter(q => q.question.trim() && q.answer.trim());
    }, [newCustomQuestions]);

    // Calculate total selected questions
    const totalSelectedQuestions = useMemo(() => {
        if (questionSource === 'app') {
            return selectedAppQuestions.length;
        } else {
            return selectedUserQuestionIds.size + validCustomQuestions.length;
        }
    }, [questionSource, selectedAppQuestions.length, selectedUserQuestionIds.size, validCustomQuestions.length]);

    // Validation
    const canCreateQuest = useMemo(() => {
        const hasValidTitle = title.trim().length > 0;
        const hasValidTeamName = teamName.trim().length > 0;
        const hasValidTeamMembers = teamMembers.some(member => member.trim().length > 0);
        const hasValidQuestions = totalSelectedQuestions > 0;

        return hasValidTitle && hasValidTeamName && hasValidTeamMembers && hasValidQuestions;
    }, [title, teamName, teamMembers, totalSelectedQuestions]);

    // Enhanced create quest handler with better error handling
    const handleCreateQuest = useCallback(async () => {
        if (!canCreateQuest) {
            Alert.alert('Validation Error', 'Please fill in all required fields and select at least one question.');
            return;
        }

        if (totalSelectedQuestions === 0) {
            Alert.alert('No Questions Selected', 'Please select at least one question to create your quest.');
            return;
        }

        try {
            const apiDifficulty = DIFFICULTY_MAPPING[difficulty];

            // Create challenge
            const challengeData: CreateChallengeRequest = {
                title: title.trim(),
                description: description.trim(),
                reward: reward.trim(),
                type: 'QUIZ',
                visibility: 'PUBLIC' as ChallengeVisibility,
                status: 'OPEN' as ChallengeStatus,
                quizConfig: JSON.stringify({
                    difficulty: apiDifficulty,
                    roundTime,
                    totalQuestions: totalSelectedQuestions,
                    enableAIHost,
                    teamBased: true,
                    questionSource,
                    selectedQuestionsCount: totalSelectedQuestions
                })
            };

            console.log('Creating challenge...', challengeData);
            const result = await createChallenge(challengeData).unwrap();

            if (result?.id) {
                // Prepare selected app questions data for saving
                const appQuestionsData: AppQuestionData[] = selectedAppQuestions.map(q => ({
                    question: q.question,
                    answer: q.answer,
                    difficulty: DIFFICULTY_MAPPING[q.difficulty as UIDifficulty] || apiDifficulty,
                    topic: q.topic,
                    additionalInfo: q.additionalInfo || '',
                    externalId: q.id,
                    source: q.source || 'APP_GENERATED',
                }));

                // Enhanced session request with only selected questions
                const sessionRequest: EnhancedStartQuizSessionRequest = {
                    challengeId: result.id.toString(),
                    teamName: teamName.trim(),
                    teamMembers: teamMembers.map(m => m.trim()).filter(m => m),
                    difficulty: apiDifficulty,
                    roundTimeSeconds: roundTime,
                    totalRounds: totalSelectedQuestions,
                    enableAiHost: enableAIHost,
                    questionSource,
                    ...(questionSource === 'user' && {
                        customQuestionIds: Array.from(selectedUserQuestionIds),
                        newCustomQuestions: validCustomQuestions,
                    }),
                    ...(questionSource === 'app' && {
                        appQuestions: appQuestionsData,
                    }),
                };

                console.log('Starting quiz session with selected questions:', {
                    questionSource,
                    selectedAppQuestions: appQuestionsData.length,
                    selectedUserQuestions: selectedUserQuestionIds.size,
                    newQuestions: validCustomQuestions.length,
                    totalRounds: sessionRequest.totalRounds,
                });

                // Start quiz session with selected questions
                const sessionResult = await startQuizSession(sessionRequest as any).unwrap();

                if (sessionResult?.id) {
                    console.log('Quiz session created successfully:', {
                        sessionId: sessionResult.id,
                        challengeId: result.id,
                        questionsCount: sessionResult.totalRounds,
                    });

                    Alert.alert(
                        'Success! 🎉',
                        `WWW Quest created successfully!\n\n✅ Challenge created\n✅ ${sessionRequest.totalRounds} selected questions saved\n✅ Quiz session ready`,
                        [
                            {
                                text: 'Start Playing',
                                onPress: () => navigation.navigate('WWWGamePlay', {
                                    sessionId: sessionResult.id.toString(),
                                    challengeId: result.id.toString()
                                }),
                            },
                        ]
                    );
                } else {
                    throw new Error('Failed to start quiz session - no session ID returned');
                }
            } else {
                throw new Error('Failed to create challenge - no challenge ID returned');
            }
        } catch (error) {
            console.error('Error creating quest:', error);
            let errorMessage = 'Unknown error occurred';

            if (error instanceof Error) {
                errorMessage = error.message;
            } else if (typeof error === 'object' && error !== null && 'data' in error) {
                errorMessage = (error as any).data?.message || 'Server error occurred';
            }

            Alert.alert('Error', `Failed to create quest: ${errorMessage}`);
        }
    }, [
        canCreateQuest,
        totalSelectedQuestions,
        difficulty,
        title,
        description,
        reward,
        roundTime,
        enableAIHost,
        questionSource,
        selectedAppQuestions,
        validCustomQuestions,
        teamName,
        teamMembers,
        selectedUserQuestionIds,
        createChallenge,
        startQuizSession,
        navigation
    ]);

    // Render app question item
    const renderAppQuestionItem = ({ item }: { item: QuestionData }) => (
        <TouchableOpacity
            style={[
                styles.questionItem,
                selectedAppQuestionIds.has(item.id) && styles.questionItemSelected
            ]}
            onPress={() => toggleAppQuestionSelection(item.id)}
            activeOpacity={0.7}
        >
            <View style={styles.questionHeader}>
                <MaterialCommunityIcons
                    name={selectedAppQuestionIds.has(item.id) ? 'checkbox-marked' : 'checkbox-blank-outline'}
                    size={24}
                    color={selectedAppQuestionIds.has(item.id) ? '#007AFF' : '#999'}
                />
                <View style={styles.questionMeta}>
                    <Text style={styles.questionDifficulty}>{item.difficulty}</Text>
                    {item.topic && <Text style={styles.questionTopic}>{item.topic}</Text>}
                </View>
            </View>
            <Text style={styles.questionText} numberOfLines={3}>{item.question}</Text>
            <Text style={styles.answerText} numberOfLines={2}>Answer: {item.answer}</Text>
            {item.additionalInfo && (
                <Text style={styles.additionalInfo} numberOfLines={2}>{item.additionalInfo}</Text>
            )}
        </TouchableOpacity>
    );

    // Render user question item
    const renderUserQuestionItem = ({ item }: { item: any }) => (
        <TouchableOpacity
            style={[
                styles.questionItem,
                selectedUserQuestionIds.has(item.id) && styles.questionItemSelected
            ]}
            onPress={() => toggleUserQuestionSelection(item.id)}
            activeOpacity={0.7}
        >
            <View style={styles.questionHeader}>
                <MaterialCommunityIcons
                    name={selectedUserQuestionIds.has(item.id) ? 'checkbox-marked' : 'checkbox-blank-outline'}
                    size={24}
                    color={selectedUserQuestionIds.has(item.id) ? '#007AFF' : '#999'}
                />
                <View style={styles.questionMeta}>
                    <Text style={styles.questionDifficulty}>{item.difficulty}</Text>
                    {item.topic && <Text style={styles.questionTopic}>{item.topic}</Text>}
                </View>
            </View>
            <Text style={styles.questionText} numberOfLines={3}>{item.question}</Text>
            <Text style={styles.answerText} numberOfLines={2}>Answer: {item.answer}</Text>
            {item.additionalInfo && (
                <Text style={styles.additionalInfo} numberOfLines={2}>{item.additionalInfo}</Text>
            )}
        </TouchableOpacity>
    );

    const isLoading = isCreatingChallenge || isStartingSession;

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.keyboardView}
            >
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => navigation.goBack()}
                    >
                        <MaterialCommunityIcons name="arrow-left" size={24} color="#333" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Create WWW Quest</Text>
                </View>

                <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                    <View style={styles.content}>
                        {/* Question Source Selection */}
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Question Source</Text>
                            <View style={styles.radioGroup}>
                                <TouchableOpacity
                                    style={[styles.radioOption, questionSource === 'app' && styles.radioSelected]}
                                    onPress={() => setQuestionSource('app')}
                                >
                                    <MaterialCommunityIcons
                                        name={questionSource === 'app' ? 'radiobox-marked' : 'radiobox-blank'}
                                        size={20}
                                        color={questionSource === 'app' ? '#007AFF' : '#999'}
                                    />
                                    <Text style={styles.radioText}>App Questions</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.radioOption, questionSource === 'user' && styles.radioSelected]}
                                    onPress={() => setQuestionSource('user')}
                                >
                                    <MaterialCommunityIcons
                                        name={questionSource === 'user' ? 'radiobox-marked' : 'radiobox-blank'}
                                        size={20}
                                        color={questionSource === 'user' ? '#007AFF' : '#999'}
                                    />
                                    <Text style={styles.radioText}>My Questions</Text>
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* Difficulty Selection */}
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Difficulty</Text>
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
                                        <Text style={[
                                            styles.difficultyButtonText,
                                            difficulty === diff && styles.difficultyButtonTextSelected
                                        ]}>
                                            {diff}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>

                        {/* Questions Section */}
                        {questionSource === 'app' ? (
                            <View style={styles.section}>
                                <View style={styles.sectionHeaderWithActions}>
                                    <Text style={styles.sectionTitle}>
                                        Select App Questions ({selectedAppQuestions.length} selected)
                                    </Text>
                                    {appQuestions.length > 0 && (
                                        <TouchableOpacity
                                            style={styles.selectAllButton}
                                            onPress={toggleSelectAllAppQuestions}
                                        >
                                            <Text style={styles.selectAllButtonText}>
                                                {selectedAppQuestionIds.size === appQuestions.length ? 'Deselect All' : 'Select All'}
                                            </Text>
                                        </TouchableOpacity>
                                    )}
                                </View>
                                {isLoadingAppQuestions ? (
                                    <View style={styles.loadingContainer}>
                                        <ActivityIndicator size="small" color="#007AFF" />
                                        <Text style={styles.loadingText}>Loading questions...</Text>
                                    </View>
                                ) : appQuestionsError ? (
                                    <View style={styles.errorContainer}>
                                        <Text style={styles.errorText}>{appQuestionsError}</Text>
                                        <TouchableOpacity style={styles.retryButton} onPress={loadAppQuestions}>
                                            <Text style={styles.retryButtonText}>Retry</Text>
                                        </TouchableOpacity>
                                    </View>
                                ) : (
                                    <View style={styles.questionsContainer}>
                                        <Text style={styles.helperText}>
                                            Select the questions you want to use in your quiz
                                        </Text>
                                        <FlatList
                                            data={appQuestions}
                                            renderItem={renderAppQuestionItem}
                                            keyExtractor={(item) => item.id}
                                            style={styles.questionsList}
                                            scrollEnabled={false}
                                            showsVerticalScrollIndicator={false}
                                            ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
                                            ListEmptyComponent={() => (
                                                <Text style={styles.helperText}>No questions available for this difficulty</Text>
                                            )}
                                        />
                                    </View>
                                )}
                            </View>
                        ) : (
                            <View style={styles.section}>
                                <Text style={styles.sectionTitle}>My Questions</Text>

                                {/* Existing User Questions */}
                                <View style={styles.subsection}>
                                    <View style={styles.sectionHeaderWithActions}>
                                        <Text style={styles.subsectionTitle}>
                                            Existing Questions ({selectedUserQuestionIds.size} selected)
                                        </Text>
                                        {userQuestions.length > 0 && (
                                            <TouchableOpacity
                                                style={styles.selectAllButton}
                                                onPress={toggleSelectAllUserQuestions}
                                            >
                                                <Text style={styles.selectAllButtonText}>
                                                    {selectedUserQuestionIds.size === userQuestions.length ? 'Deselect All' : 'Select All'}
                                                </Text>
                                            </TouchableOpacity>
                                        )}
                                    </View>
                                    {isLoadingUserQuestions ? (
                                        <View style={styles.loadingContainer}>
                                            <ActivityIndicator size="small" color="#007AFF" />
                                            <Text style={styles.loadingText}>Loading your questions...</Text>
                                        </View>
                                    ) : userQuestions.length === 0 ? (
                                        <Text style={styles.helperText}>No existing questions found</Text>
                                    ) : (
                                        <FlatList
                                            data={userQuestions}
                                            renderItem={renderUserQuestionItem}
                                            keyExtractor={(item) => item.id.toString()}
                                            style={styles.questionsList}
                                            scrollEnabled={false}
                                            showsVerticalScrollIndicator={false}
                                            ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
                                            ListEmptyComponent={() => (
                                                <Text style={styles.helperText}>No questions found</Text>
                                            )}
                                        />
                                    )}
                                </View>

                                {/* New Custom Questions */}
                                <View style={styles.subsection}>
                                    <View style={styles.subsectionHeader}>
                                        <Text style={styles.subsectionTitle}>
                                            New Questions ({validCustomQuestions.length})
                                        </Text>
                                        <TouchableOpacity
                                            style={styles.addButton}
                                            onPress={addNewCustomQuestion}
                                        >
                                            <MaterialCommunityIcons name="plus" size={20} color="#007AFF" />
                                            <Text style={styles.addButtonText}>Add Question</Text>
                                        </TouchableOpacity>
                                    </View>

                                    {newCustomQuestions.map((question, index) => (
                                        <View key={index} style={styles.customQuestionCard}>
                                            <View style={styles.customQuestionHeader}>
                                                <Text style={styles.customQuestionNumber}>Question {index + 1}</Text>
                                                <TouchableOpacity
                                                    style={styles.deleteButton}
                                                    onPress={() => removeCustomQuestion(index)}
                                                >
                                                    <MaterialCommunityIcons name="delete" size={20} color="#FF3B30" />
                                                </TouchableOpacity>
                                            </View>

                                            <TextInput
                                                style={styles.customQuestionInput}
                                                placeholder="Enter question..."
                                                value={question.question}
                                                onChangeText={(text) => updateCustomQuestion(index, 'question', text)}
                                                multiline
                                            />

                                            <TextInput
                                                style={styles.customQuestionInput}
                                                placeholder="Enter answer..."
                                                value={question.answer}
                                                onChangeText={(text) => updateCustomQuestion(index, 'answer', text)}
                                                multiline
                                            />

                                            <TextInput
                                                style={styles.customQuestionInput}
                                                placeholder="Topic (optional)"
                                                value={question.topic}
                                                onChangeText={(text) => updateCustomQuestion(index, 'topic', text)}
                                            />
                                        </View>
                                    ))}
                                </View>
                            </View>
                        )}

                        {/* Basic Info */}
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Basic Information</Text>

                            <TextInput
                                style={styles.input}
                                placeholder="Quest Title"
                                value={title}
                                onChangeText={setTitle}
                            />

                            <TextInput
                                style={[styles.input, styles.textArea]}
                                placeholder="Description"
                                value={description}
                                onChangeText={setDescription}
                                multiline
                                numberOfLines={3}
                            />
                        </View>

                        {/* Team Configuration */}
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Team Configuration</Text>

                            <TextInput
                                style={styles.input}
                                placeholder="Team Name"
                                value={teamName}
                                onChangeText={setTeamName}
                            />

                            <View style={styles.teamMembersContainer}>
                                <View style={styles.subsectionHeader}>
                                    <Text style={styles.subsectionTitle}>Team Members</Text>
                                    <TouchableOpacity
                                        style={styles.addButton}
                                        onPress={addTeamMember}
                                    >
                                        <MaterialCommunityIcons name="plus" size={20} color="#007AFF" />
                                        <Text style={styles.addButtonText}>Add Member</Text>
                                    </TouchableOpacity>
                                </View>

                                {teamMembers.map((member, index) => (
                                    <View key={index} style={styles.teamMemberRow}>
                                        <TextInput
                                            style={[styles.input, styles.teamMemberInput]}
                                            placeholder={`Member ${index + 1} name`}
                                            value={member}
                                            onChangeText={(text) => updateTeamMember(index, text)}
                                        />
                                        {teamMembers.length > 1 && (
                                            <TouchableOpacity
                                                style={styles.deleteButton}
                                                onPress={() => removeTeamMember(index)}
                                            >
                                                <MaterialCommunityIcons name="delete" size={20} color="#FF3B30" />
                                            </TouchableOpacity>
                                        )}
                                    </View>
                                ))}
                            </View>
                        </View>

                        {/* Summary */}
                        <View style={styles.section}>
                            <View style={styles.summaryCard}>
                                <Text style={styles.summaryTitle}>Quest Summary</Text>
                                <Text style={styles.summaryText}>
                                    📝 Questions: {totalSelectedQuestions} selected
                                </Text>
                                <Text style={styles.summaryText}>
                                    ⚡ Difficulty: {difficulty}
                                </Text>
                                <Text style={styles.summaryText}>
                                    👥 Team: {teamName || 'Not specified'}
                                </Text>
                                <Text style={styles.summaryText}>
                                    🔧 Source: {questionSource === 'app' ? 'App Questions' : 'My Questions'}
                                </Text>
                            </View>
                        </View>

                        {/* Create Button */}
                        <TouchableOpacity
                            style={[styles.createButton, (!canCreateQuest || isLoading) && styles.createButtonDisabled]}
                            onPress={handleCreateQuest}
                            disabled={!canCreateQuest || isLoading}
                        >
                            {isLoading ? (
                                <ActivityIndicator size="small" color="#FFF" />
                            ) : (
                                <>
                                    <MaterialCommunityIcons name="plus-circle" size={20} color="#FFF" />
                                    <Text style={styles.createButtonText}>
                                        Create WWW Quest ({totalSelectedQuestions} questions)
                                    </Text>
                                </>
                            )}
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

{/* Basic Info */}
<View style={styles.section}>
    <Text style={styles.sectionTitle}>Basic Information</Text>

    <TextInput
        style={styles.input}
        placeholder="Quest Title"
        value={title}
        onChangeText={setTitle}
    />

    <TextInput
        style={[styles.input, styles.textArea]}
        placeholder="Description"
        value={description}
        onChangeText={setDescription}
        multiline
        numberOfLines={3}
    />
</View>

{/* Team Configuration */}
<View style={styles.section}>
    <Text style={styles.sectionTitle}>Team Configuration</Text>

    <TextInput
        style={styles.input}
        placeholder="Team Name"
        value={teamName}
        onChangeText={setTeamName}
    />

    <View style={styles.teamMembersContainer}>
        <View style={styles.subsectionHeader}>
            <Text style={styles.subsectionTitle}>Team Members</Text>
            <TouchableOpacity
                style={styles.addButton}
                onPress={addTeamMember}
            >
                <MaterialCommunityIcons name="plus" size={20} color="#007AFF" />
                <Text style={styles.addButtonText}>Add Member</Text>
            </TouchableOpacity>
        </View>

        {teamMembers.map((member, index) => (
            <View key={index} style={styles.teamMemberRow}>
                <TextInput
                    style={[styles.input, styles.teamMemberInput]}
                    placeholder={`Member ${index + 1} name`}
                    value={member}
                    onChangeText={(text) => updateTeamMember(index, text)}
                />
                {teamMembers.length > 1 && (
                    <TouchableOpacity
                        style={styles.deleteButton}
                        onPress={() => removeTeamMember(index)}
                    >
                        <MaterialCommunityIcons name="delete" size={20} color="#FF3B30" />
                    </TouchableOpacity>
                )}
            </View>
        ))}
    </View>
</View>

{/* Create Button */}
<TouchableOpacity
    style={[styles.createButton, (!canCreateQuest || isLoading) && styles.createButtonDisabled]}
    onPress={handleCreateQuest}
    disabled={!canCreateQuest || isLoading}
>
    {isLoading ? (
        <ActivityIndicator size="small" color="#FFF" />
    ) : (
        <>
            <MaterialCommunityIcons name="plus-circle" size={20} color="#FFF" />
            <Text style={styles.createButtonText}>Create WWW Quest</Text>
        </>
    )}
</TouchableOpacity>
</View>
</ScrollView>
</KeyboardAvoidingView>
</SafeAreaView>
);
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8F9FA',
    },
    keyboardView: {
        flex: 1,
    },
    scrollView: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        backgroundColor: '#FFF',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E5E7',
    },
    backButton: {
        marginRight: 16,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
    },
    content: {
        padding: 16,
    },
    section: {
        marginBottom: 24,
    },
    subsection: {
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 12,
    },
    subsectionTitle: {
        fontSize: 14,
        fontWeight: '500',
        color: '#666',
        marginBottom: 8,
    },
    subsectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    sectionHeaderWithActions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    selectAllButton: {
        backgroundColor: '#007AFF',
        borderRadius: 6,
        paddingHorizontal: 12,
        paddingVertical: 6,
    },
    selectAllButtonText: {
        color: '#FFF',
        fontSize: 12,
        fontWeight: '500',
    },
    radioGroup: {
        gap: 12,
    },
    radioOption: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    radioSelected: {
        // Add selected styling if needed
    },
    radioText: {
        fontSize: 16,
        color: '#333',
    },
    // Difficulty selection styles
    difficultyContainer: {
        flexDirection: 'row',
        gap: 8,
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
    // Question selection styles
    questionsContainer: {
        backgroundColor: '#FFF',
        borderRadius: 8,
        padding: 16,
        borderWidth: 1,
        borderColor: '#E5E5E7',
    },
    questionsList: {
        maxHeight: 400, // Limit height and make scrollable
    },
    questionItem: {
        backgroundColor: '#FFF',
        borderRadius: 8,
        padding: 12,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: '#E5E5E7',
    },
    questionItemSelected: {
        borderColor: '#007AFF',
        backgroundColor: '#F0F8FF',
    },
    questionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
        gap: 8,
    },
    questionMeta: {
        flexDirection: 'row',
        gap: 8,
        flex: 1,
    },
    questionDifficulty: {
        backgroundColor: '#007AFF',
        color: '#FFF',
        fontSize: 10,
        fontWeight: '600',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
        textTransform: 'uppercase',
    },
    questionTopic: {
        backgroundColor: '#F0F0F0',
        color: '#666',
        fontSize: 10,
        fontWeight: '500',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
    },
    questionText: {
        fontSize: 14,
        fontWeight: '500',
        color: '#333',
        marginBottom: 4,
    },
    answerText: {
        fontSize: 12,
        color: '#666',
        fontStyle: 'italic',
        marginBottom: 4,
    },
    additionalInfo: {
        fontSize: 11,
        color: '#999',
    },
    // Loading and error states
    loadingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
        gap: 8,
    },
    loadingText: {
        fontSize: 14,
        color: '#666',
    },
    errorContainer: {
        alignItems: 'center',
        padding: 20,
    },
    errorText: {
        fontSize: 14,
        color: '#FF3B30',
        marginBottom: 8,
    },
    retryButton: {
        backgroundColor: '#007AFF',
        borderRadius: 6,
        paddingHorizontal: 16,
        paddingVertical: 8,
    },
    retryButtonText: {
        color: '#FFF',
        fontSize: 14,
        fontWeight: '500',
    },
    // Form styles
    input: {
        backgroundColor: '#FFF',
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        borderWidth: 1,
        borderColor: '#E5E5E7',
        marginBottom: 12,
    },
    textArea: {
        height: 80,
        textAlignVertical: 'top',
    },
    // Custom questions styles
    customQuestionCard: {
        backgroundColor: '#FFF',
        borderRadius: 8,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#E5E5E7',
    },
    customQuestionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    customQuestionNumber: {
        fontSize: 14,
        fontWeight: '500',
        color: '#666',
    },
    customQuestionInput: {
        borderWidth: 1,
        borderColor: '#E5E5E7',
        borderRadius: 6,
        padding: 8,
        fontSize: 14,
        marginBottom: 8,
        minHeight: 40,
    },
    // Team members styles
    teamMembersContainer: {
        marginTop: 8,
    },
    teamMemberRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 8,
    },
    teamMemberInput: {
        flex: 1,
        marginBottom: 0,
    },
    // Button styles
    addButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        padding: 8,
    },
    addButtonText: {
        color: '#007AFF',
        fontSize: 14,
        fontWeight: '500',
    },
    deleteButton: {
        padding: 8,
    },
    // Summary card styles
    summaryCard: {
        backgroundColor: '#FFF',
        borderRadius: 8,
        padding: 16,
        borderWidth: 1,
        borderColor: '#E5E5E7',
    },
    summaryTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 8,
    },
    summaryText: {
        fontSize: 14,
        color: '#666',
        marginBottom: 4,
    },
    // Helper text
    helperText: {
        fontSize: 14,
        color: '#666',
        fontStyle: 'italic',
        marginBottom: 8,
    },
    // Create button
    createButton: {
        backgroundColor: '#007AFF',
        borderRadius: 8,
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        marginTop: 24,
    },
    createButtonDisabled: {
        backgroundColor: '#999',
    },
    createButtonText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: '600',
    },
});

export default CreateWWWQuestScreen;