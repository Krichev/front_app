// src/screens/competitive/LiveMatchScreen.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useGetMatchQuery, useStartMatchMutation, useStartRoundMutation, useSubmitPerformanceMutation } from '../../entities/CompetitiveMatch/model/slice/competitiveApi';
import { useTheme } from '../../shared/ui/theme';
import { Button } from '../../shared/ui/Button/Button';
import { CompetitiveMatchStatus } from '../../entities/CompetitiveMatch/model/types';
// Assuming AudioRecorder component exists or using basic logic
// For now, placeholder for recorder

type LiveMatchRouteProp = RouteProp<{ params: { matchId: number } }, 'params'>;

export const LiveMatchScreen = () => {
    const navigation = useNavigation<any>();
    const route = useRoute<LiveMatchRouteProp>();
    const { matchId } = route.params;
    const { theme } = useTheme();

    const { data: match, isLoading, refetch } = useGetMatchQuery(matchId, {
        pollingInterval: 3000, // Poll for opponent updates
    });

    const [startMatch] = useStartMatchMutation();
    const [startRound] = useStartRoundMutation();
    // const [submitPerformance] = useSubmitPerformanceMutation();

    const [isRecording, setIsRecording] = useState(false);

    useEffect(() => {
        if (match?.status === 'READY') {
            // Auto start? Or wait for user.
            // Let's show "Start" button.
        } else if (match?.status === 'COMPLETED') {
            navigation.replace('MatchResult', { matchId });
        }
    }, [match?.status, navigation, matchId]);

    const handleStartMatch = async () => {
        try {
            await startMatch(matchId).unwrap();
        } catch (e) {
            console.error(e);
        }
    };

    const handleStartRound = async () => {
        try {
            await startRound(matchId).unwrap();
            setIsRecording(true);
            // In real app, trigger recording logic
        } catch (e) {
            console.error(e);
        }
    };

    const handleStopAndSubmit = async () => {
        setIsRecording(false);
        // Mock submission
        // In real app, get file path from recorder
        // await submitPerformance({ matchId, roundId: match.currentRound, audioUri: '...' });
        Alert.alert("Submission", "Recording submitted (mock)");
    };

    if (isLoading || !match) {
        return <View style={styles.container}><Text>Loading match...</Text></View>;
    }

    const currentRound = match.rounds.find(r => r.roundNumber === match.currentRound);

    return (
        <ScrollView style={[styles.container, { backgroundColor: theme.colors.background.primary }]}>
            <View style={styles.header}>
                <Text style={[styles.title, { color: theme.colors.text.primary }]}>
                    Round {match.currentRound} / {match.totalRounds}
                </Text>
                <Text style={{ color: theme.colors.text.secondary }}>
                    {match.player1Username} vs {match.player2Username || 'Opponent'}
                </Text>
                <Text style={{ color: theme.colors.primary.main, fontSize: 24, fontWeight: 'bold' }}>
                    {match.player1TotalScore} - {match.player2TotalScore}
                </Text>
            </View>

            <View style={styles.content}>
                <Text style={[styles.status, { color: theme.colors.text.primary }]}>
                    Status: {match.status}
                </Text>

                {match.status === 'READY' && (
                    <Button onPress={handleStartMatch}>Start Match</Button>
                )}

                {match.status === 'IN_PROGRESS' && currentRound && (
                    <View>
                        <Text style={[styles.question, { color: theme.colors.text.primary }]}>
                            Challenge: {currentRound.question?.question || 'Audio Challenge'}
                        </Text>
                        
                        {!isRecording ? (
                            <Button onPress={handleStartRound}>Start Recording</Button>
                        ) : (
                            <Button onPress={handleStopAndSubmit} variant="primary">Stop & Submit</Button>
                        )}
                        
                        {/* Opponent status indicator */}
                        <Text style={{ marginTop: 20, color: theme.colors.text.secondary }}>
                            Opponent Status: {currentRound.player2Submitted ? 'Submitted ✅' : 'Recording... 🎙️'}
                        </Text>
                    </View>
                )}
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        padding: 20,
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: '#ccc',
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    content: {
        padding: 20,
    },
    status: {
        fontSize: 16,
        marginBottom: 20,
        textAlign: 'center',
    },
    question: {
        fontSize: 18,
        marginBottom: 30,
        textAlign: 'center',
    },
});
