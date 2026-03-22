import React, { useState, useEffect } from 'react';
import { View, Text, Animated } from 'react-native';
import { useTranslation } from 'react-i18next';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { Wager, StakeType } from '../../../entities/WagerState/model/types';
import { useAppStyles } from '../../../shared/ui/hooks/useAppStyles';
import { createStyles } from '../../../shared/ui/theme/createStyles';
import { Button, ButtonVariant } from '../../../shared/ui/Button/Button';
import { useAcceptWagerMutation, useDeclineWagerMutation } from '../../../entities/WagerState/model/slice/wagerApi';

interface WagerInvitationCardProps {
    wager: Wager;
}

export const WagerInvitationCard: React.FC<WagerInvitationCardProps> = ({ wager }) => {
    const { t } = useTranslation();
    const { theme } = useAppStyles();
    const styles = themeStyles;
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
    }, [wager.expiresAt, t]);

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

    const getStakeIcon = (stakeType: StakeType): string => {
        switch (stakeType) {
            case 'POINTS': return 'diamond-stone';
            case 'SCREEN_TIME': return 'clock-outline';
            case 'MONEY': return 'cash';
            case 'SOCIAL_QUEST': return 'drama-masks';
            default: return 'help-circle-outline';
        }
    };

    return (
        <Animated.View style={[
            styles.container, 
            { 
                transform: [{ translateY: slideIn }],
                opacity: opacity,
            }
        ]}>
            <View style={styles.header}>
                <MaterialCommunityIcons 
                    name={getStakeIcon(wager.stakeType)} 
                    size={32} 
                    color={theme.colors.primary.main} 
                    style={styles.icon}
                />
                <View style={styles.headerText}>
                    <Text style={styles.title}>
                        {t('wager.invitation.challengeFrom', { username: wager.creatorUsername })}
                    </Text>
                    <Text style={styles.subtitle}>
                        {t('wager.invitation.expiresIn', { time: timeLeft })}
                    </Text>
                </View>
            </View>

            <View style={styles.content}>
                {wager.stakeType !== 'SOCIAL_QUEST' && (
                    <Text style={styles.amount}>
                        {t('wager.invitation.stake', { 
                            amount: wager.stakeAmount, 
                            unit: wager.stakeType === 'POINTS' 
                                ? t('wager.invitation.points') 
                                : wager.stakeType === 'SCREEN_TIME' 
                                    ? t('wager.invitation.minutes') 
                                    : wager.stakeCurrency || '' 
                        })}
                    </Text>
                )}
                
                {wager.stakeType === 'SOCIAL_QUEST' && (
                    <View style={styles.penaltyBox}>
                        <Text style={styles.penaltyLabel}>{t('wager.invitation.loserPenalty')}</Text>
                        <Text style={styles.penaltyText}>
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

const themeStyles = createStyles(theme => ({
    container: {
        margin: theme.spacing.md,
        padding: theme.spacing.md,
        borderRadius: theme.layout.borderRadius.lg,
        borderWidth: theme.layout.borderWidth.thin,
        borderColor: theme.colors.border.main,
        backgroundColor: theme.colors.background.paper,
        elevation: 4,
        shadowColor: theme.colors.text.primary,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: theme.spacing.md,
    },
    icon: {
        marginRight: theme.spacing.md,
    },
    headerText: {
        flex: 1,
    },
    title: {
        fontSize: theme.typography.fontSize.base,
        fontWeight: theme.typography.fontWeight.bold,
        color: theme.colors.text.primary,
    },
    subtitle: {
        fontSize: theme.typography.fontSize.xs,
        marginTop: 2,
        color: theme.colors.text.secondary,
    },
    content: {
        marginBottom: theme.spacing.lg,
    },
    amount: {
        fontSize: theme.typography.fontSize.lg,
        fontWeight: theme.typography.fontWeight.bold,
        marginBottom: theme.spacing.xs,
        color: theme.colors.primary.main,
    },
    penaltyBox: {
        padding: theme.spacing.sm,
        borderRadius: theme.layout.borderRadius.md,
        marginTop: theme.spacing.xs,
        backgroundColor: theme.colors.background.default,
    },
    penaltyLabel: {
        fontSize: theme.typography.fontSize.xs,
        fontWeight: theme.typography.fontWeight.semibold,
        marginBottom: 4,
        color: theme.colors.text.secondary,
    },
    penaltyText: {
        fontSize: theme.typography.fontSize.sm,
        fontStyle: 'italic',
        color: theme.colors.text.primary,
    },
    actions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    button: {
        flex: 0.48,
    },
}));
