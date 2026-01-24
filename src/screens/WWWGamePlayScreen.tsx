// src/screens/WWWGamePlayScreen.tsx - Complete and Fixed Version
import React, {useEffect, useRef, useState} from 'react';
import {
    Alert,
    Animated,
    Modal,
    Platform,
    SafeAreaView,
    ScrollView,
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
import {useAppStyles} from '../shared/ui/hooks/useAppStyles';
import {createStyles} from '../shared/ui/theme';

type WWWGamePlayNavigationProp = NativeStackNavigationProp<RootStackParamList, 'WWWGamePlay'>;
type WWWGamePlayRouteProp = RouteProp<RootStackParamList, 'WWWGamePlay'>;

const WWWGamePlayScreen: React.FC = () => {
    const route = useRoute<WWWGamePlayRouteProp>();
    const navigation = useNavigation<WWWGamePlayNavigationProp>();
    const {screen, theme} = useAppStyles();
    const styles = themeStyles;

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

    const QuestionContent: React.FC <{
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
                                color={theme.colors.text.secondary}
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
                            color={theme.colors.success.main}
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
                                placeholderTextColor={theme.colors.text.disabled}
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
                                        color={theme.colors.text.inverse}
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
                                placeholderTextColor={theme.colors.text.disabled}
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
            <SafeAreaView style={screen.container}>
                <View style={styles.loadingContainer}>
                    <MaterialCommunityIcons name="loading" size={40} color={theme.colors.success.main} />
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
                    <MaterialCommunityIcons name="alert-circle" size={40} color={theme.colors.error.main} />
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
                                <MaterialCommunityIcons name="alert-circle" size={20} color={theme.colors.warning.main} />
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
                            color={theme.colors.success.main}
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

const themeStyles = createStyles(theme => ({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background.secondary,
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
        marginTop: theme.spacing.md,
        fontSize: theme.typography.body.medium.fontSize,
        lineHeight: theme.typography.body.medium.lineHeight,
        fontFamily: theme.typography.body.medium.fontFamily,
        color: theme.colors.text.secondary,
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: theme.spacing['2xl'],
    },
    errorText: {
        marginTop: theme.spacing.md,
        fontSize: theme.typography.body.medium.fontSize,
        lineHeight: theme.typography.body.medium.lineHeight,
        fontFamily: theme.typography.body.medium.fontFamily,
        color: theme.colors.error.main,
        textAlign: 'center',
        marginBottom: theme.spacing['2xl'],
    },
    phaseContainer: {
        flex: 1,
        padding: theme.spacing['2xl'],
    },
    icon: {
        alignSelf: 'center',
        marginBottom: theme.spacing['2xl'],
    },
    waitingTitle: {
        fontSize: theme.typography.heading.h5.fontSize,
        lineHeight: theme.typography.heading.h5.lineHeight,
        fontFamily: theme.typography.heading.h5.fontFamily,
        letterSpacing: theme.typography.heading.h5.letterSpacing,
        fontWeight: theme.typography.fontWeight.bold,
        textAlign: 'center',
        color: theme.colors.text.primary,
        marginBottom: theme.spacing.lg,
    },
    waitingText: {
        fontSize: theme.typography.body.medium.fontSize,
        lineHeight: theme.typography.body.medium.lineHeight,
        fontFamily: theme.typography.body.medium.fontFamily,
        textAlign: 'center',
        color: theme.colors.text.secondary,
        marginBottom: theme.spacing['3xl'],
    },
    questionNumber: {
        fontSize: theme.typography.body.small.fontSize,
        lineHeight: theme.typography.body.small.lineHeight,
        fontFamily: theme.typography.body.small.fontFamily,
        color: theme.colors.text.secondary,
        textAlign: 'center',
        marginBottom: theme.spacing.sm,
    },
    question: {
        fontSize: theme.typography.heading.h6.fontSize,
        lineHeight: theme.typography.heading.h6.lineHeight,
        fontFamily: theme.typography.heading.h6.fontFamily,
        letterSpacing: theme.typography.heading.h6.letterSpacing,
        fontWeight: theme.typography.fontWeight.semibold,
        color: theme.colors.text.primary,
        textAlign: 'center',
        marginBottom: theme.spacing['3xl'],
    },
    primaryButton: {
        backgroundColor: theme.colors.success.main,
        paddingVertical: theme.spacing.md,
        paddingHorizontal: theme.spacing['2xl'],
        borderRadius: theme.layout.borderRadius.md,
        alignItems: 'center',
        marginTop: theme.spacing.lg,
    },
    secondaryButton: {
        backgroundColor: theme.colors.warning.main,
        paddingVertical: theme.spacing.md,
        paddingHorizontal: theme.spacing['2xl'],
        borderRadius: theme.layout.borderRadius.md,
        alignItems: 'center',
    },
    disabledButton: {
        opacity: 0.7,
        backgroundColor: theme.colors.success.light,
    },
    buttonText: {
        color: theme.colors.text.inverse,
        fontSize: theme.typography.body.medium.fontSize,
        lineHeight: theme.typography.body.medium.lineHeight,
        fontFamily: theme.typography.body.medium.fontFamily,
        fontWeight: theme.typography.fontWeight.bold,
    },
    timerContainer: {
        marginBottom: theme.spacing.lg,
    },
    timerText: {
        fontSize: theme.typography.body.medium.fontSize,
        lineHeight: theme.typography.body.medium.lineHeight,
        fontFamily: theme.typography.body.medium.fontFamily,
        fontWeight: theme.typography.fontWeight.bold,
        color: theme.colors.text.primary,
        marginBottom: theme.spacing.sm,
        textAlign: 'center',
    },
    timerBar: {
        height: 10,
        backgroundColor: theme.colors.background.tertiary,
        borderRadius: 5,
        overflow: 'hidden',
    },
    timerProgress: {
        height: '100%',
        backgroundColor: theme.colors.success.main,
    },
    discussionTitle: {
        fontSize: theme.typography.body.large.fontSize,
        lineHeight: theme.typography.body.large.lineHeight,
        fontFamily: theme.typography.body.large.fontFamily,
        fontWeight: theme.typography.fontWeight.bold,
        color: theme.colors.text.primary,
        marginBottom: theme.spacing.lg,
    },
    notesContainer: {
        marginBottom: theme.spacing.lg,
    },
    notesLabel: {
        fontSize: theme.typography.body.small.fontSize,
        lineHeight: theme.typography.body.small.lineHeight,
        fontFamily: theme.typography.body.small.fontFamily,
        color: theme.colors.text.secondary,
        marginBottom: theme.spacing.sm,
    },
    notesInput: {
        borderWidth: 1,
        borderColor: theme.colors.border.light,
        borderRadius: theme.layout.borderRadius.md,
        padding: theme.spacing.md,
        minHeight: 120,
        textAlignVertical: 'top',
        color: theme.colors.text.primary,
    },
    answerTitle: {
        fontSize: theme.typography.body.large.fontSize,
        lineHeight: theme.typography.body.large.lineHeight,
        fontFamily: theme.typography.body.large.fontFamily,
        fontWeight: theme.typography.fontWeight.bold,
        color: theme.colors.text.primary,
        marginBottom: theme.spacing.lg,
    },
    formGroup: {
        marginBottom: theme.spacing.lg,
    },
    formLabel: {
        fontSize: theme.typography.body.small.fontSize,
        lineHeight: theme.typography.body.small.lineHeight,
        fontFamily: theme.typography.body.small.fontFamily,
        color: theme.colors.text.secondary,
        marginBottom: theme.spacing.sm,
    },
    playersScroll: {
        flexDirection: 'row',
        maxHeight: 50,
    },
    playerButton: {
        paddingVertical: theme.spacing.sm,
        paddingHorizontal: theme.spacing.lg,
        borderRadius: theme.layout.borderRadius['2xl'],
        backgroundColor: theme.colors.background.tertiary,
        marginRight: theme.spacing.sm,
    },
    selectedPlayerButton: {
        backgroundColor: theme.colors.success.main,
    },
    playerButtonText: {
        color: theme.colors.text.primary,
    },
    selectedPlayerText: {
        color: theme.colors.text.inverse,
        fontWeight: theme.typography.fontWeight.bold,
    },
    answerInput: {
        borderWidth: 1,
        borderColor: theme.colors.border.light,
        borderRadius: theme.layout.borderRadius.md,
        padding: theme.spacing.md,
        fontSize: theme.typography.body.medium.fontSize,
        lineHeight: theme.typography.body.medium.lineHeight,
        fontFamily: theme.typography.body.medium.fontFamily,
        minHeight: 80,
        textAlignVertical: 'top',
        color: theme.colors.text.primary,
    },
    hintButton: {
        alignSelf: 'center',
        padding: theme.spacing.sm,
        marginBottom: theme.spacing.lg,
    },
    hintButtonText: {
        color: theme.colors.info.main,
        fontWeight: theme.typography.fontWeight.medium,
    },
    hintContainer: {
        backgroundColor: theme.colors.background.secondary,
        padding: theme.spacing.md,
        borderRadius: theme.layout.borderRadius.md,
        marginBottom: theme.spacing.lg,
    },
    hintText: {
        color: theme.colors.text.secondary, // Or a slightly darker variant
        fontStyle: 'italic',
    },
    feedbackTitle: {
        fontSize: theme.typography.body.large.fontSize,
        lineHeight: theme.typography.body.large.lineHeight,
        fontFamily: theme.typography.body.large.fontFamily,
        fontWeight: theme.typography.fontWeight.bold,
        color: theme.colors.text.primary,
        marginBottom: theme.spacing.lg,
    },
    resultContainer: {
        backgroundColor: theme.colors.background.tertiary,
        padding: theme.spacing.lg,
        borderRadius: theme.layout.borderRadius.md,
        marginBottom: theme.spacing.lg,
    },
    resultLabel: {
        fontSize: theme.typography.body.small.fontSize,
        lineHeight: theme.typography.body.small.lineHeight,
        fontFamily: theme.typography.body.small.fontFamily,
        color: theme.colors.text.secondary,
        marginBottom: 4,
    },
    resultValue: {
        fontSize: theme.typography.body.medium.fontSize,
        lineHeight: theme.typography.body.medium.lineHeight,
        fontFamily: theme.typography.body.medium.fontFamily,
        color: theme.colors.text.primary,
        fontWeight: theme.typography.fontWeight.medium,
        marginBottom: theme.spacing.md,
    },
    resultBadge: {
        alignSelf: 'flex-start',
        paddingVertical: 4,
        paddingHorizontal: theme.spacing.md,
        borderRadius: theme.layout.borderRadius.lg,
        marginBottom: theme.spacing.md,
    },
    correctBadge: {
        backgroundColor: theme.colors.success.main,
    },
    incorrectBadge: {
        backgroundColor: theme.colors.error.main,
    },
    resultBadgeText: {
        color: theme.colors.text.inverse,
        fontWeight: theme.typography.fontWeight.bold,
        fontSize: 12,
    },
    aiFeedbackContainer: {
        backgroundColor: theme.colors.info.background,
        padding: theme.spacing.lg,
        borderRadius: theme.layout.borderRadius.md,
        marginBottom: theme.spacing.lg,
    },
    aiFeedbackTitle: {
        fontSize: theme.typography.body.small.fontSize,
        lineHeight: theme.typography.body.small.lineHeight,
        fontFamily: theme.typography.body.small.fontFamily,
        color: theme.colors.info.dark,
        fontWeight: theme.typography.fontWeight.bold,
        marginBottom: theme.spacing.sm,
    },
    aiFeedbackText: {
        color: theme.colors.text.primary,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: theme.colors.overlay.medium,
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        backgroundColor: theme.colors.background.primary,
        borderRadius: theme.layout.borderRadius.lg,
        padding: theme.spacing['2xl'],
        width: '80%',
        alignItems: 'center',
    },
    modalIcon: {
        marginBottom: theme.spacing.lg,
    },
    modalTitle: {
        fontSize: theme.typography.heading.h6.fontSize,
        lineHeight: theme.typography.heading.h6.lineHeight,
        fontFamily: theme.typography.heading.h6.fontFamily,
        letterSpacing: theme.typography.heading.h6.letterSpacing,
        fontWeight: theme.typography.fontWeight.bold,
        color: theme.colors.text.primary,
        marginBottom: theme.spacing.lg,
    },
    modalText: {
        fontSize: theme.typography.body.medium.fontSize,
        lineHeight: theme.typography.body.medium.lineHeight,
        fontFamily: theme.typography.body.medium.fontFamily,
        color: theme.colors.text.secondary,
        marginBottom: theme.spacing.sm,
        textAlign: 'center',
    },
    modalScore: {
        fontSize: theme.typography.body.large.fontSize,
        lineHeight: theme.typography.body.large.lineHeight,
        fontFamily: theme.typography.body.large.fontFamily,
        fontWeight: theme.typography.fontWeight.bold,
        color: theme.colors.success.main,
        marginBottom: theme.spacing['2xl'],
        textAlign: 'center',
    },
    modalButton: {
        backgroundColor: theme.colors.success.main,
        paddingVertical: theme.spacing.md,
        paddingHorizontal: theme.spacing['2xl'],
        borderRadius: theme.layout.borderRadius.md,
    },
    modalButtonText: {
        color: theme.colors.text.inverse,
        fontSize: theme.typography.body.medium.fontSize,
        lineHeight: theme.typography.body.medium.lineHeight,
        fontFamily: theme.typography.body.medium.fontFamily,
        fontWeight: theme.typography.fontWeight.bold,
    },
    voiceRecorderContainer: {
        marginBottom: theme.spacing.lg,
        backgroundColor: theme.colors.background.tertiary,
        padding: theme.spacing.md,
        borderRadius: theme.layout.borderRadius.md,
    },
    transcriptionContainer: {
        marginTop: theme.spacing.sm,
        backgroundColor: theme.colors.background.tertiary, // Maybe slightly darker/lighter?
        padding: theme.spacing.md,
        borderRadius: theme.layout.borderRadius.md,
    },
    transcriptionLabel: {
        fontWeight: theme.typography.fontWeight.bold,
        fontSize: theme.typography.body.small.fontSize,
        lineHeight: theme.typography.body.small.lineHeight,
        fontFamily: theme.typography.body.small.fontFamily,
        color: theme.colors.text.secondary,
        marginBottom: 4,
    },
    transcriptionText: {
        fontSize: theme.typography.body.small.fontSize,
        lineHeight: theme.typography.body.small.lineHeight,
        fontFamily: theme.typography.body.small.fontFamily,
        color: theme.colors.text.primary,
        fontStyle: 'italic',
    },
    voiceAnswerContainer: {
        marginBottom: theme.spacing.lg,
    },
    voiceAnswerButton: {
        flexDirection: 'row',
        backgroundColor: theme.colors.warning.main,
        paddingVertical: theme.spacing.md,
        paddingHorizontal: theme.spacing['2xl'],
        borderRadius: theme.layout.borderRadius.md,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: theme.spacing.md,
    },
    voiceAnswerButtonActive: {
        backgroundColor: theme.colors.error.main,
    },
    voiceAnswerButtonText: {
        color: theme.colors.text.inverse,
        fontSize: theme.typography.body.medium.fontSize,
        lineHeight: theme.typography.body.medium.lineHeight,
        fontFamily: theme.typography.body.medium.fontFamily,
        fontWeight: theme.typography.fontWeight.bold,
        marginLeft: theme.spacing.sm,
    },
    audioSection: {
        margin: theme.spacing.lg,
        marginBottom: 0,
    },
    scoreRequirementBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.warning.background,
        padding: theme.spacing.md,
        borderRadius: theme.layout.borderRadius.md,
        marginTop: theme.spacing.md,
        gap: theme.spacing.sm,
    },
    scoreRequirementText: {
        flex: 1,
        fontSize: theme.typography.body.small.fontSize,
        lineHeight: theme.typography.body.small.lineHeight,
        fontFamily: theme.typography.body.small.fontFamily,
        color: theme.colors.text.secondary,
        fontWeight: theme.typography.fontWeight.medium,
    },
    questionContentContainer: {
        width: '100%',
        marginBottom: theme.spacing.lg,
    },
    questionMediaSection: {
        marginBottom: theme.spacing.lg,
        backgroundColor: theme.colors.background.tertiary,
        borderRadius: theme.layout.borderRadius.lg,
        overflow: 'hidden',
    },
    mediaTypeIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: theme.spacing.md,
        backgroundColor: theme.colors.background.tertiary,
        gap: theme.spacing.sm,
    },
    mediaTypeLabel: {
        fontSize: theme.typography.body.small.fontSize,
        lineHeight: theme.typography.body.small.lineHeight,
        fontFamily: theme.typography.body.small.fontFamily,
        color: theme.colors.text.secondary,
        fontWeight: theme.typography.fontWeight.medium,
    },
}));

export default WWWGamePlayScreen;
