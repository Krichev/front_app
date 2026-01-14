// src/screens/WWWGameResultsScreen.tsx
import React, {useState} from 'react';
import {
    ActivityIndicator,
    Alert,
    Modal,
    SafeAreaView,
    ScrollView,
    StyleSheet,
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

// Define the types for the navigation parameters
type RootStackParamList = {
    WWWGameResults: {
        teamName: string;
        score: number;
        totalRounds: number;
        roundsData: RoundData[];
        challengeId?: string; // Optional challenge ID for tracking
    };
    WWWGameSetup: undefined;
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
                        onPress: () => navigation.navigate('WWWGameSetup')
                    }
                ]
            );
        } else {
            // Regular game, just go back to setup
            navigation.navigate('WWWGameSetup');
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
        <SafeAreaView style={styles.container}>
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
                            color={meetsMinimumScore ? "#4CAF50" : "#F44336"}
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
                            <ActivityIndicator size="small" color="white" />
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
    scoreContainer: {
        margin: 16,
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    // scoreText: {
    //     fontSize: 24,
    //     fontWeight: 'bold',
    //     color: '#333',
    //     marginBottom: 16,
    // },
    scoreBar: {
        height: 16,
        width: '100%',
        backgroundColor: '#f0f0f0',
        borderRadius: 8,
        overflow: 'hidden',
        marginBottom: 8,
    },
    scoreProgress: {
        height: '100%',
        backgroundColor: '#4CAF50',
    },
    scorePercentage: {
        fontSize: 18,
        color: '#4CAF50',
        fontWeight: 'bold',
        marginBottom: 16,
    },
    resultMessage: {
        fontSize: 16,
        color: '#555',
        textAlign: 'center',
    },
    feedbackContainer: {
        margin: 16,
        marginTop: 0,
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 16,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 16,
    },
    feedbackText: {
        fontSize: 16,
        color: '#555',
        lineHeight: 24,
    },
    performanceContainer: {
        margin: 16,
        marginTop: 0,
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 16,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    playerItem: {
        marginBottom: 16,
    },
    playerInfo: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    playerName: {
        fontSize: 16,
        fontWeight: '500',
        color: '#333',
    },
    playerStats: {
        fontSize: 16,
        color: '#666',
    },
    playerBar: {
        height: 10,
        width: '100%',
        backgroundColor: '#f0f0f0',
        borderRadius: 5,
        overflow: 'hidden',
    },
    playerProgress: {
        height: '100%',
        backgroundColor: '#4CAF50',
    },
    questionsContainer: {
        margin: 16,
        marginTop: 0,
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 16,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    questionItem: {
        marginBottom: 24,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
        paddingBottom: 16,
    },
    questionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    questionNumber: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
    },
    resultBadge: {
        paddingVertical: 4,
        paddingHorizontal: 12,
        borderRadius: 16,
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

    questionText: {
        fontSize: 16,
        color: '#333',
        marginBottom: 8,
        lineHeight: 22,
        fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
    },
    answerContainer: {
        backgroundColor: '#f9f9f9',
        padding: 12,
        borderRadius: 8,
    },
    answerItem: {
        marginBottom: 8,
    },
    answerLabel: {
        fontSize: 14,
        color: '#666',
    },
    answerText: {
        fontSize: 16,
        color: '#333',
        fontWeight: '500',
    },
    playerAnswered: {
        fontSize: 14,
        color: '#666',
        fontStyle: 'italic',
        marginTop: 8,
    },
    buttonsContainer: {
        margin: 16,
        marginTop: 0,
        marginBottom: 32,
    },
    primaryButton: {
        backgroundColor: '#4CAF50',
        paddingVertical: 14,
        paddingHorizontal: 24,
        borderRadius: 8,
        alignItems: 'center',
        marginBottom: 12,
    },
    buttonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
    secondaryButton: {
        backgroundColor: 'transparent',
        paddingVertical: 14,
        paddingHorizontal: 24,
        borderRadius: 8,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#4CAF50',
    },
    secondaryButtonText: {
        color: '#4CAF50',
        fontSize: 16,
        fontWeight: 'bold',
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
    disabledButton: {
        opacity: 0.7,
    },
    scoreRequirementContainer: {
        flexDirection: 'row',
        margin: 16,
        marginTop: 0,
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 16,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        gap: 12,
        borderLeftWidth: 4,
    },
    scoreRequirementMet: {
        borderLeftColor: '#4CAF50',
        backgroundColor: '#f1f8f4',
    },
    scoreRequirementNotMet: {
        borderLeftColor: '#F44336',
        backgroundColor: '#fef5f5',
    },
    scoreRequirementContent: {
        flex: 1,
    },
    scoreRequirementTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    scoreRequirementMetText: {
        color: '#4CAF50',
    },
    scoreRequirementNotMetText: {
        color: '#F44336',
    },
    scoreRequirementDescription: {
        fontSize: 14,
        color: '#666',
        marginBottom: 4,
    },
    scoreRequirementHelp: {
        fontSize: 13,
        color: '#999',
        fontStyle: 'italic',
    },
});

export default WWWGameResultsScreen;