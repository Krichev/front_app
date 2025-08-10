// src/screens/CreateWWWQuestScreen.tsx - Enhanced with comprehensive question saving
import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {
    ActivityIndicator,
    Alert,
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
// Note: Make sure your backend StartQuizSessionRequest.java includes these new fields:
// - newCustomQuestions?: CreateQuestionRequest[]
// - appQuestions?: AppQuestionData[]
interface EnhancedStartQuizSessionRequest {
    challengeId: string;  // Changed to match existing API
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

    // App questions state (using existing QuestionService)
    const [appQuestions, setAppQuestions] = useState<QuestionData[]>([]);
    const [isLoadingAppQuestions, setIsLoadingAppQuestions] = useState(false);
    const [appQuestionsError, setAppQuestionsError] = useState<string | null>(null);

    // Enhanced question state for saving
    const [selectedAppQuestions, setSelectedAppQuestions] = useState<QuestionData[]>([]);
    const [newCustomQuestions, setNewCustomQuestions] = useState<CreateQuestionRequest[]>([]);

    // Form state - Using UI-friendly difficulty type
    const [title, setTitle] = useState('What? Where? When? Quiz');
    const [description, setDescription] = useState('Test your knowledge in this team-based quiz game.');
    const [reward, setReward] = useState('Points and bragging rights!');
    const [difficulty, setDifficulty] = useState<UIDifficulty>('Medium');
    const [selectedUserQuestions, setSelectedUserQuestions] = useState<number[]>([]);
    const [teamName, setTeamName] = useState('Team Intellect');
    const [teamMembers, setTeamMembers] = useState<string[]>(['Player 1', 'Player 2']);
    const [roundTime, setRoundTime] = useState(60);
    const [roundCount, setRoundCount] = useState(10);
    const [enableAIHost, setEnableAIHost] = useState(true);

    // Load app questions when source changes
    const loadAppQuestions = useCallback(async () => {
        if (questionSource !== 'app') return;

        setIsLoadingAppQuestions(true);
        setAppQuestionsError(null);

        try {
            const questions = await QuestionService.getQuestionsByDifficulty(difficulty);
            setAppQuestions(questions);
            console.log(`Loaded ${questions.length} app questions for difficulty: ${difficulty}`);
        } catch (error) {
            console.error('Error loading app questions:', error);
            setAppQuestionsError('Failed to load app questions. Please try again.');
        } finally {
            setIsLoadingAppQuestions(false);
        }
    }, [questionSource, difficulty]);

    useEffect(() => {
        loadAppQuestions();
    }, [loadAppQuestions]);

    // Enhanced question selection handlers
    const handleAppQuestionSelect = useCallback((question: QuestionData) => {
        setSelectedAppQuestions(prev => {
            const exists = prev.find(q => q.id === question.id);
            if (exists) {
                return prev.filter(q => q.id !== question.id);
            } else {
                return [...prev, question];
            }
        });
    }, []);

    const handleUserQuestionSelect = useCallback((questionId: number) => {
        setSelectedUserQuestions(prev => {
            if (prev.includes(questionId)) {
                return prev.filter(id => id !== questionId);
            } else {
                return [...prev, questionId];
            }
        });
    }, []);

    // Custom question management
    const addNewCustomQuestion = useCallback(() => {
        const newQuestion: CreateQuestionRequest = {
            question: '',
            answer: '',
            difficulty: DIFFICULTY_MAPPING[difficulty],
            topic: '',
            additionalInfo: '',
        };
        setNewCustomQuestions(prev => [...prev, newQuestion]);
    }, [difficulty]);

    const updateCustomQuestion = useCallback((index: number, field: keyof CreateQuestionRequest, value: string) => {
        setNewCustomQuestions(prev =>
            prev.map((q, i) =>
                i === index ? { ...q, [field]: value } : q
            )
        );
    }, []);

    const removeCustomQuestion = useCallback((index: number) => {
        setNewCustomQuestions(prev => prev.filter((_, i) => i !== index));
    }, []);

    // Team member management (keeping existing functionality)
    const addTeamMember = useCallback(() => {
        setTeamMembers(prev => [...prev, `Player ${prev.length + 1}`]);
    }, []);

    const updateTeamMember = useCallback((index: number, value: string) => {
        setTeamMembers(prev =>
            prev.map((member, i) => i === index ? value : member)
        );
    }, []);

    const removeTeamMember = useCallback((index: number) => {
        if (teamMembers.length > 1) {
            setTeamMembers(prev => prev.filter((_, i) => i !== index));
        }
    }, [teamMembers.length]);

    // Enhanced form submission with comprehensive question saving
    const handleSubmit = useCallback(async () => {
        // Enhanced validation
        if (!title.trim()) {
            Alert.alert('Error', 'Please enter a quest title');
            return;
        }

        if (teamMembers.some(member => !member.trim())) {
            Alert.alert('Error', 'All team members must have names');
            return;
        }

        // Question validation
        if (questionSource === 'user') {
            const totalUserQuestions = selectedUserQuestions.length + newCustomQuestions.filter(q => q.question.trim() && q.answer.trim()).length;
            if (totalUserQuestions === 0) {
                Alert.alert('Error', 'Please select existing questions or create new ones');
                return;
            }
        } else if (questionSource === 'app') {
            if (selectedAppQuestions.length === 0) {
                Alert.alert('Error', 'Please select at least one app question');
                return;
            }
        }

        // Validate custom questions
        for (const customQ of newCustomQuestions) {
            if (customQ.question.trim() && !customQ.answer.trim()) {
                Alert.alert('Error', 'All custom questions must have both question and answer');
                return;
            }
        }

        try {
            console.log('Creating WWW quest with enhanced question saving...');

            // Create challenge with proper structure matching CreateChallengeRequest
            const apiDifficulty = DIFFICULTY_MAPPING[difficulty];

            // Create quiz configuration object
            const quizConfig = {
                gameType: 'WWW',
                teamName: teamName.trim(),
                teamMembers: teamMembers.map(m => m.trim()),
                difficulty: difficulty,
                roundTime,
                roundCount: questionSource === 'user' ? selectedUserQuestions.length + newCustomQuestions.length : selectedAppQuestions.length,
                enableAIHost,
                teamBased: true,
                questionSource,
                selectedUserQuestions: questionSource === 'user' ? selectedUserQuestions : [],
                selectedAppQuestions: questionSource === 'app' ? selectedAppQuestions.map(q => q.id) : [],
                appQuestionsDifficulty: questionSource === 'app' ? difficulty : null
            };

            const challengeData: CreateChallengeRequest = {
                title: title.trim(),
                description: description.trim(),
                reward: reward.trim(),
                type: 'QUIZ',
                visibility: 'PUBLIC' as ChallengeVisibility,
                status: 'OPEN' as ChallengeStatus,
                quizConfig: JSON.stringify(quizConfig)
            };

            console.log('Creating challenge...', challengeData);
            const result = await createChallenge(challengeData).unwrap();

            if (result?.id) {
                // Enhanced session request with comprehensive question data
                const appQuestionsData: AppQuestionData[] = selectedAppQuestions.map(q => ({
                    question: q.question,
                    answer: q.answer,
                    difficulty: DIFFICULTY_MAPPING[q.difficulty as UIDifficulty] || apiDifficulty,
                    topic: q.topic,
                    additionalInfo: q.additionalInfo || '',
                    externalId: q.id,
                    source: q.source || 'APP_GENERATED',
                }));

                // Filter valid custom questions
                const validCustomQuestions: CreateQuestionRequest[] = newCustomQuestions.filter(q =>
                    q.question.trim() && q.answer.trim()
                );

                // Calculate total rounds based on selected questions
                const totalQuestions = questionSource === 'app'
                    ? selectedAppQuestions.length
                    : selectedUserQuestions.length + validCustomQuestions.length;

                // Enhanced session request with comprehensive question data
                const sessionRequest = {
                    challengeId: result.id.toString(),  // Convert to string to match API
                    teamName: teamName.trim(),
                    teamMembers: teamMembers.map(m => m.trim()),
                    difficulty: apiDifficulty,
                    roundTimeSeconds: roundTime,
                    totalRounds: Math.max(totalQuestions, 1),
                    enableAiHost: enableAIHost,
                    questionSource,
                    ...(questionSource === 'user' && {
                        customQuestionIds: selectedUserQuestions,
                        newCustomQuestions: validCustomQuestions,
                    }),
                    ...(questionSource === 'app' && {
                        appQuestions: appQuestionsData,
                    }),
                } as any; // Temporary type assertion until backend DTO is updated

                console.log('Starting quiz session with question saving:', {
                    questionSource,
                    appQuestions: appQuestionsData.length,
                    userQuestions: selectedUserQuestions.length,
                    newQuestions: validCustomQuestions.length,
                    totalRounds: sessionRequest.totalRounds,
                });

                // Note: Make sure your backend StartQuizSessionRequest.java includes:
                // - newCustomQuestions?: List<CreateQuestionRequest>
                // - appQuestions?: List<AppQuestionData>
                const sessionResult = await startQuizSession(sessionRequest).unwrap();

                if (sessionResult?.id) {
                    console.log('Quiz session created successfully:', {
                        sessionId: sessionResult.id,
                        challengeId: result.id,
                        questionsCount: sessionResult.totalRounds,
                    });

                    Alert.alert(
                        'Success',
                        `WWW Quiz created with ${sessionResult.totalRounds} questions saved!`,
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
            const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
            Alert.alert('Error', `Failed to create quest: ${errorMessage}`);
        }
    }, [
        title,
        description,
        reward,
        difficulty,
        questionSource,
        selectedUserQuestions,
        selectedAppQuestions,
        newCustomQuestions,
        teamName,
        teamMembers,
        roundTime,
        roundCount,
        enableAIHost,
        createChallenge,
        startQuizSession,
        navigation
    ]);

    // Enhanced form validation
    const isFormValid = useMemo(() => {
        const hasTitle = title.trim() !== '';
        const hasTeamMembers = teamMembers.length > 0 && teamMembers.every(member => member.trim() !== '');

        let hasQuestions = false;
        if (questionSource === 'user') {
            const validCustomQuestions = newCustomQuestions.filter(q => q.question.trim() && q.answer.trim()).length;
            hasQuestions = selectedUserQuestions.length > 0 || validCustomQuestions > 0;
        } else {
            hasQuestions = selectedAppQuestions.length > 0;
        }

        return hasTitle && hasTeamMembers && hasQuestions;
    }, [title, teamMembers, questionSource, selectedUserQuestions.length, selectedAppQuestions.length, newCustomQuestions]);

    const isLoading = isCreatingChallenge || isStartingSession;

    // Render functions for questions
    const renderAppQuestionItem = (question: QuestionData) => {
        const isSelected = selectedAppQuestions.some(q => q.id === question.id);

        return (
            <TouchableOpacity
                key={question.id}
                style={[styles.questionItem, isSelected && styles.selectedQuestion]}
                onPress={() => handleAppQuestionSelect(question)}
            >
                <View style={styles.questionHeader}>
                    <View style={styles.questionMeta}>
                        <Text style={styles.difficultyBadge}>{question.difficulty}</Text>
                        {question.topic && (
                            <Text style={styles.topicBadge}>{question.topic}</Text>
                        )}
                        <Text style={styles.sourceBadge}>App</Text>
                    </View>
                    <MaterialCommunityIcons
                        name={isSelected ? 'checkbox-marked' : 'checkbox-blank-outline'}
                        size={24}
                        color={isSelected ? '#4CAF50' : '#666'}
                    />
                </View>
                <Text style={styles.questionText} numberOfLines={2}>
                    {question.question}
                </Text>
                <Text style={styles.answerText} numberOfLines={1}>
                    Answer: {question.answer}
                </Text>
            </TouchableOpacity>
        );
    };

    const renderUserQuestionItem = (question: any) => {
        const isSelected = selectedUserQuestions.includes(question.id);

        return (
            <TouchableOpacity
                key={question.id}
                style={[styles.questionItem, isSelected && styles.selectedQuestion]}
                onPress={() => handleUserQuestionSelect(question.id)}
            >
                <View style={styles.questionHeader}>
                    <View style={styles.questionMeta}>
                        <Text style={styles.difficultyBadge}>{question.difficulty}</Text>
                        {question.topic && (
                            <Text style={styles.topicBadge}>{question.topic}</Text>
                        )}
                        <Text style={styles.userCreatedBadge}>User</Text>
                    </View>
                    <MaterialCommunityIcons
                        name={isSelected ? 'checkbox-marked' : 'checkbox-blank-outline'}
                        size={24}
                        color={isSelected ? '#4CAF50' : '#666'}
                    />
                </View>
                <Text style={styles.questionText} numberOfLines={2}>
                    {question.question}
                </Text>
                <Text style={styles.answerText} numberOfLines={1}>
                    Answer: {question.answer}
                </Text>
            </TouchableOpacity>
        );
    };

    const renderCustomQuestionForm = (question: CreateQuestionRequest, index: number) => (
        <View key={index} style={styles.customQuestionForm}>
            <View style={styles.customQuestionHeader}>
                <Text style={styles.customQuestionTitle}>New Question {index + 1}</Text>
                <TouchableOpacity
                    onPress={() => removeCustomQuestion(index)}
                    style={styles.removeButton}
                >
                    <MaterialCommunityIcons name="close" size={20} color="#f44336" />
                </TouchableOpacity>
            </View>

            <TextInput
                style={styles.questionInput}
                placeholder="Enter question..."
                value={question.question}
                onChangeText={(text) => updateCustomQuestion(index, 'question', text)}
                multiline
            />

            <TextInput
                style={styles.questionInput}
                placeholder="Enter answer..."
                value={question.answer}
                onChangeText={(text) => updateCustomQuestion(index, 'answer', text)}
                multiline
            />

            <TextInput
                style={styles.questionInput}
                placeholder="Topic (optional)..."
                value={question.topic || ''}
                onChangeText={(text) => updateCustomQuestion(index, 'topic', text)}
            />
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView
                style={styles.keyboardAvoid}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
                <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                    <View style={styles.content}>
                        {/* Header */}
                        <View style={styles.header}>
                            <Text style={styles.title}>Create WWW Quest</Text>
                            <Text style={styles.subtitle}>Set up your What? Where? When? quiz challenge</Text>
                        </View>

                        {/* Basic Info Section */}
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Quest Information</Text>

                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Title</Text>
                                <TextInput
                                    style={styles.input}
                                    value={title}
                                    onChangeText={setTitle}
                                    placeholder="Enter quest title"
                                    maxLength={100}
                                />
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Description</Text>
                                <TextInput
                                    style={[styles.input, styles.textArea]}
                                    value={description}
                                    onChangeText={setDescription}
                                    placeholder="Describe your quest"
                                    multiline
                                    numberOfLines={3}
                                    maxLength={500}
                                />
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Reward</Text>
                                <TextInput
                                    style={styles.input}
                                    value={reward}
                                    onChangeText={setReward}
                                    placeholder="What do participants get?"
                                    maxLength={200}
                                />
                            </View>
                        </View>

                        {/* Team Setup */}
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Team Setup</Text>

                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Team Name</Text>
                                <TextInput
                                    style={styles.input}
                                    value={teamName}
                                    onChangeText={setTeamName}
                                    placeholder="Enter team name"
                                    maxLength={50}
                                />
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Team Members</Text>
                                {teamMembers.map((member, index) => (
                                    <View key={index} style={styles.teamMemberRow}>
                                        <TextInput
                                            style={[styles.input, styles.memberInput]}
                                            value={member}
                                            onChangeText={(text) => updateTeamMember(index, text)}
                                            placeholder={`Member ${index + 1}`}
                                            maxLength={50}
                                        />
                                        {teamMembers.length > 1 && (
                                            <TouchableOpacity
                                                onPress={() => removeTeamMember(index)}
                                                style={styles.removeButton}
                                            >
                                                <MaterialCommunityIcons name="minus-circle" size={24} color="#f44336" />
                                            </TouchableOpacity>
                                        )}
                                    </View>
                                ))}
                                <TouchableOpacity onPress={addTeamMember} style={styles.addButton}>
                                    <MaterialCommunityIcons name="plus-circle" size={20} color="#4CAF50" />
                                    <Text style={styles.addButtonText}>Add Team Member</Text>
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* Game Settings */}
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Game Settings</Text>

                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Difficulty</Text>
                                <View style={styles.difficultySelector}>
                                    {(['Easy', 'Medium', 'Hard'] as const).map((level) => (
                                        <TouchableOpacity
                                            key={level}
                                            style={[
                                                styles.difficultyOption,
                                                difficulty === level && styles.difficultyOptionSelected
                                            ]}
                                            onPress={() => setDifficulty(level)}
                                        >
                                            <Text style={[
                                                styles.difficultyText,
                                                difficulty === level && styles.difficultyTextSelected
                                            ]}>
                                                {level}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Round Time: {roundTime} seconds</Text>
                                <View style={styles.sliderContainer}>
                                    <TouchableOpacity
                                        onPress={() => setRoundTime(Math.max(30, roundTime - 15))}
                                        style={styles.sliderButton}
                                    >
                                        <MaterialCommunityIcons name="minus" size={20} color="#4CAF50" />
                                    </TouchableOpacity>
                                    <Text style={styles.sliderValue}>{roundTime}s</Text>
                                    <TouchableOpacity
                                        onPress={() => setRoundTime(Math.min(300, roundTime + 15))}
                                        style={styles.sliderButton}
                                    >
                                        <MaterialCommunityIcons name="plus" size={20} color="#4CAF50" />
                                    </TouchableOpacity>
                                </View>
                            </View>

                            <View style={styles.inputGroup}>
                                <TouchableOpacity
                                    style={styles.toggleRow}
                                    onPress={() => setEnableAIHost(!enableAIHost)}
                                >
                                    <Text style={styles.label}>AI Host</Text>
                                    <MaterialCommunityIcons
                                        name={enableAIHost ? 'toggle-switch' : 'toggle-switch-off'}
                                        size={32}
                                        color={enableAIHost ? '#4CAF50' : '#ccc'}
                                    />
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* Question Source Selection */}
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Question Source</Text>
                            <View style={styles.sourceSelector}>
                                <TouchableOpacity
                                    style={[
                                        styles.sourceOption,
                                        questionSource === 'app' && styles.sourceOptionSelected
                                    ]}
                                    onPress={() => setQuestionSource('app')}
                                >
                                    <MaterialCommunityIcons
                                        name="database"
                                        size={24}
                                        color={questionSource === 'app' ? '#4CAF50' : '#666'}
                                    />
                                    <Text style={[
                                        styles.sourceText,
                                        questionSource === 'app' && styles.sourceTextSelected
                                    ]}>
                                        App Questions
                                    </Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={[
                                        styles.sourceOption,
                                        questionSource === 'user' && styles.sourceOptionSelected
                                    ]}
                                    onPress={() => setQuestionSource('user')}
                                >
                                    <MaterialCommunityIcons
                                        name="account-edit"
                                        size={24}
                                        color={questionSource === 'user' ? '#4CAF50' : '#666'}
                                    />
                                    <Text style={[
                                        styles.sourceText,
                                        questionSource === 'user' && styles.sourceTextSelected
                                    ]}>
                                        My Questions
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* App Questions */}
                        {questionSource === 'app' && (
                            <View style={styles.section}>
                                <Text style={styles.sectionTitle}>
                                    Select App Questions ({selectedAppQuestions.length} selected)
                                </Text>

                                {isLoadingAppQuestions ? (
                                    <View style={styles.loadingContainer}>
                                        <ActivityIndicator size="small" color="#4CAF50" />
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
                                ) : (
                                    <View style={styles.questionsList}>
                                        {appQuestions.map(renderAppQuestionItem)}
                                    </View>
                                )}
                            </View>
                        )}

                        {/* User Questions */}
                        {questionSource === 'user' && (
                            <View style={styles.section}>
                                <Text style={styles.sectionTitle}>
                                    My Questions ({selectedUserQuestions.length} selected)
                                </Text>

                                {isLoadingUserQuestions ? (
                                    <View style={styles.loadingContainer}>
                                        <ActivityIndicator size="small" color="#4CAF50" />
                                        <Text style={styles.loadingText}>Loading questions...</Text>
                                    </View>
                                ) : (
                                    <>
                                        <View style={styles.questionsList}>
                                            {userQuestions.map(renderUserQuestionItem)}
                                        </View>

                                        {/* Custom Questions Creation */}
                                        <View style={styles.customQuestionsSection}>
                                            <View style={styles.customQuestionsHeader}>
                                                <Text style={styles.sectionTitle}>
                                                    Create New Questions ({newCustomQuestions.length})
                                                </Text>
                                                <TouchableOpacity onPress={addNewCustomQuestion} style={styles.addButton}>
                                                    <MaterialCommunityIcons name="plus-circle" size={20} color="#4CAF50" />
                                                    <Text style={styles.addButtonText}>Add Question</Text>
                                                </TouchableOpacity>
                                            </View>

                                            {newCustomQuestions.map((question, index) =>
                                                renderCustomQuestionForm(question, index)
                                            )}
                                        </View>
                                    </>
                                )}
                            </View>
                        )}

                        {/* Submit Button */}
                        <View style={styles.submitSection}>
                            <TouchableOpacity
                                style={[
                                    styles.submitButton,
                                    (!isFormValid || isLoading) && styles.submitButtonDisabled
                                ]}
                                onPress={handleSubmit}
                                disabled={!isFormValid || isLoading}
                            >
                                {isLoading ? (
                                    <View style={styles.submitButtonContent}>
                                        <ActivityIndicator size="small" color="white" />
                                        <Text style={styles.submitButtonText}>Creating & Saving Questions...</Text>
                                    </View>
                                ) : (
                                    <Text style={styles.submitButtonText}>Create WWW Quest</Text>
                                )}
                            </TouchableOpacity>

                            {!isFormValid && (
                                <Text style={styles.validationText}>
                                    {!title.trim() ? 'Title required' :
                                        !teamMembers.every(m => m.trim()) ? 'Team member names required' :
                                            questionSource === 'app' && selectedAppQuestions.length === 0 ? 'Select app questions' :
                                                questionSource === 'user' && selectedUserQuestions.length === 0 && newCustomQuestions.filter(q => q.question.trim() && q.answer.trim()).length === 0 ? 'Select or create questions' :
                                                    'Complete all required fields'}
                                </Text>
                            )}
                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    keyboardAvoid: {
        flex: 1,
    },
    scrollView: {
        flex: 1,
    },
    content: {
        padding: 16,
    },
    header: {
        marginBottom: 24,
        alignItems: 'center',
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
    },
    section: {
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 3.84,
        elevation: 5,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 16,
    },
    inputGroup: {
        marginBottom: 16,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
        marginBottom: 8,
    },
    input: {
        backgroundColor: '#f8f9fa',
        borderWidth: 1,
        borderColor: '#e9ecef',
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        color: '#333',
    },
    textArea: {
        height: 80,
        textAlignVertical: 'top',
    },
    teamMemberRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    memberInput: {
        flex: 1,
        marginRight: 8,
        marginBottom: 0,
    },
    difficultySelector: {
        flexDirection: 'row',
        borderRadius: 8,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#e9ecef',
    },
    difficultyOption: {
        flex: 1,
        paddingVertical: 12,
        alignItems: 'center',
        backgroundColor: '#f8f9fa',
    },
    difficultyOptionSelected: {
        backgroundColor: '#4CAF50',
    },
    difficultyText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#666',
    },
    difficultyTextSelected: {
        color: 'white',
    },
    sliderContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f8f9fa',
        borderRadius: 8,
        padding: 8,
    },
    sliderButton: {
        backgroundColor: 'white',
        borderRadius: 20,
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 1,
        },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    sliderValue: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginHorizontal: 32,
        minWidth: 50,
        textAlign: 'center',
    },
    toggleRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#f8f9fa',
        borderRadius: 8,
        padding: 12,
    },
    sourceSelector: {
        flexDirection: 'row',
        gap: 12,
    },
    sourceOption: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        borderWidth: 1,
        borderColor: '#e9ecef',
        borderRadius: 8,
        backgroundColor: '#f8f9fa',
    },
    sourceOptionSelected: {
        borderColor: '#4CAF50',
        backgroundColor: '#e8f5e8',
    },
    sourceText: {
        marginLeft: 8,
        fontSize: 14,
        fontWeight: '600',
        color: '#666',
    },
    sourceTextSelected: {
        color: '#4CAF50',
    },
    questionsList: {
        gap: 8,
    },
    questionItem: {
        backgroundColor: '#f8f9fa',
        borderWidth: 1,
        borderColor: '#e9ecef',
        borderRadius: 8,
        padding: 12,
    },
    selectedQuestion: {
        borderColor: '#4CAF50',
        backgroundColor: '#e8f5e8',
    },
    questionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    questionMeta: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    difficultyBadge: {
        backgroundColor: '#6c757d',
        color: 'white',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
        fontSize: 10,
        fontWeight: '600',
        marginRight: 4,
    },
    topicBadge: {
        backgroundColor: '#007bff',
        color: 'white',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
        fontSize: 10,
        fontWeight: '600',
        marginRight: 4,
    },
    sourceBadge: {
        backgroundColor: '#28a745',
        color: 'white',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
        fontSize: 10,
        fontWeight: '600',
    },
    userCreatedBadge: {
        backgroundColor: '#6f42c1',
        color: 'white',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
        fontSize: 10,
        fontWeight: '600',
    },
    questionText: {
        fontSize: 14,
        color: '#333',
        marginBottom: 4,
        lineHeight: 20,
    },
    answerText: {
        fontSize: 12,
        color: '#666',
        fontStyle: 'italic',
    },
    customQuestionsSection: {
        marginTop: 16,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: '#e9ecef',
    },
    customQuestionsHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    customQuestionForm: {
        backgroundColor: '#e8f4fd',
        borderRadius: 8,
        padding: 12,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#bee5eb',
    },
    customQuestionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    customQuestionTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
    },
    questionInput: {
        backgroundColor: 'white',
        borderWidth: 1,
        borderColor: '#e9ecef',
        borderRadius: 6,
        padding: 8,
        fontSize: 14,
        marginBottom: 8,
    },
    addButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 8,
    },
    addButtonText: {
        marginLeft: 4,
        fontSize: 14,
        fontWeight: '600',
        color: '#4CAF50',
    },
    removeButton: {
        padding: 4,
    },
    loadingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 32,
    },
    loadingText: {
        marginLeft: 8,
        fontSize: 14,
        color: '#666',
    },
    errorContainer: {
        alignItems: 'center',
        padding: 24,
    },
    errorText: {
        fontSize: 14,
        color: '#dc3545',
        textAlign: 'center',
        marginBottom: 12,
    },
    retryButton: {
        backgroundColor: '#4CAF50',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 6,
    },
    retryButtonText: {
        color: 'white',
        fontSize: 14,
        fontWeight: '600',
    },
    submitSection: {
        marginTop: 24,
        marginBottom: 32,
    },
    submitButton: {
        backgroundColor: '#4CAF50',
        borderRadius: 12,
        paddingVertical: 16,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 3.84,
        elevation: 5,
    },
    submitButtonDisabled: {
        backgroundColor: '#ccc',
        shadowOpacity: 0,
        elevation: 0,
    },
    submitButtonContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    submitButtonText: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
        marginLeft: 8,
    },
    validationText: {
        fontSize: 12,
        color: '#dc3545',
        textAlign: 'center',
        marginTop: 8,
    },
});

export default CreateWWWQuestScreen;