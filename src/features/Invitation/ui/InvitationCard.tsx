import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, Animated } from 'react-native';
import { useTranslation } from 'react-i18next';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { InvitationSummaryDTO } from '../../../entities/InvitationState/model/types';
import { StakeType } from '../../../entities/WagerState/model/types';
import { useAppStyles } from '../../../shared/ui/hooks/useAppStyles';
import { createStyles } from '../../../shared/ui/theme/createStyles';

interface InvitationCardProps {
    invitation: InvitationSummaryDTO;
    onPress: () => void;
    isSent?: boolean;
}

export const InvitationCard: React.FC<InvitationCardProps> = ({ invitation, onPress, isSent }) => {
    const { t } = useTranslation();
    const { theme } = useAppStyles();
    const styles = themeStyles;
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
            const expires = new Date(invitation.expiresAt).getTime();
            const now = new Date().getTime();
            const diff = expires - now;

            if (diff <= 0) {
                setTimeLeft(t('invitation.card.expired'));
                clearInterval(timer);
            } else {
                const days = Math.floor(diff / (1000 * 60 * 60 * 24));
                const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                
                if (days > 0) {
                    setTimeLeft(`${days}d ${hours}h`);
                } else {
                    const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
                    setTimeLeft(`${hours}h ${mins}m`);
                }
            }
        }, 1000);

        return () => clearInterval(timer);
    }, [invitation.expiresAt, t]);

    const getStakeIcon = (stakeType: StakeType): string => {
        switch (stakeType) {
            case 'POINTS': return 'diamond-stone';
            case 'SCREEN_TIME': return 'clock-outline';
            case 'MONEY': return 'cash';
            case 'SOCIAL_QUEST': return 'drama-masks';
            default: return 'help-circle-outline';
        }
    };

    const getStatusColor = () => {
        switch (invitation.status) {
            case 'ACCEPTED': return theme.colors.success.main;
            case 'DECLINED': return theme.colors.error.main;
            case 'NEGOTIATING': return theme.colors.warning.main;
            case 'EXPIRED': return theme.colors.text.disabled;
            case 'CANCELLED': return theme.colors.text.disabled;
            default: return theme.colors.primary.main; // PENDING
        }
    };

    return (
        <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
            <Animated.View style={[
                styles.container,
                {
                    transform: [{ translateY: slideIn }],
                    opacity: opacity,
                }
            ]}>
                <View style={styles.header}>
                    <View style={styles.iconContainer}>
                        <MaterialCommunityIcons 
                            name={getStakeIcon(invitation.stakeType as StakeType)} 
                            size={20} 
                            color={theme.colors.primary.main} 
                        />
                    </View>
                    <View style={styles.headerText}>
                        <Text style={styles.title} numberOfLines={1}>
                            {invitation.questTitle}
                        </Text>
                        <Text style={styles.subtitle}>
                            {isSent 
                                ? t('invitation.card.to', { username: invitation.otherPartyUsername }) 
                                : t('invitation.card.from', { username: invitation.otherPartyUsername })
                            }
                        </Text>
                    </View>
                    <View style={[styles.badge, { backgroundColor: getStatusColor() }]}>
                        <Text style={styles.badgeText}>
                            {t(`invitation.card.status.${invitation.status}`)}
                        </Text>
                    </View>
                </View>

                <View style={styles.content}>
                    <Text style={styles.amount}>
                        {invitation.stakeType === 'SOCIAL_QUEST' 
                            ? t('wager.setup.stakeTypes.SOCIAL_QUEST')
                            : `${invitation.stakeAmount} ${
                                invitation.stakeType === 'POINTS' 
                                    ? t('wager.invitation.points') 
                                    : invitation.stakeType === 'SCREEN_TIME' 
                                        ? t('wager.invitation.minutes') 
                                        : '$'
                              }`
                        }
                    </Text>
                    
                    {(invitation.status === 'PENDING' || invitation.status === 'NEGOTIATING') && (
                        <View style={styles.expiryContainer}>
                            <MaterialCommunityIcons name="clock-outline" size={14} color={theme.colors.text.secondary} />
                            <Text style={styles.expiryText}>
                                {timeLeft}
                            </Text>
                        </View>
                    )}
                </View>

                {invitation.hasActiveNegotiation && (
                    <View style={styles.negotiationBadge}>
                        <MaterialCommunityIcons name="chat-outline" size={16} color={theme.colors.warning.main} />
                        <Text style={styles.negotiationText}>
                            {t('invitation.card.negotiationInProgress')}
                        </Text>
                    </View>
                )}
            </Animated.View>
        </TouchableOpacity>
    );
};

const themeStyles = createStyles(theme => ({
    container: {
        marginHorizontal: theme.spacing.md,
        marginVertical: theme.spacing.xs,
        padding: theme.spacing.md,
        borderRadius: theme.layout.borderRadius.md,
        borderWidth: theme.layout.borderWidth.thin,
        borderColor: theme.colors.border.main,
        backgroundColor: theme.colors.background.paper,
        elevation: 2,
        shadowColor: theme.colors.text.primary,
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: theme.spacing.sm,
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: theme.colors.background.default,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: theme.spacing.sm,
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
        fontSize: theme.typography.fontSize.sm,
        marginTop: 2,
        color: theme.colors.text.secondary,
    },
    badge: {
        paddingHorizontal: theme.spacing.sm,
        paddingVertical: 4,
        borderRadius: theme.layout.borderRadius.lg,
    },
    badgeText: {
        color: theme.colors.primary.contrastText,
        fontSize: 10,
        fontWeight: theme.typography.fontWeight.bold,
    },
    content: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    amount: {
        fontSize: theme.typography.fontSize.base,
        fontWeight: theme.typography.fontWeight.semibold,
        color: theme.colors.primary.main,
    },
    expiryContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    expiryText: {
        fontSize: theme.typography.fontSize.xs,
        color: theme.colors.text.secondary,
    },
    negotiationBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: theme.spacing.sm,
        padding: theme.spacing.xs,
        borderRadius: theme.layout.borderRadius.sm,
        gap: theme.spacing.xs,
        backgroundColor: theme.colors.warning.background,
    },
    negotiationText: {
        fontSize: theme.typography.fontSize.xs,
        fontWeight: theme.typography.fontWeight.medium,
        color: theme.colors.warning.main,
    },
}));
