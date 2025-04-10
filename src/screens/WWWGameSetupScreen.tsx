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
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

// Define the type for navigation
type WWWGameSetupScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;

const WWWGameSetupScreen: React.FC = () => {
    const navigation = useNavigation<WWWGameSetupScreenNavigationProp>();
    const {user} = useSelector((state: RootState) => state.auth);
    const {isInitialized, config} = useWWWGame();

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
            enableAIHost
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
                    <View style={styles.header}>
                        <Text style={styles.headerTitle}>What? Where? When?</Text>
                        <Text style={styles.headerSubtitle}>Game Setup</Text>

                        {/* Question Management Button - positioned in the header */}
                        <TouchableOpacity
                            style={styles.questionManagementButton}
                            onPress={navigateToQuestionManagement}
                        >
                            <MaterialCommunityIcons name="cog" size={24} color="white" />
                            <Text style={styles.questionManagementButtonText}>Manage Questions</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Rest of the component remains unchanged */}
                    {/* ... */}

                    {/* Start Game Button */}
                    <TouchableOpacity style={styles.startButton} onPress={startGame}>
                        <Text style={styles.startButtonText}>Start Game</Text>
                    </TouchableOpacity>

                    {/* Alternative Question Management Button - at the bottom */}
                    <TouchableOpacity
                        style={styles.questionManagementButtonAlt}
                        onPress={navigateToQuestionManagement}
                    >
                        <MaterialCommunityIcons name="playlist-edit" size={20} color="#4CAF50" />
                        <Text style={styles.questionManagementButtonAltText}>
                            Manage Question Database
                        </Text>
                    </TouchableOpacity>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

// Styles remain unchanged
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
        padding: 20,
        alignItems: 'center',
        position: 'relative', // For absolute positioning of the question management button
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
    },
    startButton: {
        backgroundColor: '#4CAF50',
        padding: 16,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 20,
    },
    startButtonText: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
    },
    // Other styles remain the same but are omitted for brevity...
});

export default WWWGameSetupScreen;