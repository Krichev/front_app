import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useMultiplayerRoomService } from '../features/MultiplayerRoom/services/MultiplayerRoomService';
import { GamePhase } from '../features/MultiplayerRoom/types';
import { useGetQuizQuestionByIdQuery } from '../entities/QuizState/model/slice/quizApi';
import { useSelector } from 'react-redux';
import { RootState } from '../app/providers/StoreProvider/store';

type ControllerGameRouteProp = RouteProp<RootStackParamList, 'ControllerGame'>;
type ControllerGameNavigationProp = NativeStackNavigationProp<RootStackParamList>;

const ControllerGameScreen: React.FC = () => {
    const route = useRoute<ControllerGameRouteProp>();
    const navigation = useNavigation<ControllerGameNavigationProp>();
    const { roomCode } = route.params;
    
    const { gameState, players, connectionStatus, submitAnswer, sendBuzz } = useMultiplayerRoomService(roomCode);
    const user = useSelector((state: RootState) => state.auth.user);
    const me = players.find(p => p.userId.toString() === user?.id);

    const { data: question } = useGetQuizQuestionByIdQuery(gameState?.currentQuestionId || 0, {
        skip: !gameState?.currentQuestionId
    });

    const [answerText, setAnswerText] = useState('');
    const [hasSubmitted, setHasSubmitted] = useState(false);

    // Reset submission state when question changes
    useEffect(() => {
        setHasSubmitted(false);
        setAnswerText('');
    }, [gameState?.currentQuestionId]);

    useEffect(() => {
        if (gameState?.phase === GamePhase.COMPLETED) {
            navigation.navigate('MultiplayerGameOver', { roomCode });
        }
    }, [gameState?.phase, navigation, roomCode]);

    const handleSubmit = (answer: string) => {
        if (hasSubmitted || !gameState?.currentQuestionId) return;
        submitAnswer(gameState.currentQuestionId, answer);
        setHasSubmitted(true);
    };

    const renderPhaseContent = () => {
        if (!gameState) return null;

        switch (gameState.phase) {
            case GamePhase.READING:
            case GamePhase.DISCUSSION:
                return (
                    <View style={styles.phaseContainer}>
                        <Text style={styles.phaseTitle}>Listen Carefully!</Text>
                        <Text style={styles.phaseSubtitle}>Discussion in progress...</Text>
                        {/* If Brain Ring, show Buzz button */}
                        <TouchableOpacity style={styles.buzzButton} onPress={sendBuzz}>
                            <Text style={styles.buzzText}>BUZZ!</Text>
                        </TouchableOpacity>
                    </View>
                );
            case GamePhase.ANSWERING:
                if (hasSubmitted) {
                    return (
                        <View style={styles.phaseContainer}>
                            <Text style={styles.submittedText}>Answer Sent ✓</Text>
                            <Text style={styles.waitText}>Waiting for others...</Text>
                        </View>
                    );
                }
                return (
                    <KeyboardAvoidingView 
                        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                        style={styles.answerContainer}
                    >
                        <Text style={styles.questionHint}>{question?.question}</Text>
                        <TextInput
                            style={styles.textInput}
                            placeholder="Type your answer..."
                            placeholderTextColor="#666"
                            value={answerText}
                            onChangeText={setAnswerText}
                            autoFocus
                        />
                        <TouchableOpacity 
                            style={styles.submitButton}
                            onPress={() => handleSubmit(answerText)}
                        >
                            <Text style={styles.submitButtonText}>SUBMIT</Text>
                        </TouchableOpacity>
                    </KeyboardAvoidingView>
                );
            case GamePhase.FEEDBACK:
                return (
                    <View style={styles.phaseContainer}>
                        <Text style={styles.phaseTitle}>Round Finished</Text>
                        <Text style={styles.feedbackText}>Look at the TV!</Text>
                    </View>
                );
            default:
                return <Text style={styles.waitText}>Waiting for next phase...</Text>;
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <View>
                    <Text style={styles.playerName}>{user?.username}</Text>
                    <Text style={styles.playerScore}>{me?.score || 0} pts</Text>
                </View>
                <View style={styles.roomBadge}>
                    <Text style={styles.roomText}>{roomCode}</Text>
                </View>
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                {renderPhaseContent()}
            </ScrollView>

            {connectionStatus !== 'CONNECTED' && (
                <View style={styles.reconnecting}>
                    <Text style={styles.reconnectingText}>Reconnecting...</Text>
                </View>
            )}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#1a1a2e',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        backgroundColor: '#16213e',
    },
    playerName: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    playerScore: {
        color: '#e94560',
        fontSize: 16,
        fontWeight: 'bold',
    },
    roomBadge: {
        backgroundColor: '#0f3460',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
    },
    roomText: {
        color: '#fff',
        fontWeight: 'bold',
    },
    content: {
        flexGrow: 1,
        padding: 24,
        justifyContent: 'center',
    },
    phaseContainer: {
        alignItems: 'center',
    },
    phaseTitle: {
        color: '#fff',
        fontSize: 32,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    phaseSubtitle: {
        color: '#ccc',
        fontSize: 18,
        marginBottom: 40,
    },
    buzzButton: {
        width: 200,
        height: 200,
        borderRadius: 100,
        backgroundColor: '#e94560',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 8,
        borderColor: '#951c30',
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.5,
        shadowRadius: 10,
    },
    buzzText: {
        color: '#fff',
        fontSize: 40,
        fontWeight: 'black',
    },
    answerContainer: {
        width: '100%',
    },
    questionHint: {
        color: '#ccc',
        fontSize: 16,
        marginBottom: 20,
        fontStyle: 'italic',
    },
    textInput: {
        backgroundColor: '#16213e',
        borderRadius: 12,
        padding: 20,
        fontSize: 20,
        color: '#fff',
        borderWidth: 2,
        borderColor: '#0f3460',
        marginBottom: 24,
    },
    submitButton: {
        backgroundColor: '#e94560',
        padding: 20,
        borderRadius: 12,
        alignItems: 'center',
    },
    submitButtonText: {
        color: '#fff',
        fontSize: 20,
        fontWeight: 'bold',
    },
    submittedText: {
        color: '#4CAF50',
        fontSize: 32,
        fontWeight: 'bold',
        marginBottom: 16,
    },
    waitText: {
        color: '#ccc',
        fontSize: 18,
    },
    feedbackText: {
        color: '#fff',
        fontSize: 24,
        fontWeight: 'bold',
    },
    reconnecting: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.7)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    reconnectingText: {
        color: '#fff',
        fontSize: 24,
        fontWeight: 'bold',
    }
});

export default ControllerGameScreen;
