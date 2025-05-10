// src/screens/WWWGamePlayScreen.tsx
import React, {useEffect, useRef, useState} from 'react';
import {
    Alert,
    Animated,
    Modal,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import {RouteProp, useNavigation, useRoute} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {GameSettings, RoundData, WWWGameService} from "../services/wwwGame/wwwGameService.ts";
import VoiceRecorder from '../components/VoiceRecorder';

// Define the types for the navigation parameters
type RootStackParamList = {
    WWWGameSetup: undefined;
    WWWGamePlay: GameSettings;
    WWWGameResults: {
        teamName: string;
        score: number;
        totalRounds: number;
        roundsData: RoundData[];
    };
};

// Define navigation and route prop types
type WWWGamePlayNavigationProp = NativeStackNavigationProp<RootStackParamList, 'WWWGamePlay'>;
type WWWGamePlayRouteProp = RouteProp<RootStackParamList, 'WWWGamePlay'>;

const WWWGamePlayScreen: React.FC = () => {
    const route = useRoute<WWWGamePlayRouteProp>();
    const navigation = useNavigation<WWWGamePlayNavigationProp>();
    const {
        teamName,
        teamMembers,
        difficulty,
        roundTime,
        roundCount,
        enableAIHost
    } = route.params;

    // Game state
    const [currentRound, setCurrentRound] = useState(0);
    const [score, setScore] = useState(0);
    const [roundsData, setRoundsData] = useState<RoundData[]>([]);
    const [gamePhase, setGamePhase] = useState<'question' | 'discussion' | 'answer' | 'feedback'>('question');
    const [timer, setTimer] = useState(0);
    const [isTimerRunning, setIsTimerRunning] = useState(false);
    const [discussionNotes, setDiscussionNotes] = useState('');
    const [selectedPlayer, setSelectedPlayer] = useState('');
    const [teamAnswer, setTeamAnswer] = useState('');
    const [currentQuestion, setCurrentQuestion] = useState('');
    const [currentAnswer, setCurrentAnswer] = useState('');
    const [showHint, setShowHint] = useState(false);

    // Animated values
    const timerAnimation = useRef(new Animated.Value(1)).current;

    // Modal visibility
    const [showEndGameModal, setShowEndGameModal] = useState(false);

    // Initialize game with questions and round data
    useEffect(() => {
        // Use the game service to initialize the game
        const { gameQuestions, roundsData: initialRoundsData } = WWWGameService.initializeGame({
            teamName,
            teamMembers,
            difficulty: difficulty as 'Easy' | 'Medium' | 'Hard',
            roundTime,
            roundCount,
            enableAIHost
        });

        // Setup first question
        if (gameQuestions.length > 0) {
            setCurrentQuestion(gameQuestions[0].question);
            setCurrentAnswer(gameQuestions[0].answer);
        }

        // Set the initial rounds data
        setRoundsData(initialRoundsData);
    }, [difficulty, roundCount, teamName, teamMembers, enableAIHost]);

    // Timer effect
    useEffect(() => {
        let interval: NodeJS.Timeout | null = null;

        if (isTimerRunning && timer > 0) {
            interval = setInterval(() => {
                setTimer(prevTimer => prevTimer - 1);
            }, 1000);

            // Animate timer
            Animated.timing(timerAnimation, {
                toValue: timer / roundTime,
                duration: 1000,
                useNativeDriver: false,
            }).start();
        } else if (timer === 0 && isTimerRunning) {
            // Time's up
            setIsTimerRunning(false);
            if (gamePhase === 'discussion') {
                setGamePhase('answer');
            }
        }

        return () => {
            if (interval) clearInterval(interval);
        };
    }, [isTimerRunning, timer, gamePhase, roundTime, timerAnimation]);

    // Start discussion phase
    const startDiscussion = () => {
        setGamePhase('discussion');
        setTimer(roundTime);
        setIsTimerRunning(true);
    };

    // Submit team answer
    const submitAnswer = () => {
        if (!teamAnswer.trim()) {
            Alert.alert('Error', 'Please enter an answer');
            return;
        }

        if (!selectedPlayer) {
            Alert.alert('Error', 'Please select a player who is answering');
            return;
        }

        // Process the answer using the game service
        const { updatedRoundsData, isCorrect } = WWWGameService.processRoundAnswer(
            roundsData,
            currentRound,
            teamAnswer,
            selectedPlayer,
            discussionNotes
        );

        // Update state with new data
        setRoundsData(updatedRoundsData);

        // Update score
        if (isCorrect) {
            setScore(prevScore => prevScore + 1);
        }

        // Move to feedback phase
        setGamePhase('feedback');
    };

    // Move to next round
    const nextRound = () => {
        // Check if game is over
        if (currentRound + 1 >= roundCount) {
            // End game
            setShowEndGameModal(true);
            return;
        }

        // Reset round state
        setCurrentRound(prevRound => prevRound + 1);
        setGamePhase('question');
        setTeamAnswer('');
        setDiscussionNotes('');
        setSelectedPlayer('');
        setShowHint(false);

        // Set next question
        setCurrentQuestion(roundsData[currentRound + 1].question);
        setCurrentAnswer(roundsData[currentRound + 1].correctAnswer);
    };

    // End game and navigate to results
    const endGame = () => {
        setShowEndGameModal(false);
        navigation.navigate('WWWGameResults', {
            teamName,
            score,
            totalRounds: roundCount,
            roundsData
        });
    };

    // AI host feedback
    const getAIFeedback = () => {
        const currentRoundData = roundsData[currentRound];
        return WWWGameService.generateRoundFeedback(currentRoundData, enableAIHost);
    };

    // Render game UI based on phase
    const renderGamePhase = () => {
        switch (gamePhase) {
            case 'question':
                return (
                    <View style={styles.phaseContainer}>
                        <Text style={styles.questionNumber}>Question {currentRound + 1} of {roundCount}</Text>
                        <Text style={styles.question}>{currentQuestion}</Text>

                        <TouchableOpacity
                            style={styles.primaryButton}
                            onPress={startDiscussion}
                        >
                            <Text style={styles.buttonText}>Start Discussion</Text>
                        </TouchableOpacity>
                    </View>
                );

            case 'discussion':
                return (
                    <View style={styles.phaseContainer}>
                        <View style={styles.timerContainer}>
                            <Text style={styles.timerText}>{timer} seconds</Text>
                            <View style={styles.timerBar}>
                                <Animated.View
                                    style={[
                                        styles.timerProgress,
                                        { width: timerAnimation.interpolate({
                                                inputRange: [0, 1],
                                                outputRange: ['0%', '100%'],
                                            })}
                                    ]}
                                />
                            </View>
                        </View>

                        <Text style={styles.discussionTitle}>Team Discussion</Text>
                        <Text style={styles.question}>{currentQuestion}</Text>

                        {/* Add VoiceRecorder component */}
                        <VoiceRecorder
                            isActive={gamePhase === 'discussion'}
                            onTranscription={(text) => {
                                // Append transcribed text to discussion notes
                                setDiscussionNotes(prev => prev ? `${prev}\n${text}` : text);
                            }}
                        />

                        <View style={styles.notesContainer}>
                            <Text style={styles.notesLabel}>Discussion Notes (AI Host is listening)</Text>
                            <TextInput
                                style={styles.notesInput}
                                multiline
                                value={discussionNotes}
                                onChangeText={setDiscussionNotes}
                                placeholder="Take notes on your team's discussion..."
                            />
                        </View>

                        <TouchableOpacity
                            style={styles.secondaryButton}
                            onPress={() => {
                                setIsTimerRunning(false);
                                setGamePhase('answer');
                            }}
                        >
                            <Text style={styles.buttonText}>End Discussion Early</Text>
                        </TouchableOpacity>
                    </View>
                );

            case 'answer':
                return (
                    <View style={styles.phaseContainer}>
                        <Text style={styles.answerTitle}>Submit Your Answer</Text>
                        <Text style={styles.question}>{currentQuestion}</Text>

                        <View style={styles.formGroup}>
                            <Text style={styles.formLabel}>Select Player Answering:</Text>
                            <ScrollView
                                horizontal
                                showsHorizontalScrollIndicator={false}
                                style={styles.playersScroll}
                            >
                                {teamMembers.map((player, index) => (
                                    <TouchableOpacity
                                        key={index}
                                        style={[
                                            styles.playerButton,
                                            selectedPlayer === player && styles.selectedPlayerButton
                                        ]}
                                        onPress={() => setSelectedPlayer(player)}
                                    >
                                        <Text
                                            style={[
                                                styles.playerButtonText,
                                                selectedPlayer === player && styles.selectedPlayerText
                                            ]}
                                        >
                                            {player}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        </View>

                        <View style={styles.formGroup}>
                            <Text style={styles.formLabel}>Team Answer:</Text>
                            <TextInput
                                style={styles.answerInput}
                                value={teamAnswer}
                                onChangeText={setTeamAnswer}
                                placeholder="Enter your team's final answer"
                            />
                        </View>

                        {enableAIHost && (
                            <TouchableOpacity
                                style={styles.hintButton}
                                onPress={() => setShowHint(!showHint)}
                            >
                                <Text style={styles.hintButtonText}>
                                    {showHint ? 'Hide Hint' : 'Get Hint from AI Host'}
                                </Text>
                            </TouchableOpacity>
                        )}

                        {showHint && (
                            <View style={styles.hintContainer}>
                                <Text style={styles.hintText}>
                                    {WWWGameService.generateHint(currentAnswer)}
                                </Text>
                            </View>
                        )}

                        <TouchableOpacity
                            style={styles.primaryButton}
                            onPress={submitAnswer}
                        >
                            <Text style={styles.buttonText}>Submit Answer</Text>
                        </TouchableOpacity>
                    </View>
                );

            case 'feedback':
                const currentRoundData = roundsData[currentRound];
                return (
                    <View style={styles.phaseContainer}>
                        <Text style={styles.feedbackTitle}>Answer Feedback</Text>

                        <View style={styles.resultContainer}>
                            <Text style={styles.resultLabel}>Your Answer:</Text>
                            <Text style={styles.resultValue}>{currentRoundData.teamAnswer}</Text>

                            <Text style={styles.resultLabel}>Correct Answer:</Text>
                            <Text style={styles.resultValue}>{currentRoundData.correctAnswer}</Text>

                            <Text style={styles.resultLabel}>Result:</Text>
                            <View style={[
                                styles.resultBadge,
                                currentRoundData.isCorrect ? styles.correctBadge : styles.incorrectBadge
                            ]}>
                                <Text style={styles.resultBadgeText}>
                                    {currentRoundData.isCorrect ? 'CORRECT' : 'INCORRECT'}
                                </Text>
                            </View>

                            <Text style={styles.resultLabel}>Answered By:</Text>
                            <Text style={styles.resultValue}>{currentRoundData.playerWhoAnswered}</Text>
                        </View>

                        {enableAIHost && (
                            <View style={styles.aiFeedbackContainer}>
                                <Text style={styles.aiFeedbackTitle}>AI Host Feedback:</Text>
                                <Text style={styles.aiFeedbackText}>{getAIFeedback()}</Text>
                            </View>
                        )}

                        <TouchableOpacity
                            style={styles.primaryButton}
                            onPress={nextRound}
                        >
                            <Text style={styles.buttonText}>
                                {currentRound + 1 >= roundCount ? 'See Final Results' : 'Next Question'}
                            </Text>
                        </TouchableOpacity>
                    </View>
                );

            default:
                return null;
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <View style={styles.headerTop}>
                    <Text style={styles.teamName}>{teamName}</Text>
                    <Text style={styles.scoreText}>Score: {score}/{roundCount}</Text>
                </View>
                <View style={styles.progressBar}>
                    <View
                        style={[
                            styles.progressFill,
                            { width: `${(currentRound / roundCount) * 100}%` }
                        ]}
                    />
                </View>
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                {renderGamePhase()}
            </ScrollView>

            {/* End Game Modal */}
            <Modal
                visible={showEndGameModal}
                transparent
                animationType="fade"
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Game Over!</Text>
                        <Text style={styles.modalText}>
                            Your team scored {score} out of {roundCount} questions.
                        </Text>
                        <Text style={styles.modalScore}>
                            {score === roundCount
                                ? 'Perfect score! Incredible!'
                                : score > roundCount / 2
                                    ? 'Well done!'
                                    : 'Better luck next time!'}
                        </Text>

                        <TouchableOpacity
                            style={styles.modalButton}
                            onPress={endGame}
                        >
                            <Text style={styles.modalButtonText}>See Detailed Results</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    header: {
        backgroundColor: '#4CAF50',
        padding: 16,
    },
    headerTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    teamName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: 'white',
    },
    scoreText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: 'white',
    },
    progressBar: {
        height: 6,
        backgroundColor: 'rgba(255, 255, 255, 0.3)',
        borderRadius: 3,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        backgroundColor: 'white',
    },
    content: {
        padding: 16,
        flexGrow: 1,
    },
    phaseContainer: {
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    questionNumber: {
        fontSize: 14,
        color: '#666',
        marginBottom: 8,
    },
    question: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 24,
    },
    primaryButton: {
        backgroundColor: '#4CAF50',
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 8,
        alignItems: 'center',
    },
    secondaryButton: {
        backgroundColor: '#FF9800',
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 8,
        alignItems: 'center',
    },
    buttonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
    timerContainer: {
        marginBottom: 16,
    },
    timerText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 8,
        textAlign: 'center',
    },
    timerBar: {
        height: 10,
        backgroundColor: '#f0f0f0',
        borderRadius: 5,
        overflow: 'hidden',
    },
    timerProgress: {
        height: '100%',
        backgroundColor: '#4CAF50',
    },
    discussionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 16,
    },
    notesContainer: {
        marginBottom: 16,
    },
    notesLabel: {
        fontSize: 14,
        color: '#666',
        marginBottom: 8,
    },
    notesInput: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        padding: 12,
        minHeight: 120,
        textAlignVertical: 'top',
    },
    answerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 16,
    },
    formGroup: {
        marginBottom: 16,
    },
    formLabel: {
        fontSize: 14,
        color: '#666',
        marginBottom: 8,
    },
    playersScroll: {
        flexDirection: 'row',
        maxHeight: 50,
    },
    playerButton: {
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 20,
        backgroundColor: '#f0f0f0',
        marginRight: 8,
    },
    selectedPlayerButton: {
        backgroundColor: '#4CAF50',
    },
    playerButtonText: {
        color: '#333',
    },
    selectedPlayerText: {
        color: 'white',
        fontWeight: 'bold',
    },
    answerInput: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
    },
    hintButton: {
        alignSelf: 'center',
        padding: 8,
        marginBottom: 16,
    },
    hintButtonText: {
        color: '#2196F3',
        fontWeight: '500',
    },
    hintContainer: {
        backgroundColor: '#f5f5f5',
        padding: 12,
        borderRadius: 8,
        marginBottom: 16,
    },
    hintText: {
        color: '#555',
        fontStyle: 'italic',
    },
    feedbackTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 16,
    },
    resultContainer: {
        backgroundColor: '#f9f9f9',
        padding: 16,
        borderRadius: 8,
        marginBottom: 16,
    },
    resultLabel: {
        fontSize: 14,
        color: '#666',
        marginBottom: 4,
    },
    resultValue: {
        fontSize: 16,
        color: '#333',
        fontWeight: '500',
        marginBottom: 12,
    },
    resultBadge: {
        alignSelf: 'flex-start',
        paddingVertical: 4,
        paddingHorizontal: 12,
        borderRadius: 16,
        marginBottom: 12,
    },
    correctBadge: {
        backgroundColor: '#4CAF50',
    },
    incorrectBadge: {
        backgroundColor: '#F44336',
    },
    resultBadgeText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 12,
    },
    aiFeedbackContainer: {
        backgroundColor: '#E1F5FE',
        padding: 16,
        borderRadius: 8,
        marginBottom: 16,
    },
    aiFeedbackTitle: {
        fontSize: 14,
        color: '#0288D1',
        fontWeight: 'bold',
        marginBottom: 8,
    },
    aiFeedbackText: {
        color: '#333',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 24,
        width: '80%',
        alignItems: 'center',
    },
    modalTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 16,
    },
    modalText: {
        fontSize: 16,
        color: '#555',
        marginBottom: 8,
        textAlign: 'center',
    },
    modalScore: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#4CAF50',
        marginBottom: 24,
        textAlign: 'center',
    },
    modalButton: {
        backgroundColor: '#4CAF50',
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 8,
    },
    modalButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
});

export default WWWGamePlayScreen;
