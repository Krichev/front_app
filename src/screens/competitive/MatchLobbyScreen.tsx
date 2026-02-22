// src/screens/competitive/MatchLobbyScreen.tsx
import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { useGetMatchQuery, useStartMatchMutation } from '../../entities/CompetitiveMatch/model/slice/competitiveApi';
import { useTheme } from '../../shared/ui/theme';
import { Button } from '../../shared/ui/Button/Button';

type MatchLobbyRouteProp = RouteProp<{ params: { matchId: number } }, 'params'>;

export const MatchLobbyScreen = () => {
    const navigation = useNavigation<any>();
    const route = useRoute<MatchLobbyRouteProp>();
    const { matchId } = route.params;
    const { theme } = useTheme();
    const { t } = useTranslation();

    const { data: match, isLoading } = useGetMatchQuery(matchId, {
        pollingInterval: 3000,
    });

    const [startMatch] = useStartMatchMutation();

    useEffect(() => {
        if (match?.status === 'IN_PROGRESS') {
            navigation.replace('LiveMatch', { matchId });
        } else if (match?.status === 'COMPLETED') {
            navigation.replace('MatchResult', { matchId });
        }
    }, [match?.status, navigation, matchId]);

    const handleStart = async () => {
        try {
            await startMatch(matchId).unwrap();
        } catch (e) {
            console.error(e);
        }
    };

    if (isLoading || !match) {
        return (
            <View style={[styles.container, { backgroundColor: theme.colors.background.primary, justifyContent: 'center', alignItems: 'center' }]}>
                <Text style={{ color: theme.colors.text.primary }}>{t('competitive.matchLobby.loading')}</Text>
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.background.primary }]}>
            <View style={styles.content}>
                <Text style={[styles.title, { color: theme.colors.text.primary }]}>
                    {t('competitive.matchLobby.title')}
                </Text>
                
                <Text style={[styles.subtitle, { color: theme.colors.text.secondary }]}>
                    {match.audioChallengeType} • {t('competitive.matchLobby.rounds', { count: match.totalRounds })}
                </Text>

                <View style={styles.vsContainer}>
                    <Text style={[styles.player, { color: theme.colors.text.primary }]}>
                        {match.player1Username}
                    </Text>
                    <Text style={[styles.vs, { color: theme.colors.primary.main }]}>VS</Text>
                    <Text style={[styles.player, { color: match.player2Username ? theme.colors.text.primary : theme.colors.text.disabled }]}>
                        {match.player2Username || t('competitive.matchLobby.waitingForOpponent')}
                    </Text>
                </View>

                {match.status === 'WAITING_FOR_OPPONENT' && (
                    <Text style={[styles.waiting, { color: theme.colors.text.secondary }]}>
                        {t('competitive.matchLobby.waitingDescription')}
                    </Text>
                )}

                {match.status === 'READY' && (
                    <Button onPress={handleStart} style={styles.button}>
                        {t('competitive.matchLobby.startMatch')}
                    </Button>
                )}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        padding: 20,
    },
    content: {
        alignItems: 'center',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        marginBottom: 32,
    },
    vsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 40,
    },
    player: {
        fontSize: 18,
        fontWeight: '600',
    },
    vs: {
        fontSize: 24,
        fontWeight: 'bold',
        marginHorizontal: 20,
    },
    waiting: {
        fontSize: 14,
        fontStyle: 'italic',
    },
    button: {
        width: '100%',
        marginTop: 20,
    },
});
