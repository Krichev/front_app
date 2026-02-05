// src/screens/competitive/MatchResultScreen.tsx
import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useGetMatchResultQuery } from '../../entities/CompetitiveMatch/model/slice/competitiveApi';
import { useTheme } from '../../shared/ui/theme';
import { Button, ButtonVariant } from '../../shared/ui/Button/Button';

type ResultRouteProp = RouteProp<{ params: { matchId: number } }, 'params'>;

export const MatchResultScreen = () => {
    const navigation = useNavigation<any>();
    const route = useRoute<ResultRouteProp>();
    const { matchId } = route.params;
    const { theme } = useTheme();

    const { data: result, isLoading } = useGetMatchResultQuery(matchId);

    if (isLoading || !result) {
        return <View style={styles.container}><Text>Loading results...</Text></View>;
    }

    const isDraw = result.isDraw;
    // Assuming current user context needed to determine "You Won" vs "You Lost"
    // Since API returns winnerId, we'd compare. 
    // For simplicity, just showing Winner Username.

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.background.primary }]}>
            <ScrollView contentContainerStyle={styles.content}>
                <Text style={[styles.title, { color: theme.colors.text.primary }]}>
                    Match Results
                </Text>

                <View style={styles.winnerBox}>
                    <Text style={styles.winnerText}>
                        {isDraw ? 'Draw!' : `Winner: ${result.winnerUsername}`}
                    </Text>
                    {!isDraw && (
                        <Text style={styles.crown}>👑</Text>
                    )}
                </View>

                <View style={styles.scoreContainer}>
                    <View style={styles.scoreBox}>
                        <Text style={[styles.scoreLabel, { color: theme.colors.text.secondary }]}>Player 1</Text>
                        <Text style={[styles.scoreValue, { color: theme.colors.text.primary }]}>{result.player1TotalScore}</Text>
                        <Text style={[styles.roundsWon, { color: theme.colors.text.secondary }]}>{result.player1RoundsWon} Rounds</Text>
                    </View>
                    <View style={styles.scoreBox}>
                        <Text style={[styles.scoreLabel, { color: theme.colors.text.secondary }]}>Player 2</Text>
                        <Text style={[styles.scoreValue, { color: theme.colors.text.primary }]}>{result.player2TotalScore}</Text>
                        <Text style={[styles.roundsWon, { color: theme.colors.text.secondary }]}>{result.player2RoundsWon} Rounds</Text>
                    </View>
                </View>

                {result.amountWon && (
                    <Text style={[styles.wagerText, { color: theme.colors.success.main }]}>
                        Won: {result.amountWon} {result.currency || 'Points'}
                    </Text>
                )}
            </ScrollView>

            <View style={styles.footer}>
                <Button onPress={() => navigation.navigate('Main', { screen: 'Home' })}>
                    Return Home
                </Button>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        padding: 20,
        alignItems: 'center',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 24,
    },
    winnerBox: {
        alignItems: 'center',
        marginBottom: 32,
    },
    winnerText: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#FFD700',
    },
    crown: {
        fontSize: 48,
    },
    scoreContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        width: '100%',
        marginBottom: 32,
    },
    scoreBox: {
        alignItems: 'center',
    },
    scoreLabel: {
        fontSize: 16,
        marginBottom: 8,
    },
    scoreValue: {
        fontSize: 32,
        fontWeight: 'bold',
    },
    roundsWon: {
        fontSize: 14,
    },
    wagerText: {
        fontSize: 18,
        fontWeight: 'bold',
        marginTop: 16,
    },
    footer: {
        padding: 20,
    },
});
