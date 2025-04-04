// src/screens/WWWGameResultsScreen.tsx
import React from 'react';
import {SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View,} from 'react-native';
import {RouteProp, useNavigation, useRoute} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {useSelector} from 'react-redux';
import {RootState} from '../app/providers/StoreProvider/store';
import {WWWGameService} from "../services/wwwGame/wwwGameService.ts";

// Define the types for the navigation parameters
type RootStackParamList = {
    WWWGameResults: {
        teamName: string;
        score: number;
        totalRounds: number;
        roundsData: RoundData[];
    };
    WWWGameSetup: undefined;
    Main: { screen: string };
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
    const { teamName, score, totalRounds, roundsData } = route.params;
    const { user } = useSelector((state: RootState) => state.auth);

    // Calculate stats
    const correctPercentage = (score / totalRounds) * 100;

    // Calculate player performance using the game service
    const performances = WWWGameService.calculatePlayerPerformance(roundsData);

    // Result message based on score
    const getResultMessage = () => {
        return WWWGameService.generateResultsMessage(score, totalRounds);
    };

    // AI host feedback on overall performance
    const getAIFeedback = () => {
        return WWWGameService.generateGameFeedback(roundsData, performances);
    };

    const playAgain = () => {
        navigation.navigate('WWWGameSetup');
    };

    const returnHome = () => {
        navigation.navigate('Main', { screen: 'Home' });
    };

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView style={styles.scrollView}>
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>Game Results</Text>
                    <Text style={styles.teamName}>{teamName}</Text>
                </View>

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

                <View style={styles.feedbackContainer}>
                    <Text style={styles.sectionTitle}>AI Host Analysis</Text>
                    <Text style={styles.feedbackText}>{getAIFeedback()}</Text>
                </View>

                <View style={styles.performanceContainer}>
                    <Text style={styles.sectionTitle}>Player Performance</Text>
                    {performances.map((perf: { player: string | number | boolean | React.ReactElement<any, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | React.ReactPortal | null | undefined; correct: string | number | boolean | React.ReactElement<any, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | React.ReactPortal | null | undefined; total: string | number | boolean | React.ReactElement<any, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | React.ReactPortal | null | undefined; percentage: number; }, index: React.Key | null | undefined) => (
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
                        style={styles.primaryButton}
                        onPress={playAgain}
                    >
                        <Text style={styles.buttonText}>Play Again</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.secondaryButton}
                        onPress={returnHome}
                    >
                        <Text style={styles.secondaryButtonText}>Return to Home</Text>
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
    scrollView: {
        flex: 1,
    },
    header: {
        backgroundColor: '#4CAF50',
        padding: 20,
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: 'white',
        marginBottom: 8,
    },
    teamName: {
        fontSize: 18,
        color: 'rgba(255, 255, 255, 0.9)',
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
    scoreText: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 16,
    },
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
        marginBottom: 12,
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
});

export default WWWGameResultsScreen;