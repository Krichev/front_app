// src/entities/SoloQuestState/ui/ReputationMarkCard.tsx
import React, { useCallback } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useAppStyles } from '../../../shared/ui/hooks/useAppStyles';
import { createStyles } from '../../../shared/ui/theme';
import { ReputationMark } from '../model/types';

interface ReputationMarkCardProps {
    mark: ReputationMark;
    showAppeal: boolean;
    onAppeal: (markId: number) => void;
}

function getDaysRemaining(expiresAt: string | undefined): number | null {
    if (!expiresAt) {return null;}
    const diff = new Date(expiresAt).getTime() - Date.now();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

const APPEAL_STATUS_COLORS: Record<string, string> = {
    PENDING: '#FF9800',
    APPROVED: '#4CAF50',
    REJECTED: '#F44336',
    NONE: 'transparent',
};

const ReputationMarkCard: React.FC<ReputationMarkCardProps> = ({ mark, showAppeal, onAppeal }) => {
    const { t } = useTranslation();
    const { theme } = useAppStyles();
    const styles = themeStyles;

    const isPositive = mark.type === 'POSITIVE';
    const bgColor = isPositive ? theme.colors.success.background : theme.colors.error.background;
    const labelColor = isPositive ? theme.colors.success.main : theme.colors.error.main;

    const daysRemaining = !isPositive ? getDaysRemaining(mark.expiresAt) : null;

    const canAppeal = showAppeal &&
        !isPositive &&
        (mark.appealStatus === 'NONE' || mark.appealStatus === undefined);

    const appealPending = mark.appealStatus === 'PENDING';

    const handleAppeal = useCallback(() => {
        onAppeal(mark.id);
    }, [onAppeal, mark.id]);

    return (
        <View style={[styles.card, { backgroundColor: bgColor }]}>
            <View style={styles.header}>
                <Text style={[styles.label, { color: labelColor }]}>{mark.label}</Text>
                {mark.appealStatus && mark.appealStatus !== 'NONE' && (
                    <View style={[styles.appealStatusBadge, { backgroundColor: APPEAL_STATUS_COLORS[mark.appealStatus] + '33' }]}>
                        <Text style={[styles.appealStatusText, { color: APPEAL_STATUS_COLORS[mark.appealStatus] }]}>
                            {t(`soloQuest.reputation.appealStatus.${mark.appealStatus}`)}
                        </Text>
                    </View>
                )}
            </View>

            {!!mark.description && (
                <Text style={[styles.description, { color: theme.colors.text.secondary }]}>
                    {mark.description}
                </Text>
            )}

            {daysRemaining !== null && (
                <Text style={[styles.expiry, { color: theme.colors.error.main }]}>
                    {t('soloQuest.reputation.expiresInDays', { days: daysRemaining })}
                </Text>
            )}

            {(canAppeal || appealPending) && (
                <TouchableOpacity
                    style={[styles.appealButton, { backgroundColor: theme.colors.background.primary }]}
                    onPress={handleAppeal}
                    disabled={appealPending}
                >
                    <Text style={[styles.appealButtonText, { color: appealPending ? theme.colors.text.disabled : theme.colors.error.main }]}>
                        {appealPending
                            ? t('soloQuest.reputation.appealStatus.PENDING')
                            : t('soloQuest.reputation.appealButton')}
                    </Text>
                </TouchableOpacity>
            )}
        </View>
    );
};

const themeStyles = createStyles(theme => ({
    card: {
        borderRadius: theme.layout.borderRadius.md,
        padding: theme.spacing.md,
        marginBottom: theme.spacing.sm,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: theme.spacing.xs,
    },
    label: {
        ...theme.typography.body.small,
        fontWeight: theme.typography.fontWeight.bold,
        flex: 1,
    },
    description: {
        ...theme.typography.caption,
        marginBottom: theme.spacing.xs,
    },
    expiry: {
        ...theme.typography.caption,
        marginBottom: theme.spacing.xs,
    },
    appealStatusBadge: {
        paddingHorizontal: theme.spacing.sm,
        paddingVertical: 2,
        borderRadius: theme.layout.borderRadius.xl,
        marginLeft: theme.spacing.xs,
    },
    appealStatusText: {
        ...theme.typography.caption,
        fontWeight: theme.typography.fontWeight.bold,
    },
    appealButton: {
        alignSelf: 'flex-start',
        paddingHorizontal: theme.spacing.md,
        paddingVertical: theme.spacing.xs,
        borderRadius: theme.layout.borderRadius.sm,
        marginTop: theme.spacing.xs,
    },
    appealButtonText: {
        ...theme.typography.caption,
        fontWeight: theme.typography.fontWeight.semibold,
    },
}));

export default ReputationMarkCard;
