import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { InvitationNegotiationDTO } from '../../../entities/InvitationState/model/types';
import { useTheme } from '../../../shared/ui/theme';
import { Button, ButtonVariant } from '../../../shared/ui/Button/Button';

interface NegotiationCardProps {
    negotiation: InvitationNegotiationDTO;
    isInviter: boolean; // Current user is the one who SENT the invitation
    onAccept?: () => void;
    onReject?: () => void;
}

export const NegotiationCard: React.FC<NegotiationCardProps> = ({ negotiation, isInviter, onAccept, onReject }) => {
    const { theme } = useTheme();

    // If I am the inviter, and negotiation status is PROPOSED, I need to respond (Accept/Reject)
    // The proposer is the invitee in the counter-offer scenario.
    const canRespond = isInviter && negotiation.status === 'PROPOSED';

    return (
        <View style={[styles.container, { borderColor: theme.colors.warning.main, backgroundColor: theme.colors.warning.light + '20' }]}>
            <Text style={[styles.title, { color: theme.colors.warning.dark }]}>Counter Offer</Text>
            <Text style={[styles.subtitle, { color: theme.colors.text.secondary }]}>
                Proposed by {negotiation.proposerUsername}
            </Text>

            <View style={styles.content}>
                <View style={styles.row}>
                    <Text style={styles.label}>Type:</Text>
                    <Text style={styles.value}>{negotiation.counterStakeType}</Text>
                </View>
                <View style={styles.row}>
                    <Text style={styles.label}>Amount:</Text>
                    <Text style={styles.value}>
                        {negotiation.counterStakeAmount} {negotiation.counterStakeCurrency || (negotiation.counterStakeType === 'SCREEN_TIME' ? 'mins' : '')}
                    </Text>
                </View>
                {negotiation.counterSocialPenaltyDescription && (
                    <View style={styles.penaltyRow}>
                         <Text style={styles.label}>Penalty:</Text>
                         <Text style={[styles.value, { fontStyle: 'italic' }]}>{negotiation.counterSocialPenaltyDescription}</Text>
                    </View>
                )}
                {negotiation.message && (
                    <Text style={[styles.message, { color: theme.colors.text.secondary }]}>"{negotiation.message}"</Text>
                )}
            </View>

            {canRespond && (
                <View style={styles.actions}>
                    <Button 
                        variant={ButtonVariant.OUTLINE} 
                        onPress={onReject}
                        style={[styles.button, { borderColor: theme.colors.error.main }]}
                        textStyle={{ color: theme.colors.error.main }}
                    >
                        Reject
                    </Button>
                    <Button 
                        onPress={onAccept}
                        style={[styles.button, { backgroundColor: theme.colors.success.main }]}
                    >
                        Accept
                    </Button>
                </View>
            )}
            
            {!canRespond && negotiation.status === 'PROPOSED' && (
                 <Text style={[styles.statusText, { color: theme.colors.warning.main }]}>Waiting for response...</Text>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        marginTop: 8,
    },
    title: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    subtitle: {
        fontSize: 12,
        marginBottom: 12,
    },
    content: {
        gap: 8,
        marginBottom: 16,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    penaltyRow: {
        marginTop: 4,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#666',
    },
    value: {
        fontSize: 14,
        fontWeight: '500',
        color: '#333',
    },
    message: {
        marginTop: 8,
        fontStyle: 'italic',
        fontSize: 13,
    },
    actions: {
        flexDirection: 'row',
        gap: 12,
    },
    button: {
        flex: 1,
        height: 40,
    },
    statusText: {
        textAlign: 'center',
        fontStyle: 'italic',
        marginTop: 8,
        fontSize: 12,
    }
});
