import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { InvitationSummaryDTO } from '../../../entities/InvitationState/model/types';
import { useTheme } from '../../../shared/ui/theme';
import Icon from 'react-native-vector-icons/Ionicons';

interface InvitationCardProps {
    invitation: InvitationSummaryDTO;
    onPress: () => void;
    isSent?: boolean;
}

export const InvitationCard: React.FC<InvitationCardProps> = ({ invitation, onPress, isSent }) => {
    const { theme } = useTheme();
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
                setTimeLeft('Expired');
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
    }, [invitation.expiresAt]);

    const getStakeIcon = () => {
        switch (invitation.stakeType) {
            case 'POINTS': return '💎';
            case 'SCREEN_TIME': return '⏳';
            case 'MONEY': return '💵';
            case 'SOCIAL_QUEST': return '🎭';
            default: return '🎲';
        }
    };

    const getStatusColor = () => {
        switch (invitation.status) {
            case 'ACCEPTED': return theme.colors.success.main;
            case 'DECLINED': return theme.colors.error.main;
            case 'NEGOTIATING': return theme.colors.warning.main;
            case 'EXPIRED': return theme.colors.text.disabled;
            case 'CANCELLED': return theme.colors.text.disabled;
            default: return theme.colors.info.main; // PENDING
        }
    };

    return (
        <TouchableOpacity onPress={onPress}>
            <Animated.View style={[
                styles.container,
                {
                    backgroundColor: theme.colors.background.paper,
                    borderColor: theme.colors.border.main,
                    transform: [{ translateY: slideIn }],
                    opacity: opacity,
                }
            ]}>
                <View style={styles.header}>
                    <View style={styles.iconContainer}>
                        <Text style={styles.icon}>{getStakeIcon()}</Text>
                    </View>
                    <View style={styles.headerText}>
                        <Text style={[styles.title, { color: theme.colors.text.primary }]}>
                            {invitation.questTitle}
                        </Text>
                        <Text style={[styles.subtitle, { color: theme.colors.text.secondary }]}>
                            {isSent ? `To: ${invitation.otherPartyUsername}` : `From: ${invitation.otherPartyUsername}`}
                        </Text>
                    </View>
                    <View style={[styles.badge, { backgroundColor: getStatusColor() }]}>
                        <Text style={styles.badgeText}>{invitation.status}</Text>
                    </View>
                </View>

                <View style={styles.content}>
                    <Text style={[styles.amount, { color: theme.colors.primary.main }]}>
                        {invitation.stakeAmount} {invitation.stakeType === 'POINTS' ? 'Points' : invitation.stakeType === 'SCREEN_TIME' ? 'Minutes' : ''}
                    </Text>
                    
                    {invitation.status === 'PENDING' || invitation.status === 'NEGOTIATING' ? (
                        <View style={styles.expiryContainer}>
                            <Icon name="time-outline" size={14} color={theme.colors.text.secondary} />
                            <Text style={[styles.expiryText, { color: theme.colors.text.secondary }]}>
                                {timeLeft}
                            </Text>
                        </View>
                    ) : null}
                </View>

                {invitation.hasActiveNegotiation && (
                    <View style={[styles.negotiationBadge, { backgroundColor: theme.colors.warning.light }]}>
                        <Icon name="chatbubbles-outline" size={16} color={theme.colors.warning.dark} />
                        <Text style={[styles.negotiationText, { color: theme.colors.warning.dark }]}>
                            Negotiation in progress
                        </Text>
                    </View>
                )}
            </Animated.View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        marginHorizontal: 16,
        marginVertical: 8,
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#f0f0f0',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    icon: {
        fontSize: 20,
    },
    headerText: {
        flex: 1,
    },
    title: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    subtitle: {
        fontSize: 14,
        marginTop: 2,
    },
    badge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    badgeText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: 'bold',
    },
    content: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    amount: {
        fontSize: 16,
        fontWeight: '600',
    },
    expiryContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    expiryText: {
        fontSize: 12,
    },
    negotiationBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 12,
        padding: 8,
        borderRadius: 8,
        gap: 8,
    },
    negotiationText: {
        fontSize: 12,
        fontWeight: '500',
    },
});
