// src/screens/CreateWWWQuestScreen.tsx - COMPLETE FIXED VERSION
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
    const navigation = useNavigation<CreateWWWQuestScreenNavigationProp>();
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
    const [roundTime, setRoundTime] = useState('60');
    const [enableAIHost, setEnableAIHost] = useState(true);

    // Team info state
    const [teamName, setTeamName] = useState('My Quiz Team');
    const [teamMembers, setTeamMembers] = useState<string[]>(['']);

    // Load app questions when needed
    useEffect(() => {
        if (questionSource === 'app') {
            loadAppQuestions();
        }
    }, [questionSource]);

    const loadAppQuestions = async () => {
        try {
            setIsLoadingAppQuestions(true);
            setAppQuestionsError(null);
            // Use the correct method name from QuestionService
            const questions = await QuestionService.fetchRandomQuestions(50);
            setAppQuestions(questions);
        } catch (error) {
            console.error('Error loading app questions:', error);
            setAppQuestionsError('Failed to load questions. Please try again.');
        } finally {
            setIsLoadingAppQuestions(false);
        }
    };

    // Question selection handlers
    const toggleAppQuestionSelection = useCallback((questionId: string) => {
        setSelectedAppQuestionIds(prev => {
            const newSet = new Set(prev);
            if (newSet.has(questionId)) {
                newSet.delete(questionId);
            } else {
                newSet.add(questionId);
            }
            return newSet;
        });
    }, []);

    const toggleUserQuestionSelection = useCallback((questionId: number) => {
        setSelectedUserQuestionIds(prev => {
            const newSet = new Set(prev);
            if (newSet.has(questionId)) {
                newSet.delete(questionId);
            } else {
                newSet.add(questionId);
            }
            return newSet;
        });
    }, []);

    const selectAllAppQuestions = useCallback(() => {
        const allIds = new Set(appQuestions.map(q => q.id));
        setSelectedAppQuestionIds(allIds);
    }, [appQuestions]);

    const deselectAllAppQuestions = useCallback(() => {
        setSelectedAppQuestionIds(new Set());
    }, []);

    const selectAllUserQuestions = useCallback(() => {
        const allIds = new Set(userQuestions.map(q => Number(q.id)));
        setSelectedUserQuestionIds(allIds);
    }, [userQuestions]);

    const deselectAllUserQuestions = useCallback(() => {
        setSelectedUserQuestionIds(new Set());
    }, []);

    // Custom questions handlers
    const addNewCustomQuestion = useCallback(() => {
        setNewCustomQuestions(prev => [...prev, {
            question: '',
            answer: '',
            difficulty: DIFFICULTY_MAPPING[difficulty],
            topic: '',
            additionalInfo: ''
        }]);
    }, [difficulty]);

    const removeCustomQuestion = useCallback((index: number) => {
        setNewCustomQuestions(prev => prev.filter((_, i) => i !== index));
    }, []);

    const updateCustomQuestion = useCallback((index: number, field: keyof CreateQuestionRequest, value: string) => {
        setNewCustomQuestions(prev => prev.map((q, i) =>
            i === index ? { ...q, [field]: value } : q
        ));
    }, []);

    // Team members handlers
    const addTeamMember = useCallback(() => {
        setTeamMembers(prev => [...prev, '']);
    }, []);

    const removeTeamMember = useCallback((index: number) => {
        setTeamMembers(prev => prev.filter((_, i) => i !== index));
    }, []);

    const updateTeamMember = useCallback((index: number, value: string) => {
        setTeamMembers(prev => prev.map((member, i) => i === index ? value : member));
    }, []);

    // Computed values
    const selectedAppQuestions = useMemo(() =>
            appQuestions.filter(q => selectedAppQuestionIds.has(q.id)),
        [appQuestions, selectedAppQuestionIds]
    );

    const validCustomQuestions = useMemo(() =>
            newCustomQuestions.filter(q => q.question.trim() && q.answer.trim()),
        [newCustomQuestions]
    );

    const validTeamMembers = useMemo(() =>
            teamMembers.filter(member => member.trim()),
        [teamMembers]
    );

    const totalSelectedQuestions = questionSource === 'app'
        ? selectedAppQuestions.length + validCustomQuestions.length
        : selectedUserQuestionIds.size + validCustomQuestions.length;

    const canCreateQuest = useMemo(() => {
        return title.trim() &&
            description.trim() &&
            teamName.trim() &&
            validTeamMembers.length > 0 &&
            totalSelectedQuestions >= 5 &&
            parseInt(roundTime) > 0;
    }, [title, description, teamName, validTeamMembers, totalSelectedQuestions, roundTime]);

    // Create quest handler
    const handleCreateQuest = useCallback(async () => {
        if (!canCreateQuest || !user) {
            Alert.alert('Error', 'Please fill in all required fields and select at least 5 questions.');
            return;
        }

        try {
            // Create challenge first
            const challengeRequest: CreateChallengeRequest = {
                title: title.trim(),
                description: description.trim(),
                type: 'QUIZ',
                status: 'ACTIVE',
                visibility: 'PUBLIC',
                frequency: 'ONE_TIME',
                startDate: new Date().toISOString(),
                endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
                reward: reward.trim(),
                verificationMethod: 'QUIZ',
                quizConfig: JSON.stringify({
                    defaultDifficulty: DIFFICULTY_MAPPING[difficulty],
                    defaultRoundTimeSeconds: parseInt(roundTime),
                    defaultTotalRounds: totalSelectedQuestions,
                    enableAiHost: enableAIHost,
                    questionSource: questionSource,
                    allowCustomQuestions: true,
                }),
                verificationDetails: {
                    enableAiHost: enableAIHost,
                    roundTimeSeconds: parseInt(roundTime),
                    difficulty: DIFFICULTY_MAPPING[difficulty],
                    totalRounds: totalSelectedQuestions,
                },
            };

            console.log('Creating challenge:', challengeRequest);
            const result = await createChallenge(challengeRequest).unwrap();

            if (result?.id) {
                console.log('Challenge created successfully:', result.id);

                // Prepare questions data with proper difficulty conversion
                const appQuestionsData: AppQuestionData[] = selectedAppQuestions.map(q => ({
                    question: q.question,
                    answer: q.answer,
                    difficulty: q.difficulty ? DIFFICULTY_MAPPING[q.difficulty] : DIFFICULTY_MAPPING[difficulty],
                    topic: q.topic,
                    additionalInfo: q.additionalInfo,
                    externalId: q.id,
                    source: 'app'
                }));

                // Create session request
                const sessionRequest: EnhancedStartQuizSessionRequest = {
                    challengeId: result.id.toString(),
                    teamName: teamName.trim(),
                    teamMembers: validTeamMembers,
                    difficulty: DIFFICULTY_MAPPING[difficulty],
                    roundTimeSeconds: parseInt(roundTime),
                    totalRounds: totalSelectedQuestions,
                    enableAiHost: enableAIHost,
                    questionSource,
                    ...(questionSource === 'user' && {
                        customQuestionIds: Array.from(selectedUserQuestionIds),
                        newCustomQuestions: validCustomQuestions,
                    }),
                    ...(questionSource === 'app' && {
                        appQuestions: appQuestionsData,
                        newCustomQuestions: validCustomQuestions,
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
        validTeamMembers,
        selectedUserQuestionIds,
        createChallenge,
        startQuizSession,
        navigation,
        user
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
                selectedUserQuestionIds.has(Number(item.id)) && styles.questionItemSelected
            ]}
            onPress={() => toggleUserQuestionSelection(Number(item.id))}
            activeOpacity={0.7}
        >
            <View style={styles.questionHeader}>
                <MaterialCommunityIcons
                    name={selectedUserQuestionIds.has(Number(item.id)) ? 'checkbox-marked' : 'checkbox-blank-outline'}
                    size={24}
                    color={selectedUserQuestionIds.has(Number(item.id)) ? '#007AFF' : '#999'}
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

                <ScrollView
                    style={styles.scrollView}
                    contentContainerStyle={styles.content}
                    showsVerticalScrollIndicator={false}
                >
                    {/* Question Source Selection */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Question Source</Text>
                        <View style={styles.radioGroup}>
                            <TouchableOpacity
                                style={styles.radioOption}
                                onPress={() => setQuestionSource('app')}
                                activeOpacity={0.7}
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
                                activeOpacity={0.7}
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

                    {/* Question Selection */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>
                            Select Questions ({totalSelectedQuestions} selected, min 5)
                        </Text>

                        {questionSource === 'app' && (
                            <View style={styles.questionsContainer}>
                                <View style={styles.sectionHeaderWithActions}>
                                    <Text style={styles.subsectionTitle}>
                                        App Questions ({selectedAppQuestions.length})
                                    </Text>
                                    {appQuestions.length > 0 && (
                                        <TouchableOpacity
                                            style={styles.selectAllButton}
                                            onPress={selectedAppQuestionIds.size === appQuestions.length ?
                                                deselectAllAppQuestions : selectAllAppQuestions}
                                        >
                                            <Text style={styles.selectAllButtonText}>
                                                {selectedAppQuestionIds.size === appQuestions.length ?
                                                    'Deselect All' : 'Select All'}
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
                                        <TouchableOpacity
                                            style={styles.retryButton}
                                            onPress={loadAppQuestions}
                                        >
                                            <Text style={styles.retryButtonText}>Retry</Text>
                                        </TouchableOpacity>
                                    </View>
                                ) : appQuestions.length === 0 ? (
                                    <Text style={styles.helperText}>No questions available</Text>
                                ) : (
                                    <FlatList
                                        data={appQuestions}
                                        renderItem={renderAppQuestionItem}
                                        keyExtractor={(item) => item.id}
                                        style={styles.questionsList}
                                        scrollEnabled={false}
                                        showsVerticalScrollIndicator={false}
                                        ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
                                    />
                                )}
                            </View>
                        )}

                        {questionSource === 'user' && (
                            <View style={styles.questionsContainer}>
                                <View style={styles.sectionHeaderWithActions}>
                                    <Text style={styles.subsectionTitle}>
                                        Your Questions ({selectedUserQuestionIds.size})
                                    </Text>
                                    {userQuestions.length > 0 && (
                                        <TouchableOpacity
                                            style={styles.selectAllButton}
                                            onPress={selectedUserQuestionIds.size === userQuestions.length ?
                                                deselectAllUserQuestions : selectAllUserQuestions}
                                        >
                                            <Text style={styles.selectAllButtonText}>
                                                {selectedUserQuestionIds.size === userQuestions.length ?
                                                    'Deselect All' : 'Select All'}
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
                                    <View style={styles.emptyStateContainer}>
                                        <Text style={styles.helperText}>No existing questions found</Text>
                                        <TouchableOpacity
                                            style={styles.addQuestionsButton}
                                            onPress={() => navigation.navigate('UserQuestions')}
                                        >
                                            <Text style={styles.addQuestionsButtonText}>Create Questions</Text>
                                        </TouchableOpacity>
                                    </View>
                                ) : (
                                    <FlatList
                                        data={userQuestions}
                                        renderItem={renderUserQuestionItem}
                                        keyExtractor={(item) => item.id.toString()}
                                        style={styles.questionsList}
                                        scrollEnabled={false}
                                        showsVerticalScrollIndicator={false}
                                        ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
                                    />
                                )}
                            </View>
                        )}

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
                                    <MaterialCommunityIcons name="plus" size={16} color="#007AFF" />
                                    <Text style={styles.addButtonText}>Add Question</Text>
                                </TouchableOpacity>
                            </View>

                            {newCustomQuestions.length === 0 ? (
                                <Text style={styles.helperText}>No new questions added</Text>
                            ) : (
                                <View>
                                    {newCustomQuestions.map((question, index) => (
                                        <View key={index} style={styles.customQuestionContainer}>
                                            <View style={styles.customQuestionHeader}>
                                                <Text style={styles.customQuestionNumber}>
                                                    Question {index + 1}
                                                </Text>
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
                            )}
                        </View>
                    </View>

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

                        <TextInput
                            style={styles.input}
                            placeholder="Reward"
                            value={reward}
                            onChangeText={setReward}
                        />
                    </View>

                    {/* Game Settings */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Game Settings</Text>

                        <View style={styles.subsection}>
                            <Text style={styles.subsectionTitle}>Difficulty</Text>
                            <View style={styles.difficultyContainer}>
                                {(['Easy', 'Medium', 'Hard'] as UIDifficulty[]).map((level) => (
                                    <TouchableOpacity
                                        key={level}
                                        style={[
                                            styles.difficultyButton,
                                            difficulty === level && styles.difficultyButtonSelected
                                        ]}
                                        onPress={() => setDifficulty(level)}
                                    >
                                        <Text style={[
                                            styles.difficultyButtonText,
                                            difficulty === level && styles.difficultyButtonTextSelected
                                        ]}>
                                            {level}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>

                        <View style={styles.subsection}>
                            <Text style={styles.subsectionTitle}>Round Time (seconds)</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="60"
                                value={roundTime}
                                onChangeText={setRoundTime}
                                keyboardType="numeric"
                            />
                        </View>

                        <TouchableOpacity
                            style={styles.radioOption}
                            onPress={() => setEnableAIHost(!enableAIHost)}
                            activeOpacity={0.7}
                        >
                            <MaterialCommunityIcons
                                name={enableAIHost ? 'checkbox-marked' : 'checkbox-blank-outline'}
                                size={24}
                                color="#007AFF"
                            />
                            <Text style={styles.radioText}>Enable AI Host</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Team Info */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Team Information</Text>

                        <TextInput
                            style={styles.input}
                            placeholder="Team Name"
                            value={teamName}
                            onChangeText={setTeamName}
                        />

                        <View style={styles.subsection}>
                            <View style={styles.subsectionHeader}>
                                <Text style={styles.subsectionTitle}>Team Members</Text>
                                <TouchableOpacity
                                    style={styles.addButton}
                                    onPress={addTeamMember}
                                >
                                    <MaterialCommunityIcons name="plus" size={16} color="#007AFF" />
                                    <Text style={styles.addButtonText}>Add Member</Text>
                                </TouchableOpacity>
                            </View>

                            <View style={styles.teamMembersContainer}>
                                {teamMembers.map((member, index) => (
                                    <View key={index} style={styles.teamMemberRow}>
                                        <TextInput
                                            style={[styles.input, styles.teamMemberInput]}
                                            placeholder={`Team member ${index + 1}`}
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
                    </View>

                    {/* Summary */}
                    <View style={styles.section}>
                        <View style={styles.summaryCard}>
                            <Text style={styles.summaryTitle}>Quest Summary</Text>
                            <Text style={styles.summaryText}>Title: {title || 'Not set'}</Text>
                            <Text style={styles.summaryText}>Questions: {totalSelectedQuestions}</Text>
                            <Text style={styles.summaryText}>Difficulty: {difficulty}</Text>
                            <Text style={styles.summaryText}>Round Time: {roundTime}s</Text>
                            <Text style={styles.summaryText}>Team: {teamName || 'Not set'}</Text>
                            <Text style={styles.summaryText}>Members: {validTeamMembers.length}</Text>
                        </View>
                    </View>

                    {/* Create Button */}
                    <View style={styles.section}>
                        <TouchableOpacity
                            style={[
                                styles.createButton,
                                (!canCreateQuest || isLoading) && styles.createButtonDisabled
                            ]}
                            onPress={handleCreateQuest}
                            disabled={!canCreateQuest || isLoading}
                            activeOpacity={0.8}
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
    radioText: {
        fontSize: 16,
        color: '#333',
    },
    // Input styles
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
        backgroundColor: '#28A745',
        color: '#FFF',
        fontSize: 10,
        fontWeight: '600',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
    },
    questionText: {
        fontSize: 14,
        color: '#333',
        marginBottom: 4,
        fontWeight: '500',
    },
    answerText: {
        fontSize: 12,
        color: '#666',
        fontStyle: 'italic',
    },
    additionalInfo: {
        fontSize: 12,
        color: '#999',
        marginTop: 4,
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
        textAlign: 'center',
        marginBottom: 8,
    },
    retryButton: {
        backgroundColor: '#007AFF',
        borderRadius: 6,
        paddingHorizontal: 12,
        paddingVertical: 6,
    },
    retryButtonText: {
        color: '#FFF',
        fontSize: 12,
        fontWeight: '500',
    },
    emptyStateContainer: {
        alignItems: 'center',
        padding: 20,
    },
    addQuestionsButton: {
        backgroundColor: '#28A745',
        borderRadius: 6,
        paddingHorizontal: 12,
        paddingVertical: 8,
        marginTop: 8,
    },
    addQuestionsButtonText: {
        color: '#FFF',
        fontSize: 14,
        fontWeight: '500',
    },
    // Custom questions styles
    customQuestionContainer: {
        backgroundColor: '#FFF',
        borderRadius: 8,
        padding: 12,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#E5E5E7',
    },
    customQuestionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
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