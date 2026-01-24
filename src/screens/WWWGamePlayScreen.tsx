// src/screens/WWWGamePlayScreen.tsx - Complete and Fixed Version
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
    useBeginQuizSessionMutation,
    useCompleteQuizSessionMutation,
    useGetQuizRoundsQuery,
    useGetQuizSessionQuery,
    useSubmitRoundAnswerMutation,
} from '../entities/QuizState/model/slice/quizApi';
import {useGetChallengeAudioConfigQuery} from '../entities/ChallengeState/model/slice/challengeApi';
import { useSubmitRecordingMutation } from '../entities/AudioChallengeState/model/slice/audioChallengeApi';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import VoiceRecorder from '../components/VoiceRecorder';
import {RootStackParamList} from '../navigation/AppNavigator';
import {QuestAudioPlayer} from '../components/QuestAudioPlayer';
import { AudioChallengeContainer } from './components/audio';
import QuestionMediaViewer from './CreateWWWQuestScreen/components/QuestionMediaViewer';
import { MediaType } from '../services/wwwGame/questionService';

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

    // API hooks - with proper type guards
    const { data: session, isLoading: isLoadingSession } = useGetQuizSessionQuery(sessionId!, {
        skip: !sessionId,
    });
    const { data: rounds = [], isLoading: isLoadingRounds, refetch: refetchRounds } = useGetQuizRoundsQuery(sessionId!, {
        skip: !sessionId,
    });
    const [beginQuizSession, { isLoading: isBeginningSession }] = useBeginQuizSessionMutation();
    const [submitRoundAnswer, { isLoading: isSubmittingAnswer }] = useSubmitRoundAnswerMutation();
    const [completeQuizSession, { isLoading: isCompletingSession }] = useCompleteQuizSessionMutation();
    const [submitRecording, { isLoading: isSubmittingAudio }] = useSubmitRecordingMutation();

    // Fetch challenge audio configuration if challengeId exists
    const { data: audioConfig, isLoading: isLoadingAudioConfig } = useGetChallengeAudioConfigQuery(
        challengeId || '',
        { skip: !challengeId }
    );

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
    const [recordedAudio, setRecordedAudio] = useState<{uri: string; name: string; type: string} | null>(null);

    // Animated values
    const timerAnimation = useRef(new Animated.Value(1)).current;

    // Modal visibility
    const [showEndGameModal, setShowEndGameModal] = useState(false);

    // Current round data
    const currentRoundData = rounds[currentRound];

    // Helper to check if it's an audio challenge
    const isAudioChallenge = (question: any): boolean => {
        return question?.questionType === 'AUDIO' && !!question?.audioChallengeType;
    };

    const hasQuestionMedia = (question: any): boolean => {
        if (!question) {return false;}
        // Has media if questionType is not TEXT, or if questionMediaType is set
        const type = question.questionType?.toUpperCase();
        return (type && type !== 'TEXT') || !!question.questionMediaType;
    };

    const getMediaType = (question: any): MediaType | null => {
        if (!question) {return null;}
        // Prefer questionMediaType if available
        const mediaType = question.questionMediaType?.toUpperCase();
        if (mediaType && ['IMAGE', 'VIDEO', 'AUDIO'].includes(mediaType)) {
            return mediaType as MediaType;
        }
        // Fall back to questionType
        const qType = question.questionType?.toUpperCase();
        if (qType && ['IMAGE', 'VIDEO', 'AUDIO'].includes(qType)) {
            return qType as MediaType;
        }
        return null;
    };

    const QuestionContent: React.FC<{
        question: any;
        showText?: boolean;
        mediaHeight?: number;
    }> = ({ question, showText = true, mediaHeight = 200 }) => {
        const mediaType = getMediaType(question);
        const questionId = question?.id ? Number(question.id) : null;
        const showMedia = hasQuestionMedia(question) && !isAudioChallenge(question) && questionId;

        return (
            <View style={styles.questionContentContainer}>
                {/* Media section */}
                {showMedia && mediaType && (
                    <View style={styles.questionMediaSection}>
                        <View style={styles.mediaTypeIndicator}>
                            <MaterialCommunityIcons
                                name={mediaType === 'AUDIO' ? 'music' : mediaType === 'VIDEO' ? 'video' : 'image'}
                                size={16}
                                color="#666"
                            />
                            <Text style={styles.mediaTypeLabel}>
                                {mediaType === 'AUDIO' ? 'Listen to the audio' :
                                 mediaType === 'VIDEO' ? 'Watch the video' : 'View the image'}
                            </Text>
                        </View>
                        <QuestionMediaViewer
                            questionId={questionId}
                            mediaType={mediaType as MediaType}
                            height={mediaType === 'AUDIO' ? 80 : mediaHeight}
                            enableFullscreen={mediaType !== 'AUDIO'}
                        />
                    </View>
                )}

                {/* Question text */}
                {showText && (
                    <Text style={styles.question}>{question?.question}</Text>
                )}
            </View>
        );
    };

    // Initialize game when session and rounds are loaded
    useEffect(() => {
        if (session && rounds.length > 0) {
            if (session.status === 'CREATED') {
                setGamePhase('waiting');
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
            if (interval) {clearInterval(interval);}
        };
    }, [isTimerRunning, timer, gamePhase, session?.roundTimeSeconds, timerAnimation]);

    // Start the game session
    const startGame = async () => {
        if (!session || !sessionId) {return;}
        if (isBeginningSession) {return;} // Guard: Already in progress

        if (session.status === 'IN_PROGRESS') {
            // Session already started, just update UI
            setGamePhase('question');
            return;
        }

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
            setDiscussionNotes(prev => prev ? `${prev} ${text}` : text);
        } else if (gamePhase === 'answer') {
            setTeamAnswer(prev => prev ? `${prev} ${text}` : text);
        }
        setVoiceTranscription(text);
    };

    // Handler for audio recording completion
    const handleAudioRecordingComplete = (audioFile: { uri: string; name: string; type: string }) => {
        setRecordedAudio(audioFile);
    };

    // Submit audio answer
    const submitAudioAnswer = async () => {
        if (!recordedAudio || !currentRoundData || !sessionId || isSubmittingAudio || isSubmittingAnswer) {return;}

        try {
            // Submit to audio challenge API for scoring
            const result = await submitRecording({
                questionId: parseInt(currentRoundData.question.id as unknown as string),
                audioFile: recordedAudio,
            }).unwrap();

            // Also submit round answer with reference to submission
            await submitRoundAnswer({
                sessionId,
                roundId: currentRoundData.id,
                answer: {
                    teamAnswer: `Audio submission: ${result.id}`,
                    playerWhoAnswered: selectedPlayer || 'Team',
                    discussionNotes: discussionNotes.trim(),
                },
            }).unwrap();

            setGamePhase('feedback');
            refetchRounds();
        } catch (error) {
            console.error('Failed to submit audio:', error);
            Alert.alert('Error', 'Failed to submit audio recording');
        }
    };

    // Submit round answer (text)
    const submitAnswer = async () => {
        if (!currentRoundData || !teamAnswer.trim() || !sessionId || isSubmittingAnswer) {
            if (!teamAnswer.trim()) Alert.alert('Error', 'Please provide an answer');
            return;
        }

        try {
            const request = {
                teamAnswer: teamAnswer.trim(),
                playerWhoAnswered: selectedPlayer || 'Team', // Default to 'Team' if no player selected
                discussionNotes: discussionNotes.trim(),
            };

            await submitRoundAnswer({
                sessionId,
                roundId: currentRoundData.id,
                answer: request,
            }).unwrap();

            // Move to feedback phase
            setGamePhase('feedback');

            // Refresh rounds data
            refetchRounds();
        } catch (error) {
            console.error('Failed to submit answer:', error);
            Alert.alert('Error', 'Failed to submit answer');
        }
    };

    // Continue to next round
    const continueToNextRound = () => {
        if (currentRound + 1 >= rounds.length) {
            // Game completed
            completeGame();
        } else {
            // Reset for next round
            setCurrentRound(prev => prev + 1);
            setGamePhase('question');
            setDiscussionNotes('');
            setTeamAnswer('');
            setSelectedPlayer('');
            setShowHint(false);
            setVoiceTranscription('');
            setRecordedAudio(null);
        }
    };

    // Complete the game
    const completeGame = async () => {
        if (!sessionId || isCompletingSession) {return;}

        try {
            await completeQuizSession(sessionId).unwrap();
            setShowEndGameModal(true);
        } catch (error) {
            console.error('Failed to complete game:', error);
            Alert.alert('Error', 'Failed to complete the game');
        }
    };

    // Navigate to results
    const goToResults = () => {
        if (!sessionId || !session) {return;}

        setShowEndGameModal(false);

        // Prepare the results data in the format expected by WWWGameResults
        const roundsData = rounds.map(round => ({
            question: round.question.question,
            correctAnswer: round.question.answer,
            teamAnswer: round.teamAnswer || '',
            isCorrect: round.isCorrect,
            playerWhoAnswered: round.playerWhoAnswered || '',
            discussionNotes: round.discussionNotes || '',
        }));

        navigation.navigate('WWWGameResults', {
            teamName: session.teamName,
            score: session.correctAnswers,
            totalRounds: session.totalRounds,
            roundsData: roundsData,
            challengeId: challengeId,
            sessionId: sessionId,
            gameStartTime: session.startedAt,
            gameDuration: session.totalDurationSeconds,
        });
    };

    // Handle voice recording for answers (Text based)
    const toggleVoiceAnswer = () => {
        setIsRecordingVoiceAnswer(!isRecordingVoiceAnswer);
    };

    // Render different phases
    const renderPhaseContent = () => {
        switch (gamePhase) {
            case 'waiting':
                return (
                    <View style={styles.phaseContainer}>
                        <MaterialCommunityIcons
                            name="play-circle-outline"
                            size={80}
                            color="#4CAF50"
                            style={styles.icon}
                        />
                        <Text style={styles.waitingTitle}>Ready to Start?</Text>
                        <Text style={styles.waitingText}>
                            Welcome to WWW_QUIZ!{'\n\n'}
                            You'll have {session?.roundTimeSeconds || 60} seconds to discuss each question with your team.{'\n\n'}
                            When you're ready to begin, press the button below.
                        </Text>
                        <TouchableOpacity
                            style={[styles.primaryButton, isBeginningSession && styles.disabledButton]}
                            onPress={startGame}
                            disabled={isBeginningSession}
                        >
                            <Text style={styles.buttonText}>
                                {isBeginningSession ? 'Starting...' : 'Start Quiz'}
                            </Text>
                        </TouchableOpacity>
                    </View>
                );

            case 'question':
                if (!currentRoundData) {return null;}
                const questionData = currentRoundData.question;

                // DEBUG: Log question data to verify audio fields are present
                console.log('🎯 Question data:', {
                    id: questionData.id,
                    questionType: questionData.questionType,
                    audioChallengeType: questionData.audioChallengeType,
                    isAudioChallenge: isAudioChallenge(questionData),
                });

                return (
                    <View style={styles.phaseContainer}>
                        <Text style={styles.questionNumber}>
                            Question {currentRound + 1} of {session?.totalRounds || rounds.length}
                        </Text>

                        {isAudioChallenge(questionData) ? (
                            <AudioChallengeContainer
                                question={questionData as any}
                                mode="preview"
                            />
                        ) : (
                            <QuestionContent question={questionData} />
                        )}

                        <TouchableOpacity
                            style={styles.primaryButton}
                            onPress={isAudioChallenge(questionData) ? () => setGamePhase('answer') : startDiscussion}
                        >
                            <Text style={styles.buttonText}>
                                {isAudioChallenge(questionData) ? 'Ready to Record' : 'Start Discussion'}
                            </Text>
                        </TouchableOpacity>
                    </View>
                );

            case 'discussion':
                if (!currentRoundData) {return null;}

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
                                            }),
                                        },
                                    ]}
                                />
                            </View>
                        </View>

                        <Text style={styles.discussionTitle}>Team Discussion</Text>

                        {isAudioChallenge(currentRoundData.question) ? (
                            <Text style={styles.question}>Audio Challenge</Text>
                        ) : (
                            <QuestionContent question={currentRoundData.question} />
                        )}

                        {isVoiceRecordingEnabled && !isAudioChallenge(currentRoundData.question) && (
                            <View style={styles.voiceRecorderContainer}>
                                <VoiceRecorder
                                    onTranscription={handleVoiceTranscription}
                                    isActive={gamePhase === 'discussion'}
                                />
                                {voiceTranscription && (
                                    <View style={styles.transcriptionContainer}>
                                        <Text style={styles.transcriptionLabel}>Latest Transcription:</Text>
                                        <Text style={styles.transcriptionText}>{voiceTranscription}</Text>
                                    </View>
                                )}
                            </View>
                        )}

                        <View style={styles.notesContainer}>
                            <Text style={styles.notesLabel}>Discussion Notes:</Text>
                            <TextInput
                                style={styles.notesInput}
                                value={discussionNotes}
                                onChangeText={setDiscussionNotes}
                                placeholder="Record your team's discussion..."
                                multiline
                                textAlignVertical="top"
                            />
                        </View>

                        <TouchableOpacity
                            style={styles.primaryButton}
                            onPress={() => setGamePhase('answer')}
                        >
                            <Text style={styles.buttonText}>Submit Answer</Text>
                        </TouchableOpacity>
                    </View>
                );

            case 'answer':
                if (!currentRoundData) {return null;}
                const answerQuestionData = currentRoundData.question;

                if (isAudioChallenge(answerQuestionData)) {
                    return (
                        <View style={styles.phaseContainer}>
                            <AudioChallengeContainer
                                question={answerQuestionData as any}
                                mode="record"
                                onRecordingComplete={handleAudioRecordingComplete}
                                disabled={isSubmittingAudio}
                            />
                            <TouchableOpacity
                                style={[styles.primaryButton, (!recordedAudio || isSubmittingAudio) && styles.disabledButton]}
                                onPress={submitAudioAnswer}
                                disabled={!recordedAudio || isSubmittingAudio}
                            >
                                {isSubmittingAudio ? (
                                    <Text style={styles.buttonText}>Uploading...</Text>
                                ) : (
                                    <Text style={styles.buttonText}>Submit Recording</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    );
                }

                return (
                    <View style={styles.phaseContainer}>
                        <Text style={styles.answerTitle}>Submit Your Answer</Text>
                        <QuestionContent question={answerQuestionData} />

                        {/* Hint section */}
                        {answerQuestionData.additionalInfo && (
                            <View>
                                <TouchableOpacity
                                    style={styles.hintButton}
                                    onPress={() => setShowHint(!showHint)}
                                >
                                    <Text style={styles.hintButtonText}>
                                        {showHint ? 'Hide Hint' : 'Show Hint'}
                                    </Text>
                                </TouchableOpacity>
                                {showHint && (
                                    <View style={styles.hintContainer}>
                                        <Text style={styles.hintText}>{answerQuestionData.additionalInfo}</Text>
                                    </View>
                                )}
                            </View>
                        )}

                        {/* Voice answer recording */}
                        {isVoiceRecordingEnabled && (
                            <View style={styles.voiceAnswerContainer}>
                                <TouchableOpacity
                                    style={[
                                        styles.voiceAnswerButton,
                                        isRecordingVoiceAnswer && styles.voiceAnswerButtonActive,
                                    ]}
                                    onPress={toggleVoiceAnswer}
                                >
                                    <MaterialCommunityIcons
                                        name={isRecordingVoiceAnswer ? 'stop' : 'microphone'}
                                        size={20}
                                        color="white"
                                    />
                                    <Text style={styles.voiceAnswerButtonText}>
                                        {isRecordingVoiceAnswer ? 'Stop Recording Answer' : 'Record Voice Answer'}
                                    </Text>
                                </TouchableOpacity>

                                {isRecordingVoiceAnswer && (
                                    <VoiceRecorder
                                        onTranscription={handleVoiceTranscription}
                                        isActive={isRecordingVoiceAnswer}
                                    />
                                )}
                            </View>
                        )}

                        {/* Player selection */}
                        {gameSettings?.players && gameSettings.players.length > 0 && (
                            <View style={styles.formGroup}>
                                <Text style={styles.formLabel}>Who is answering?</Text>
                                <ScrollView
                                    horizontal
                                    showsHorizontalScrollIndicator={false}
                                    style={styles.playersScroll}
                                >
                                    {gameSettings.players.map((player: string) => (
                                        <TouchableOpacity
                                            key={player}
                                            style={[
                                                styles.playerButton,
                                                selectedPlayer === player && styles.selectedPlayerButton,
                                            ]}
                                            onPress={() => setSelectedPlayer(player)}
                                        >
                                            <Text style={[
                                                styles.playerButtonText,
                                                selectedPlayer === player && styles.selectedPlayerText,
                                            ]}>
                                                {player}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>
                            </View>
                        )}

                        {/* Answer input */}
                        <View style={styles.formGroup}>
                            <Text style={styles.formLabel}>Team Answer:</Text>
                            <TextInput
                                style={styles.answerInput}
                                value={teamAnswer}
                                onChangeText={setTeamAnswer}
                                placeholder="Enter your team's answer..."
                                multiline
                            />
                        </View>

                        <TouchableOpacity
                            style={[styles.primaryButton, (!teamAnswer.trim() || isSubmittingAnswer) && styles.disabledButton]}
                            onPress={submitAnswer}
                            disabled={!teamAnswer.trim() || isSubmittingAnswer}
                        >
                            <Text style={styles.buttonText}>
                                {isSubmittingAnswer ? 'Submitting...' : 'Submit Answer'}
                            </Text>
                        </TouchableOpacity>
                    </View>
                );

            case 'feedback':
                if (!currentRoundData) {return null;}

                const isCorrect = currentRoundData.isCorrect;

                return (
                    <View style={styles.phaseContainer}>
                        <Text style={styles.feedbackTitle}>Round Results</Text>

                        <View style={styles.resultContainer}>
                            <Text style={styles.resultLabel}>Question:</Text>
                            <Text style={styles.resultValue}>{currentRoundData.question.question}</Text>

                            <Text style={styles.resultLabel}>Your Answer:</Text>
                            <Text style={styles.resultValue}>{currentRoundData.teamAnswer}</Text>

                            <Text style={styles.resultLabel}>Correct Answer:</Text>
                            <Text style={styles.resultValue}>{currentRoundData.question.answer}</Text>

                            <View style={[
                                styles.resultBadge,
                                isCorrect ? styles.correctBadge : styles.incorrectBadge,
                            ]}>
                                <Text style={styles.resultBadgeText}>
                                    {isCorrect ? 'CORRECT' : 'INCORRECT'}
                                </Text>
                            </View>
                        </View>

                        {currentRoundData.aiFeedback && (
                            <View style={styles.aiFeedbackContainer}>
                                <Text style={styles.aiFeedbackTitle}>AI Host Feedback:</Text>
                                <Text style={styles.aiFeedbackText}>{currentRoundData.aiFeedback}</Text>
                            </View>
                        )}

                        <TouchableOpacity
                            style={styles.primaryButton}
                            onPress={continueToNextRound}
                        >
                            <Text style={styles.buttonText}>
                                {currentRound + 1 >= rounds.length ? 'Finish Game' : 'Next Question'}
                            </Text>
                        </TouchableOpacity>
                    </View>
                );

            default:
                return null;
        }
    };

    // Loading state
    if (isLoadingSession || isLoadingRounds) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.loadingContainer}>
                    <MaterialCommunityIcons name="loading" size={40} color="#4CAF50" />
                    <Text style={styles.loadingText}>Loading quiz...</Text>
                </View>
            </SafeAreaView>
        );
    }

    // Error state
    if (!session || !sessionId) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.errorContainer}>
                    <MaterialCommunityIcons name="alert-circle" size={40} color="#F44336" />
                    <Text style={styles.errorText}>Quiz session not found</Text>
                    <TouchableOpacity
                        style={styles.primaryButton}
                        onPress={() => navigation.goBack()}
                    >
                        <Text style={styles.buttonText}>Go Back</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {/* Quest Audio Player Section */}
                {audioConfig && (
                    <View style={styles.audioSection}>
                        <QuestAudioPlayer
                            audioConfig={audioConfig}
                            autoPlay={false}
                        />
                        {audioConfig.minimumScorePercentage > 0 && (
                            <View style={styles.scoreRequirementBanner}>
                                <MaterialCommunityIcons name="alert-circle" size={20} color="#FF9800" />
                                <Text style={styles.scoreRequirementText}>
                                    Minimum score required: {audioConfig.minimumScorePercentage}%
                                </Text>
                            </View>
                        )}
                    </View>
                )}

                {renderPhaseContent()}
            </ScrollView>

            {/* End Game Modal */}
            <Modal
                visible={showEndGameModal}
                transparent
                animationType="fade"
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <MaterialCommunityIcons
                            name="trophy"
                            size={60}
                            color="#4CAF50"
                            style={styles.modalIcon}
                        />
                        <Text style={styles.modalTitle}>Quiz Complete!</Text>
                        <Text style={styles.modalText}>
                            Congratulations! You've completed the quiz.
                        </Text>
                        <Text style={styles.modalScore}>
                            Final Score: {session.correctAnswers || 0}/{session.totalRounds || rounds.length}
                        </Text>
                        <TouchableOpacity
                            style={styles.modalButton}
                            onPress={goToResults}
                        >
                            <Text style={styles.modalButtonText}>View Results</Text>
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
    content: {
        flex: 1,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 16,
        fontSize: 16,
        color: '#666',
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    errorText: {
        marginTop: 16,
        fontSize: 16,
        color: '#F44336',
        textAlign: 'center',
        marginBottom: 24,
    },
    phaseContainer: {
        flex: 1,
        padding: 24,
    },
    icon: {
        alignSelf: 'center',
        marginBottom: 24,
    },
    waitingTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        textAlign: 'center',
        color: '#333',
        marginBottom: 16,
    },
    waitingText: {
        fontSize: 16,
        textAlign: 'center',
        color: '#666',
        lineHeight: 24,
        marginBottom: 32,
    },
    questionNumber: {
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
        marginBottom: 8,
    },
    question: {
        fontSize: 20,
        fontWeight: '600',
        color: '#333',
        textAlign: 'center',
        marginBottom: 32,
        lineHeight: 28,
        fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
    },
    primaryButton: {
        backgroundColor: '#4CAF50',
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 16,
    },
    secondaryButton: {
        backgroundColor: '#FF9800',
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 8,
        alignItems: 'center',
    },
    disabledButton: {
        opacity: 0.7,
        backgroundColor: '#A5D6A7',
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
        minHeight: 80,
        textAlignVertical: 'top',
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
    modalIcon: {
        marginBottom: 16,
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
    audioSection: {
        margin: 16,
        marginBottom: 0,
    },
    scoreRequirementBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff3e0',
        padding: 12,
        borderRadius: 8,
        marginTop: 12,
        gap: 8,
    },
    scoreRequirementText: {
        flex: 1,
        fontSize: 14,
        color: '#666',
        fontWeight: '500',
    },
    questionContentContainer: {
        width: '100%',
        marginBottom: 16,
    },
    questionMediaSection: {
        marginBottom: 16,
        backgroundColor: '#f9f9f9',
        borderRadius: 12,
        overflow: 'hidden',
    },
    mediaTypeIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        backgroundColor: '#f0f0f0',
        gap: 8,
    },
    mediaTypeLabel: {
        fontSize: 14,
        color: '#666',
        fontWeight: '500',
    },
});

export default WWWGamePlayScreen;
