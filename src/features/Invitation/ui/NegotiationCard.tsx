import React from 'react';
import { View, Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import { InvitationNegotiationDTO } from '../../../entities/InvitationState/model/types';
import { useAppStyles } from '../../../shared/ui/hooks/useAppStyles';
import { createStyles } from '../../../shared/ui/theme/createStyles';
import { Button, ButtonVariant } from '../../../shared/ui/Button/Button';

interface NegotiationCardProps {
    negotiation: InvitationNegotiationDTO;
    isInviter: boolean; // Current user is the one who SENT the invitation
    onAccept?: () => void;
    onReject?: () => void;
}

export const NegotiationCard: React.FC<NegotiationCardProps> = ({ negotiation, isInviter, onAccept, onReject }) => {
    const { t } = useTranslation();
    const { theme } = useAppStyles();
    const styles = themeStyles;

    // If I am the inviter, and negotiation status is PROPOSED, I need to respond (Accept/Reject)
    // The proposer is the invitee in the counter-offer scenario.
    const canRespond = isInviter && negotiation.status === 'PROPOSED';

    return (
        <View style={styles.container}>
            <Text style={styles.title}>{t('invitation.negotiation.counterOfferTitle')}</Text>
            <Text style={styles.subtitle}>
                {t('invitation.negotiation.proposedBy', { username: negotiation.proposerUsername })}
            </Text>

            <View style={styles.content}>
                <View style={styles.row}>
                    <Text style={styles.label}>{t('invitation.negotiation.typeLabel')}</Text>
                    <Text style={styles.value}>{t(`wager.setup.stakeTypes.${negotiation.counterStakeType}`)}</Text>
                </View>
                {negotiation.counterStakeType !== 'SOCIAL_QUEST' && (
                    <View style={styles.row}>
                        <Text style={styles.label}>{t('invitation.negotiation.amountLabel')}</Text>
                        <Text style={styles.value}>
                            {negotiation.counterStakeAmount} {
                                negotiation.counterStakeType === 'POINTS' 
                                    ? t('wager.invitation.points') 
                                    : negotiation.counterStakeType === 'SCREEN_TIME' 
                                        ? t('wager.invitation.minutes') 
                                        : negotiation.counterStakeCurrency || ''
                            }
                        </Text>
                    </View>
                )}
                {negotiation.counterSocialPenaltyDescription && (
                    <View style={styles.penaltyRow}>
                         <Text style={styles.label}>{t('invitation.negotiation.penaltyLabel')}</Text>
                         <Text style={styles.penaltyValue}>{negotiation.counterSocialPenaltyDescription}</Text>
                    </View>
                )}
                {negotiation.message && (
                    <Text style={styles.message}>"{negotiation.message}"</Text>
                )}
            </View>

            {canRespond && (
                <View style={styles.actions}>
                    <Button 
                        variant={ButtonVariant.OUTLINE} 
                        onPress={onReject}
                        style={[styles.button, styles.rejectButton]}
                        textStyle={{ color: theme.colors.error.main }}
                    >
                        {t('invitation.negotiation.rejectButton')}
                    </Button>
                    <Button 
                        onPress={onAccept}
                        style={[styles.button, styles.acceptButton]}
                    >
                        {t('invitation.negotiation.acceptButton')}
                    </Button>
                </View>
            )}
            
            {!canRespond && negotiation.status === 'PROPOSED' && (
                 <Text style={styles.statusText}>{t('invitation.negotiation.waitingForResponse')}</Text>
            )}
        </View>
    );
};

const themeStyles = createStyles(theme => ({
    container: {
        padding: theme.spacing.md,
        borderRadius: theme.layout.borderRadius.md,
        borderWidth: theme.layout.borderWidth.thin,
        borderColor: theme.colors.warning.main,
        backgroundColor: theme.colors.warning.background,
        marginTop: theme.spacing.sm,
    },
    title: {
        fontSize: theme.typography.fontSize.base,
        fontWeight: theme.typography.fontWeight.bold,
        marginBottom: 4,
        color: theme.colors.warning.dark,
    },
    subtitle: {
        fontSize: theme.typography.fontSize.xs,
        marginBottom: theme.spacing.md,
        color: theme.colors.text.secondary,
    },
    content: {
        gap: theme.spacing.sm,
        marginBottom: theme.spacing.md,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    penaltyRow: {
        marginTop: 4,
    },
    label: {
        fontSize: theme.typography.fontSize.sm,
        fontWeight: theme.typography.fontWeight.semibold,
        color: theme.colors.text.secondary,
    },
    value: {
        fontSize: theme.typography.fontSize.sm,
        fontWeight: theme.typography.fontWeight.medium,
        color: theme.colors.text.primary,
    },
    penaltyValue: {
        fontSize: theme.typography.fontSize.sm,
        fontWeight: theme.typography.fontWeight.medium,
        color: theme.colors.text.primary,
        fontStyle: 'italic',
        marginTop: 2,
    },
    message: {
        marginTop: theme.spacing.sm,
        fontStyle: 'italic',
        fontSize: theme.typography.fontSize.sm,
        color: theme.colors.text.secondary,
    },
    actions: {
        flexDirection: 'row',
        gap: theme.spacing.sm,
    },
    button: {
        flex: 1,
        height: 40,
    },
    rejectButton: {
        borderColor: theme.colors.error.main,
    },
    acceptButton: {
        backgroundColor: theme.colors.success.main,
        borderColor: theme.colors.success.main,
    },
    statusText: {
        textAlign: 'center',
        fontStyle: 'italic',
        marginTop: theme.spacing.sm,
        fontSize: theme.typography.fontSize.xs,
        color: theme.colors.warning.main,
    }
}));
