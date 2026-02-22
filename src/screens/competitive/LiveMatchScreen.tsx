// src/screens/competitive/LiveMatchScreen.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { useGetMatchQuery, useStartMatchMutation, useStartRoundMutation } from '../../entities/CompetitiveMatch/model/slice/competitiveApi';
import { useTheme } from '../../shared/ui/theme';
import { Button, ButtonVariant } from '../../shared/ui/Button/Button';

type LiveMatchRouteProp = RouteProp<{ params: { matchId: number } }, 'params'>;

export const LiveMatchScreen = () => {
    const navigation = useNavigation<any>();
    const route = useRoute<LiveMatchRouteProp>();
    const { matchId } = route.params;
    const { theme } = useTheme();
    const { t } = useTranslation();

    const { data: match, isLoading, refetch } = useGetMatchQuery(matchId, {
        pollingInterval: 3000, // Poll for opponent updates
    });

    const [startMatch] = useStartMatchMutation();
    const [startRound] = useStartRoundMutation();

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
        Alert.alert(t('competitive.liveMatch.submissionAlert'), t('competitive.liveMatch.submissionSuccessMock'));
    };

    if (isLoading || !match) {
        return (
            <View style={[styles.container, { backgroundColor: theme.colors.background.primary, justifyContent: 'center', alignItems: 'center' }]}>
                <Text style={{ color: theme.colors.text.primary }}>{t('competitive.liveMatch.loading')}</Text>
            </View>
        );
    }

    const currentRound = match.rounds.find(r => r.roundNumber === match.currentRound);

    return (
        <ScrollView style={[styles.container, { backgroundColor: theme.colors.background.primary }]}>
            <View style={styles.header}>
                <Text style={[styles.title, { color: theme.colors.text.primary }]}>
                    {t('competitive.liveMatch.round', { current: match.currentRound, total: match.totalRounds })}
                </Text>
                <Text style={{ color: theme.colors.text.secondary }}>
                    {match.player1Username} vs {match.player2Username || t('competitive.liveMatch.opponent')}
                </Text>
                <Text style={{ color: theme.colors.primary.main, fontSize: 24, fontWeight: 'bold' }}>
                    {match.player1TotalScore} - {match.player2TotalScore}
                </Text>
            </View>

            <View style={styles.content}>
                <Text style={[styles.status, { color: theme.colors.text.primary }]}>
                    {t('competitive.liveMatch.status', { status: match.status })}
                </Text>

                {match.status === 'READY' && (
                    <Button onPress={handleStartMatch}>{t('competitive.liveMatch.startMatch')}</Button>
                )}

                {match.status === 'IN_PROGRESS' && currentRound && (
                    <View>
                        <Text style={[styles.question, { color: theme.colors.text.primary }]}>
                            {t('competitive.liveMatch.challenge', { challenge: currentRound.question?.question || t('competitive.liveMatch.audioChallenge') })}
                        </Text>
                        
                        {!isRecording ? (
                            <Button onPress={handleStartRound}>{t('competitive.liveMatch.startRecording')}</Button>
                        ) : (
                            <Button onPress={handleStopAndSubmit} variant={ButtonVariant.PRIMARY}>{t('competitive.liveMatch.stopAndSubmit')}</Button>
                        )}
                        
                        {/* Opponent status indicator */}
                        <Text style={{ marginTop: 20, color: theme.colors.text.secondary, textAlign: 'center' }}>
                            {t('competitive.liveMatch.opponentStatus')} {currentRound.player2Submitted ? t('competitive.liveMatch.submitted') : t('competitive.liveMatch.recording')}
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
