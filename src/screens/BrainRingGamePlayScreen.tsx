import React, { useEffect, useState, useCallback } from 'react';
import { SafeAreaView, StyleSheet, View, Text, Alert, ScrollView, TextInput } from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useBrainRingController } from '../features/BrainRing/hooks/useBrainRingController';
import { BuzzButton } from '../features/BrainRing/ui/BuzzButton';
import { PlayerStatus } from '../features/BrainRing/ui/PlayerStatus';
import { AnswerTimer } from '../features/BrainRing/ui/AnswerTimer';
import { Button, ButtonVariant } from '../shared/ui/Button/Button';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useAppStyles } from '../shared/ui/hooks/useAppStyles';
import { useGetQuizRoundsQuery, useGetQuizSessionQuery } from '../entities/QuizState/model/slice/quizApi';

type BrainRingGamePlayNavigationProp = NativeStackNavigationProp<RootStackParamList, 'BrainRingGamePlay'>;
type BrainRingGamePlayRouteProp = RouteProp<RootStackParamList, 'BrainRingGamePlay'>;

const BrainRingGamePlayScreen: React.FC = () => {
    const route = useRoute<BrainRingGamePlayRouteProp>();
    const navigation = useNavigation<BrainRingGamePlayNavigationProp>();
    const { screen } = useAppStyles();
    
    const { sessionId, userId } = route.params;
    
    // Fetch session and rounds
    const { data: session } = useGetQuizSessionQuery(sessionId);
    const { data: rounds } = useGetQuizRoundsQuery(sessionId);
    
    const [currentRoundIndex, setCurrentRoundIndex] = useState(0);
    const currentRound = rounds ? rounds[currentRoundIndex] : null;
    
    const controller = useBrainRingController(
        sessionId,
        currentRound?.id || '',
        Number(userId)
    );
    
    const [answer, setAnswer] = useState('');

    const handleNextRound = useCallback(() => {
        if (rounds && currentRoundIndex < rounds.length - 1) {
            setCurrentRoundIndex(prev => prev + 1);
            setAnswer('');
        } else {
            navigation.navigate('ChallengeDetails', { challengeId: session?.challengeId || '' });
        }
    }, [rounds, currentRoundIndex, navigation, session]);

    const handleSubmitAnswer = async () => {
        if (!answer.trim()) return;
        const result = await controller.handleSubmitAnswer(answer);
        if (result?.isCorrect) {
            Alert.alert('Correct!', 'Well done!');
        } else {
            Alert.alert('Incorrect', 'Better luck next time or wait for others.');
        }
    };

    if (!session || !currentRound) {
        return (
            <SafeAreaView style={screen.container}>
                <Text>Loading game...</Text>
            </SafeAreaView>
        );
    }

    const renderContent = () => {
        const { state } = controller;

        switch (state.phase) {
            case 'question_display':
                return (
                    <View style={styles.center}>
                        <Text style={styles.roundInfo}>Round {currentRoundIndex + 1}</Text>
                        <Text style={styles.question}>{currentRound.question.question}</Text>
                        <BuzzButton 
                            onPress={controller.handleBuzz} 
                            disabled={!state.canBuzz} 
                            isActive={state.canBuzz} 
                        />
                    </View>
                );
            case 'player_answering':
                return (
                    <View style={styles.center}>
                        <Text style={styles.answeringText}>
                            {state.isAnswering ? 'YOUR TURN!' : `${state.currentBuzzer} is answering...`}
                        </Text>
                        {state.answerDeadline && (
                            <AnswerTimer deadline={state.answerDeadline} />
                        )}
                        {state.isAnswering ? (
                            <View style={styles.inputContainer}>
                                <TextInput
                                    style={styles.input}
                                    value={answer}
                                    onChangeText={setAnswer}
                                    placeholder="Type your answer..."
                                    autoFocus
                                />
                                <Button onPress={handleSubmitAnswer} disabled={!answer.trim()}>
                                    Submit Answer
                                </Button>
                            </View>
                        ) : (
                            <View style={styles.waitingContainer}>
                                <Text style={styles.question}>{currentRound.question.question}</Text>
                                <Text>Wait for player to answer...</Text>
                            </View>
                        )}
                    </View>
                );
            case 'answer_feedback':
                return (
                    <View style={styles.center}>
                        <Text style={styles.feedbackTitle}>Correct Answer!</Text>
                        <Text style={styles.correctAnswer}>{currentRound.question.answer}</Text>
                        <Button onPress={handleNextRound}>
                            {currentRoundIndex < (rounds?.length || 0) - 1 ? 'Next Round' : 'Finish Game'}
                        </Button>
                    </View>
                );
            case 'round_complete':
                return (
                    <View style={styles.center}>
                        <Text style={styles.feedbackTitle}>Round Over</Text>
                        <Text>No one answered correctly.</Text>
                        <Text style={styles.correctAnswer}>The answer was: {currentRound.question.answer}</Text>
                        <Button onPress={handleNextRound}>
                            {currentRoundIndex < (rounds?.length || 0) - 1 ? 'Next Round' : 'Finish Game'}
                        </Button>
                    </View>
                );
            default:
                return <Text>Waiting...</Text>;
        }
    };

    return (
        <SafeAreaView style={screen.container}>
            <View style={styles.header}>
                <Text style={styles.teamName}>{session.teamName}</Text>
                <Text style={styles.score}>Score: {session.correctAnswers}</Text>
            </View>
            
            <ScrollView style={styles.content}>
                {renderContent()}
            </ScrollView>

            <View style={styles.footer}>
                <Text style={styles.statusTitle}>Players Status</Text>
                <PlayerStatus 
                    name="You" 
                    score={0} 
                    status={
                        controller.state.isAnswering ? 'answering' : 
                        controller.state.lockedOutPlayers.includes(Number(userId)) ? 'locked_out' : 'active'
                    }
                    isMe
                />
                {/* Other players would be listed here if we had them in session */}
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        padding: 16,
        backgroundColor: '#FFF',
        borderBottomWidth: 1,
        borderBottomColor: '#EEE',
    },
    teamName: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    score: {
        fontSize: 18,
        color: '#4CAF50',
    },
    content: {
        flex: 1,
        padding: 20,
    },
    center: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 40,
    },
    roundInfo: {
        fontSize: 16,
        color: '#666',
        marginBottom: 10,
    },
    question: {
        fontSize: 24,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 40,
    },
    answeringText: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#FF9800',
        marginBottom: 20,
    },
    inputContainer: {
        width: '100%',
        marginTop: 20,
    },
    input: {
        borderWidth: 1,
        borderColor: '#DDD',
        borderRadius: 8,
        padding: 15,
        fontSize: 18,
        marginBottom: 20,
        backgroundColor: '#FFF',
    },
    waitingContainer: {
        alignItems: 'center',
    },
    feedbackTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#4CAF50',
        marginBottom: 20,
    },
    correctAnswer: {
        fontSize: 22,
        marginBottom: 40,
        textAlign: 'center',
    },
    footer: {
        padding: 16,
        backgroundColor: '#F9F9F9',
        borderTopWidth: 1,
        borderTopColor: '#EEE',
    },
    statusTitle: {
        fontSize: 14,
        color: '#666',
        marginBottom: 10,
        fontWeight: 'bold',
    },
});

export default BrainRingGamePlayScreen;
