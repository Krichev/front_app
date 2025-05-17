// src/screens/WWWGamePlayScreen.tsx with voice recording capabilities
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
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
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
        challengeId?: string;
    };
};

// Define navigation and route prop types
type WWWGamePlayNavigationProp = NativeStackNavigationProp<RootStackParamList, 'WWWGamePlay'>;
type WWWGamePlayRouteProp = RouteProp<RootStackParamList, 'WWWGamePlay'>;

const WWWGamePlayScreen: React.FC = () => {
    const route = useRoute<WWWGamePlayRouteProp>();
    const navigation = useNavigation<WWWGamePlayNavigationProp>();

    // Extract parameters from route
    const {
        teamName,
        teamMembers,
        difficulty,
        roundTime,
        roundCount,
        enableAIHost,
        challengeId,
        questionSource,
        userQuestions
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

    // Voice recording state
    const [isVoiceRecordingEnabled, setIsVoiceRecordingEnabled] = useState(difficulty === 'Easy');
    const [isRecordingVoiceAnswer, setIsRecordingVoiceAnswer] = useState(false);
    const [voiceTranscription, setVoiceTranscription] = useState('');

    const [recognitionLanguage, setRecognitionLanguage] = useState<'en' | 'ru'>('en');

    const toggleRecognitionLanguage = () => {
        setRecognitionLanguage(prev => prev === 'en' ? 'ru' : 'en');
    };

    // Animated values
    const timerAnimation = useRef(new Animated.Value(1)).current;

    // Modal visibility
    const [showEndGameModal, setShowEndGameModal] = useState(false);

    // Initialize game with questions and round data
    useEffect(() => {
        // Use the game service to initialize the game with the appropriate questions
        console.log("Initializing game with params:", {
            teamName,
            teamMembers,
            difficulty,
            roundTime,
            roundCount,
            enableAIHost,
            questionSource,
            userQuestions: userQuestions?.length || 0,  // Log question count for debugging
        });

        // Choose initialization method based on question source
        if (questionSource === 'user' && userQuestions && userQuestions.length > 0) {
            console.log("Initializing with user questions:", userQuestions.length);

            // Use user questions
            const { gameQuestions, roundsData: initialRoundsData } = WWWGameService.initializeGameWithExternalQuestions({
                teamName,
                teamMembers,
                difficulty: difficulty as 'Easy' | 'Medium' | 'Hard',
                roundTime,
                roundCount,
                enableAIHost,
                userQuestions
            });

            // Setup first question
            if (gameQuestions.length > 0) {
                console.log("First user question:", gameQuestions[0].question.substring(0, 30) + "...");
                setCurrentQuestion(gameQuestions[0].question);
                setCurrentAnswer(gameQuestions[0].answer);
            }

            // Set the initial rounds data
            setRoundsData(initialRoundsData);
        }
        else if (questionSource === 'app' && userQuestions && userQuestions.length > 0) {
            console.log("Initializing with app questions from db.chgk.info:", userQuestions.length);

            // Important: Use the app questions that were passed via navigation
            const { gameQuestions, roundsData: initialRoundsData } = WWWGameService.initializeGameWithExternalQuestions({
                teamName,
                teamMembers,
                difficulty: difficulty as 'Easy' | 'Medium' | 'Hard',
                roundTime,
                roundCount,
                enableAIHost,
                userQuestions  // This is actually appQuestions passed via navigation
            });

            // Setup first question
            if (gameQuestions.length > 0) {
                console.log("First app question:", gameQuestions[0].question.substring(0, 30) + "...");
                setCurrentQuestion(gameQuestions[0].question);
                setCurrentAnswer(gameQuestions[0].answer);
            }

            // Set the initial rounds data
            setRoundsData(initialRoundsData);
        }
        else {
            console.log("Initializing with default questions (no external questions provided)");

            // Use the default initialization with built-in questions
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
                console.log("First default question:", gameQuestions[0].question.substring(0, 30) + "...");
                setCurrentQuestion(gameQuestions[0].question);
                setCurrentAnswer(gameQuestions[0].answer);
            }

            // Set the initial rounds data
            setRoundsData(initialRoundsData);
        }
    }, [difficulty, roundCount, teamName, teamMembers, enableAIHost, questionSource, userQuestions]);
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
        // Reset voice transcription when starting discussion
        setVoiceTranscription('');
    };

    // Handle voice transcription updates
    const handleVoiceTranscription = (text: string) => {
        if (gamePhase === 'discussion') {
            // For discussion phase, append to discussion notes
            setDiscussionNotes(prev => prev ? `${prev}\n${text}` : text);
            setVoiceTranscription(text);
        } else if (gamePhase === 'answer' && isRecordingVoiceAnswer) {
            // For answer phase, set as the team answer
            setTeamAnswer(text);
            setVoiceTranscription(text);
        }
    };

    // Toggle voice answer recording
    const toggleVoiceAnswer = () => {
        setIsRecordingVoiceAnswer(!isRecordingVoiceAnswer);
        if (!isRecordingVoiceAnswer) {
            // Reset the team answer when starting recording
            setTeamAnswer('');
        }
    };

    // Submit team answer
    const submitAnswer = () => {
        if (!teamAnswer.trim()) {
            Alert.alert('Error', 'Please enter or record an answer');
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

        // Reset voice recording state
        setIsRecordingVoiceAnswer(false);
    };

    // Move to next round
    const nextRound = () => {
        // Check if game is over
        if (currentRound + 1 >= roundCount || currentRound + 1 >= roundsData.length) {
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
        setVoiceTranscription('');

        // Set next question if available
        const nextRoundIndex = currentRound + 1;
        if (roundsData[nextRoundIndex]) {
            setCurrentQuestion(roundsData[nextRoundIndex].question);
            setCurrentAnswer(roundsData[nextRoundIndex].correctAnswer);
        }
    };

    // End game and navigate to results
    const endGame = () => {
        setShowEndGameModal(false);
        navigation.navigate('WWWGameResults', {
            teamName,
            score,
            totalRounds: roundsData.length,
            roundsData,
            challengeId // Pass the challengeId to the results screen
        });
    };

    // AI host feedback
    const getAIFeedback = () => {
        const currentRoundData = roundsData[currentRound];
        if (!currentRoundData) return '';
        return WWWGameService.generateRoundFeedback(currentRoundData, enableAIHost);
    };

    // Render game UI based on phase
    const renderGamePhase = () => {
        switch (gamePhase) {
            case 'question':
                return (
                    <View style={styles.phaseContainer}>
                        <Text style={styles.questionNumber}>Question {currentRound + 1} of {roundsData.length}</Text>
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

                        {/* Voice Recording for Easy Difficulty */}
                        {isVoiceRecordingEnabled && (
                            <View style={styles.voiceRecorderContainer}>
                                <VoiceRecorder
                                    onTranscription={handleVoiceTranscription}
                                    isActive={gamePhase === 'discussion' || (gamePhase === 'answer' && isRecordingVoiceAnswer)}
                                    language={recognitionLanguage}
                                    onLanguageToggle={toggleRecognitionLanguage}
                                />
                                {voiceTranscription ? (
                                    <View style={styles.transcriptionContainer}>
                                        <Text style={styles.transcriptionLabel}>Last Transcription:</Text>
                                        <Text style={styles.transcriptionText}>{voiceTranscription}</Text>
                                    </View>
                                ) : null}
                            </View>
                        )}

                        <View style={styles.notesContainer}>
                            <Text style={styles.notesLabel}>Discussion Notes {isVoiceRecordingEnabled ? '(Voice transcriptions will appear here)' : ''}</Text>
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
                            <View style={styles.answerInputContainer}>
                                <View style={styles.languageToggleContainer}>
                                    <Text style={styles.languageToggleLabel}>Answer Language:</Text>
                                    <TouchableOpacity
                                        style={[
                                            styles.languageToggleButton,
                                            { backgroundColor: recognitionLanguage === 'en' ? '#2196F3' : '#4CAF50' }
                                        ]}
                                        onPress={toggleRecognitionLanguage}
                                    >
                                        <Text style={styles.languageToggleText}>
                                            {recognitionLanguage === 'en' ? 'English' : 'Russian'}
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                                <TextInput
                                    style={styles.answerInput}
                                    value={teamAnswer}
                                    onChangeText={setTeamAnswer}
                                    placeholder="Enter your team's final answer (Russian accepted)"
                                    placeholderTextColor="#999"
                                    autoCorrect={false}
                                    // These props help with proper display of Cyrillic characters
                                    autoCapitalize="none"
                                    // Support Russian keyboard input
                                    keyboardType="default"
                                />
                                <View style={styles.languageIndicator}>
                                    <Text style={styles.languageText}>EN/RU</Text>
                                </View>
                            </View>
                            <Text style={styles.answerHintText}>
                                Answers in both English and Russian are accepted.
                            </Text>
                        </View>

                        {/* Voice Answer Option */}
                        <View style={styles.voiceAnswerContainer}>
                            <TouchableOpacity
                                style={[
                                    styles.voiceAnswerButton,
                                    isRecordingVoiceAnswer && styles.voiceAnswerButtonActive
                                ]}
                                onPress={toggleVoiceAnswer}
                            >
                                <MaterialCommunityIcons
                                    name={isRecordingVoiceAnswer ? "stop" : "microphone"}
                                    size={24}
                                    color="white"
                                />
                                <Text style={styles.voiceAnswerButtonText}>
                                    {isRecordingVoiceAnswer ? "Stop Recording" : "Record Answer"}
                                </Text>
                            </TouchableOpacity>

                            {isRecordingVoiceAnswer && (
                                <VoiceRecorder
                                    onTranscription={handleVoiceTranscription}
                                    isActive={isRecordingVoiceAnswer}
                                />
                            )}

                            {isRecordingVoiceAnswer && voiceTranscription && (
                                <View style={styles.transcriptionContainer}>
                                    <Text style={styles.transcriptionLabel}>Voice Answer:</Text>
                                    <Text style={styles.transcriptionText}>{voiceTranscription}</Text>
                                </View>
                            )}
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
                if (!currentRoundData) {
                    return (
                        <View style={styles.phaseContainer}>
                            <Text>No data available for this round</Text>
                        </View>
                    );
                }

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
                                {currentRound + 1 >= roundsData.length ? 'See Final Results' : 'Next Question'}
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
                    <Text style={styles.scoreText}>Score: {score}/{roundsData.length}</Text>
                </View>
                <View style={styles.progressBar}>
                    <View
                        style={[
                            styles.progressFill,
                            { width: `${roundsData.length > 0 ? (currentRound / roundsData.length) * 100 : 0}%` }
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
                            Your team scored {score} out of {roundsData.length} questions.
                        </Text>
                        <Text style={styles.modalScore}>
                            {score === roundsData.length
                                ? 'Perfect score! Incredible!'
                                : score > roundsData.length / 2
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
    // Voice recording styles
    voiceRecorderContainer: {
        marginBottom: 16,
        backgroundColor: '#f9f9f9',
        padding: 12,
        borderRadius: 8,
    },
    transcriptionContainer: {
        marginTop: 8,
        backgroundColor: '#f0f0f0',
        padding: 12,
        borderRadius: 8,
    },
    transcriptionLabel: {
        fontWeight: 'bold',
        fontSize: 14,
        color: '#555',
        marginBottom: 4,
    },
    transcriptionText: {
        fontSize: 14,
        color: '#333',
        fontStyle: 'italic',
    },
    voiceAnswerContainer: {
        marginBottom: 16,
    },
    voiceAnswerButton: {
        flexDirection: 'row',
        backgroundColor: '#FF9800',
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
    },
    voiceAnswerButtonActive: {
        backgroundColor: '#F44336',
    },
    voiceAnswerButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
        marginLeft: 8,
    },
    answerInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        backgroundColor: 'white',
    },
    languageIndicator: {
        paddingHorizontal: 8,
        backgroundColor: '#f0f0f0',
        height: '100%',
        justifyContent: 'center',
        borderTopRightRadius: 8,
        borderBottomRightRadius: 8,
    },
    languageText: {
        fontSize: 12,
        color: '#666',
        fontWeight: 'bold',
    },
    answerHintText: {
        fontSize: 12,
        color: '#666',
        fontStyle: 'italic',
        marginTop: 4,
    },
    languageToggleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },
    languageToggleLabel: {
        fontSize: 14,
        color: '#555',
        marginRight: 8,
    },
    languageToggleButton: {
        paddingVertical: 6,
        paddingHorizontal: 16,
        borderRadius: 16,
        elevation: 1,
    },
    languageToggleText: {
        color: 'white',
        fontWeight: 'bold',
    }
});

export default WWWGamePlayScreen;