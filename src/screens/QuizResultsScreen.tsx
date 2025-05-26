// src/screens/QuizResultsScreen.tsx
import React, {useEffect} from 'react';
import {
    ActivityIndicator,
    Alert,
    Platform,
    SafeAreaView,
    ScrollView,
    Share,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import {RouteProp, useNavigation, useRoute} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {useSelector} from 'react-redux';
import {RootState} from '../app/providers/StoreProvider/store';
import {useUpdateChallengeMutation} from '../entities/ChallengeState/model/slice/challengeApi';
import {DeepSeekHostService} from '../services/wwwGame/deepseekHostService';
import {navigateToTab} from "../utils/navigation.ts";

// Define the types for the navigation parameters
type RootStackParamList = {
    QuizResults: {
        challengeId: string;
        score: number;
        totalRounds: number;
        teamName: string;
        roundsData: any[];
    };
    Challenges: undefined;
    ChallengeDetails: { challengeId: string };
};

type QuizResultsRouteProp = RouteProp<RootStackParamList, 'QuizResults'>;
type QuizResultsNavigationProp = NativeStackNavigationProp<RootStackParamList, 'QuizResults'>;

const QuizResultsScreen: React.FC = () => {
    const route = useRoute<QuizResultsRouteProp>();
    const navigation = useNavigation<QuizResultsNavigationProp>();
    const {user} = useSelector((state: RootState) => state.auth);
    const [updateChallenge, {isLoading}] = useUpdateChallengeMutation();

    const {challengeId, score, totalRounds, teamName, roundsData} = route.params;
    const [feedback, setFeedback] = React.useState<string>('');
    const [isGeneratingFeedback, setIsGeneratingFeedback] = React.useState(false);

    // Calculate score percentage
    const scorePercentage = (score / totalRounds) * 100;

    // Generate feedback using DeepSeek service
    useEffect(() => {
        const generateFeedback = async () => {
            try {
                setIsGeneratingFeedback(true);

                // Calculate player performances
                const playerMap = new Map();

                roundsData.forEach(round => {
                    if (!round.playerWhoAnswered) return;

                    if (!playerMap.has(round.playerWhoAnswered)) {
                        playerMap.set(round.playerWhoAnswered, {player: round.playerWhoAnswered, correct: 0, total: 0});
                    }

                    const playerData = playerMap.get(round.playerWhoAnswered);
                    playerData.total += 1;

                    if (round.isCorrect) {
                        playerData.correct += 1;
                    }
                });

                const playerPerformances = Array.from(playerMap.values());

                // Generate feedback
                const feedbackText = await DeepSeekHostService.generateGameFeedback(
                    teamName,
                    score,
                    totalRounds,
                    playerPerformances,
                    roundsData
                );

                setFeedback(feedbackText);
            } catch (error) {
                console.error('Error generating feedback:', error);
                setFeedback('Great job completing the quiz! Keep challenging yourself with more quizzes.');
            } finally {
                setIsGeneratingFeedback(false);
            }
        };

        generateFeedback();
    }, [roundsData, score, teamName, totalRounds]);

    // Mark challenge as completed
    const markChallengeCompleted = async () => {
        try {
            await updateChallenge({
                id: challengeId, // Changed from challengeId to id
                status: 'completed'
            }).unwrap();

            Alert.alert(
                'Success',
                'Challenge marked as completed!',
                [{text: 'OK', onPress: () => navigateToTab(navigation, 'Challenges')}]
            );
        } catch (error) {
            console.error('Error updating challenge:', error);
            Alert.alert('Error', 'Failed to update challenge status');
        }
    };
    // Share quiz results
    const shareResults = async () => {
        try {
            const shareMessage = `I just completed the "${teamName}" What? Where? When? quiz challenge with ${score}/${totalRounds} correct answers (${scorePercentage.toFixed(0)}%)!`;

            await Share.share({
                message: shareMessage,
                title: 'Quiz Challenge Results'
            });
        } catch (error) {
            console.error('Error sharing results:', error);
            Alert.alert('Error', 'Failed to share results');
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>Quiz Completed!</Text>
                </View>

                <View style={styles.scoreCard}>
                    <Text style={styles.teamName}>{teamName}</Text>

                    <View style={styles.scoreCircle}>
                        <Text style={styles.scoreText}>{score}/{totalRounds}</Text>
                        <Text style={styles.scorePercentage}>{scorePercentage.toFixed(0)}%</Text>
                    </View>

                    <Text style={styles.scoreLabel}>
                        {scorePercentage >= 80 ? 'Excellent!' :
                            scorePercentage >= 60 ? 'Great job!' :
                                scorePercentage >= 40 ? 'Good effort!' :
                                    'Keep trying!'}
                    </Text>
                </View>

                {/* AI Feedback */}
                <View style={styles.feedbackContainer}>
                    <View style={styles.feedbackHeader}>
                        <MaterialCommunityIcons name="comment-text" size={20} color="#4CAF50"/>
                        <Text style={styles.feedbackTitle}>Quiz Analysis</Text>
                    </View>

                    {isGeneratingFeedback ? (
                        <View style={styles.loadingContainer}>
                            <ActivityIndicator size="small" color="#4CAF50"/>
                            <Text style={styles.loadingText}>Analyzing your performance...</Text>
                        </View>
                    ) : (
                        <Text style={styles.feedbackText}>{feedback}</Text>
                    )}
                </View>

                {/* Question Summary */}
                <View style={styles.questionsContainer}>
                    <Text style={styles.questionsTitle}>Questions Summary</Text>

                    {roundsData.map((round, index) => (
                        <View key={index} style={styles.questionItem}>
                            <View style={styles.questionHeader}>
                                <Text style={styles.questionNumber}>Q{index + 1}</Text>
                                <View style={[
                                    styles.resultBadge,
                                    round.isCorrect ? styles.correctBadge : styles.incorrectBadge
                                ]}>
                                    <Text style={styles.resultBadgeText}>
                                        {round.isCorrect ? 'CORRECT' : 'INCORRECT'}
                                    </Text>
                                </View>
                            </View>

                            <Text style={styles.questionText} numberOfLines={2}>
                                {round.question}
                            </Text>

                            <View style={styles.answerContainer}>
                                <Text style={styles.answerLabel}>Your answer:</Text>
                                <Text style={styles.answerText}>{round.teamAnswer}</Text>

                                {!round.isCorrect && (
                                    <>
                                        <Text style={styles.answerLabel}>Correct answer:</Text>
                                        <Text style={styles.correctAnswerText}>{round.correctAnswer}</Text>
                                    </>
                                )}
                            </View>

                            {round.playerWhoAnswered && (
                                <Text style={styles.answeredBy}>
                                    Answered by: {round.playerWhoAnswered}
                                </Text>
                            )}
                        </View>
                    ))}
                </View>

                {/* Action Buttons */}
                <View style={styles.actionsContainer}>
                    <TouchableOpacity
                        style={styles.shareButton}
                        onPress={shareResults}
                    >
                        <MaterialCommunityIcons name="share" size={18} color="white"/>
                        <Text style={styles.buttonText}>Share Results</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.completeButton, isLoading && styles.disabledButton]}
                        onPress={markChallengeCompleted}
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <ActivityIndicator size="small" color="white"/>
                        ) : (
                            <>
                                <MaterialCommunityIcons name="check-circle" size={18} color="white"/>
                                <Text style={styles.buttonText}>Mark Completed</Text>
                            </>
                        )}
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => navigation.navigate('ChallengeDetails', {challengeId})}
                    >
                        <MaterialCommunityIcons name="arrow-left" size={18} color="#555"/>
                        <Text style={styles.backButtonText}>Back to Challenge</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    scrollContent: {
        padding: 16,
    },
    header: {
        alignItems: 'center',
        marginBottom: 20,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#4CAF50',
    },
    scoreCard: {
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 20,
        alignItems: 'center',
        marginBottom: 20,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 2},
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    teamName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 16,
    },
    scoreCircle: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: '#E8F5E9',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    scoreText: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#4CAF50',
    },
    scorePercentage: {
        fontSize: 16,
        color: '#4CAF50',
        marginTop: 4,
    },
    scoreLabel: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#4CAF50',
    },
    feedbackContainer: {
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 16,
        marginBottom: 20,
        elevation: 1,
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 1},
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    feedbackHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    feedbackTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginLeft: 8,
    },
    loadingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 12,
    },
    loadingText: {
        marginLeft: 8,
        fontSize: 14,
        color: '#666',
    },
    feedbackText: {
        fontSize: 14,
        lineHeight: 22,
        color: '#333',
    },
    questionsContainer: {
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 16,
        marginBottom: 20,
        elevation: 1,
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 1},
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    questionsTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 16,
    },
    questionItem: {
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
        paddingVertical: 12,
    },
    questionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    questionNumber: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#555',
    },
    resultBadge: {
        paddingVertical: 4,
        paddingHorizontal: 8,
        borderRadius: 4,
    },
    correctBadge: {
        backgroundColor: '#E8F5E9',
    },
    incorrectBadge: {
        backgroundColor: '#FFEBEE',
    },
    resultBadgeText: {
        fontSize: 10,
        fontWeight: 'bold',
        color: '#555',
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
        padding: 8,
        borderRadius: 4,
        marginBottom: 8,
    },
    answerLabel: {
        fontSize: 12,
        color: '#777',
        marginBottom: 2,
    },
    answerText: {
        fontSize: 14,
        color: '#333',
        marginBottom: 6,
    },
    correctAnswerText: {
        fontSize: 14,
        color: '#4CAF50',
        fontWeight: '500',
        marginBottom: 4,
    },
    answeredBy: {
        fontSize: 12,
        color: '#777',
        fontStyle: 'italic',
    },
    actionsContainer: {
        alignItems: 'center',
        marginBottom: 32,
    },
    shareButton: {
        flexDirection: 'row',
        backgroundColor: '#2196F3',
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 8,
        alignItems: 'center',
        marginBottom: 12,
        width: '100%',
        justifyContent: 'center',
    },
    completeButton: {
        flexDirection: 'row',
        backgroundColor: '#4CAF50',
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 8,
        alignItems: 'center',
        marginBottom: 16,
        width: '100%',
        justifyContent: 'center',
    },
    buttonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
        marginLeft: 8,
    },
    backButton: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    backButtonText: {
        color: '#555',
        fontSize: 14,
        marginLeft: 4,
    },
    disabledButton: {
        opacity: 0.7,
    },
});

export default QuizResultsScreen;