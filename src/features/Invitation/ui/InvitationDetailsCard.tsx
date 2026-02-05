import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { QuestInvitationDTO, InvitationNegotiationDTO } from '../../../entities/InvitationState/model/types';
import { useTheme } from '../../../shared/ui/theme';
import { Button, ButtonVariant } from '../../../shared/ui/Button/Button';
import Icon from 'react-native-vector-icons/Ionicons';
import { NegotiationCard } from './NegotiationCard';

interface InvitationDetailsCardProps {
    invitation: QuestInvitationDTO;
    onAccept: () => void;
    onDecline: () => void;
    onNegotiate: () => void;
    onCancel?: () => void;
    onRespondToCounter?: (negotiationId: number, accepted: boolean) => void;
    currentUserId: number;
    isLoading?: boolean;
}

export const InvitationDetailsCard: React.FC<InvitationDetailsCardProps> = ({
    invitation,
    onAccept,
    onDecline,
    onNegotiate,
    onCancel,
    onRespondToCounter,
    currentUserId,
    isLoading
}) => {
    const { theme } = useTheme();
    const isInviter = invitation.inviterId === currentUserId;
    const canRespond = !isInviter && invitation.status === 'PENDING';
    const canCancel = isInviter && (invitation.status === 'PENDING' || invitation.status === 'NEGOTIATING');
    const hasNegotiation = !!invitation.currentNegotiation;

    return (
        <ScrollView style={styles.container}>
            <View style={[styles.card, { backgroundColor: theme.colors.background.paper }]}>
                <View style={styles.section}>
                    <Text style={[styles.label, { color: theme.colors.text.secondary }]}>Quest</Text>
                    <Text style={[styles.value, { color: theme.colors.text.primary }]}>{invitation.questTitle}</Text>
                </View>

                <View style={styles.row}>
                    <View style={styles.halfSection}>
                        <Text style={[styles.label, { color: theme.colors.text.secondary }]}>From</Text>
                        <Text style={[styles.value, { color: theme.colors.text.primary }]}>{invitation.inviterUsername}</Text>
                    </View>
                    <View style={styles.halfSection}>
                        <Text style={[styles.label, { color: theme.colors.text.secondary }]}>To</Text>
                        <Text style={[styles.value, { color: theme.colors.text.primary }]}>{invitation.inviteeUsername}</Text>
                    </View>
                </View>

                <View style={styles.divider} />

                <Text style={[styles.sectionTitle, { color: theme.colors.primary.main }]}>Stakes</Text>
                
                <View style={styles.stakeContainer}>
                    <View style={styles.stakeItem}>
                        <Text style={[styles.label, { color: theme.colors.text.secondary }]}>Type</Text>
                        <Text style={[styles.value, { color: theme.colors.text.primary }]}>{invitation.stakeType}</Text>
                    </View>
                    <View style={styles.stakeItem}>
                        <Text style={[styles.label, { color: theme.colors.text.secondary }]}>Amount</Text>
                        <Text style={[styles.value, { color: theme.colors.text.primary }]}>
                            {invitation.stakeAmount} {invitation.stakeCurrency || (invitation.stakeType === 'SCREEN_TIME' ? 'mins' : '')}
                        </Text>
                    </View>
                </View>

                {invitation.socialPenaltyDescription && (
                    <View style={[styles.penaltyBox, { backgroundColor: theme.colors.background.default }]}>
                        <Text style={[styles.label, { color: theme.colors.text.secondary }]}>Social Penalty</Text>
                        <Text style={[styles.penaltyText, { color: theme.colors.text.primary }]}>
                            {invitation.socialPenaltyDescription}
                        </Text>
                    </View>
                )}

                {invitation.message && (
                    <View style={styles.messageBox}>
                        <Icon name="chatbox-outline" size={16} color={theme.colors.text.secondary} />
                        <Text style={[styles.messageText, { color: theme.colors.text.secondary }]}>
                            "{invitation.message}"
                        </Text>
                    </View>
                )}

                {hasNegotiation && invitation.currentNegotiation && (
                    <View style={styles.negotiationSection}>
                         <Text style={[styles.sectionTitle, { color: theme.colors.warning.main, marginTop: 16 }]}>Active Negotiation</Text>
                         <NegotiationCard 
                            negotiation={invitation.currentNegotiation}
                            isInviter={isInviter}
                            onAccept={() => onRespondToCounter && onRespondToCounter(invitation.currentNegotiation!.id, true)}
                            onReject={() => onRespondToCounter && onRespondToCounter(invitation.currentNegotiation!.id, false)}
                         />
                    </View>
                )}

                <View style={styles.actions}>
                    {canRespond && !hasNegotiation && (
                        <>
                            <Button 
                                variant={ButtonVariant.OUTLINE}
                                onPress={onNegotiate}
                                style={styles.actionButton}
                                disabled={isLoading}
                            >
                                Counter-Offer
                            </Button>
                            <View style={styles.row}>
                                <Button 
                                    variant={ButtonVariant.GHOST}
                                    onPress={onDecline}
                                    style={[styles.actionButton, styles.halfButton]}
                                    disabled={isLoading}
                                >
                                    Decline
                                </Button>
                                <Button 
                                    onPress={onAccept}
                                    style={[styles.actionButton, styles.halfButton]}
                                    disabled={isLoading}
                                    loading={isLoading}
                                >
                                    Accept
                                </Button>
                            </View>
                        </>
                    )}
                    
                    {canCancel && (
                        <Button 
                            variant={ButtonVariant.OUTLINE}
                            onPress={onCancel}
                            style={[styles.actionButton, { borderColor: theme.colors.error.main }]}
                            textStyle={{ color: theme.colors.error.main }}
                            disabled={isLoading}
                        >
                            Cancel Invitation
                        </Button>
                    )}
                </View>
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    card: {
        margin: 16,
        padding: 20,
        borderRadius: 16,
        elevation: 2,
    },
    section: {
        marginBottom: 16,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 16,
        gap: 12,
    },
    halfSection: {
        flex: 1,
    },
    label: {
        fontSize: 12,
        marginBottom: 4,
        fontWeight: '600',
    },
    value: {
        fontSize: 16,
        fontWeight: '500',
    },
    divider: {
        height: 1,
        backgroundColor: '#e0e0e0',
        marginVertical: 16,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 12,
    },
    stakeContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 16,
    },
    stakeItem: {
        flex: 1,
    },
    penaltyBox: {
        padding: 12,
        borderRadius: 8,
        marginBottom: 16,
    },
    penaltyText: {
        fontSize: 14,
        fontStyle: 'italic',
    },
    messageBox: {
        flexDirection: 'row',
        gap: 8,
        padding: 12,
        backgroundColor: '#f5f5f5',
        borderRadius: 8,
        marginBottom: 16,
        alignItems: 'center',
    },
    messageText: {
        fontSize: 14,
        fontStyle: 'italic',
        flex: 1,
    },
    actions: {
        marginTop: 24,
        gap: 12,
    },
    actionButton: {
        width: '100%',
    },
    halfButton: {
        flex: 1,
    },
    negotiationSection: {
        marginBottom: 16,
    }
});
