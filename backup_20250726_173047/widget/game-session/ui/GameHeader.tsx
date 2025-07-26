// src/widgets/game-session/ui/GameHeader.tsx
import React from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {MaterialCommunityIcons} from '@expo/vector-icons';
import {SpeechIndicator} from '../../../features/speech-to-text';
import type {GameRound, GameSession} from '../../../entities/game-session';

interface GameHeaderProps {
    session: GameSession;
    currentRound?: GameRound | null;
    progress: number;
    speechIndicator?: boolean;
}

export const GameHeader: React.FC<GameHeaderProps> = ({
                                                          session,
                                                          currentRound,
                                                          progress,
                                                          speechIndicator,
                                                      }) => {
    return (
        <View style={styles.container}>
            <View style={styles.topRow}>
                <View style={styles.sessionInfo}>
                    <Text style={styles.sessionTitle}>{session.gameType.toUpperCase()}</Text>
                    <Text style={styles.roundInfo}>
                        Round {session.currentRoundIndex + 1} of {session.totalRounds}
                    </Text>
                </View>

                <View style={styles.indicators}>
                    {speechIndicator && <SpeechIndicator compact />}
                    <View style={styles.scoreContainer}>
                        <CustomIcon name="star" size={16} color="#ffd700" />
                        <Text style={styles.scoreText}>{session.score}</Text>
                    </View>
                </View>
            </View>

            <View style={styles.progressContainer}>
                <View style={styles.progressBar}>
                    <View style={[styles.progressFill, { width: `${progress}%` }]} />
                </View>
                <Text style={styles.progressText}>{Math.round(progress)}%</Text>
            </View>

            {currentRound && (
                <View style={styles.roundStatus}>
                    <View style={styles.statusItem}>
                        <CustomIcon name="clock" size={16} color="#666" />
                        <Text style={styles.statusText}>
                            {Math.floor(currentRound.timeSpent / 60)}:{(currentRound.timeSpent % 60).toString().padStart(2, '0')}
                        </Text>
                    </View>

                    <View style={styles.statusItem}>
                        <CustomIcon
                            name={currentRound.phase === 'discussion' ? 'account-group' : 'help-circle'}
                            size={16}
                            color="#666"
                        />
                        <Text style={styles.statusText}>{currentRound.phase}</Text>
                    </View>
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: 'white',
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    topRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    sessionInfo: {
        flex: 1,
    },
    sessionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    roundInfo: {
        fontSize: 14,
        color: '#666',
        marginTop: 2,
    },
    indicators: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    scoreContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f8f9fa',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        gap: 4,
    },
    scoreText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
    },
    progressContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 12,
    },
    progressBar: {
        flex: 1,
        height: 6,
        backgroundColor: '#f0f0f0',
        borderRadius: 3,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        backgroundColor: '#4dabf7',
        borderRadius: 3,
    },
    progressText: {
        fontSize: 12,
        fontWeight: '500',
        color: '#666',
        minWidth: 32,
    },
    roundStatus: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
    },
    statusItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    statusText: {
        fontSize: 12,
        color: '#666',
        textTransform: 'capitalize',
    },
});
