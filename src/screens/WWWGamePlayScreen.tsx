// src/screens/WWWGamePlayScreen.tsx - Complete updated version
import React, {useEffect, useRef, useState} from 'react';
import {
    ActivityIndicator,
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
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

// Import global navigation types
import {RootStackParamList} from '../navigation/AppNavigator';

// Import Quiz API hooks (if available, otherwise comment out and use fallback)
import {
    QuizRound,
    useBeginQuizSessionMutation,
    useCompleteQuizSessionMutation,
    useGetQuizRoundsQuery,
    useGetQuizSessionQuery,
    useSubmitRoundAnswerMutation
} from '../entities/QuizState/model/slice/quizApi';

// Import VoiceRecorder component (if available)
// import VoiceRecorder from '../components/VoiceRecorder';

// Use global navigation types
type WWWGamePlayNavigationProp = NativeStackNavigationProp<RootStackParamList, 'WWWGamePlay'>;
type WWWGamePlayRouteProp = RouteProp<RootStackParamList, 'WWWGamePlay'>;

// Game phase type
type GamePhase = 'waiting' | 'question' | 'discussion' | 'answer' | 'feedback';

const WWWGamePlayScreen: React.FC = () => {
    const route = useRoute<WWWGamePlayRouteProp>();
    const navigation = useNavigation<WWWGamePlayNavigationProp>();

    // Extract params with proper typing
    const params = route.params;
    const sessionId = params?.sessionId;
    const challengeId = params?.challengeId;

    // Support both old GameSettings format and new sessionId format
    const gameSettings = params;

    // Early return if sessionId is missing and we're using the new API
    if (!sessionId && !gameSettings?.teamName) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.errorContainer}>
                    <MaterialCommunityIcons name="alert-circle" size={48} color="#F44336" />
                    <Text style={styles.errorText}>Invalid game session</Text>
                    <Text style={styles.errorSubtext}>
                        Required game parameters are missing
                    </Text>
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

    // API hooks with proper error handling (skip if sessionId not available)
    const {
        data: session,
        isLoading: isLoadingSession,
        error: sessionError
    } = useGetQuizSessionQuery(sessionId!, {
        skip: !sessionId,
    });

    const {
        data: rounds = [],
        isLoading: isLoadingRounds,
        refetch: refetchRounds,
        error: roundsError
    } = useGetQuizRoundsQuery(sessionId!, {
        skip: !sessionId,
    });

    // Mutations
    const [beginQuizSession] = useBeginQuizSessionMutation();
    const [submitRoundAnswer] = useSubmitRoundAnswerMutation();
    const [completeQuizSession] = useCompleteQuizSessionMutation();

    // Game state
    const [currentRound, setCurrentRound] = useState(0);
    const [gamePhase, setGamePhase] = useState<GamePhase>('waiting');
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

    // Modal visibility
    const [showEndGameModal, setShowEndGameModal] = useState(false);

    // Animated values
    const timerAnimation = useRef(new Animated.Value(1)).current;

    // Fallback game data for when not using Quiz API
    const fallbackGameData = {
        teamName: gameSettings?.teamName || 'Team Intellect',
        teamMembers: gameSettings?.teamMembers || ['Player 1'],
        difficulty: gameSettings?.difficulty || 'Medium',
        roundTimeSeconds: gameSettings?.roundTime || 60,
        totalRounds: gameSettings?.roundCount || 10,
        enableAiHost: gameSettings?.enableAIHost !== false,
        correctAnswers: 0,
    };

    // Use session data if available, otherwise use fallback
    const gameData = session || fallbackGameData;

    // Initialize game when session and rounds are loaded
    useEffect(() => {
        if (sessionId && session && rounds.length > 0) {
            // Handle session-based game initialization
            if (session.status === 'CREATED') {
                setGamePhase('question');
            } else if (session.status === 'IN_PROGRESS') {
                const currentRoundIndex = session.completedRounds || 0;
                setCurrentRound(currentRoundIndex);

                if (currentRoundIndex >= rounds.length) {
                    setShowEndGameModal(true);
                } else {
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

            setIsVoiceRecordingEnabled(session.difficulty === 'EASY');

            if (session.startedAt && !gameStartTime) {
                setGameStartTime(new Date(session.startedAt));
            }
        } else if (!sessionId && gameSettings) {
            // Handle fallback game initialization
            setGamePhase('question');
            setGameStartTime(new Date());
            setIsVoiceRecordingEnabled(gameSettings.difficulty === 'Easy');
        }
    }, [session, rounds, gameStartTime, sessionId, gameSettings]);

    // Timer effect
    useEffect(() => {
        let interval: NodeJS.Timeout | null = null;

        if (isTimerRunning && timer > 0) {
            interval = setInterval(() => {
                setTimer(prevTimer => prevTimer - 1);
            }, 1000);

            Animated.timing(timerAnimation, {
                toValue: timer / gameData.roundTimeSeconds,
                duration: 1000,
                useNativeDriver: false,
            }).start();
        } else if (timer === 0 && isTimerRunning) {
            setIsTimerRunning(false);
            if (gamePhase === 'discussion') {
                setGamePhase('answer');
            }
        }

        return () => {
            if (interval) clearInterval(interval);
        };
    }, [isTimerRunning, timer, gamePhase, gameData.roundTimeSeconds, timerAnimation]);

    // Handle loading states
    if ((sessionId && (isLoadingSession || isLoadingRounds))) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#4CAF50" />
                    <Text style={styles.loadingText}>Loading quiz session...</Text>
                </View>
            </SafeAreaView>
        );
    }

    // Handle API errors
    if (sessionId && (sessionError || roundsError)) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.errorContainer}>
                    <MaterialCommunityIcons name="alert-circle" size={48} color="#F44336" />
                    <Text style={styles.errorText}>Failed to load quiz session</Text>
                    <Text style={styles.errorSubtext}>
                        {sessionError ? 'Session error' : 'Rounds error'}
                    </Text>
                    <TouchableOpacity
                        style={styles.errorButton}
                        onPress={() => {
                            refetchRounds();
                        }}
                    >
                        <Text style={styles.errorButtonText}>Retry</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.secondaryErrorButton}
                        onPress={() => navigation.goBack()}
                    >
                        <Text style={styles.secondaryErrorButtonText}>Go Back</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    // Handle missing session data (only for session-based games)
    if (sessionId && !session) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.errorContainer}>
                    <MaterialCommunityIcons name="help-circle" size={48} color="#FF9800" />
                    <Text style={styles.errorText}>Quiz session not found</Text>
                    <Text style={styles.errorSubtext}>
                        The session may have expired or been deleted
                    </Text>
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

    // Start the game session
    const startGame = async () => {
        if (sessionId && session) {
            try {
                await beginQuizSession(sessionId).unwrap();
                setGameStartTime(new Date());
                setGamePhase('question');
            } catch (error) {
                console.error('Failed to start quiz session:', error);
                Alert.alert('Error', 'Failed to start the quiz session');
            }
        } else {
            // Fallback mode
            setGameStartTime(new Date());
            setGamePhase('question');
        }
    };

    // Start discussion phase
    const startDiscussion = () => {
        setGamePhase('discussion');
        setTimer(gameData.roundTimeSeconds);
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

        if (sessionId) {
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

                refetchRounds();
                setGamePhase('feedback');
                setIsRecordingVoiceAnswer(false);
            } catch (error) {
                console.error('Failed to submit answer:', error);
                Alert.alert('Error', 'Failed to submit answer. Please try again.');
            }
        } else {
            // Fallback mode - simulate answer processing
            setGamePhase('feedback');
            setIsRecordingVoiceAnswer(false);
        }
    };

    // Move to next round
    const nextRound = () => {
        if (currentRound + 1 >= gameData.totalRounds) {
            setShowEndGameModal(true);
            return;
        }

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
        if (sessionId && session) {
            try {
                await completeQuizSession(sessionId).unwrap();
            } catch (error) {
                console.error('Failed to complete quiz session:', error);
            }
        }

        setShowEndGameModal(false);

        const gameEndTime = new Date();
        const gameDuration = gameStartTime
            ? Math.floor((gameEndTime.getTime() - gameStartTime.getTime()) / 1000)
            : 0;

        const navigationParams: RootStackParamList['WWWGameResults'] = {
            teamName: gameData.teamName,
            score: gameData.correctAnswers || 0,
            totalRounds: gameData.totalRounds,
            roundsData: [], // You might need to format this properly
            challengeId,
            sessionId,
            gameStartTime: gameStartTime?.toISOString() || gameEndTime.toISOString(),
            gameDuration
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
        const difficulty = gameData.difficulty || 'MEDIUM';

        switch (difficulty) {
            case 'EASY':
            case 'Easy':
                const firstLetters = words.map(w => w[0]).join(' ');
                return `Starts with: ${firstLetters} (${words.length} word${words.length !== 1 ? 's' : ''})`;
            case 'MEDIUM':
            case 'Medium':
                return `${correctAnswer.length} characters, ${words.length} word${words.length !== 1 ? 's' : ''}`;
            case 'HARD':
            case 'Hard':
                return words.length > 1 ? `${words.length}-word answer` : `Single word, ${correctAnswer.length} letters`;
            default:
                return `${correctAnswer.length} characters total`;
        }
    };

    // Render game UI based on phase
    const renderGamePhase = () => {
        const currentRoundData = getCurrentRound();

        switch (gamePhase) {
            case 'waiting':
                return (
                    <View style={styles.phaseContainer}>
                        <MaterialCommunityIcons name="play-circle" size={64} color="#4CAF50" />
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
                // For fallback mode, create a mock question
                const questionText = currentRoundData?.question.question ||
                    `Sample Question ${currentRound + 1}: What is the capital of France?`;

                return (
                    <View style={styles.phaseContainer}>
                        <Text style={styles.questionNumber}>
                            Question {currentRound + 1} of {gameData.totalRounds}
                        </Text>
                        <Text style={styles.question}>{questionText}</Text>

                        <TouchableOpacity
                            style={styles.primaryButton}
                            onPress={startDiscussion}
                        >
                            <MaterialCommunityIcons name="account-group" size={20} color="white" />
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
                        <Text style={styles.question}>
                            {currentRoundData?.question.question || `Sample Question ${currentRound + 1}`}
                        </Text>

                        {isVoiceRecordingEnabled && (
                            <View style={styles.voiceRecorderContainer}>
                                <MaterialCommunityIcons name="microphone" size={24} color="#4CAF50" />
                                <Text style={styles.voiceRecorderText}>Voice recording enabled</Text>
                                {/* Uncomment when VoiceRecorder component is available */}
                                {/* <VoiceRecorder
                                    onTranscription={handleVoiceTranscription}
                                    isActive={gamePhase === 'discussion'}
                                /> */}
                                {voiceTranscription && (
                                    <View style={styles.transcriptionContainer}>
                                        <Text style={styles.transcriptionLabel}>Last Transcription:</Text>
                                        <Text style={styles.transcriptionText}>{voiceTranscription}</Text>
                                    </View>
                                )}
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
                            <MaterialCommunityIcons name="fast-forward" size={20} color="white" />
                            <Text style={styles.buttonText}>End Discussion Early</Text>
                        </TouchableOpacity>
                    </View>
                );

            case 'answer':
                return (
                    <View style={styles.phaseContainer}>
                        <Text style={styles.answerTitle}>Submit Your Answer</Text>
                        <Text style={styles.question}>
                            {currentRoundData?.question.question || `Sample Question ${currentRound + 1}`}
                        </Text>

                        <View style={styles.formGroup}>
                            <Text style={styles.formLabel}>Select Player Answering:</Text>
                            <ScrollView
                                horizontal
                                showsHorizontalScrollIndicator={false}
                                style={styles.playersScroll}
                            >
                                {gameData.teamMembers.map((player: string, index: number) => (
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

                            {/* Uncomment when VoiceRecorder component is available */}
                            {/* {isRecordingVoiceAnswer && (
                                <VoiceRecorder
                                    onTranscription={handleVoiceTranscription}
                                    isActive={isRecordingVoiceAnswer}
                                />
                            )} */}
                        </View>

                        {gameData.enableAiHost && (
                            <TouchableOpacity
                                style={styles.hintButton}
                                onPress={() => setShowHint(!showHint)}
                            >
                                <MaterialCommunityIcons name="lightbulb" size={16} color="#2196F3" />
                                <Text style={styles.hintButtonText}>
                                    {showHint ? 'Hide Hint' : 'Get Hint from AI Host'}
                                </Text>
                            </TouchableOpacity>
                        )}

                        {showHint && (
                            <View style={styles.hintContainer}>
                                <Text style={styles.hintText}>
                                    {generateHint(currentRoundData?.question.answer || 'Paris')}
                                </Text>
                            </View>
                        )}

                        <TouchableOpacity
                            style={styles.primaryButton}
                            onPress={submitAnswer}
                        >
                            <MaterialCommunityIcons name="send" size={20} color="white" />
                            <Text style={styles.buttonText}>Submit Answer</Text>
                        </TouchableOpacity>
                    </View>
                );

            case 'feedback':
                const isCorrect = currentRoundData?.isCorrect ?? (teamAnswer.toLowerCase() === 'paris');
                const correctAnswer = currentRoundData?.question.answer || 'Paris';

                return (
                    <View style={styles.phaseContainer}>
                        <Text style={styles.feedbackTitle}>Answer Feedback</Text>

                        <View style={styles.resultContainer}>
                            <Text style={styles.resultLabel}>Your Answer:</Text>
                            <Text style={styles.resultValue}>{currentRoundData?.teamAnswer || teamAnswer}</Text>

                            <Text style={styles.resultLabel}>Correct Answer:</Text>
                            <Text style={styles.resultValue}>{correctAnswer}</Text>

                            <Text style={styles.resultLabel}>Result:</Text>
                            <View style={[
                                styles.resultBadge,
                                isCorrect ? styles.correctBadge : styles.incorrectBadge
                            ]}>
                                <MaterialCommunityIcons
                                    name={isCorrect ? "check-circle" : "close-circle"}
                                    size={16}
                                    color="white"
                                />
                                <Text style={styles.resultBadgeText}>
                                    {isCorrect ? 'CORRECT' : 'INCORRECT'}
                                </Text>
                            </View>

                            <Text style={styles.resultLabel}>Answered By:</Text>
                            <Text style={styles.resultValue}>{currentRoundData?.playerWhoAnswered || selectedPlayer}</Text>
                        </View>

                        {gameData.enableAiHost && currentRoundData?.aiFeedback && (
                            <View style={styles.aiFeedbackContainer}>
                                <Text style={styles.aiFeedbackTitle}>AI Host Feedback:</Text>
                                <Text style={styles.aiFeedbackText}>{currentRoundData.aiFeedback}</Text>
                            </View>
                        )}

                        <TouchableOpacity
                            style={styles.primaryButton}
                            onPress={nextRound}
                        >
                            <MaterialCommunityIcons
                                name={currentRound + 1 >= gameData.totalRounds ? "flag-checkered" : "arrow-right"}
                                size={20}
                                color="white"
                            />
                            <Text style={styles.buttonText}>
                                {currentRound + 1 >= gameData.totalRounds ? 'See Final Results' : 'Next Question'}
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
                    <Text style={styles.teamName}>{gameData.teamName}</Text>
                    <Text style={styles.scoreText}>Score: {gameData.correctAnswers}/{gameData.totalRounds}</Text>
                </View>
                <View style={styles.progressBar}>
                    <View
                        style={[
                            styles.progressFill,
                            {width: `${(currentRound / gameData.totalRounds) * 100}%`}
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
                        <MaterialCommunityIcons name="trophy" size={48} color="#FFD700" />
                        <Text style={styles.modalTitle}>Game Over!</Text>
                        <Text style={styles.modalText}>
                            Your team scored {gameData.correctAnswers} out of {gameData.totalRounds} questions.
                        </Text>
                        <Text style={styles.modalScore}>
                            {gameData.correctAnswers === gameData.totalRounds
                                ? 'Perfect score! Incredible!'
                                : gameData.correctAnswers > gameData.totalRounds / 2
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
        padding: 20,
    },
    loadingText: {
        fontSize: 16,
        color: '#666',
        marginTop: 12,
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
        fontWeight: 'bold',
        marginTop: 16,
        marginBottom: 8,
        textAlign: 'center',
    },
    errorSubtext: {
        fontSize: 14,
        color: '#666',
        marginBottom: 20,
        textAlign: 'center',
    },
    errorButton: {
        backgroundColor: '#4CAF50',
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 8,
        marginBottom: 12,
    },
    errorButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
    secondaryErrorButton: {
        backgroundColor: 'transparent',
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#4CAF50',
    },
    secondaryErrorButtonText: {
        color: '#4CAF50',
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
        marginTop: 16,
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
        flexDirection: 'row',
        justifyContent: 'center',
    },
    secondaryButton: {
        backgroundColor: '#FF9800',
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 8,
        alignItems: 'center',
        flexDirection: 'row',
        justifyContent: 'center',
    },
    buttonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
        marginLeft: 8,
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
    voiceRecorderContainer: {
        backgroundColor: '#f9f9f9',
        padding: 12,
        borderRadius: 8,
        marginBottom: 16,
        alignItems: 'center',
    },
    voiceRecorderText: {
        fontSize: 14,
        color: '#4CAF50',
        marginTop: 8,
        fontWeight: '500',
    },
    transcriptionContainer: {
        marginTop: 8,
        backgroundColor: '#f0f0f0',
        padding: 12,
        borderRadius: 8,
        width: '100%',
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
    hintButton: {
        alignSelf: 'center',
        padding: 8,
        marginBottom: 16,
        flexDirection: 'row',
        alignItems: 'center',
    },
    hintButtonText: {
        color: '#2196F3',
        fontWeight: '500',
        marginLeft: 4,
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
        flexDirection: 'row',
        alignItems: 'center',
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
        marginLeft: 4,
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
        marginTop: 16,
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