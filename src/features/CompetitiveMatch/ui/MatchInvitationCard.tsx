// src/features/CompetitiveMatch/ui/MatchInvitationCard.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { CompetitiveMatchInvitation } from '../../../entities/CompetitiveMatch/model/types';
import { useRespondToInvitationMutation } from '../../../entities/CompetitiveMatch/model/slice/competitiveApi';
import { useTheme } from '../../../shared/ui/theme';
import { Button, ButtonVariant } from '../../../shared/ui/Button/Button';

interface MatchInvitationCardProps {
    invitation: CompetitiveMatchInvitation;
}

export const MatchInvitationCard: React.FC<MatchInvitationCardProps> = ({ invitation }) => {
    const { theme } = useTheme();
    const [respond, { isLoading }] = useRespondToInvitationMutation();
    const [timeLeft, setTimeLeft] = useState('');
    
    useEffect(() => {
        const timer = setInterval(() => {
            const expires = new Date(invitation.expiresAt).getTime();
            const now = new Date().getTime();
            const diff = expires - now;

            if (diff <= 0) {
                setTimeLeft('Expired');
                clearInterval(timer);
            } else {
                const hours = Math.floor(diff / (1000 * 60 * 60));
                const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
                setTimeLeft(`${hours}h ${mins}m`);
            }
        }, 1000);
        return () => clearInterval(timer);
    }, [invitation.expiresAt]);

    const handleRespond = (accepted: boolean) => {
        respond({ invitationId: invitation.id, accepted });
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.background.primary, borderColor: theme.colors.border.main }]}>
            <View style={styles.header}>
                <Text style={styles.icon}>🎤</Text>
                <View style={styles.headerText}>
                    <Text style={[styles.title, { color: theme.colors.text.primary }]}>
                        Karaoke Challenge from {invitation.inviterUsername}
                    </Text>
                    <Text style={[styles.subtitle, { color: theme.colors.text.secondary }]}>
                        {invitation.audioChallengeType} • {invitation.totalRounds} Rounds • Expires: {timeLeft}
                    </Text>
                </View>
            </View>
            
            {invitation.message && (
                <Text style={[styles.message, { color: theme.colors.text.primary }]}>"{invitation.message}"</Text>
            )}

            <View style={styles.actions}>
                <Button 
                    variant={ButtonVariant.OUTLINE} 
                    onPress={() => handleRespond(false)} 
                    loading={isLoading}
                    style={styles.button}
                >
                    Decline
                </Button>
                <Button 
                    onPress={() => handleRespond(true)} 
                    loading={isLoading}
                    style={styles.button}
                >
                    Accept
                </Button>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        margin: 16,
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    icon: {
        fontSize: 24,
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
    message: {
        fontSize: 14,
        fontStyle: 'italic',
        marginBottom: 16,
    },
    actions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    button: {
        flex: 0.48,
    },
});
