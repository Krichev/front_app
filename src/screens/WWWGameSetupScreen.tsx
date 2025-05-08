// Fixed navigation calls in WWWGameSetupScreen
import React, {useEffect, useState} from 'react';
import {
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
import {RootStackParamList} from '../navigation/AppNavigator'; // Import the correct type
import {GameSettings, initializeWWWGameServices} from '../services/wwwGame';
import {useWWWGame} from '../app/providers/WWWGameProvider';
import {UserQuestion} from "../services/wwwGame/questionService.ts";
import QuestionSourceSelector from "../components/QuestionSourceSelector.tsx";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
// Define the type for navigation

const WWWGameSetupScreen: React.FC = () => {
    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
    const {user} = useSelector((state: RootState) => state.auth);
    const {isInitialized, config} = useWWWGame();
    const [questionSource, setQuestionSource] = useState<'app' | 'user'>('app');
    const [userQuestions, setUserQuestions] = useState<UserQuestion[]>([]);
    // Initialize game if not already initialized
    useEffect(() => {
        if (!isInitialized) {
            // Initialize game services (fallback if provider is not used)
            initializeWWWGameServices();
        }
    }, [isInitialized]);

    // State for game settings
    const [teamName, setTeamName] = useState('Team Intellect');
    const [teamMembers, setTeamMembers] = useState<string[]>([user?.name || 'Player 1']);
    const [newMember, setNewMember] = useState('');
    const [difficulty, setDifficulty] = useState<'Easy' | 'Medium' | 'Hard'>(
        config.questions.defaultDifficulty || 'Medium'
    );
    const [roundTime, setRoundTime] = useState(config.game.defaultRoundTime || 60); // seconds
    const [roundCount, setRoundCount] = useState(config.game.defaultRoundCount || 10);
    const [enableAIHost, setEnableAIHost] = useState<boolean>(config.aiHost.enabled || true);

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

        // Create game settings object to pass to the game screen
        const gameSettings: GameSettings = {
            teamName,
            teamMembers,
            difficulty,
            roundTime,
            roundCount,
            enableAIHost,
            questionSource, // Add this property
            userQuestions: questionSource === 'user' ? userQuestions : undefined, // Add this property
        };

        navigation.navigate('WWWGamePlay', gameSettings);
    };

    // Navigate to Question Management Screen
    const navigateToQuestionManagement = () => {
        navigation.navigate('QuestionManagement');
    };

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.keyboardAvoidContainer}
            >
                <ScrollView style={styles.scrollView}>
                    {/* Header */}
                    <View style={styles.header}>
                        <Text style={styles.headerTitle}>What? Where? When?</Text>
                        <Text style={styles.headerSubtitle}>Game Setup</Text>
                    </View>

                    {/* Question Source Section */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Question Source</Text>
                        <QuestionSourceSelector
                            source={questionSource}
                            onSelectSource={setQuestionSource}
                        />

                        {questionSource === 'user' && (
                            <TouchableOpacity
                                style={styles.manageQuestionsButton}
                                onPress={() => navigation.navigate('UserQuestions')}
                            >
                                <MaterialCommunityIcons name="playlist-edit" size={18} color="#4CAF50"/>
                                <Text style={styles.manageQuestionsText}>Manage My Questions</Text>
                            </TouchableOpacity>
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
                                        onSubmitEditing={addTeamMember}
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

                    {/* Game Settings Section */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Game Settings</Text>

                        {/* Difficulty */}
                        <View style={styles.settingItem}>
                            <Text style={styles.settingLabel}>Difficulty</Text>
                            <View style={styles.difficultyButtons}>
                                {(['Easy', 'Medium', 'Hard'] as const).map((level) => (
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

                        {/* Discussion Time */}
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

                        {/* Number of Questions */}
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
                                    Note: You only have {userQuestions.length} user questions available.
                                    The game will use all available questions.
                                </Text>
                            )}
                        </View>

                        {/* AI Host */}
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
                                {enableAIHost
                                    ? "AI Host will analyze team discussions and provide feedback"
                                    : "AI Host features will be disabled"}
                            </Text>
                        </View>
                    </View>

                    {/* Action Buttons */}
                    <View style={styles.actionsContainer}>
                        {/* Start Game Button */}
                        <TouchableOpacity
                            style={styles.startButton}
                            onPress={startGame}
                            disabled={
                                questionSource === 'user' &&
                                (!userQuestions || userQuestions.length === 0)
                            }
                        >
                            <Text style={styles.startButtonText}>Start Game</Text>
                        </TouchableOpacity>

                        {questionSource === 'user' && (!userQuestions || userQuestions.length === 0) && (
                            <Text style={styles.errorText}>
                                Please create and select some questions first
                            </Text>
                        )}

                        {/* Back Button */}
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

// Styles remain unchanged
const styles = StyleSheet.create({
    // Container styles
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

    // Header styles
    header: {
        backgroundColor: '#4CAF50',
        padding: 20,
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: 'white',
    },
    headerSubtitle: {
        fontSize: 16,
        color: 'rgba(255, 255, 255, 0.8)',
        marginTop: 5,
    },

    // Section styles
    section: {
        backgroundColor: 'white',
        borderRadius: 8,
        padding: 16,
        margin: 16,
        marginBottom: 8,
        elevation: 1,
        shadowOpacity: 0.1,
        shadowRadius: 2,
        shadowOffset: { width: 0, height: 1 },
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 16,
    },

    // Question source management
    manageQuestionsButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        marginTop: 8,
        backgroundColor: '#f0f0f0',
        borderRadius: 8,
    },
    manageQuestionsText: {
        marginLeft: 6,
        color: '#4CAF50',
        fontSize: 14,
        fontWeight: '500',
    },

    // Form elements
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

    // Team members
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

    // Settings
    settingItem: {
        marginBottom: 16,
    },
    settingLabel: {
        fontSize: 16,
        color: '#555',
        marginBottom: 8,
    },

    // Difficulty buttons
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

    // Time buttons
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

    // Count buttons
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

    // Toggle switch
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

    // Warning and error messages
    warningText: {
        color: '#FF9800',
        fontSize: 12,
        marginTop: 8,
        fontStyle: 'italic',
    },
    errorText: {
        color: '#F44336',
        fontSize: 14,
        textAlign: 'center',
        marginTop: 8,
    },

    // Action buttons
    actionsContainer: {
        padding: 16,
        marginBottom: 24,
    },
    startButton: {
        backgroundColor: '#4CAF50',
        padding: 16,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 16,
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
        color: '#555',
        fontSize: 16,
    },
    disabledButton: {
        opacity: 0.7,
    },

    // Question management button
    questionManagementButton: {
        position: 'absolute',
        right: 16,
        top: 16,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
    },
    questionManagementButtonText: {
        color: 'white',
        marginLeft: 4,
        fontSize: 12,
        fontWeight: '600',
    },
    questionManagementButtonAlt: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        marginTop: 16,
        borderTopWidth: 1,
        borderTopColor: '#E0E0E0',
    },
    questionManagementButtonAltText: {
        marginLeft: 6,
        color: '#4CAF50',
        fontSize: 14,
        fontWeight: '500',
    }
});

export default WWWGameSetupScreen;