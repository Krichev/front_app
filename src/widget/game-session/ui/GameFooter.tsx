// src/widgets/game-session/ui/GameFooter.tsx
import React from 'react';
import {StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {MaterialCommunityIcons} from '@expo/vector-icons';
import type {GameSession} from '../../../entities/game-session';

interface GameFooterProps {
    session: GameSession;
    verification: any;
    onNextRound: () => void;
    onEndGame: () => void;
}

export const GameFooter: React.FC<GameFooterProps> = ({
                                                          session,
                                                          verification,
                                                          onNextRound,
                                                          onEndGame,
                                                      }) => {
    const isLastRound = session.currentRoundIndex >= session.totalRounds - 1;
    const canContinue = session.currentRound?.phase === 'complete';

    return (
        <View style={styles.container}>
            <View style={styles.actions}>
                <TouchableOpacity
                    style={styles.secondaryButton}
                    onPress={onEndGame}
                >
                    <MaterialCommunityIcons name="stop" size={20} color="#666" />
                    <Text style={styles.secondaryButtonText}>End Game</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[
                        styles.primaryButton,
                        !canContinue && styles.disabledButton,
                    ]}
                    onPress={isLastRound ? onEndGame : onNextRound}
                    disabled={!canContinue}
                >
                    <Text style={[
                        styles.primaryButtonText,
                        !canContinue && styles.disabledButtonText,
                    ]}>
                        {isLastRound ? 'Finish Game' : 'Next Round'}
                    </Text>
                    <MaterialCommunityIcons
                        name={isLastRound ? 'flag-checkered' : 'arrow-right'}
                        size={20}
                        color={canContinue ? 'white' : '#ccc'}
                    />
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: 'white',
        borderTopWidth: 1,
        borderTopColor: '#e0e0e0',
        paddingHorizontal: 20,
        paddingVertical: 16,
    },
    actions: {
        flexDirection: 'row',
        gap: 12,
    },
    primaryButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#4dabf7',
        paddingVertical: 12,
        borderRadius: 8,
        gap: 8,
    },
    secondaryButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f8f9fa',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#e0e0e0',
        gap: 8,
    },
    disabledButton: {
        backgroundColor: '#f0f0f0',
    },
    primaryButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: 'white',
    },
    secondaryButtonText: {
        fontSize: 14,
        fontWeight: '500',
        color: '#666',
    },
    disabledButtonText: {
        color: '#ccc',
    },
});