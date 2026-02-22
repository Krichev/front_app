import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Wager } from '../../../entities/WagerState/model/types';
import { useTheme } from '../../../shared/ui/theme';
import { Button, ButtonVariant } from '../../../shared/ui/Button/Button';
import { useAcceptWagerMutation, useDeclineWagerMutation } from '../../../entities/WagerState/model/slice/wagerApi';

interface WagerInvitationCardProps {
    wager: Wager;
}

export const WagerInvitationCard: React.FC<WagerInvitationCardProps> = ({ wager }) => {
    const { t } = useTranslation();
    const { theme } = useTheme();
    const [acceptWager, { isLoading: isAccepting }] = useAcceptWagerMutation();
    const [declineWager, { isLoading: isDeclining }] = useDeclineWagerMutation();
    
    const [timeLeft, setTimeLeft] = useState('');
    const slideIn = useState(new Animated.Value(50))[0];
    const opacity = useState(new Animated.Value(0))[0];

    useEffect(() => {
        Animated.parallel([
            Animated.timing(slideIn, {
                toValue: 0,
                duration: 500,
                useNativeDriver: true,
            }),
            Animated.timing(opacity, {
                toValue: 1,
                duration: 500,
                useNativeDriver: true,
            })
        ]).start();

        const timer = setInterval(() => {
            const expires = new Date(wager.expiresAt).getTime();
            const now = new Date().getTime();
            const diff = expires - now;

            if (diff <= 0) {
                setTimeLeft(t('wager.invitation.expired'));
                clearInterval(timer);
            } else {
                const hours = Math.floor(diff / (1000 * 60 * 60));
                const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
                const secs = Math.floor((diff % (1000 * 60)) / 1000);
                setTimeLeft(`${hours}h ${mins}m ${secs}s`);
            }
        }, 1000);

        return () => clearInterval(timer);
    }, [wager.expiresAt]);

    const handleAccept = async () => {
        try {
            await acceptWager(wager.id).unwrap();
        } catch (error) {
            console.error('Failed to accept wager:', error);
        }
    };

    const handleDecline = async () => {
        try {
            await declineWager(wager.id).unwrap();
        } catch (error) {
            console.error('Failed to decline wager:', error);
        }
    };

    const getStakeIcon = () => {
        switch (wager.stakeType) {
            case 'POINTS': return '💎';
            case 'SCREEN_TIME': return '⏳';
            case 'MONEY': return '💵';
            case 'SOCIAL_QUEST': return '🎭';
            default: return '🎲';
        }
    };

    return (
        <Animated.View style={[
            styles.container, 
            { 
                backgroundColor: theme.colors.background.primary,
                borderColor: theme.colors.border.main,
                transform: [{ translateY: slideIn }],
                opacity: opacity,
            }
        ]}>
            <View style={styles.header}>
                <Text style={styles.icon}>{getStakeIcon()}</Text>
                <View style={styles.headerText}>
                    <Text style={[styles.title, { color: theme.colors.text.primary }]}>
                        {t('wager.invitation.challengeFrom', { username: wager.creatorUsername })}
                    </Text>
                    <Text style={[styles.subtitle, { color: theme.colors.text.secondary }]}>
                        {t('wager.invitation.expiresIn', { time: timeLeft })}
                    </Text>
                </View>
            </View>

            <View style={styles.content}>
                <Text style={[styles.amount, { color: theme.colors.primary.main }]}>
                    {t('wager.invitation.stake', { 
                        amount: wager.stakeAmount, 
                        unit: wager.stakeType === 'POINTS' 
                            ? t('wager.invitation.points') 
                            : wager.stakeType === 'SCREEN_TIME' 
                                ? t('wager.invitation.minutes') 
                                : wager.stakeCurrency || '' 
                    })}
                </Text>
                
                {wager.stakeType === 'SOCIAL_QUEST' && (
                    <View style={[styles.penaltyBox, { backgroundColor: theme.colors.background.secondary }]}>
                        <Text style={[styles.penaltyLabel, { color: theme.colors.text.secondary }]}>{t('wager.invitation.loserPenalty')}</Text>
                        <Text style={[styles.penaltyText, { color: theme.colors.text.primary }]}>
                            {wager.socialPenaltyDescription}
                        </Text>
                    </View>
                )}
            </View>

            <View style={styles.actions}>
                <Button 
                    variant={ButtonVariant.OUTLINE} 
                    onPress={handleDecline} 
                    loading={isDeclining}
                    style={styles.button}
                >
                    {t('wager.invitation.decline')}
                </Button>
                <Button 
                    onPress={handleAccept} 
                    loading={isAccepting}
                    style={styles.button}
                >
                    {t('wager.invitation.accept')}
                </Button>
            </View>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        margin: 16,
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    icon: {
        fontSize: 32,
        marginRight: 12,
    },
    headerText: {
        flex: 1,
    },
    title: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    subtitle: {
        fontSize: 12,
        marginTop: 2,
    },
    content: {
        marginBottom: 20,
    },
    amount: {
        fontSize: 18,
        fontWeight: '700',
        marginBottom: 8,
    },
    penaltyBox: {
        padding: 12,
        borderRadius: 8,
        marginTop: 8,
    },
    penaltyLabel: {
        fontSize: 12,
        fontWeight: '600',
        marginBottom: 4,
    },
    penaltyText: {
        fontSize: 14,
        fontStyle: 'italic',
    },
    actions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    button: {
        flex: 0.48,
    },
});
