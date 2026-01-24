// src/screens/WWWGameResultsScreen.tsx
import React, {useState} from 'react';
import {
    ActivityIndicator,
    Alert,
    Modal,
    Platform,
    SafeAreaView,
    ScrollView,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import {RouteProp, useNavigation, useRoute} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {useSelector} from 'react-redux';
import {RootState} from '../app/providers/StoreProvider/store';
import {WWWGameService} from "../services/wwwGame/wwwGameService.ts";
import {
    useGetChallengeAudioConfigQuery,
    useSubmitChallengeCompletionMutation
} from '../entities/ChallengeState/model/slice/challengeApi';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {useAppStyles} from '../shared/ui/hooks/useAppStyles';
import {createStyles} from '../shared/ui/theme';

// Define the types for the navigation parameters
type RootStackParamList = {
    WWWGameResults: {
        teamName: string;
        score: number;
        totalRounds: number;
        roundsData: RoundData[];
        challengeId?: string; // Optional challenge ID for tracking
    };
    CreateWWWQuest: undefined;
    Main: { screen: string };
    QuizResults: {
        challengeId: string;
        score: number;
        totalRounds: number;
        teamName: string;
        roundsData: any[];
    };
};

type WWWGameResultsRouteProp = RouteProp<RootStackParamList, 'WWWGameResults'>;
type WWWGameResultsNavigationProp = NativeStackNavigationProp<RootStackParamList, 'WWWGameResults'>;

// Types for game data
interface RoundData {
    question: string;
    correctAnswer: string;
    teamAnswer: string;
    isCorrect: boolean;
    playerWhoAnswered: string;
    discussionNotes: string;
}

const WWWGameResultsScreen: React.FC = () => {
    const route = useRoute<WWWGameResultsRouteProp>();
    const navigation = useNavigation<WWWGameResultsNavigationProp>();
    const { teamName, score, totalRounds, roundsData, challengeId } = route.params;
    const { user } = useSelector((state: RootState) => state.auth);
    const [submitCompletion, { isLoading: isSubmitting }] = useSubmitChallengeCompletionMutation();
    const {screen, theme} = useAppStyles();
    const styles = themeStyles;

    // Fetch challenge audio configuration if challengeId exists
    const { data: audioConfig } = useGetChallengeAudioConfigQuery(
        challengeId || '',
        { skip: !challengeId }
    );

    // State variables
    const [showEndGameModal, setShowEndGameModal] = useState(false);
    const [submittingChallenge, setSubmittingChallenge] = useState(false);

    // Variables for progress bar - added these
    const roundCount = totalRounds; // Total number of rounds
    const currentRound = totalRounds; // On results screen, all rounds are complete

    // Calculate stats
    const correctPercentage = (score / totalRounds) * 100;

    // Calculate player performance using the game service
    const performances = WWWGameService.calculatePlayerPerformance(roundsData);

    // Check if minimum score requirement is met
    const minimumScoreRequired = audioConfig?.minimumScorePercentage || 0;
    const meetsMinimumScore = minimumScoreRequired === 0 || correctPercentage >= minimumScoreRequired;

    // Result message based on score
    const getResultMessage = () => {
        return WWWGameService.generateResultsMessage(score, totalRounds);
    };

    // AI host feedback on overall performance
    const getAIFeedback = () => {
        return WWWGameService.generateGameFeedback(roundsData, performances);
    };

    // Play again button handler
    const playAgain = () => {
        // Check if this game was part of a challenge
        if (challengeId) {
            // Prompt to complete the challenge
            Alert.alert(
                'Complete Challenge?',
                'Would you like to mark this challenge as completed?',
                [
                    {
                        text: 'Yes, Complete It',
                        onPress: () => {
                            // Submit challenge completion
                            submitChallengeWithResults();
                        }
                    },
                    {
                        text: 'No, Play Again',
                        onPress: () => navigation.navigate('CreateWWWQuest')
                    }
                ]
            );
        } else {
            // Regular game, just go back to setup
            navigation.navigate('CreateWWWQuest');
        }
    };

    // Return home button handler
    const returnHome = () => {
        // Check if this game was part of a challenge
        if (challengeId) {
            // Prompt to complete the challenge
            Alert.alert(
                'Complete Challenge?',
                'Would you like to mark this challenge as completed?',
                [
                    {
                        text: 'Yes, Complete It',
                        onPress: () => {
                            // Submit challenge completion
                            submitChallengeWithResults();
                        }
                    },
                    {
                        text: 'No, Return Home',
                        onPress: () => navigation.navigate('Main', { screen: 'Home' })
                    }
                ]
            );
        } else {
            // Regular game, just go home
            navigation.navigate('Main', { screen: 'Home' });
        }
    };

    // Submit challenge with results
    const submitChallengeWithResults = async () => {
        if (!challengeId) return;

        try {
            // Show loading indicator
            setSubmittingChallenge(true);

            // Submit completion with the game results
            await submitCompletion({
                challengeId: challengeId,
                completionData: {
                    verificationData: {
                        score,
                        totalRounds,
                        completed: true,
                        teamName,
                        roundsData: roundsData.map(round => ({
                            question: round.question,
                            correctAnswer: round.correctAnswer,
                            teamAnswer: round.teamAnswer,
                            isCorrect: round.isCorrect,
                            playerWhoAnswered: round.playerWhoAnswered
                        }))
                    },
                    notes: `Quiz completed with score ${score}/${totalRounds}`
                }
            }).unwrap();

            // Navigate to the quiz results screen
            navigation.navigate('QuizResults', {
                challengeId,
                score,
                totalRounds,
                teamName,
                roundsData
            });
        } catch (error) {
            console.error('Error completing challenge:', error);
            Alert.alert(
                'Error',
                'Failed to submit challenge completion. Please try again.',
                [{ text: 'OK', onPress: () => navigation.navigate('Main', { screen: 'Home' }) }]
            );
        } finally {
            setSubmittingChallenge(false);
        }
    };

    // Legacy end game function for non-challenge games
    const endGame = () => {
        setShowEndGameModal(false);

        // If this game was started from a challenge, offer to mark it as completed
        if (challengeId) {
            Alert.alert(
                'Complete Challenge?',
                'Would you like to mark this challenge as completed?',
                [
                    {
                        text: 'Yes',
                        onPress: submitChallengeWithResults
                    },
                    {
                        text: 'No',
                        onPress: () => navigation.navigate('Main', { screen: 'Home' })
                    }
                ]
            );
        } else {
            // Regular game flow
            navigation.navigate('Main', { screen: 'Home' });
        }
    };

    return (
        <SafeAreaView style={screen.container}>
            <View style={styles.header}>
                <View style={styles.headerTop}>
                    <Text style={styles.teamName}>{teamName}</Text>
                    <Text style={styles.scoreText}>Score: {score}/{totalRounds}</Text>
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
                <View style={styles.scoreContainer}>
                    <Text style={styles.scoreText}>Score: {score}/{totalRounds}</Text>
                    <View style={styles.scoreBar}>
                        <View
                            style={[
                                styles.scoreProgress,
                                { width: `${correctPercentage}%` }
                            ]}
                        />
                    </View>
                    <Text style={styles.scorePercentage}>{correctPercentage.toFixed(0)}% Correct</Text>
                    <Text style={styles.resultMessage}>{getResultMessage()}</Text>
                </View>

                {/* Minimum Score Requirement Status */}
                {minimumScoreRequired > 0 && (
                    <View style={[
                        styles.scoreRequirementContainer,
                        meetsMinimumScore ? styles.scoreRequirementMet : styles.scoreRequirementNotMet
                    ]}>
                        <MaterialCommunityIcons
                            name={meetsMinimumScore ? "check-circle" : "alert-circle"}
                            size={24}
                            color={meetsMinimumScore ? theme.colors.success.main : theme.colors.error.main}
                        />
                        <View style={styles.scoreRequirementContent}>
                            <Text style={[
                                styles.scoreRequirementTitle,
                                meetsMinimumScore ? styles.scoreRequirementMetText : styles.scoreRequirementNotMetText
                            ]}>
                                {meetsMinimumScore ? 'Quest Requirement Met!' : 'Quest Requirement Not Met'}
                            </Text>
                            <Text style={styles.scoreRequirementDescription}>
                                Minimum score required: {minimumScoreRequired}% | Your score: {correctPercentage.toFixed(0)}%
                            </Text>
                            {!meetsMinimumScore && (
                                <Text style={styles.scoreRequirementHelp}>
                                    You need to score at least {minimumScoreRequired}% to complete this quest. Try again!
                                </Text>
                            )}
                        </View>
                    </View>
                )}

                <View style={styles.feedbackContainer}>
                    <Text style={styles.sectionTitle}>AI Host Analysis</Text>
                    <Text style={styles.feedbackText}>{getAIFeedback()}</Text>
                </View>

                <View style={styles.performanceContainer}>
                    <Text style={styles.sectionTitle}>Player Performance</Text>
                    {performances.map((perf, index) => (
                        <View key={index} style={styles.playerItem}>
                            <View style={styles.playerInfo}>
                                <Text style={styles.playerName}>{perf.player}</Text>
                                <Text style={styles.playerStats}>
                                    {perf.correct}/{perf.total} ({perf.percentage.toFixed(0)}%)
                                </Text>
                            </View>
                            <View style={styles.playerBar}>
                                <View
                                    style={[
                                        styles.playerProgress,
                                        { width: `${perf.percentage}%` }
                                    ]}
                                />
                            </View>
                        </View>
                    ))}
                </View>

                <View style={styles.questionsContainer}>
                    <Text style={styles.sectionTitle}>Question Results</Text>
                    {roundsData.map((round, index) => (
                        <View key={index} style={styles.questionItem}>
                            <View style={styles.questionHeader}>
                                <Text style={styles.questionNumber}>Question {index + 1}</Text>
                                <View style={[
                                    styles.resultBadge,
                                    round.isCorrect ? styles.correctBadge : styles.incorrectBadge
                                ]}>
                                    <Text style={styles.resultBadgeText}>
                                        {round.isCorrect ? 'CORRECT' : 'INCORRECT'}
                                    </Text>
                                </View>
                            </View>

                            <Text style={styles.questionText}>{round.question}</Text>

                            <View style={styles.answerContainer}>
                                <View style={styles.answerItem}>
                                    <Text style={styles.answerLabel}>Your Answer:</Text>
                                    <Text style={styles.answerText}>{round.teamAnswer}</Text>
                                </View>

                                <View style={styles.answerItem}>
                                    <Text style={styles.answerLabel}>Correct Answer:</Text>
                                    <Text style={styles.answerText}>{round.correctAnswer}</Text>
                                </View>

                                <Text style={styles.playerAnswered}>
                                    Answered by: {round.playerWhoAnswered}
                                </Text>
                            </View>
                        </View>
                    ))}
                </View>

                <View style={styles.buttonsContainer}>
                    <TouchableOpacity
                        style={[styles.primaryButton, (submittingChallenge) && styles.disabledButton]}
                        onPress={playAgain}
                        disabled={submittingChallenge}
                    >
                        {submittingChallenge ? (
                            <ActivityIndicator size="small" color={theme.colors.text.inverse} />
                        ) : (
                            <Text style={styles.buttonText}>Play Again</Text>
                        )}
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.secondaryButton, (submittingChallenge) && styles.disabledButton]}
                        onPress={returnHome}
                        disabled={submittingChallenge}
                    >
                        <Text style={styles.secondaryButtonText}>Return to Home</Text>
                    </TouchableOpacity>
                </View>
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
                            Your team scored {score} out of {totalRounds} questions.
                        </Text>
                        <Text style={styles.modalScore}>
                            {score === totalRounds
                                ? 'Perfect score! Incredible!'
                                : score > totalRounds / 2
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

const themeStyles = createStyles(theme => ({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background.secondary,
    },
    header: {
        backgroundColor: theme.colors.success.main,
        padding: theme.spacing.lg,
    },
    headerTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: theme.spacing.sm,
    },
    teamName: {
        ...theme.typography.body.large,
        fontWeight: theme.typography.fontWeight.bold,
        color: theme.colors.text.inverse,
    },
    scoreText: {
        ...theme.typography.body.large,
        fontWeight: theme.typography.fontWeight.bold,
        color: theme.colors.text.inverse,
    },
    progressBar: {
        height: 6,
        backgroundColor: theme.colors.overlay.light,
        borderRadius: 3,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        backgroundColor: theme.colors.background.primary,
    },
    content: {
        padding: theme.spacing.lg,
        flexGrow: 1,
    },
    scoreContainer: {
        margin: theme.spacing.lg,
        backgroundColor: theme.colors.background.primary,
        borderRadius: theme.layout.borderRadius.lg,
        padding: theme.spacing.lg,
        alignItems: 'center',
        ...theme.shadows.small,
    },
    scoreBar: {
        height: 16,
        width: '100%',
        backgroundColor: theme.colors.background.tertiary,
        borderRadius: 8,
        overflow: 'hidden',
        marginBottom: theme.spacing.sm,
    },
    scoreProgress: {
        height: '100%',
        backgroundColor: theme.colors.success.main,
    },
    scorePercentage: {
        ...theme.typography.heading.h6,
        color: theme.colors.success.main,
        fontWeight: theme.typography.fontWeight.bold,
        marginBottom: theme.spacing.lg,
    },
    resultMessage: {
        ...theme.typography.body.medium,
        color: theme.colors.text.secondary,
        textAlign: 'center',
    },
    feedbackContainer: {
        margin: theme.spacing.lg,
        marginTop: 0,
        backgroundColor: theme.colors.background.primary,
        borderRadius: theme.layout.borderRadius.lg,
        padding: theme.spacing.lg,
        ...theme.shadows.small,
    },
    sectionTitle: {
        ...theme.typography.heading.h6,
        fontWeight: theme.typography.fontWeight.bold,
        color: theme.colors.text.primary,
        marginBottom: theme.spacing.lg,
    },
    feedbackText: {
        ...theme.typography.body.medium,
        color: theme.colors.text.secondary,
        lineHeight: 24,
    },
    performanceContainer: {
        margin: theme.spacing.lg,
        marginTop: 0,
        backgroundColor: theme.colors.background.primary,
        borderRadius: theme.layout.borderRadius.lg,
        padding: theme.spacing.lg,
        ...theme.shadows.small,
    },
    playerItem: {
        marginBottom: theme.spacing.lg,
    },
    playerInfo: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: theme.spacing.sm,
    },
    playerName: {
        ...theme.typography.body.medium,
        fontWeight: theme.typography.fontWeight.medium,
        color: theme.colors.text.primary,
    },
    playerStats: {
        ...theme.typography.body.medium,
        color: theme.colors.text.secondary,
    },
    playerBar: {
        height: 10,
        width: '100%',
        backgroundColor: theme.colors.background.tertiary,
        borderRadius: 5,
        overflow: 'hidden',
    },
    playerProgress: {
        height: '100%',
        backgroundColor: theme.colors.success.main,
    },
    questionsContainer: {
        margin: theme.spacing.lg,
        marginTop: 0,
        backgroundColor: theme.colors.background.primary,
        borderRadius: theme.layout.borderRadius.lg,
        padding: theme.spacing.lg,
        ...theme.shadows.small,
    },
    questionItem: {
        marginBottom: theme.spacing['2xl'],
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border.light,
        paddingBottom: theme.spacing.lg,
    },
    questionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: theme.spacing.sm,
    },
    questionNumber: {
        ...theme.typography.body.medium,
        fontWeight: theme.typography.fontWeight.bold,
        color: theme.colors.text.primary,
    },
    resultBadge: {
        paddingVertical: 4,
        paddingHorizontal: theme.spacing.md,
        borderRadius: theme.layout.borderRadius.lg,
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
    questionText: {
        ...theme.typography.body.medium,
        color: theme.colors.text.primary,
        marginBottom: theme.spacing.sm,
        lineHeight: 22,
        fontFamily: Platform.OS === 'ios' ? 'System' : theme.typography.fontFamily.primary,
    },
    answerContainer: {
        backgroundColor: theme.colors.background.tertiary,
        padding: theme.spacing.md,
        borderRadius: theme.layout.borderRadius.md,
    },
    answerItem: {
        marginBottom: theme.spacing.sm,
    },
    answerLabel: {
        ...theme.typography.body.small,
        color: theme.colors.text.secondary,
    },
    answerText: {
        ...theme.typography.body.medium,
        color: theme.colors.text.primary,
        fontWeight: theme.typography.fontWeight.medium,
    },
    playerAnswered: {
        ...theme.typography.body.small,
        color: theme.colors.text.secondary,
        fontStyle: 'italic',
        marginTop: theme.spacing.sm,
    },
    buttonsContainer: {
        margin: theme.spacing.lg,
        marginTop: 0,
        marginBottom: theme.spacing['3xl'],
    },
    primaryButton: {
        backgroundColor: theme.colors.success.main,
        paddingVertical: 14,
        paddingHorizontal: theme.spacing['2xl'],
        borderRadius: theme.layout.borderRadius.md,
        alignItems: 'center',
        marginBottom: theme.spacing.md,
    },
    buttonText: {
        color: theme.colors.text.inverse,
        ...theme.typography.body.medium,
        fontWeight: theme.typography.fontWeight.bold,
    },
    secondaryButton: {
        backgroundColor: 'transparent',
        paddingVertical: 14,
        paddingHorizontal: theme.spacing['2xl'],
        borderRadius: theme.layout.borderRadius.md,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: theme.colors.success.main,
    },
    secondaryButtonText: {
        color: theme.colors.success.main,
        ...theme.typography.body.medium,
        fontWeight: theme.typography.fontWeight.bold,
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
    modalTitle: {
        ...theme.typography.heading.h5,
        fontWeight: theme.typography.fontWeight.bold,
        color: theme.colors.text.primary,
        marginBottom: theme.spacing.lg,
    },
    modalText: {
        ...theme.typography.body.medium,
        color: theme.colors.text.secondary,
        marginBottom: theme.spacing.sm,
        textAlign: 'center',
    },
    modalScore: {
        ...theme.typography.body.large,
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
        ...theme.typography.body.medium,
        fontWeight: theme.typography.fontWeight.bold,
    },
    disabledButton: {
        opacity: 0.7,
    },
    scoreRequirementContainer: {
        flexDirection: 'row',
        margin: theme.spacing.lg,
        marginTop: 0,
        backgroundColor: theme.colors.background.primary,
        borderRadius: theme.layout.borderRadius.lg,
        padding: theme.spacing.lg,
        ...theme.shadows.small,
        gap: theme.spacing.md,
        borderLeftWidth: 4,
    },
    scoreRequirementMet: {
        borderLeftColor: theme.colors.success.main,
        backgroundColor: theme.colors.success.background,
    },
    scoreRequirementNotMet: {
        borderLeftColor: theme.colors.error.main,
        backgroundColor: theme.colors.error.background,
    },
    scoreRequirementContent: {
        flex: 1,
    },
    scoreRequirementTitle: {
        ...theme.typography.body.medium,
        fontWeight: theme.typography.fontWeight.bold,
        marginBottom: 4,
    },
    scoreRequirementMetText: {
        color: theme.colors.success.main,
    },
    scoreRequirementNotMetText: {
        color: theme.colors.error.main,
    },
    scoreRequirementDescription: {
        ...theme.typography.body.small,
        color: theme.colors.text.secondary,
        marginBottom: 4,
    },
    scoreRequirementHelp: {
        ...theme.typography.caption,
        color: theme.colors.text.disabled,
        fontStyle: 'italic',
    },
}));

export default WWWGameResultsScreen;