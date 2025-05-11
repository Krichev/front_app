// src/screens/CreateWWWQuestScreen.tsx
import React, {useState} from 'react';
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
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {useCreateChallengeMutation} from '../entities/ChallengeState/model/slice/challengeApi';
import {useSelector} from 'react-redux';
import {RootState} from '../app/providers/StoreProvider/store';
import {GameSettings} from '../services/wwwGame/wwwGameService';
import {WWWQuizConfig} from '../entities/ChallengeState/model/types';
import {navigateToTab} from "../utils/navigation.ts"; // Import the new type

type RootStackParamList = {
    Challenges: undefined;
    WWWGamePlay: GameSettings & { challengeId?: string };
};

type CreateWWWQuestScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;

const CreateWWWQuestScreen: React.FC = () => {
    const navigation = useNavigation<CreateWWWQuestScreenNavigationProp>();
    const { user } = useSelector((state: RootState) => state.auth);
    const [createChallenge, { isLoading }] = useCreateChallengeMutation();

    // Form state
    const [title, setTitle] = useState('What? Where? When? Quiz');
    const [description, setDescription] = useState('Test your knowledge in this team-based quiz game.');
    const [reward, setReward] = useState('100 points');
    const [teamName, setTeamName] = useState('Team Intellect');
    const [teamMembers, setTeamMembers] = useState<string[]>([user?.name || 'Player 1']);
    const [newMember, setNewMember] = useState('');
    const [difficulty, setDifficulty] = useState<'Easy' | 'Medium' | 'Hard'>('Medium');
    const [roundTime, setRoundTime] = useState(60); // seconds
    const [roundCount, setRoundCount] = useState(10);
    const [enableAIHost, setEnableAIHost] = useState(true);

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

    // Create the quest
    const handleCreateQuest = async () => {
        if (!title.trim()) {
            Alert.alert('Error', 'Please enter a title for your quiz');
            return;
        }

        try {
            // Create the quiz config object with proper typing
            const quizConfig: WWWQuizConfig = {
                gameType: 'WWW',
                teamName,
                teamMembers,
                difficulty,
                roundTime,
                roundCount,
                enableAIHost,
                teamBased: true
            };

            // Create a new challenge with QUIZ type
            const result = await createChallenge({
                title,
                description,
                type: 'QUIZ',
                verificationMethod: 'QUIZ',
                visibility: 'PUBLIC',
                status: 'ACTIVE',
                reward,
                // Store WWW specific config as JSON
                quizConfig: JSON.stringify(quizConfig)
            }).unwrap();

            Alert.alert('Success', 'Quiz challenge created successfully!', [
                {
                    text: 'Start Game Now',
                    onPress: () => {
                        // Navigate to game with settings
                        navigation.navigate('WWWGamePlay', {
                            teamName,
                            teamMembers,
                            difficulty,
                            roundTime,
                            roundCount,
                            enableAIHost,
                            challengeId: result.id // Pass the challenge ID for tracking progress
                        });
                    }
                },
                {
                    text: 'Back to Challenges',
                    onPress: () => navigateToTab(navigation, 'Challenges')
                }
            ]);
        } catch (error) {
            console.error('Failed to create challenge:', error);
            Alert.alert('Error', 'Failed to create quiz challenge. Please try again.');
        }
    };

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
                            style={[styles.createButton, isLoading && styles.disabledButton]}
                            onPress={handleCreateQuest}
                            disabled={isLoading}
                        >
                            <Text style={styles.createButtonText}>
                                {isLoading ? 'Creating...' : 'Create Quiz Challenge'}
                            </Text>
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
    },
});

export default CreateWWWQuestScreen;