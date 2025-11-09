// src/screens/WWWGameSetupScreen.tsx - UPDATED: Backend Integration
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
import {useSelector} from 'react-redux';
import {RootState} from '../app/providers/StoreProvider/store';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {RootStackParamList} from '../navigation/AppNavigator';
import {GameSettings} from '../services/wwwGame';
import {useWWWGame} from '../app/providers/WWWGameProvider';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {
    convertToAPIDifficulty,
    convertToUIDifficulty,
    useGetQuestionsByDifficultyQuery,
    useGetTournamentStatisticsQuery,
} from '../entities/TournamentState/model/slice/tournamentQuestionApi';

const WWWGameSetupScreen: React.FC = () => {
    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
    const { user } = useSelector((state: RootState) => state.auth);
    const { config } = useWWWGame();

    // Tournament & Question State
    const [tournamentId, setTournamentId] = useState<string>('1'); // Default tournament
    const [questionSource, setQuestionSource] = useState<'tournament' | 'local'>('tournament');
    const [useTournamentQuestions, setUseTournamentQuestions] = useState(true);

    // Game Settings State
    const [teamName, setTeamName] = useState('Team Intellect');
    const [teamMembers, setTeamMembers] = useState<string[]>([user?.username || 'Player 1']);
    const [newMember, setNewMember] = useState('');
    const [difficulty, setDifficulty] = useState<'EASY' | 'MEDIUM' | 'HARD'>(
        config?.questions?.defaultDifficulty || 'Medium'
    );
    const [roundTime, setRoundTime] = useState(config?.game?.defaultRoundTime || 60);
    const [roundCount, setRoundCount] = useState(config?.game?.defaultRoundCount || 10);
    const [enableAIHost, setEnableAIHost] = useState<boolean>(config?.aiHost?.enabled || true);

    // Parse tournament ID
    const parsedTournamentId = parseInt(tournamentId) || 1;

    // Fetch questions from backend when tournament questions are enabled
    const {
        data: tournamentQuestions,
        isLoading: isLoadingQuestions,
        error: questionsError,
        refetch: refetchQuestions,
    } = useGetQuestionsByDifficultyQuery(
        {
            tournamentId: parsedTournamentId,
            difficulty: convertToAPIDifficulty(difficulty),
            limit: Math.max(roundCount, 20), // Fetch extra for variety
        },
        {
            skip: !useTournamentQuestions, // Skip if not using tournament questions
        }
    );

    // Fetch tournament statistics
    const {
        data: tournamentStats,
        isLoading: isLoadingStats,
    } = useGetTournamentStatisticsQuery(parsedTournamentId, {
        skip: !useTournamentQuestions,
    });

    // Show tournament info when questions are loaded
    useEffect(() => {
        if (tournamentQuestions && tournamentQuestions.length > 0) {
            console.log(`Loaded ${tournamentQuestions.length} questions from tournament ${parsedTournamentId}`);
        }
    }, [tournamentQuestions, parsedTournamentId]);

    // Warn if not enough questions
    useEffect(() => {
        if (
            useTournamentQuestions &&
            tournamentQuestions &&
            tournamentQuestions.length < roundCount &&
            tournamentQuestions.length > 0
        ) {
            Alert.alert(
                'Limited Questions',
                `Only ${tournamentQuestions.length} questions available for ${difficulty} difficulty. Round count adjusted.`,
                [{ text: 'OK' }]
            );
            setRoundCount(tournamentQuestions.length);
        }
    }, [tournamentQuestions, roundCount, difficulty, useTournamentQuestions]);

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
        if (teamMembers.length === 1) {
            Alert.alert('Error', 'You must have at least one team member');
            return;
        }
        const updatedMembers = [...teamMembers];
        updatedMembers.splice(index, 1);
        setTeamMembers(updatedMembers);
    };

    // Start game
    const startGame = () => {
        if (teamMembers.length === 0) {
            Alert.alert('Error', 'Please add at least one team member');
            return;
        }

        // Check if using tournament questions
        if (useTournamentQuestions) {
            if (isLoadingQuestions) {
                Alert.alert('Please Wait', 'Questions are still loading...');
                return;
            }

            if (questionsError) {
                Alert.alert(
                    'Error Loading Questions',
                    'Failed to load tournament questions. Please check your connection and try again.',
                    [
                        { text: 'Retry', onPress: () => refetchQuestions() },
                        { text: 'Use Local Questions', onPress: () => setUseTournamentQuestions(false) },
                    ]
                );
                return;
            }

            if (!tournamentQuestions || tournamentQuestions.length === 0) {
                Alert.alert(
                    'No Questions Available',
                    `No questions found for ${difficulty} difficulty in this tournament. Try a different difficulty or tournament.`,
                    [{ text: 'OK' }]
                );
                return;
            }
        }

        // Convert backend questions to game format
        const userQuestions = useTournamentQuestions && tournamentQuestions
            ? tournamentQuestions.slice(0, roundCount).map((q, idx) => ({
                id: q.id.toString(),
                question: q.questionPreview,
                answer: 'Answer pending', // Will be loaded in detail view
                difficulty: convertToUIDifficulty(q.difficulty),
                topic: q.topic,
            }))
            : undefined;

        // Create game settings
        const gameSettings: GameSettings = {
            teamName,
            teamMembers,
            difficulty,
            roundTime,
            roundCount: useTournamentQuestions
                ? Math.min(roundCount, tournamentQuestions?.length || roundCount)
                : roundCount,
            enableAIHost,
            questionSource: useTournamentQuestions ? 'user' : 'app',
            userQuestions,
        };

        navigation.navigate('WWWGamePlay', gameSettings);
    };

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.keyboardAvoidContainer}
            >
                <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                    {/* Header */}
                    <View style={styles.header}>
                        <MaterialCommunityIcons name="brain" size={48} color="white" />
                        <Text style={styles.headerTitle}>WWW_QUIZ</Text>
                        <Text style={styles.headerSubtitle}>Game Setup</Text>
                    </View>

                    {/* Tournament Selection Section */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Question Source</Text>

                        {/* Toggle: Tournament vs Local */}
                        <View style={styles.sourceToggle}>
                            <TouchableOpacity
                                style={[
                                    styles.sourceButton,
                                    useTournamentQuestions && styles.sourceButtonActive,
                                ]}
                                onPress={() => setUseTournamentQuestions(true)}
                            >
                                <MaterialCommunityIcons
                                    name="server"
                                    size={20}
                                    color={useTournamentQuestions ? 'white' : '#666'}
                                />
                                <Text
                                    style={[
                                        styles.sourceButtonText,
                                        useTournamentQuestions && styles.sourceButtonTextActive,
                                    ]}
                                >
                                    Tournament
                                </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[
                                    styles.sourceButton,
                                    !useTournamentQuestions && styles.sourceButtonActive,
                                ]}
                                onPress={() => setUseTournamentQuestions(false)}
                            >
                                <MaterialCommunityIcons
                                    name="database"
                                    size={20}
                                    color={!useTournamentQuestions ? 'white' : '#666'}
                                />
                                <Text
                                    style={[
                                        styles.sourceButtonText,
                                        !useTournamentQuestions && styles.sourceButtonTextActive,
                                    ]}
                                >
                                    Local
                                </Text>
                            </TouchableOpacity>
                        </View>

                        {/* Tournament ID Input */}
                        {useTournamentQuestions && (
                            <View style={styles.tournamentInputContainer}>
                                <Text style={styles.inputLabel}>Tournament ID:</Text>
                                <TextInput
                                    style={styles.tournamentInput}
                                    value={tournamentId}
                                    onChangeText={setTournamentId}
                                    placeholder="Enter tournament ID"
                                    keyboardType="number-pad"
                                />
                            </View>
                        )}

                        {/* Tournament Stats */}
                        {useTournamentQuestions && tournamentStats && !isLoadingStats && (
                            <View style={styles.statsContainer}>
                                <MaterialCommunityIcons
                                    name="chart-box"
                                    size={20}
                                    color="#4CAF50"
                                    style={styles.statsIcon}
                                />
                                <View style={styles.statsContent}>
                                    <Text style={styles.statsTitle}>
                                        {tournamentStats.tournamentTitle || `Tournament #${tournamentId}`}
                                    </Text>
                                    <Text style={styles.statsText}>
                                        {tournamentStats.totalQuestions} total questions •
                                        {tournamentStats.activeQuestions} active
                                    </Text>
                                    <Text style={styles.statsText}>
                                        Avg Points: {tournamentStats.averagePoints?.toFixed(1) || 0}
                                    </Text>
                                </View>
                            </View>
                        )}

                        {/* Loading Indicator */}
                        {useTournamentQuestions && isLoadingQuestions && (
                            <View style={styles.loadingContainer}>
                                <ActivityIndicator size="small" color="#4CAF50" />
                                <Text style={styles.loadingText}>Loading questions...</Text>
                            </View>
                        )}

                        {/* Questions Loaded Info */}
                        {useTournamentQuestions &&
                            tournamentQuestions &&
                            tournamentQuestions.length > 0 && (
                                <View style={styles.infoContainer}>
                                    <MaterialCommunityIcons
                                        name="check-circle"
                                        size={16}
                                        color="#4CAF50"
                                    />
                                    <Text style={styles.infoText}>
                                        {tournamentQuestions.length} questions loaded for {difficulty}{' '}
                                        difficulty
                                    </Text>
                                </View>
                            )}

                        {/* Error State */}
                        {useTournamentQuestions && questionsError && (
                            <View style={styles.errorContainer}>
                                <MaterialCommunityIcons name="alert-circle" size={16} color="#F44336" />
                                <Text style={styles.errorText}>
                                    Failed to load questions
                                </Text>
                                <TouchableOpacity
                                    style={styles.retryButton}
                                    onPress={() => refetchQuestions()}
                                >
                                    <Text style={styles.retryButtonText}>Retry</Text>
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>

                    {/* Team Setup Section */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Team Setup</Text>

                        {/* Team Name */}
                        <View style={styles.formGroup}>
                            <Text style={styles.label}>Team Name</Text>
                            <TextInput
                                style={styles.input}
                                value={teamName}
                                onChangeText={setTeamName}
                                placeholder="Enter team name"
                            />
                        </View>

                        {/* Team Members */}
                        <View style={styles.formGroup}>
                            <Text style={styles.label}>Team Members</Text>
                            <View style={styles.teamMembersContainer}>
                                {teamMembers.map((member, index) => (
                                    <View key={index} style={styles.memberItem}>
                                        <MaterialCommunityIcons
                                            name="account"
                                            size={20}
                                            color="#4CAF50"
                                        />
                                        <Text style={styles.memberName}>{member}</Text>
                                        <TouchableOpacity
                                            onPress={() => removeTeamMember(index)}
                                            style={styles.removeButton}
                                        >
                                            <MaterialCommunityIcons
                                                name="close"
                                                size={16}
                                                color="white"
                                            />
                                        </TouchableOpacity>
                                    </View>
                                ))}

                                {/* Add Member Input */}
                                <View style={styles.addMemberContainer}>
                                    <TextInput
                                        style={styles.memberInput}
                                        value={newMember}
                                        onChangeText={setNewMember}
                                        placeholder="Add team member"
                                        onSubmitEditing={addTeamMember}
                                    />
                                    <TouchableOpacity
                                        onPress={addTeamMember}
                                        style={styles.addButton}
                                    >
                                        <MaterialCommunityIcons name="plus" size={20} color="white" />
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </View>
                    </View>

                    {/* Game Settings Section */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Game Settings</Text>

                        {/* Difficulty */}
                        <View style={styles.settingItem}>
                            <Text style={styles.settingLabel}>Difficulty</Text>
                            <View style={styles.difficultyButtons}>
                                {(['EASY', 'MEDIUM', 'HARDHARD'] as const).map((level) => (
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

                        {/* Round Time */}
                        <View style={styles.settingItem}>
                            <Text style={styles.settingLabel}>Time per Round (seconds)</Text>
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
                                            {time}s
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>

                        {/* Round Count */}
                        <View style={styles.settingItem}>
                            <Text style={styles.settingLabel}>Number of Rounds</Text>
                            <View style={styles.countButtons}>
                                {[5, 10, 15, 20].map((count) => (
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
                            {useTournamentQuestions &&
                                tournamentQuestions &&
                                tournamentQuestions.length < roundCount && (
                                    <Text style={styles.warningText}>
                                        ⚠️ Only {tournamentQuestions.length} questions available
                                    </Text>
                                )}
                        </View>

                        {/* AI Host Toggle */}
                        <View style={styles.settingItem}>
                            <View style={styles.switchRow}>
                                <TouchableOpacity
                                    onPress={() => setEnableAIHost(!enableAIHost)}
                                    style={[
                                        styles.toggleButton,
                                        enableAIHost ? styles.toggleActive : styles.toggleInactive,
                                    ]}
                                >
                                    <View
                                        style={[
                                            styles.toggleKnob,
                                            enableAIHost
                                                ? styles.toggleKnobActive
                                                : styles.toggleKnobInactive,
                                        ]}
                                    />
                                </TouchableOpacity>
                                <Text style={styles.toggleText}>Enable AI Host</Text>
                            </View>
                            <Text style={styles.aiHostDescription}>
                                AI host provides commentary and hints during the game
                            </Text>
                        </View>
                    </View>

                    {/* Action Buttons */}
                    <View style={styles.actionsContainer}>
                        <TouchableOpacity
                            style={[
                                styles.startButton,
                                (isLoadingQuestions ||
                                    (useTournamentQuestions && !tournamentQuestions)) &&
                                styles.disabledButton,
                            ]}
                            onPress={startGame}
                            disabled={
                                isLoadingQuestions ||
                                (useTournamentQuestions && !tournamentQuestions)
                            }
                        >
                            <MaterialCommunityIcons name="play" size={24} color="white" />
                            <Text style={styles.startButtonText}>Start Game</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.backButton}
                            onPress={() => navigation.goBack()}
                        >
                            <Text style={styles.backButtonText}>Back</Text>
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
        backgroundColor: '#f5f5f5',
    },
    keyboardAvoidContainer: {
        flex: 1,
    },
    scrollView: {
        flex: 1,
    },
    header: {
        backgroundColor: '#4CAF50',
        padding: 24,
        alignItems: 'center',
        borderBottomLeftRadius: 20,
        borderBottomRightRadius: 20,
        marginBottom: 16,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: 'white',
        marginTop: 8,
    },
    headerSubtitle: {
        fontSize: 16,
        color: 'rgba(255, 255, 255, 0.9)',
        marginTop: 4,
    },
    section: {
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 16,
        marginHorizontal: 16,
        marginBottom: 16,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 16,
    },
    sourceToggle: {
        flexDirection: 'row',
        backgroundColor: '#f0f0f0',
        borderRadius: 8,
        padding: 4,
        marginBottom: 16,
    },
    sourceButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        borderRadius: 6,
        gap: 6,
    },
    sourceButtonActive: {
        backgroundColor: '#4CAF50',
    },
    sourceButtonText: {
        fontSize: 14,
        color: '#666',
        fontWeight: '500',
    },
    sourceButtonTextActive: {
        color: 'white',
        fontWeight: 'bold',
    },
    tournamentInputContainer: {
        marginBottom: 12,
    },
    inputLabel: {
        fontSize: 14,
        color: '#666',
        marginBottom: 6,
        fontWeight: '500',
    },
    tournamentInput: {
        backgroundColor: '#f9f9f9',
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
    },
    statsContainer: {
        flexDirection: 'row',
        backgroundColor: '#f0f9f4',
        borderRadius: 8,
        padding: 12,
        marginTop: 8,
        borderLeftWidth: 3,
        borderLeftColor: '#4CAF50',
    },
    statsIcon: {
        marginRight: 10,
        marginTop: 2,
    },
    statsContent: {
        flex: 1,
    },
    statsTitle: {
        fontSize: 15,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 4,
    },
    statsText: {
        fontSize: 13,
        color: '#666',
        marginTop: 2,
    },
    loadingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        gap: 8,
    },
    loadingText: {
        fontSize: 14,
        color: '#666',
    },
    infoContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f0f9f4',
        borderRadius: 6,
        padding: 10,
        marginTop: 8,
        gap: 6,
    },
    infoText: {
        fontSize: 13,
        color: '#4CAF50',
        fontWeight: '500',
    },
    errorContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff5f5',
        borderRadius: 6,
        padding: 10,
        marginTop: 8,
        gap: 6,
    },
    errorText: {
        flex: 1,
        fontSize: 13,
        color: '#F44336',
        fontWeight: '500',
    },
    retryButton: {
        backgroundColor: '#F44336',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 4,
    },
    retryButtonText: {
        color: 'white',
        fontSize: 12,
        fontWeight: 'bold',
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
    teamMembersContainer: {
        backgroundColor: '#f9f9f9',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#ddd',
        padding: 12,
    },
    memberItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
        gap: 8,
    },
    memberName: {
        flex: 1,
        fontSize: 16,
        color: '#333',
    },
    removeButton: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: '#ff6b6b',
        alignItems: 'center',
        justifyContent: 'center',
    },
    addMemberContainer: {
        flexDirection: 'row',
        marginTop: 12,
        gap: 8,
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
    },
    settingItem: {
        marginBottom: 20,
    },
    settingLabel: {
        fontSize: 16,
        color: '#555',
        marginBottom: 10,
        fontWeight: '500',
    },
    difficultyButtons: {
        flexDirection: 'row',
        gap: 8,
    },
    difficultyButton: {
        flex: 1,
        paddingVertical: 10,
        borderRadius: 8,
        backgroundColor: '#f0f0f0',
        alignItems: 'center',
    },
    selectedDifficulty: {
        backgroundColor: '#4CAF50',
    },
    difficultyText: {
        fontSize: 14,
        color: '#555',
        fontWeight: '500',
    },
    selectedDifficultyText: {
        color: 'white',
        fontWeight: 'bold',
    },
    timeButtons: {
        flexDirection: 'row',
        gap: 8,
    },
    timeButton: {
        flex: 1,
        paddingVertical: 10,
        borderRadius: 8,
        backgroundColor: '#f0f0f0',
        alignItems: 'center',
    },
    selectedTime: {
        backgroundColor: '#4CAF50',
    },
    timeText: {
        fontSize: 14,
        color: '#555',
        fontWeight: '500',
    },
    selectedTimeText: {
        color: 'white',
        fontWeight: 'bold',
    },
    countButtons: {
        flexDirection: 'row',
        gap: 8,
    },
    countButton: {
        flex: 1,
        paddingVertical: 10,
        borderRadius: 8,
        backgroundColor: '#f0f0f0',
        alignItems: 'center',
    },
    selectedCount: {
        backgroundColor: '#4CAF50',
    },
    countText: {
        fontSize: 14,
        color: '#555',
        fontWeight: '500',
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
        gap: 12,
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
        shadowOffset: { width: 0, height: 2 },
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
        fontSize: 16,
        color: '#555',
        fontWeight: '500',
    },
    aiHostDescription: {
        fontSize: 12,
        color: '#666',
        fontStyle: 'italic',
        marginTop: 8,
        marginLeft: 62,
    },
    actionsContainer: {
        padding: 16,
        marginBottom: 24,
    },
    startButton: {
        flexDirection: 'row',
        backgroundColor: '#4CAF50',
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 3,
    },
    startButtonText: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
    },
    backButton: {
        alignItems: 'center',
        padding: 12,
        marginTop: 8,
    },
    backButtonText: {
        color: '#666',
        fontSize: 16,
    },
    disabledButton: {
        opacity: 0.5,
        backgroundColor: '#A5D6A7',
    },
});

export default WWWGameSetupScreen;