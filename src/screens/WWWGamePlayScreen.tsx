// src/screens/WWWGamePlayScreen.tsx - Updated to use Quiz Session API
import React, {useEffect, useRef, useState} from 'react';
import {
    Alert,
    Animated,
    Modal,
    Platform,
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
import {
    QuizRound,
    useBeginQuizSessionMutation,
    useCompleteQuizSessionMutation,
    useGetQuizRoundsQuery,
    useGetQuizSessionQuery,
    useSubmitRoundAnswerMutation
} from '../entities/QuizState/model/slice/quizApi';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import VoiceRecorder from '../components/VoiceRecorder';

import {RootStackParamList} from '../navigation/AppNavigator';

type WWWGamePlayNavigationProp = NativeStackNavigationProp<RootStackParamList, 'WWWGamePlay'>;
type WWWGamePlayRouteProp = RouteProp<RootStackParamList, 'WWWGamePlay'>;

const WWWGamePlayScreen: React.FC = () => {
    const route = useRoute<WWWGamePlayRouteProp>();
    const navigation = useNavigation<WWWGamePlayNavigationProp>();

    const params = route.params;
    const sessionId = params?.sessionId;
    const challengeId = params?.challengeId;

    // Support both old GameSettings format and new sessionId format
    const gameSettings = params as any;

    // const { sessionId, challengeId } = route.params;

    // API hooks
    const { data: session, isLoading: isLoadingSession } = useGetQuizSessionQuery(sessionId);
    const { data: rounds = [], isLoading: isLoadingRounds, refetch: refetchRounds } = useGetQuizRoundsQuery(sessionId);
    const [beginQuizSession] = useBeginQuizSessionMutation();
    const [submitRoundAnswer] = useSubmitRoundAnswerMutation();
    const [completeQuizSession] = useCompleteQuizSessionMutation();

    // Game state
    const [currentRound, setCurrentRound] = useState(0);
    const [gamePhase, setGamePhase] = useState<'waiting' | 'question' | 'discussion' | 'answer' | 'feedback'>('waiting');
    const [timer, setTimer] = useState(0);
    const [isTimerRunning, setIsTimerRunning] = useState(false);
    const [discussionNotes, setDiscussionNotes] = useState('');
    const [selectedPlayer, setSelectedPlayer] = useState('');
    const [teamAnswer, setTeamAnswer] = useState('');
    const [showHint, setShowHint] = useState(false);
    const [gameStartTime, setGameStartTime] = useState<Date | null>(null);
    const [roundStartTime, setRoundStartTime] = useState<Date | null>(null);

    // Voice recording state
    const [isVoiceRecordingEnabled, setIsVoiceRecordingEnabled] = useState(false);
    const [isRecordingVoiceAnswer, setIsRecordingVoiceAnswer] = useState(false);
    const [voiceTranscription, setVoiceTranscription] = useState('');

    // Animated values
    const timerAnimation = useRef(new Animated.Value(1)).current;

    // Modal visibility
    const [showEndGameModal, setShowEndGameModal] = useState(false);

    // Initialize game when session and rounds are loaded
    useEffect(() => {
        if (session && rounds.length > 0) {
            if (session.status === 'CREATED') {
                setGamePhase('question');
            } else if (session.status === 'IN_PROGRESS') {
                // Determine current round based on completed rounds
                const currentRoundIndex = session.completedRounds || 0;
                setCurrentRound(currentRoundIndex);

                if (currentRoundIndex >= rounds.length) {
                    // Game should be completed
                    setShowEndGameModal(true);
                } else {
                    // Check if current round has an answer
                    const currentRoundData = rounds[currentRoundIndex];
                    if (currentRoundData.teamAnswer) {
                        setGamePhase('feedback');
                        setTeamAnswer(currentRoundData.teamAnswer);
                        setSelectedPlayer(currentRoundData.playerWhoAnswered || '');
                        setDiscussionNotes(currentRoundData.discussionNotes || '');
                    } else {
                        setGamePhase('question');
                    }
                }
            } else if (session.status === 'COMPLETED') {
                setShowEndGameModal(true);
            }

            // Set voice recording based on difficulty
            setIsVoiceRecordingEnabled(session.difficulty === 'EASY');

            // Set game start time
            if (session.startedAt && !gameStartTime) {
                setGameStartTime(new Date(session.startedAt));
            }
        }
    }, [session, rounds, gameStartTime]);

    // Timer effect
    useEffect(() => {
        let interval: NodeJS.Timeout | null = null;

        if (isTimerRunning && timer > 0) {
            interval = setInterval(() => {
                setTimer(prevTimer => prevTimer - 1);
            }, 1000);

            // Animate timer
            Animated.timing(timerAnimation, {
                toValue: timer / (session?.roundTimeSeconds || 60),
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
    }, [isTimerRunning, timer, gamePhase, session?.roundTimeSeconds, timerAnimation]);

    // Start the game session
    const startGame = async () => {
        if (!session) return;

        try {
            await beginQuizSession(sessionId).unwrap();
            setGameStartTime(new Date());
            setGamePhase('question');
        } catch (error) {
            console.error('Failed to start quiz session:', error);
            Alert.alert('Error', 'Failed to start the quiz session');
        }
    };

    // Start discussion phase
    const startDiscussion = () => {
        setGamePhase('discussion');
        setTimer(session?.roundTimeSeconds || 60);
        setIsTimerRunning(true);
        setVoiceTranscription('');
        setRoundStartTime(new Date());
    };

    // Handle voice transcription updates
    const handleVoiceTranscription = (text: string) => {
        if (gamePhase === 'discussion') {
            setDiscussionNotes(prev => prev ? `${prev}\n${text}` : text);
            setVoiceTranscription(text);
        } else if (gamePhase === 'answer' && isRecordingVoiceAnswer) {
            setTeamAnswer(text);
            setVoiceTranscription(text);
        }
    };

    // Toggle voice answer recording
    const toggleVoiceAnswer = () => {
        setIsRecordingVoiceAnswer(!isRecordingVoiceAnswer);
        if (!isRecordingVoiceAnswer) {
            setTeamAnswer('');
        }
    };

    // Submit team answer
    const submitAnswer = async () => {
        if (!teamAnswer.trim()) {
            Alert.alert('Error', 'Please enter or record an answer');
            return;
        }

        if (!selectedPlayer) {
            Alert.alert('Error', 'Please select a player who is answering');
            return;
        }

        try {
            await submitRoundAnswer({
                sessionId,
                request: {
                    roundNumber: currentRound + 1,
                    teamAnswer,
                    playerWhoAnswered: selectedPlayer,
                    discussionNotes,
                    hintUsed: showHint,
                    voiceRecordingUsed: isRecordingVoiceAnswer,
                }
            }).unwrap();

            // Refetch rounds to get updated data
            refetchRounds();

            // Move to feedback phase
            setGamePhase('feedback');
            setIsRecordingVoiceAnswer(false);
        } catch (error) {
            console.error('Failed to submit answer:', error);
            Alert.alert('Error', 'Failed to submit answer. Please try again.');
        }
    };

    // Move to next round
    const nextRound = () => {
        // Check if game is over
        if (currentRound + 1 >= (session?.totalRounds || 0)) {
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
    };

    // End game and navigate to results
    const endGame = async () => {
        if (!session) return;

        try {
            await completeQuizSession(sessionId).unwrap();
        } catch (error) {
            console.error('Failed to complete quiz session:', error);
        }

        setShowEndGameModal(false);

        const gameEndTime = new Date();
        const gameDuration = gameStartTime
            ? Math.floor((gameEndTime.getTime() - gameStartTime.getTime()) / 1000)
            : 0;

        const navigateToResults = () => {
            const navigationParams: RootStackParamList['WWWGameResults'] = {
                teamName: gameSettings?.teamName || 'Team',
                score: 0,
                totalRounds: gameSettings?.roundCount || 10,
                roundsData: [],
                challengeId,
                sessionId,
                gameStartTime: new Date().toISOString(),
                gameDuration: 0
            };

            navigation.navigate('WWWGameResults', navigationParams);
        };

    // Get current round data
    const getCurrentRound = (): QuizRound | null => {
        return rounds[currentRound] || null;
    };

    // Generate hint
    const generateHint = (correctAnswer: string): string => {
        if (!correctAnswer) return 'No hint available';

        const words = correctAnswer.split(' ');
        const difficulty = session?.difficulty || 'MEDIUM';

        switch (difficulty) {
            case 'EASY':
                const firstLetters = words.map(w => w[0]).join(' ');
                return `Starts with: ${firstLetters} (${words.length} word${words.length !== 1 ? 's' : ''})`;
            case 'MEDIUM':
                return `${correctAnswer.length} characters, ${words.length} word${words.length !== 1 ? 's' : ''}`;
            case 'HARD':
                return words.length > 1 ? `${words.length}-word answer` : `Single word, ${correctAnswer.length} letters`;
            default:
                return `${correctAnswer.length} characters total`;
        }
    };

    if (isLoadingSession || isLoadingRounds) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.loadingContainer}>
                    <Text style={styles.loadingText}>Loading quiz session...</Text>
                </View>
            </SafeAreaView>
        );
    }

    if (!session) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.errorContainer}>
                    <Text style={styles.errorText}>Quiz session not found</Text>
                    <TouchableOpacity
                        style={styles.errorButton}
                        onPress={() => navigation.goBack()}
                    >
                        <Text style={styles.errorButtonText}>Go Back</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    const currentRoundData = getCurrentRound();

    // Render game UI based on phase
    const renderGamePhase = () => {
        switch (gamePhase) {
            case 'waiting':
                return (
                    <View style={styles.phaseContainer}>
                        <Text style={styles.waitingTitle}>Ready to Start?</Text>
                        <Text style={styles.waitingDescription}>
                            Your quiz session is ready. When you're ready to begin, press the button below.
                        </Text>
                        <TouchableOpacity
                            style={styles.primaryButton}
                            onPress={startGame}
                        >
                            <Text style={styles.buttonText}>Start Quiz</Text>
                        </TouchableOpacity>
                    </View>
                );

            case 'question':
                if (!currentRoundData) return null;

                return (
                    <View style={styles.phaseContainer}>
                        <Text style={styles.questionNumber}>
                            Question {currentRound + 1} of {session.totalRounds}
                        </Text>
                        <Text style={styles.question}>{currentRoundData.question.question}</Text>

                        <TouchableOpacity
                            style={styles.primaryButton}
                            onPress={startDiscussion}
                        >
                            <Text style={styles.buttonText}>Start Discussion</Text>
                        </TouchableOpacity>
                    </View>
                );

            case 'discussion':
                if (!currentRoundData) return null;

                return (
                    <View style={styles.phaseContainer}>
                        <View style={styles.timerContainer}>
                            <Text style={styles.timerText}>{timer} seconds</Text>
                            <View style={styles.timerBar}>
                                <Animated.View
                                    style={[
                                        styles.timerProgress,
                                        {
                                            width: timerAnimation.interpolate({
                                                inputRange: [0, 1],
                                                outputRange: ['0%', '100%'],
                                            })
                                        }
                                    ]}
                                />
                            </View>
                        </View>

                        <Text style={styles.discussionTitle}>Team Discussion</Text>
                        <Text style={styles.question}>{currentRoundData.question.question}</Text>

                        {isVoiceRecordingEnabled && (
                            <View style={styles.voiceRecorderContainer}>
                                <VoiceRecorder
                                    onTranscription={handleVoiceTranscription}
                                    isActive={gamePhase === 'discussion'}
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
                            <Text style={styles.notesLabel}>
                                Discussion Notes {isVoiceRecordingEnabled ? '(Voice transcriptions will appear here)' : ''}
                            </Text>
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
                if (!currentRoundData) return null;

                return (
                    <View style={styles.phaseContainer}>
                        <Text style={styles.answerTitle}>Submit Your Answer</Text>
                        <Text style={styles.question}>{currentRoundData.question.question}</Text>

                        <View style={styles.formGroup}>
                            <Text style={styles.formLabel}>Select Player Answering:</Text>
                            <ScrollView
                                horizontal
                                showsHorizontalScrollIndicator={false}
                                style={styles.playersScroll}
                            >
                                {session.teamMembers.map((player, index) => (
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
                        </View>

                        {session.enableAiHost && (
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
                                    {generateHint(currentRoundData.question.answer)}
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
                if (!currentRoundData) return null;

                return (
                    <View style={styles.phaseContainer}>
                        <Text style={styles.feedbackTitle}>Answer Feedback</Text>

                        <View style={styles.resultContainer}>
                            <Text style={styles.resultLabel}>Your Answer:</Text>
                            <Text style={styles.resultValue}>{currentRoundData.teamAnswer || teamAnswer}</Text>

                            <Text style={styles.resultLabel}>Correct Answer:</Text>
                            <Text style={styles.resultValue}>{currentRoundData.question.answer}</Text>

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
                            <Text style={styles.resultValue}>{currentRoundData.playerWhoAnswered || selectedPlayer}</Text>
                        </View>

                        {session.enableAiHost && currentRoundData.aiFeedback && (
                            <View style={styles.aiFeedbackContainer}>
                                <Text style={styles.aiFeedbackTitle}>AI Host Feedback:</Text>
                                <Text style={styles.aiFeedbackText}>{currentRoundData.aiFeedback}</Text>
                            </View>
                        )}

                        <TouchableOpacity
                            style={styles.primaryButton}
                            onPress={nextRound}
                        >
                            <Text style={styles.buttonText}>
                                {currentRound + 1 >= session.totalRounds ? 'See Final Results' : 'Next Question'}
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
                    <Text style={styles.teamName}>{session.teamName}</Text>
                    <Text style={styles.scoreText}>Score: {session.correctAnswers}/{session.totalRounds}</Text>
                </View>
                <View style={styles.progressBar}>
                    <View
                        style={[
                            styles.progressFill,
                            {width: `${(currentRound / session.totalRounds) * 100}%`}
                        ]}
                    />
                </View>
                {gameStartTime && (
                    <Text style={styles.gameTimeText}>
                        Started: {gameStartTime.toLocaleTimeString()}
                    </Text>
                )}
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
                            Your team scored {session.correctAnswers} out of {session.totalRounds} questions.
                        </Text>
                        <Text style={styles.modalScore}>
                            {session.correctAnswers === session.totalRounds
                                ? 'Perfect score! Incredible!'
                                : session.correctAnswers > session.totalRounds / 2
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
    gameTimeText: {
        fontSize: 12,
        color: 'rgba(255, 255, 255, 0.8)',
        marginTop: 4,
        textAlign: 'center',
    },
    content: {
        padding: 16,
        flexGrow: 1,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        fontSize: 16,
        color: '#666',
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    errorText: {
        fontSize: 18,
        color: '#F44336',
        marginBottom: 20,
        textAlign: 'center',
    },
    errorButton: {
        backgroundColor: '#4CAF50',
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 8,
    },
    errorButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
    phaseContainer: {
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 2},
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    waitingTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 16,
        textAlign: 'center',
    },
    waitingDescription: {
        fontSize: 16,
        color: '#666',
        marginBottom: 24,
        textAlign: 'center',
        lineHeight: 22,
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
        lineHeight: 28,
        fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
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
});

export default WWWGamePlayScreen;