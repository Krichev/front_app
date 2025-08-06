// src/screens/CreateWWWQuestScreen.tsx - FIXED: Type errors and API compatibility
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

// FIXED: API Difficulty type mapping
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

    // App questions state (using old QuestionService)
    const [appQuestions, setAppQuestions] = useState<QuestionData[]>([]);
    const [isLoadingAppQuestions, setIsLoadingAppQuestions] = useState(false);
    const [appQuestionsError, setAppQuestionsError] = useState<string | null>(null);

    // Form state - FIXED: Using UI-friendly difficulty type
    const [title, setTitle] = useState('What? Where? When? Quiz');
    const [description, setDescription] = useState('Test your knowledge in this team-based quiz game.');
    const [reward, setReward] = useState('100 points');
    const [teamName, setTeamName] = useState('Team Intellect');
    const [teamMembers, setTeamMembers] = useState<string[]>(() => [user?.name || 'Player 1']);
    const [newMember, setNewMember] = useState('');
    const [difficulty, setDifficulty] = useState<UIDifficulty>('Medium'); // FIXED: UI type
    const [roundTime, setRoundTime] = useState(60);
    const [roundCount, setRoundCount] = useState(10);
    const [enableAIHost, setEnableAIHost] = useState<boolean>(true);
    const [selectedUserQuestions, setSelectedUserQuestions] = useState<string[]>([]);

    // FIXED: Memoized function to load app questions with proper difficulty mapping
    const loadAppQuestions = useCallback(async () => {
        setIsLoadingAppQuestions(true);
        setAppQuestionsError(null);

        try {
            console.log(`Loading ${difficulty} questions for ${roundCount} rounds...`);
            const questions = await QuestionService.getQuestionsByDifficulty(
                difficulty, // Use UI difficulty for QuestionService (if it accepts UI format)
                roundCount * 2 // Get more questions than needed
            );
            console.log(`Loaded ${questions.length} questions successfully`);
            setAppQuestions(questions);
        } catch (error) {
            console.error('Error loading app questions:', error);
            setAppQuestionsError('Failed to load questions');
            setAppQuestions([]);
        } finally {
            setIsLoadingAppQuestions(false);
        }
    }, [difficulty, roundCount]);

    // Load app questions when difficulty changes and source is 'app'
    useEffect(() => {
        if (questionSource === 'app') {
            loadAppQuestions();
        }
    }, [questionSource, loadAppQuestions]);

    // Auto-select user questions when source changes - prevent infinite loops
    useEffect(() => {
        if (questionSource === 'user' && userQuestions.length > 0) {
            // Auto-select up to roundCount questions
            const autoSelected = userQuestions
                .slice(0, roundCount)
                .map(q => q.id);

            // Only update if selection actually changed
            setSelectedUserQuestions(prev => {
                const newSelection = JSON.stringify(autoSelected.sort());
                const prevSelection = JSON.stringify(prev.sort());
                return newSelection !== prevSelection ? autoSelected : prev;
            });
        } else if (questionSource !== 'user') {
            // Only clear if not empty
            setSelectedUserQuestions(prev => prev.length > 0 ? [] : prev);
        }
    }, [questionSource, userQuestions, roundCount]);

    // Memoized retry function
    const refetchAppQuestions = useCallback(() => {
        loadAppQuestions();
    }, [loadAppQuestions]);

    // Memoized team member functions
    const addTeamMember = useCallback(() => {
        if (newMember.trim() === '') {
            Alert.alert('Error', 'Please enter a team member name');
            return;
        }

        if (teamMembers.includes(newMember.trim())) {
            Alert.alert('Error', 'This team member is already added');
            return;
        }

        setTeamMembers(prev => [...prev, newMember.trim()]);
        setNewMember('');
    }, [newMember, teamMembers]);

    const removeTeamMember = useCallback((index: number) => {
        if (teamMembers.length <= 1) {
            Alert.alert('Error', 'You must have at least one team member');
            return;
        }

        setTeamMembers(prev => {
            const updated = [...prev];
            updated.splice(index, 1);
            return updated;
        });
    }, [teamMembers.length]);

    // Memoized question selection toggle
    const toggleQuestionSelection = useCallback((questionId: string) => {
        setSelectedUserQuestions(prev => {
            if (prev.includes(questionId)) {
                return prev.filter(id => id !== questionId);
            } else {
                if (prev.length >= roundCount) {
                    Alert.alert('Selection Limit', `You can only select up to ${roundCount} questions.`);
                    return prev;
                }
                return [...prev, questionId];
            }
        });
    }, [roundCount]);

    // FIXED: Create quest handler with proper type mapping
    const handleCreateQuest = useCallback(async () => {
        if (!title.trim()) {
            Alert.alert('Error', 'Please enter a title for your quiz');
            return;
        }

        // Validate questions
        if (questionSource === 'user') {
            if (selectedUserQuestions.length === 0) {
                Alert.alert('Error', 'Please select at least one question for your quiz.');
                return;
            }
            if (selectedUserQuestions.length < roundCount) {
                const proceed = await new Promise<boolean>((resolve) => {
                    Alert.alert(
                        'Fewer Questions Selected',
                        `You selected ${selectedUserQuestions.length} questions but want ${roundCount} rounds. The quiz will only have ${selectedUserQuestions.length} rounds. Continue?`,
                        [
                            { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
                            { text: 'Continue', onPress: () => resolve(true) }
                        ]
                    );
                });
                if (!proceed) return;
            }
        } else if (questionSource === 'app') {
            if (appQuestions.length === 0) {
                Alert.alert('Error', 'No app questions available. Please try refreshing or check your connection.');
                return;
            }
        }

        try {
            // FIXED: Create challenge with proper structure matching CreateChallengeRequest
            const apiDifficulty = DIFFICULTY_MAPPING[difficulty]; // Convert to API format

            // Create quiz configuration object
            const quizConfig = {
                gameType: 'WWW',
                teamName: teamName.trim(),
                teamMembers: teamMembers.map(m => m.trim()),
                difficulty: difficulty, // Keep UI format for quiz config
                roundTime,
                roundCount: questionSource === 'user' ? selectedUserQuestions.length : roundCount,
                enableAIHost,
                teamBased: true,
                questionSource,
                selectedUserQuestions: questionSource === 'user' ? selectedUserQuestions : [],
                appQuestionsDifficulty: questionSource === 'app' ? difficulty : null
            };

            const challengeData: CreateChallengeRequest = {
                title: title.trim(),
                description: description.trim(),
                reward: reward.trim(),
                type: 'QUIZ', // FIXED: Use 'QUIZ' instead of 'WWW_QUIZ'
                visibility: 'PUBLIC' as ChallengeVisibility, // FIXED: Add required visibility field with proper type
                status: 'OPEN' as ChallengeStatus,           // FIXED: Add required status field with proper type
                quizConfig: JSON.stringify(quizConfig) // FIXED: Store quiz config as JSON string
            };

            const result = await createChallenge(challengeData).unwrap();

            if (result?.id) {
                // FIXED: Start quiz session with proper request format
                const sessionRequest = {
                    challengeId: result.id,
                    teamName: teamName.trim(),
                    teamMembers: teamMembers.map(m => m.trim()),
                    difficulty: apiDifficulty, // FIXED: Use API difficulty format
                    roundTimeSeconds: roundTime,
                    totalRounds: questionSource === 'user' ? selectedUserQuestions.length : roundCount,
                    enableAiHost: enableAIHost, // FIXED: Match API field name
                    questionSource,
                    customQuestionIds: questionSource === 'user' ? selectedUserQuestions : undefined
                };

                const sessionResult = await startQuizSession(sessionRequest).unwrap();

                // FIXED: Access 'id' instead of 'sessionId' from QuizSession
                if (sessionResult?.id) {
                    navigation.navigate('WWWGamePlay', {
                        sessionId: sessionResult.id, // FIXED: Use 'id' field from QuizSession
                        challengeId: result.id
                    });
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
        teamName,
        teamMembers,
        roundTime,
        roundCount,
        enableAIHost,
        appQuestions.length,
        createChallenge,
        startQuizSession,
        navigation
    ]);

    // Memoized computed values
    const isFormValid = useMemo(() => {
        return title.trim() !== '' &&
            teamMembers.length > 0 &&
            (questionSource === 'user' ? selectedUserQuestions.length > 0 : appQuestions.length > 0);
    }, [title, teamMembers.length, questionSource, selectedUserQuestions.length, appQuestions.length]);

    const isLoading = isCreatingChallenge || isStartingSession;

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

                        {/* Basic Information */}
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Basic Information</Text>

                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Title</Text>
                                <TextInput
                                    style={styles.input}
                                    value={title}
                                    onChangeText={setTitle}
                                    placeholder="Enter quiz title"
                                    maxLength={100}
                                />
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Description</Text>
                                <TextInput
                                    style={[styles.input, styles.textArea]}
                                    value={description}
                                    onChangeText={setDescription}
                                    placeholder="Describe your quiz"
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
                                    placeholder="e.g., 100 points, Badge, etc."
                                    maxLength={50}
                                />
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

                            {/* App Questions Info */}
                            {questionSource === 'app' && (
                                <View style={styles.appQuestionsInfo}>
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

                                    {isLoadingAppQuestions ? (
                                        <View style={styles.loadingContainer}>
                                            <ActivityIndicator size="small" color="#4CAF50" />
                                            <Text style={styles.loadingText}>Loading questions...</Text>
                                        </View>
                                    ) : appQuestionsError ? (
                                        <View>
                                            <Text style={styles.errorText}>Failed to load questions: {appQuestionsError}</Text>
                                            <TouchableOpacity
                                                style={styles.refreshButton}
                                                onPress={refetchAppQuestions}
                                            >
                                                <MaterialCommunityIcons name="refresh" size={16} color="#4CAF50" />
                                                <Text style={styles.refreshButtonText}>Retry</Text>
                                            </TouchableOpacity>
                                        </View>
                                    ) : (
                                        <Text style={styles.infoText}>
                                            {appQuestions.length} questions available for {difficulty} difficulty
                                        </Text>
                                    )}
                                </View>
                            )}

                            {/* User Questions Info */}
                            {questionSource === 'user' && (
                                <View style={styles.userQuestionsInfo}>
                                    {isLoadingUserQuestions ? (
                                        <View style={styles.loadingContainer}>
                                            <ActivityIndicator size="small" color="#4CAF50" />
                                            <Text style={styles.loadingText}>Loading your questions...</Text>
                                        </View>
                                    ) : (
                                        <>
                                            <TouchableOpacity
                                                style={styles.manageQuestionsButton}
                                                onPress={() => navigation.navigate('UserQuestions')}
                                            >
                                                <MaterialCommunityIcons name="playlist-edit" size={18} color="#4CAF50"/>
                                                <Text style={styles.manageQuestionsText}>Manage My Questions</Text>
                                            </TouchableOpacity>

                                            {userQuestions.length > 0 ? (
                                                <>
                                                    <Text style={styles.infoText}>
                                                        Select {selectedUserQuestions.length} of {userQuestions.length} questions:
                                                    </Text>
                                                    <ScrollView
                                                        style={styles.questionsList}
                                                        nestedScrollEnabled={true}
                                                        showsVerticalScrollIndicator={false}
                                                    >
                                                        {userQuestions.map((question) => (
                                                            <TouchableOpacity
                                                                key={question.id}
                                                                style={[
                                                                    styles.questionItem,
                                                                    selectedUserQuestions.includes(question.id) && styles.questionItemSelected
                                                                ]}
                                                                onPress={() => toggleQuestionSelection(question.id)}
                                                            >
                                                                <MaterialCommunityIcons
                                                                    name={selectedUserQuestions.includes(question.id) ? 'checkbox-marked' : 'checkbox-blank-outline'}
                                                                    size={20}
                                                                    color={selectedUserQuestions.includes(question.id) ? '#4CAF50' : '#666'}
                                                                />
                                                                <Text style={[
                                                                    styles.questionText,
                                                                    selectedUserQuestions.includes(question.id) && styles.questionTextSelected
                                                                ]}>
                                                                    {question.question}
                                                                </Text>
                                                            </TouchableOpacity>
                                                        ))}
                                                    </ScrollView>
                                                </>
                                            ) : (
                                                <View style={styles.noQuestionsContainer}>
                                                    <MaterialCommunityIcons name="help-circle-outline" size={48} color="#CCC" />
                                                    <Text style={styles.noQuestionsText}>No custom questions yet</Text>
                                                    <Text style={styles.noQuestionsSubtext}>Create some questions to use them in your quiz</Text>
                                                    <TouchableOpacity
                                                        style={styles.createQuestionButton}
                                                        onPress={() => navigation.navigate('UserQuestions')}
                                                    >
                                                        <Text style={styles.createQuestionButtonText}>Create Questions</Text>
                                                    </TouchableOpacity>
                                                </View>
                                            )}
                                        </>
                                    )}
                                </View>
                            )}
                        </View>

                        {/* Game Settings */}
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Game Settings</Text>

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
                                <View style={styles.teamMembersContainer}>
                                    {teamMembers.map((member, index) => (
                                        <View key={index} style={styles.teamMember}>
                                            <Text style={styles.teamMemberText}>{member}</Text>
                                            {teamMembers.length > 1 && (
                                                <TouchableOpacity onPress={() => removeTeamMember(index)}>
                                                    <MaterialCommunityIcons name="close" size={18} color="#FF5722" />
                                                </TouchableOpacity>
                                            )}
                                        </View>
                                    ))}
                                    <View style={styles.addMemberContainer}>
                                        <TextInput
                                            style={styles.addMemberInput}
                                            value={newMember}
                                            onChangeText={setNewMember}
                                            placeholder="Add team member"
                                            maxLength={30}
                                        />
                                        <TouchableOpacity style={styles.addMemberButton} onPress={addTeamMember}>
                                            <MaterialCommunityIcons name="plus" size={20} color="#4CAF50" />
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            </View>

                            {questionSource === 'app' && (
                                <View style={styles.inputGroup}>
                                    <Text style={styles.label}>Number of Rounds</Text>
                                    <View style={styles.roundSelector}>
                                        {[5, 10, 15, 20].map((count) => (
                                            <TouchableOpacity
                                                key={count}
                                                style={[
                                                    styles.roundOption,
                                                    roundCount === count && styles.roundOptionSelected
                                                ]}
                                                onPress={() => setRoundCount(count)}
                                            >
                                                <Text style={[
                                                    styles.roundText,
                                                    roundCount === count && styles.roundTextSelected
                                                ]}>
                                                    {count}
                                                </Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                </View>
                            )}

                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Time per Round (seconds)</Text>
                                <View style={styles.timeSelector}>
                                    {[30, 60, 90, 120].map((time) => (
                                        <TouchableOpacity
                                            key={time}
                                            style={[
                                                styles.timeOption,
                                                roundTime === time && styles.timeOptionSelected
                                            ]}
                                            onPress={() => setRoundTime(time)}
                                        >
                                            <Text style={[
                                                styles.timeText,
                                                roundTime === time && styles.timeTextSelected
                                            ]}>
                                                {time}s
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>

                            <View style={styles.inputGroup}>
                                <View style={styles.toggleContainer}>
                                    <View style={styles.toggleInfo}>
                                        <Text style={styles.label}>AI Host</Text>
                                        <Text style={styles.toggleDescription}>
                                            Enable AI-powered host for enhanced experience
                                        </Text>
                                    </View>
                                    <TouchableOpacity
                                        style={[
                                            styles.toggle,
                                            enableAIHost && styles.toggleActive
                                        ]}
                                        onPress={() => setEnableAIHost(!enableAIHost)}
                                    >
                                        <View style={[
                                            styles.toggleSlider,
                                            enableAIHost && styles.toggleSliderActive
                                        ]} />
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </View>

                        {/* Create Button */}
                        <TouchableOpacity
                            style={[
                                styles.createButton,
                                (!isFormValid || isLoading) && styles.createButtonDisabled
                            ]}
                            onPress={handleCreateQuest}
                            disabled={!isFormValid || isLoading}
                        >
                            {isLoading ? (
                                <ActivityIndicator size="small" color="#FFF" />
                            ) : (
                                <>
                                    <MaterialCommunityIcons name="rocket-launch" size={20} color="#FFF" />
                                    <Text style={styles.createButtonText}>Create Quest</Text>
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
        backgroundColor: '#F5F7FA',
    },
    keyboardAvoid: {
        flex: 1,
    },
    scrollView: {
        flex: 1,
    },
    content: {
        padding: 20,
        paddingBottom: 40,
    },
    header: {
        marginBottom: 30,
        alignItems: 'center',
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#1A1A1A',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
    },
    section: {
        backgroundColor: '#FFF',
        borderRadius: 12,
        padding: 20,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: '600',
        color: '#1A1A1A',
        marginBottom: 16,
    },
    inputGroup: {
        marginBottom: 16,
    },
    label: {
        fontSize: 16,
        fontWeight: '500',
        color: '#333',
        marginBottom: 8,
    },
    input: {
        borderWidth: 1,
        borderColor: '#E0E0E0',
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        backgroundColor: '#FAFAFA',
    },
    textArea: {
        height: 80,
        textAlignVertical: 'top',
    },
    sourceSelector: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 16,
    },
    sourceOption: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        borderWidth: 2,
        borderColor: '#E0E0E0',
        borderRadius: 8,
        backgroundColor: '#FAFAFA',
    },
    sourceOptionSelected: {
        borderColor: '#4CAF50',
        backgroundColor: '#F1F8E9',
    },
    sourceText: {
        fontSize: 16,
        fontWeight: '500',
        color: '#666',
        marginLeft: 8,
    },
    sourceTextSelected: {
        color: '#4CAF50',
    },
    appQuestionsInfo: {
        backgroundColor: '#F8F9FA',
        padding: 16,
        borderRadius: 8,
        marginTop: 12,
    },
    userQuestionsInfo: {
        backgroundColor: '#F8F9FA',
        padding: 16,
        borderRadius: 8,
        marginTop: 12,
    },
    difficultySelector: {
        flexDirection: 'row',
        gap: 8,
    },
    difficultyOption: {
        flex: 1,
        padding: 12,
        borderWidth: 1,
        borderColor: '#E0E0E0',
        borderRadius: 6,
        alignItems: 'center',
        backgroundColor: '#FFF',
    },
    difficultyOptionSelected: {
        borderColor: '#4CAF50',
        backgroundColor: '#F1F8E9',
    },
    difficultyText: {
        fontSize: 14,
        fontWeight: '500',
        color: '#666',
    },
    difficultyTextSelected: {
        color: '#4CAF50',
    },
    loadingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
    },
    loadingText: {
        fontSize: 14,
        color: '#666',
        marginLeft: 8,
    },
    errorText: {
        fontSize: 14,
        color: '#FF5722',
        textAlign: 'center',
        marginBottom: 8,
    },
    refreshButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 8,
    },
    refreshButtonText: {
        fontSize: 14,
        color: '#4CAF50',
        marginLeft: 4,
        fontWeight: '500',
    },
    infoText: {
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
        fontStyle: 'italic',
    },
    manageQuestionsButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 12,
        backgroundColor: '#FFF',
        borderRadius: 6,
        borderWidth: 1,
        borderColor: '#4CAF50',
        marginBottom: 12,
    },
    manageQuestionsText: {
        fontSize: 14,
        color: '#4CAF50',
        fontWeight: '500',
        marginLeft: 6,
    },
    questionsList: {
        maxHeight: 200,
        marginTop: 8,
    },
    questionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        backgroundColor: '#FFF',
        borderRadius: 6,
        marginBottom: 6,
        borderWidth: 1,
        borderColor: '#E0E0E0',
    },
    questionItemSelected: {
        borderColor: '#4CAF50',
        backgroundColor: '#F1F8E9',
    },
    questionText: {
        flex: 1,
        fontSize: 14,
        color: '#333',
        marginLeft: 8,
    },
    questionTextSelected: {
        color: '#2E7D32',
        fontWeight: '500',
    },
    noQuestionsContainer: {
        alignItems: 'center',
        padding: 20,
    },
    noQuestionsText: {
        fontSize: 16,
        fontWeight: '500',
        color: '#666',
        marginTop: 12,
    },
    noQuestionsSubtext: {
        fontSize: 14,
        color: '#999',
        textAlign: 'center',
        marginTop: 4,
        marginBottom: 16,
    },
    createQuestionButton: {
        backgroundColor: '#4CAF50',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 6,
    },
    createQuestionButtonText: {
        color: '#FFF',
        fontSize: 14,
        fontWeight: '500',
    },
    teamMembersContainer: {
        gap: 8,
    },
    teamMember: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 12,
        backgroundColor: '#F1F8E9',
        borderRadius: 6,
        borderWidth: 1,
        borderColor: '#4CAF50',
    },
    teamMemberText: {
        fontSize: 14,
        color: '#2E7D32',
        fontWeight: '500',
    },
    addMemberContainer: {
        flexDirection: 'row',
        gap: 8,
    },
    addMemberInput: {
        flex: 1,
        borderWidth: 1,
        borderColor: '#E0E0E0',
        borderRadius: 6,
        padding: 10,
        fontSize: 14,
        backgroundColor: '#FAFAFA',
    },
    addMemberButton: {
        padding: 10,
        backgroundColor: '#F1F8E9',
        borderRadius: 6,
        borderWidth: 1,
        borderColor: '#4CAF50',
        alignItems: 'center',
        justifyContent: 'center',
    },
    roundSelector: {
        flexDirection: 'row',
        gap: 8,
    },
    roundOption: {
        flex: 1,
        padding: 12,
        borderWidth: 1,
        borderColor: '#E0E0E0',
        borderRadius: 6,
        alignItems: 'center',
        backgroundColor: '#FFF',
    },
    roundOptionSelected: {
        borderColor: '#4CAF50',
        backgroundColor: '#F1F8E9',
    },
    roundText: {
        fontSize: 14,
        fontWeight: '500',
        color: '#666',
    },
    roundTextSelected: {
        color: '#4CAF50',
    },
    timeSelector: {
        flexDirection: 'row',
        gap: 8,
    },
    timeOption: {
        flex: 1,
        padding: 12,
        borderWidth: 1,
        borderColor: '#E0E0E0',
        borderRadius: 6,
        alignItems: 'center',
        backgroundColor: '#FFF',
    },
    timeOptionSelected: {
        borderColor: '#4CAF50',
        backgroundColor: '#F1F8E9',
    },
    timeText: {
        fontSize: 14,
        fontWeight: '500',
        color: '#666',
    },
    timeTextSelected: {
        color: '#4CAF50',
    },
    toggleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    toggleInfo: {
        flex: 1,
    },
    toggleDescription: {
        fontSize: 12,
        color: '#999',
        marginTop: 2,
    },
    toggle: {
        width: 50,
        height: 28,
        borderRadius: 14,
        backgroundColor: '#E0E0E0',
        padding: 2,
        justifyContent: 'center',
    },
    toggleActive: {
        backgroundColor: '#4CAF50',
    },
    toggleSlider: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: '#FFF',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 2,
    },
    toggleSliderActive: {
        transform: [{ translateX: 22 }],
    },
    createButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#4CAF50',
        padding: 16,
        borderRadius: 12,
        marginTop: 20,
        shadowColor: '#4CAF50',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    createButtonDisabled: {
        backgroundColor: '#CCC',
        shadowOpacity: 0,
        elevation: 0,
    },
    createButtonText: {
        color: '#FFF',
        fontSize: 18,
        fontWeight: '600',
        marginLeft: 8,
    },
});

export default CreateWWWQuestScreen;