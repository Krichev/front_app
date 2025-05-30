// src/screens/CreateWWWQuestScreen.tsx - Updated to use Quiz API
import React, {useEffect, useState} from 'react';
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
import {useCreateChallengeMutation} from '../entities/ChallengeState/model/slice/challengeApi';
import {
    useGetQuestionsByDifficultyQuery,
    useGetUserQuestionsQuery,
    useStartQuizSessionMutation
} from '../entities/QuizState/model/slice/quizApi';
import {useSelector} from 'react-redux';
import {RootState} from '../app/providers/StoreProvider/store';
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import {navigateToTab} from "../utils/navigation.ts";

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

    // Form state
    const [title, setTitle] = useState('What? Where? When? Quiz');
    const [description, setDescription] = useState('Test your knowledge in this team-based quiz game.');
    const [reward, setReward] = useState('100 points');
    const [teamName, setTeamName] = useState('Team Intellect');
    const [teamMembers, setTeamMembers] = useState<string[]>([user?.name || 'Player 1']);
    const [newMember, setNewMember] = useState('');
    const [difficulty, setDifficulty] = useState<'EASY' | 'MEDIUM' | 'HARD'>('MEDIUM');
    const [roundTime, setRoundTime] = useState(60);
    const [roundCount, setRoundCount] = useState(10);
    const [enableAIHost, setEnableAIHost] = useState<boolean>(true);
    const [selectedUserQuestions, setSelectedUserQuestions] = useState<string[]>([]);

    // App questions query (only when needed)
    const {
        data: appQuestions = [],
        isLoading: isLoadingAppQuestions,
        error: appQuestionsError,
        refetch: refetchAppQuestions
    } = useGetQuestionsByDifficultyQuery(
        { difficulty, count: roundCount * 2 },
        { skip: questionSource !== 'app' }
    );

    // Auto-select user questions when source changes
    useEffect(() => {
        if (questionSource === 'user' && userQuestions.length > 0) {
            // Auto-select up to roundCount questions
            const autoSelected = userQuestions
                .slice(0, roundCount)
                .map(q => q.id);
            setSelectedUserQuestions(autoSelected);
        } else {
            setSelectedUserQuestions([]);
        }
    }, [questionSource, userQuestions, roundCount]);

    // Add team member
    const addTeamMember = () => {
        if (newMember.trim() === '') {
            Alert.alert('Error', 'Please enter a team member name');
            return;
        }

        if (teamMembers.includes(newMember.trim())) {
            Alert.alert('Error', 'This team member is already added');
            return;
        }

        setTeamMembers([...teamMembers, newMember.trim()]);
        setNewMember('');
    };

    // Remove team member
    const removeTeamMember = (index: number) => {
        if (teamMembers.length <= 1) {
            Alert.alert('Error', 'You must have at least one team member');
            return;
        }

        const updatedMembers = [...teamMembers];
        updatedMembers.splice(index, 1);
        setTeamMembers(updatedMembers);
    };

    // Toggle user question selection
    const toggleQuestionSelection = (questionId: string) => {
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
    };

    // Create the quiz
    const handleCreateQuest = async () => {
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
                Alert.alert('Error', 'No app questions available. Please try a different difficulty or check your connection.');
                return;
            }
        }

        try {
            // First, create a challenge to track this quiz
            const challengeResult = await createChallenge({
                title,
                description,
                type: 'QUIZ',
                verificationMethod: 'QUIZ',
                visibility: 'PUBLIC',
                status: 'ACTIVE',
                reward,
            }).unwrap();

            // Then create a quiz session
            const sessionResult = await startQuizSession({
                challengeId: challengeResult.id,
                teamName,
                teamMembers,
                difficulty,
                roundTimeSeconds: roundTime,
                totalRounds: questionSource === 'user' ? selectedUserQuestions.length : roundCount,
                enableAiHost: enableAIHost,
                questionSource,
                ...(questionSource === 'user' && { customQuestionIds: selectedUserQuestions })
            }).unwrap();

            Alert.alert('Success', 'Quiz challenge created successfully!', [
                {
                    text: 'Start Game Now',
                    onPress: () => {
                        navigation.navigate('WWWGamePlay', {
                            sessionId: sessionResult.id,
                            challengeId: challengeResult.id
                        });
                    }
                },
                {
                    text: 'Back to Challenges',
                    onPress: () => navigateToTab(navigation, 'Challenges')
                }
            ]);
        } catch (error) {
            console.error('Failed to create quiz:', error);
            Alert.alert('Error', 'Failed to create quiz challenge. Please try again.');
        }
    };

    const isLoading = isCreatingChallenge || isStartingSession;

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.keyboardAvoid}
            >
                <ScrollView style={styles.scrollView}>
                    <View style={styles.header}>
                        <Text style={styles.headerTitle}>Create What? Where? When? Quiz</Text>
                        <Text style={styles.headerSubtitle}>Set up a team-based quiz challenge</Text>
                    </View>

                    <View style={styles.formContainer}>
                        {/* Challenge Details */}
                        <View style={styles.formSection}>
                            <Text style={styles.sectionTitle}>Challenge Details</Text>

                            <View style={styles.formGroup}>
                                <Text style={styles.label}>Title</Text>
                                <TextInput
                                    style={styles.input}
                                    value={title}
                                    onChangeText={setTitle}
                                    placeholder="Enter quiz title"
                                />
                            </View>

                            <View style={styles.formGroup}>
                                <Text style={styles.label}>Description</Text>
                                <TextInput
                                    style={[styles.input, styles.textArea]}
                                    value={description}
                                    onChangeText={setDescription}
                                    placeholder="Describe your quiz challenge"
                                    multiline
                                    numberOfLines={4}
                                />
                            </View>

                            <View style={styles.formGroup}>
                                <Text style={styles.label}>Reward</Text>
                                <TextInput
                                    style={styles.input}
                                    value={reward}
                                    onChangeText={setReward}
                                    placeholder="Enter reward"
                                />
                            </View>
                        </View>

                        {/* Question Source Section */}
                        <View style={styles.formSection}>
                            <Text style={styles.sectionTitle}>Question Source</Text>

                            <View style={styles.sourceButtons}>
                                <TouchableOpacity
                                    style={[
                                        styles.sourceButton,
                                        questionSource === 'app' && styles.selectedSource
                                    ]}
                                    onPress={() => setQuestionSource('app')}
                                >
                                    <Text style={[
                                        styles.sourceButtonText,
                                        questionSource === 'app' && styles.selectedSourceText
                                    ]}>
                                        App Questions
                                    </Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={[
                                        styles.sourceButton,
                                        questionSource === 'user' && styles.selectedSource
                                    ]}
                                    onPress={() => setQuestionSource('user')}
                                >
                                    <Text style={[
                                        styles.sourceButtonText,
                                        questionSource === 'user' && styles.selectedSourceText
                                    ]}>
                                        My Questions
                                    </Text>
                                </TouchableOpacity>
                            </View>

                            {questionSource === 'app' && (
                                <View style={styles.appQuestionsInfo}>
                                    {isLoadingAppQuestions ? (
                                        <View style={styles.loadingContainer}>
                                            <ActivityIndicator size="small" color="#4CAF50" />
                                            <Text style={styles.loadingText}>Loading questions...</Text>
                                        </View>
                                    ) : appQuestionsError ? (
                                        <View>
                                            <Text style={styles.errorText}>Failed to load questions</Text>
                                            <TouchableOpacity
                                                style={styles.refreshButton}
                                                onPress={() => refetchAppQuestions()}
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
                                                <View style={styles.questionSelection}>
                                                    <Text style={styles.selectionTitle}>
                                                        Select Questions ({selectedUserQuestions.length}/{userQuestions.length})
                                                    </Text>
                                                    <ScrollView style={styles.questionsContainer} nestedScrollEnabled>
                                                        {userQuestions.map((question) => (
                                                            <TouchableOpacity
                                                                key={question.id}
                                                                style={[
                                                                    styles.questionItem,
                                                                    selectedUserQuestions.includes(question.id) && styles.selectedQuestion
                                                                ]}
                                                                onPress={() => toggleQuestionSelection(question.id)}
                                                            >
                                                                <Text style={styles.questionText} numberOfLines={2}>
                                                                    {question.question}
                                                                </Text>
                                                                <Text style={styles.questionDifficulty}>
                                                                    {question.difficulty}
                                                                </Text>
                                                            </TouchableOpacity>
                                                        ))}
                                                    </ScrollView>
                                                </View>
                                            ) : (
                                                <Text style={styles.infoText}>
                                                    You haven't created any questions yet. Create some questions to use them in your quiz.
                                                </Text>
                                            )}
                                        </>
                                    )}
                                </View>
                            )}
                        </View>

                        {/* Team Setup */}
                        <View style={styles.formSection}>
                            <Text style={styles.sectionTitle}>Team Setup</Text>

                            <View style={styles.formGroup}>
                                <Text style={styles.label}>Team Name</Text>
                                <TextInput
                                    style={styles.input}
                                    value={teamName}
                                    onChangeText={setTeamName}
                                    placeholder="Enter team name"
                                />
                            </View>

                            <View style={styles.formGroup}>
                                <Text style={styles.label}>Team Members</Text>
                                <View style={styles.teamMembersContainer}>
                                    {teamMembers.map((member, index) => (
                                        <View key={index} style={styles.memberItem}>
                                            <Text style={styles.memberName}>{member}</Text>
                                            <TouchableOpacity
                                                onPress={() => removeTeamMember(index)}
                                                style={styles.removeButton}
                                            >
                                                <Text style={styles.removeButtonText}>×</Text>
                                            </TouchableOpacity>
                                        </View>
                                    ))}

                                    <View style={styles.addMemberContainer}>
                                        <TextInput
                                            style={styles.memberInput}
                                            value={newMember}
                                            onChangeText={setNewMember}
                                            placeholder="Add team member"
                                        />
                                        <TouchableOpacity
                                            onPress={addTeamMember}
                                            style={styles.addButton}
                                        >
                                            <Text style={styles.addButtonText}>+</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            </View>
                        </View>

                        {/* Game Settings */}
                        <View style={styles.formSection}>
                            <Text style={styles.sectionTitle}>Game Settings</Text>

                            <View style={styles.settingItem}>
                                <Text style={styles.settingLabel}>Difficulty</Text>
                                <View style={styles.difficultyButtons}>
                                    {(['EASY', 'MEDIUM', 'HARD'] as const).map((level) => (
                                        <TouchableOpacity
                                            key={level}
                                            style={[
                                                styles.difficultyButton,
                                                difficulty === level && styles.selectedDifficulty,
                                            ]}
                                            onPress={() => setDifficulty(level)}
                                        >
                                            <Text
                                                style={[
                                                    styles.difficultyText,
                                                    difficulty === level && styles.selectedDifficultyText,
                                                ]}
                                            >
                                                {level}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>

                            <View style={styles.settingItem}>
                                <Text style={styles.settingLabel}>Discussion Time (seconds)</Text>
                                <View style={styles.timeButtons}>
                                    {[30, 60, 90, 120].map((time) => (
                                        <TouchableOpacity
                                            key={time}
                                            style={[
                                                styles.timeButton,
                                                roundTime === time && styles.selectedTime,
                                            ]}
                                            onPress={() => setRoundTime(time)}
                                        >
                                            <Text
                                                style={[
                                                    styles.timeText,
                                                    roundTime === time && styles.selectedTimeText,
                                                ]}
                                            >
                                                {time}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>

                            <View style={styles.settingItem}>
                                <Text style={styles.settingLabel}>Number of Questions</Text>
                                <View style={styles.countButtons}>
                                    {[5, 10, 15].map((count) => (
                                        <TouchableOpacity
                                            key={count}
                                            style={[
                                                styles.countButton,
                                                roundCount === count && styles.selectedCount,
                                            ]}
                                            onPress={() => setRoundCount(count)}
                                        >
                                            <Text
                                                style={[
                                                    styles.countText,
                                                    roundCount === count && styles.selectedCountText,
                                                ]}
                                            >
                                                {count}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>

                                {questionSource === 'user' && userQuestions.length > 0 && userQuestions.length < roundCount && (
                                    <Text style={styles.warningText}>
                                        Note: You only have {userQuestions.length} custom questions available.
                                        The game will use all available questions.
                                    </Text>
                                )}
                            </View>

                            <View style={styles.settingItem}>
                                <Text style={styles.settingLabel}>Enable AI Host</Text>
                                <View style={styles.switchRow}>
                                    <TouchableOpacity
                                        style={[
                                            styles.toggleButton,
                                            enableAIHost ? styles.toggleActive : styles.toggleInactive,
                                        ]}
                                        onPress={() => setEnableAIHost(!enableAIHost)}
                                    >
                                        <View
                                            style={[
                                                styles.toggleKnob,
                                                enableAIHost ? styles.toggleKnobActive : styles.toggleKnobInactive,
                                            ]}
                                        />
                                    </TouchableOpacity>
                                    <Text style={styles.toggleText}>
                                        {enableAIHost ? 'Enabled' : 'Disabled'}
                                    </Text>
                                </View>
                                <Text style={styles.aiHostDescription}>
                                    {enableAIHost ?
                                        "AI Host will analyze team discussions and provide feedback" :
                                        "AI Host features will be disabled"}
                                </Text>
                            </View>
                        </View>

                        {/* Create Button */}
                        <TouchableOpacity
                            style={[
                                styles.createButton,
                                (isLoading ||
                                    (questionSource === 'user' && selectedUserQuestions.length === 0) ||
                                    (questionSource === 'app' && appQuestions.length === 0)
                                ) && styles.disabledButton
                            ]}
                            onPress={handleCreateQuest}
                            disabled={
                                isLoading ||
                                (questionSource === 'user' && selectedUserQuestions.length === 0) ||
                                (questionSource === 'app' && appQuestions.length === 0)
                            }
                        >
                            <Text style={styles.createButtonText}>
                                {isLoading ? 'Creating...' : 'Create Quiz Challenge'}
                            </Text>
                        </TouchableOpacity>

                        {questionSource === 'user' && selectedUserQuestions.length === 0 && (
                            <Text style={styles.errorText}>
                                Please select at least one question to continue
                            </Text>
                        )}
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
    header: {
        backgroundColor: '#4CAF50',
        padding: 16,
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: 'white',
    },
    headerSubtitle: {
        fontSize: 14,
        color: 'rgba(255, 255, 255, 0.8)',
        marginTop: 4,
    },
    formContainer: {
        padding: 16,
    },
    formSection: {
        backgroundColor: 'white',
        borderRadius: 8,
        padding: 16,
        marginBottom: 16,
        elevation: 1,
        shadowOpacity: 0.1,
        shadowRadius: 2,
        shadowOffset: { width: 0, height: 1 },
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 16,
        color: '#333',
    },
    formGroup: {
        marginBottom: 16,
    },
    label: {
        fontSize: 16,
        fontWeight: '500',
        marginBottom: 8,
        color: '#555',
    },
    input: {
        backgroundColor: '#f9f9f9',
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        color: '#333',
    },
    textArea: {
        minHeight: 100,
        textAlignVertical: 'top',
    },
    sourceButtons: {
        flexDirection: 'row',
        marginBottom: 16,
    },
    sourceButton: {
        flex: 1,
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 8,
        backgroundColor: '#f0f0f0',
        marginRight: 8,
        alignItems: 'center',
    },
    selectedSource: {
        backgroundColor: '#4CAF50',
    },
    sourceButtonText: {
        fontSize: 14,
        color: '#555',
        fontWeight: '500',
    },
    selectedSourceText: {
        color: 'white',
        fontWeight: 'bold',
    },
    appQuestionsInfo: {
        backgroundColor: '#f5f5f5',
        padding: 12,
        borderRadius: 8,
    },
    userQuestionsInfo: {
        backgroundColor: '#f5f5f5',
        padding: 12,
        borderRadius: 8,
    },
    questionSelection: {
        marginTop: 12,
    },
    selectionTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        marginBottom: 8,
        color: '#333',
    },
    questionsContainer: {
        maxHeight: 200,
    },
    questionItem: {
        backgroundColor: 'white',
        padding: 12,
        borderRadius: 6,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: '#ddd',
    },
    selectedQuestion: {
        borderColor: '#4CAF50',
        backgroundColor: '#f0fff0',
    },
    questionText: {
        fontSize: 14,
        color: '#333',
        marginBottom: 4,
    },
    questionDifficulty: {
        fontSize: 12,
        color: '#666',
        fontWeight: '500',
    },
    loadingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 8,
    },
    loadingText: {
        marginLeft: 8,
        fontSize: 14,
        color: '#666',
    },
    infoText: {
        fontSize: 14,
        color: '#666',
        fontStyle: 'italic',
        textAlign: 'center',
    },
    errorText: {
        color: '#F44336',
        fontSize: 14,
        textAlign: 'center',
        marginTop: 8,
    },
    refreshButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 8,
        padding: 8,
        backgroundColor: '#e8f5e9',
        borderRadius: 4,
    },
    refreshButtonText: {
        color: '#4CAF50',
        marginLeft: 4,
        fontSize: 14,
        fontWeight: '500',
    },
    manageQuestionsButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        backgroundColor: '#e8f5e9',
        borderRadius: 8,
    },
    manageQuestionsText: {
        marginLeft: 6,
        color: '#4CAF50',
        fontSize: 14,
        fontWeight: '500',
    },
    teamMembersContainer: {
        backgroundColor: '#f9f9f9',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#ddd',
        padding: 12,
    },
    memberItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    memberName: {
        fontSize: 16,
        color: '#333',
    },
    removeButton: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: '#ff6b6b',
        alignItems: 'center',
        justifyContent: 'center',
    },
    removeButtonText: {
        fontSize: 16,
        color: 'white',
        fontWeight: 'bold',
    },
    addMemberContainer: {
        flexDirection: 'row',
        marginTop: 12,
    },
    memberInput: {
        flex: 1,
        height: 40,
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        paddingHorizontal: 12,
        backgroundColor: 'white',
    },
    addButton: {
        width: 40,
        height: 40,
        borderRadius: 8,
        backgroundColor: '#4CAF50',
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: 8,
    },
    addButtonText: {
        fontSize: 20,
        color: 'white',
        fontWeight: 'bold',
    },
    settingItem: {
        marginBottom: 16,
    },
    settingLabel: {
        fontSize: 16,
        color: '#555',
        marginBottom: 8,
    },
    difficultyButtons: {
        flexDirection: 'row',
    },
    difficultyButton: {
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 16,
        marginRight: 8,
        backgroundColor: '#f0f0f0',
    },
    selectedDifficulty: {
        backgroundColor: '#4CAF50',
    },
    difficultyText: {
        fontSize: 14,
        color: '#555',
    },
    selectedDifficultyText: {
        color: 'white',
        fontWeight: 'bold',
    },
    timeButtons: {
        flexDirection: 'row',
    },
    timeButton: {
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 16,
        marginRight: 8,
        backgroundColor: '#f0f0f0',
    },
    selectedTime: {
        backgroundColor: '#4CAF50',
    },
    timeText: {
        fontSize: 14,
        color: '#555',
    },
    selectedTimeText: {
        color: 'white',
        fontWeight: 'bold',
    },
    countButtons: {
        flexDirection: 'row',
    },
    countButton: {
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 16,
        marginRight: 8,
        backgroundColor: '#f0f0f0',
    },
    selectedCount: {
        backgroundColor: '#4CAF50',
    },
    countText: {
        fontSize: 14,
        color: '#555',
    },
    selectedCountText: {
        color: 'white',
        fontWeight: 'bold',
    },
    warningText: {
        color: '#FF9800',
        fontSize: 12,
        marginTop: 8,
        fontStyle: 'italic',
    },
    switchRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    toggleButton: {
        width: 50,
        height: 28,
        borderRadius: 14,
        justifyContent: 'center',
        paddingHorizontal: 2,
    },
    toggleActive: {
        backgroundColor: '#4CAF50',
    },
    toggleInactive: {
        backgroundColor: '#ccc',
    },
    toggleKnob: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: 'white',
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 2},
        shadowOpacity: 0.2,
        shadowRadius: 2,
        elevation: 2,
    },
    toggleKnobActive: {
        alignSelf: 'flex-end',
    },
    toggleKnobInactive: {
        alignSelf: 'flex-start',
    },
    toggleText: {
        marginLeft: 8,
        fontSize: 16,
        color: '#555',
    },
    aiHostDescription: {
        fontSize: 12,
        color: '#666',
        fontStyle: 'italic',
        marginTop: 8,
    },
    createButton: {
        backgroundColor: '#4CAF50',
        padding: 16,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 16,
        marginBottom: 32,
    },
    createButtonText: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
    },
    disabledButton: {
        opacity: 0.7,
        backgroundColor: '#A5D6A7',
    },
});

export default CreateWWWQuestScreen;