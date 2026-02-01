import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions } from 'react-native';
import { Wager, WagerOutcome } from '../../../entities/WagerState/model/types';
import { useTheme } from '../../../shared/ui/theme';
import { Button } from '../../../shared/ui/Button/Button';

const { width, height } = Dimensions.get('window');

interface WagerResultsOverlayProps {
    wager: Wager;
    outcome: WagerOutcome;
    onClose: () => void;
}

export const WagerResultsOverlay: React.FC<WagerResultsOverlayProps> = ({ wager, outcome, onClose }) => {
    const { theme } = useTheme();
    const scaleAnim = useRef(new Animated.Value(0)).current;
    const opacityAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.spring(scaleAnim, {
                toValue: 1,
                friction: 8,
                tension: 40,
                useNativeDriver: true,
            }),
            Animated.timing(opacityAnim, {
                toValue: 1,
                duration: 400,
                useNativeDriver: true,
            })
        ]).start();
    }, []);

    const isDraw = outcome.settlementType === 'DRAW_REFUND';
    const isWinner = !!outcome.winnerId;

    return (
        <View style={styles.overlay}>
            <Animated.View style={[styles.backdrop, { opacity: opacityAnim, backgroundColor: theme.colors.overlay.medium }]} />
            <Animated.View 
                style={[
                    styles.content, 
                    { 
                        backgroundColor: theme.colors.background.primary,
                        transform: [{ scale: scaleAnim }],
                        opacity: opacityAnim,
                    }
                ]}
            >
                <Text style={styles.trophy}>🏆</Text>
                
                <Text style={[styles.title, { color: theme.colors.text.primary }]}>
                    {isDraw ? "It's a Draw!" : "Wager Settled!"}
                </Text>

                <View style={styles.infoBox}>
                    {outcome.winnerId ? (
                        <Text style={[styles.winnerName, { color: theme.colors.success.main }]}>
                            Winner: {outcome.winnerUsername}
                        </Text>
                    ) : isDraw ? (
                        <Text style={[styles.drawText, { color: theme.colors.text.secondary }]}>
                            Everyone gets their stakes back.
                        </Text>
                    ) : null}

                    <Text style={[styles.amount, { color: theme.colors.primary.main }]}>
                        {isDraw ? "Stake Refunded" : `Pot Distributed: ${outcome.amountDistributed}`}
                    </Text>
                </View>

                {wager.stakeType === 'SOCIAL_QUEST' && outcome.loserId && (
                    <View style={[styles.penaltyBox, { backgroundColor: theme.colors.error.background }]}>
                        <Text style={[styles.penaltyLabel, { color: theme.colors.error.dark }]}>
                            Penalty for {outcome.loserUsername}:
                        </Text>
                        <Text style={[styles.penaltyText, { color: theme.colors.text.primary }]}>
                            {wager.socialPenaltyDescription}
                        </Text>
                    </View>
                )}

                <Button onPress={onClose} fullWidth style={styles.closeButton}>
                    Continue
                </Button>
            </Animated.View>
        </View>
    );
};

const styles = StyleSheet.create({
    overlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
    },
    backdrop: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
    },
    content: {
        width: width * 0.85,
        padding: 24,
        borderRadius: 24,
        alignItems: 'center',
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
    },
    trophy: {
        fontSize: 64,
        marginBottom: 16,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 16,
    },
    infoBox: {
        alignItems: 'center',
        marginBottom: 20,
    },
    winnerName: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 4,
    },
    drawText: {
        fontSize: 16,
        textAlign: 'center',
    },
    amount: {
        fontSize: 20,
        fontWeight: 'bold',
        marginTop: 8,
    },
    penaltyBox: {
        padding: 16,
        borderRadius: 12,
        width: '100%',
        marginBottom: 24,
    },
    penaltyLabel: {
        fontSize: 14,
        fontWeight: '700',
        marginBottom: 4,
    },
    penaltyText: {
        fontSize: 16,
        fontStyle: 'italic',
    },
    closeButton: {
        marginTop: 8,
    }
});
