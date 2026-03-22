import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { useTranslation } from 'react-i18next';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { QuestInvitationDTO } from '../../../entities/InvitationState/model/types';
import { StakeType } from '../../../entities/WagerState/model/types';
import { useAppStyles } from '../../../shared/ui/hooks/useAppStyles';
import { createStyles } from '../../../shared/ui/theme/createStyles';
import { Button, ButtonVariant } from '../../../shared/ui/Button/Button';
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
    const { t } = useTranslation();
    const { theme } = useAppStyles();
    const styles = themeStyles;
    const isInviter = invitation.inviterId === currentUserId;
    const canRespond = !isInviter && invitation.status === 'PENDING';
    const canCancel = isInviter && (invitation.status === 'PENDING' || invitation.status === 'NEGOTIATING');
    const hasNegotiation = !!invitation.currentNegotiation;

    return (
        <ScrollView style={styles.container}>
            <View style={styles.card}>
                <View style={styles.section}>
                    <Text style={styles.label}>{t('invitation.details.questLabel')}</Text>
                    <Text style={styles.value}>{invitation.questTitle}</Text>
                </View>

                <View style={styles.row}>
                    <View style={styles.halfSection}>
                        <Text style={styles.label}>{t('invitation.details.fromLabel')}</Text>
                        <Text style={styles.value}>{invitation.inviterUsername}</Text>
                    </View>
                    <View style={styles.halfSection}>
                        <Text style={styles.label}>{t('invitation.details.toLabel')}</Text>
                        <Text style={styles.value}>{invitation.inviteeUsername}</Text>
                    </View>
                </View>

                <View style={styles.divider} />

                <Text style={styles.sectionTitle}>{t('invitation.details.stakesTitle')}</Text>
                
                <View style={styles.stakeContainer}>
                    <View style={styles.stakeItem}>
                        <Text style={styles.label}>{t('invitation.details.typeLabel')}</Text>
                        <Text style={styles.value}>{t(`wager.setup.stakeTypes.${invitation.stakeType}`)}</Text>
                    </View>
                    {invitation.stakeType !== 'SOCIAL_QUEST' && (
                        <View style={styles.stakeItem}>
                            <Text style={styles.label}>{t('invitation.details.amountLabel')}</Text>
                            <Text style={styles.value}>
                                {invitation.stakeAmount} {
                                    invitation.stakeType === 'POINTS' 
                                        ? t('wager.invitation.points') 
                                        : invitation.stakeType === 'SCREEN_TIME' 
                                            ? t('wager.invitation.minutes') 
                                            : invitation.stakeCurrency || ''
                                }
                            </Text>
                        </View>
                    )}
                </View>

                {invitation.socialPenaltyDescription && (
                    <View style={styles.penaltyBox}>
                        <Text style={styles.label}>{t('invitation.details.socialPenaltyLabel')}</Text>
                        <Text style={styles.penaltyText}>
                            {invitation.socialPenaltyDescription}
                        </Text>
                    </View>
                )}

                {invitation.message && (
                    <View style={styles.messageBox}>
                        <MaterialCommunityIcons name="chat-outline" size={16} color={theme.colors.text.secondary} />
                        <Text style={styles.messageText}>
                            "{invitation.message}"
                        </Text>
                    </View>
                )}

                {hasNegotiation && invitation.currentNegotiation && (
                    <View style={styles.negotiationSection}>
                         <Text style={styles.negotiationTitle}>{t('invitation.details.activeNegotiationTitle')}</Text>
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
                                {t('invitation.details.counterOfferButton')}
                            </Button>
                            <View style={styles.row}>
                                <Button 
                                    variant={ButtonVariant.GHOST}
                                    onPress={onDecline}
                                    style={[styles.actionButton, styles.halfButton]}
                                    disabled={isLoading}
                                >
                                    {t('invitation.details.declineButton')}
                                </Button>
                                <Button 
                                    onPress={onAccept}
                                    style={[styles.actionButton, styles.halfButton]}
                                    disabled={isLoading}
                                    loading={isLoading}
                                >
                                    {t('invitation.details.acceptButton')}
                                </Button>
                            </View>
                        </>
                    )}
                    
                    {canCancel && (
                        <Button 
                            variant={ButtonVariant.OUTLINE}
                            onPress={onCancel}
                            style={[styles.actionButton, styles.cancelButton]}
                            textStyle={{ color: theme.colors.error.main }}
                            disabled={isLoading}
                        >
                            {t('invitation.details.cancelInvitationButton')}
                        </Button>
                    )}
                </View>
            </View>
        </ScrollView>
    );
};

const themeStyles = createStyles(theme => ({
    container: {
        flex: 1,
    },
    card: {
        margin: theme.spacing.md,
        padding: theme.spacing.lg,
        borderRadius: theme.layout.borderRadius.lg,
        backgroundColor: theme.colors.background.paper,
        elevation: 2,
        shadowColor: theme.colors.text.primary,
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    section: {
        marginBottom: theme.spacing.md,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: theme.spacing.md,
        gap: theme.spacing.md,
    },
    halfSection: {
        flex: 1,
    },
    label: {
        fontSize: theme.typography.fontSize.xs,
        marginBottom: 4,
        fontWeight: theme.typography.fontWeight.semibold,
        color: theme.colors.text.secondary,
    },
    value: {
        fontSize: theme.typography.fontSize.base,
        fontWeight: theme.typography.fontWeight.medium,
        color: theme.colors.text.primary,
    },
    divider: {
        height: theme.layout.borderWidth.thin,
        backgroundColor: theme.colors.border.light,
        marginVertical: theme.spacing.md,
    },
    sectionTitle: {
        fontSize: theme.typography.fontSize.lg,
        fontWeight: theme.typography.fontWeight.bold,
        marginBottom: theme.spacing.sm,
        color: theme.colors.primary.main,
    },
    stakeContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: theme.spacing.md,
    },
    stakeItem: {
        flex: 1,
    },
    penaltyBox: {
        padding: theme.spacing.md,
        borderRadius: theme.layout.borderRadius.md,
        marginBottom: theme.spacing.md,
        backgroundColor: theme.colors.background.default,
    },
    penaltyText: {
        fontSize: theme.typography.fontSize.sm,
        fontStyle: 'italic',
        color: theme.colors.text.primary,
    },
    messageBox: {
        flexDirection: 'row',
        gap: theme.spacing.sm,
        padding: theme.spacing.md,
        backgroundColor: theme.colors.background.default,
        borderRadius: theme.layout.borderRadius.md,
        marginBottom: theme.spacing.md,
        alignItems: 'center',
    },
    messageText: {
        fontSize: theme.typography.fontSize.sm,
        fontStyle: 'italic',
        flex: 1,
        color: theme.colors.text.secondary,
    },
    actions: {
        marginTop: theme.spacing.lg,
        gap: theme.spacing.sm,
    },
    actionButton: {
        width: '100%',
    },
    cancelButton: {
        borderColor: theme.colors.error.main,
    },
    halfButton: {
        flex: 1,
    },
    negotiationSection: {
        marginBottom: theme.spacing.md,
    },
    negotiationTitle: {
        fontSize: theme.typography.fontSize.lg,
        fontWeight: theme.typography.fontWeight.bold,
        color: theme.colors.warning.main,
        marginTop: theme.spacing.md,
        marginBottom: theme.spacing.sm,
    },
}));
