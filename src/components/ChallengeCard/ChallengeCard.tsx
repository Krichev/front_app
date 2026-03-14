// src/components/ChallengeCard/ChallengeCard.tsx
import React from 'react';
import {Text, TouchableOpacity, View} from 'react-native';
import {useTranslation} from 'react-i18next';
import {ApiChallenge, CurrencyType, PaymentType} from '../../entities/ChallengeState/model/types/challenge.types';
import {useAppStyles} from '../../shared/ui/hooks/useAppStyles';
import {createStyles} from '../../shared/ui/theme/createStyles';

interface ChallengeCardProps {
    challenge: ApiChallenge;
    onPress: () => void;
}

export const ChallengeCard: React.FC<ChallengeCardProps> = ({ challenge, onPress }) => {
    const { t } = useTranslation();
    const { theme } = useAppStyles();
    const styles = themeStyles;

    const formatCurrency = (amount: number, currency: CurrencyType) => {
        if (currency === CurrencyType.POINTS) {
            return t('challengeCard.currency.pts', { amount: amount.toLocaleString() });
        }

        const symbols: Record<string, string> = {
            USD: '$',
            EUR: '€',
            GBP: '£',
            CAD: 'C$',
            AUD: 'A$',
        };

        return `${symbols[currency] || currency}${amount.toFixed(2)}`;
    };

    const getVisibilityBadge = () => {
        if (challenge.visibility === 'PRIVATE') {
            return (
                <View style={styles.privateBadge}>
                    <Text style={styles.badgeText}>🔒 {t('challengeCard.visibility.private')}</Text>
                </View>
            );
        }
        return null;
    };

    const getPaymentBadge = () => {
        if (challenge.paymentType === PaymentType.FREE || !challenge.hasEntryFee) {
            return (
                <View style={styles.freeBadge}>
                    <Text style={styles.freeBadgeText}>{t('challengeCard.payment.free')}</Text>
                </View>
            );
        }

        if (challenge.hasEntryFee && challenge.entryFeeAmount) {
            const isPoints = challenge.entryFeeCurrency === CurrencyType.POINTS;
            return (
                <View style={[styles.paidBadge, isPoints && styles.pointsBadge]}>
                    <Text style={styles.paidBadgeText}>
                        {formatCurrency(challenge.entryFeeAmount, challenge.entryFeeCurrency!)}
                    </Text>
                </View>
            );
        }

        return null;
    };

    return (
        <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
            <View style={styles.header}>
                <View style={styles.titleContainer}>
                    <Text style={styles.title} numberOfLines={1}>{challenge.title}</Text>
                    {getVisibilityBadge()}
                </View>
                <View style={styles.badges}>
                    {getPaymentBadge()}
                </View>
            </View>

            <Text style={styles.description} numberOfLines={2}>
                {challenge.description || t('challengeCard.description.empty')}
            </Text>

            <View style={styles.metadata}>
                <View style={styles.metadataItem}>
                    <Text style={styles.metadataLabel}>{t('challengeCard.metadata.type')}:</Text>
                    <Text style={styles.metadataValue}>{challenge.type}</Text>
                </View>
                <View style={styles.metadataItem}>
                    <Text style={styles.metadataLabel}>{t('challengeCard.metadata.participants')}:</Text>
                    <Text style={styles.metadataValue}>{challenge.participantCount || 0}</Text>
                </View>
                {challenge.frequency && (
                    <View style={styles.metadataItem}>
                        <Text style={styles.metadataLabel}>{t('challengeCard.metadata.frequency')}:</Text>
                        <Text style={styles.metadataValue}>{challenge.frequency}</Text>
                    </View>
                )}
            </View>

            {challenge.hasPrize && challenge.prizeAmount && (
                <View style={styles.prizeContainer}>
                    <Text style={styles.prizeLabel}>🏆 {t('challengeCard.prize.label')}:</Text>
                    <Text style={styles.prizeAmount}>
                        {formatCurrency(challenge.prizeAmount, challenge.prizeCurrency!)}
                    </Text>
                </View>
            )}

            {challenge.prizePool && challenge.prizePool > 0 && (
                <View style={styles.prizePoolContainer}>
                    <Text style={styles.prizePoolLabel}>💰 {t('challengeCard.prize.pool')}:</Text>
                    <Text style={styles.prizePoolAmount}>
                        {formatCurrency(challenge.prizePool, challenge.prizeCurrency || CurrencyType.USD)}
                    </Text>
                </View>
            )}

            <View style={styles.footer}>
                <Text style={styles.creator}>
                    {t('challengeCard.creator.createdBy', { username: challenge.creatorUsername })}
                </Text>
                {challenge.userIsCreator && (
                    <View style={styles.creatorBadge}>
                        <Text style={styles.creatorBadgeText}>{t('challengeCard.creator.yourChallenge')}</Text>
                    </View>
                )}
            </View>
        </TouchableOpacity>
    );
};

const themeStyles = createStyles(theme => ({
    card: {
        backgroundColor: theme.colors.background.primary,
        borderRadius: theme.layout.borderRadius.md,
        padding: theme.spacing.lg,
        marginBottom: theme.spacing.md,
        shadowColor: theme.colors.text.primary,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: theme.spacing.sm,
    },
    titleContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
    },
    title: {
        fontSize: theme.typography.fontSize.lg,
        fontWeight: theme.typography.fontWeight.bold,
        color: theme.colors.text.primary,
        flex: 1,
        marginRight: theme.spacing.sm,
    },
    badges: {
        flexDirection: 'row',
        gap: theme.spacing.sm,
    },
    privateBadge: {
        backgroundColor: theme.colors.text.disabled,
        paddingHorizontal: theme.spacing.sm,
        paddingVertical: theme.spacing.xs,
        borderRadius: theme.layout.borderRadius.sm,
        marginLeft: theme.spacing.sm,
    },
    badgeText: {
        fontSize: theme.typography.fontSize.xs,
        color: theme.colors.text.inverse,
        fontWeight: theme.typography.fontWeight.semibold,
    },
    freeBadge: {
        backgroundColor: theme.colors.success.main,
        paddingHorizontal: theme.spacing.md,
        paddingVertical: theme.spacing.xs,
        borderRadius: theme.layout.borderRadius.md,
    },
    freeBadgeText: {
        fontSize: theme.typography.fontSize.sm,
        fontWeight: theme.typography.fontWeight.bold,
        color: theme.colors.text.inverse,
    },
    paidBadge: {
        backgroundColor: theme.colors.error.main,
        paddingHorizontal: theme.spacing.md,
        paddingVertical: theme.spacing.xs,
        borderRadius: theme.layout.borderRadius.md,
    },
    pointsBadge: {
        backgroundColor: theme.colors.warning.main,
    },
    paidBadgeText: {
        fontSize: theme.typography.fontSize.sm,
        fontWeight: theme.typography.fontWeight.bold,
        color: theme.colors.text.inverse,
    },
    description: {
        fontSize: theme.typography.fontSize.base,
        color: theme.colors.text.secondary,
        marginBottom: theme.spacing.lg,
        lineHeight: 20,
    },
    metadata: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: theme.spacing.md,
        marginBottom: theme.spacing.lg,
    },
    metadataItem: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    metadataLabel: {
        fontSize: theme.typography.fontSize.sm,
        color: theme.colors.text.disabled,
        marginRight: theme.spacing.xs,
    },
    metadataValue: {
        fontSize: theme.typography.fontSize.sm,
        fontWeight: theme.typography.fontWeight.semibold,
        color: theme.colors.text.primary,
    },
    prizeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.success.background,
        padding: theme.spacing.md,
        borderRadius: theme.layout.borderRadius.sm,
        marginBottom: theme.spacing.sm,
    },
    prizeLabel: {
        fontSize: theme.typography.fontSize.sm,
        fontWeight: theme.typography.fontWeight.semibold,
        color: theme.colors.success.dark,
        marginRight: theme.spacing.md,
    },
    prizeAmount: {
        fontSize: theme.typography.fontSize.base,
        fontWeight: theme.typography.fontWeight.bold,
        color: theme.colors.success.main,
    },
    prizePoolContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.warning.background,
        padding: theme.spacing.md,
        borderRadius: theme.layout.borderRadius.sm,
        marginBottom: theme.spacing.sm,
    },
    prizePoolLabel: {
        fontSize: theme.typography.fontSize.sm,
        fontWeight: theme.typography.fontWeight.semibold,
        color: theme.colors.warning.dark,
        marginRight: theme.spacing.md,
    },
    prizePoolAmount: {
        fontSize: theme.typography.fontSize.base,
        fontWeight: theme.typography.fontWeight.bold,
        color: theme.colors.warning.main,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: theme.spacing.sm,
        paddingTop: theme.spacing.sm,
        borderTopWidth: theme.layout.borderWidth.thin,
        borderTopColor: theme.colors.border.light,
    },
    creator: {
        fontSize: theme.typography.fontSize.sm,
        color: theme.colors.text.disabled,
    },
    creatorBadge: {
        backgroundColor: theme.colors.primary.light,
        paddingHorizontal: theme.spacing.sm,
        paddingVertical: theme.spacing.xs,
        borderRadius: theme.layout.borderRadius.sm,
    },
    creatorBadgeText: {
        fontSize: theme.typography.fontSize.xs,
        fontWeight: theme.typography.fontWeight.semibold,
        color: theme.colors.primary.main,
    },
}));
