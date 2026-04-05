// src/entities/SoloQuestState/ui/SoloQuestCard.tsx
import React, { useCallback } from 'react';
import { Image, Text, TouchableOpacity, View } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTranslation } from 'react-i18next';
import { SoloQuestDetails } from '../model/types';
import { useAppStyles } from '../../../shared/ui/hooks/useAppStyles';
import { createStyles } from '../../../shared/ui/theme';

interface SoloQuestCardProps {
    quest: SoloQuestDetails;
    onPress: (questId: number) => void;
}

function formatMeetupDatetime(iso: string): string {
    const date = new Date(iso);
    return date.toLocaleString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
    });
}

const SoloQuestCard: React.FC<SoloQuestCardProps> = ({ quest, onPress }) => {
    const { t } = useTranslation();
    const { theme } = useAppStyles();
    const styles = themeStyles;

    const handlePress = useCallback(() => {
        onPress(quest.id);
    }, [onPress, quest.id]);

    const depositLabel = (() => {
        if (quest.depositPolicy === 'NONE' || !quest.stakeAmount) {
            return t('soloQuestFeed.free');
        }
        if (quest.stakeCurrency === 'POINTS' || quest.stakeType === 'POINTS') {
            return t('soloQuestFeed.depositPoints', { amount: quest.stakeAmount });
        }
        const symbols: Record<string, string> = { USD: '$', EUR: '€', GBP: '£' };
        const symbol = quest.stakeCurrency ? (symbols[quest.stakeCurrency] || quest.stakeCurrency) : '';
        return t('soloQuestFeed.depositMoney', { amount: `${symbol}${quest.stakeAmount}` });
    })();

    return (
        <TouchableOpacity
            style={[styles.card, { backgroundColor: theme.colors.background.primary }]}
            onPress={handlePress}
            activeOpacity={0.85}
        >
            {/* Creator row */}
            <View style={styles.creatorRow}>
                <Image
                    source={{ uri: quest.creatorAvatarUrl || 'https://via.placeholder.com/36x36?text=U' }}
                    style={styles.avatar}
                />
                <View style={styles.creatorInfo}>
                    <Text style={[styles.creatorName, { color: theme.colors.text.primary }]}>
                        {quest.creatorUsername}
                    </Text>
                    {quest.creatorReputationScore !== undefined && (
                        <Text style={[styles.reputationBadge, { color: theme.colors.warning.main }]}>
                            {t('soloQuestFeed.reputation', { score: quest.creatorReputationScore })}
                        </Text>
                    )}
                </View>
                <View style={[styles.statusBadge, { backgroundColor: theme.colors.success.background }]}>
                    <Text style={[styles.statusText, { color: theme.colors.success.main }]}>
                        {t(`soloQuest.status.${quest.status}`)}
                    </Text>
                </View>
            </View>

            {/* Title */}
            <Text style={[styles.title, { color: theme.colors.text.primary }]} numberOfLines={1}>
                {quest.title}
            </Text>

            {/* Description */}
            {!!quest.description && (
                <Text style={[styles.description, { color: theme.colors.text.secondary }]} numberOfLines={2}>
                    {quest.description}
                </Text>
            )}

            {/* Location + distance */}
            <View style={styles.infoRow}>
                <MaterialCommunityIcons name="map-marker-outline" size={14} color={theme.colors.text.secondary} />
                <Text style={[styles.infoText, { color: theme.colors.text.secondary }]} numberOfLines={1}>
                    {quest.meetupLocationName}
                </Text>
                {quest.distanceKm !== undefined && (
                    <View style={[styles.distanceBadge, { backgroundColor: theme.colors.info.background ?? theme.colors.background.secondary }]}>
                        <Text style={[styles.distanceText, { color: theme.colors.info.main }]}>
                            {quest.distanceKm.toFixed(1)} {t('soloQuestFeed.distanceUnit')}
                        </Text>
                    </View>
                )}
            </View>

            {/* Datetime */}
            <View style={styles.infoRow}>
                <MaterialCommunityIcons name="calendar-outline" size={14} color={theme.colors.text.secondary} />
                <Text style={[styles.infoText, { color: theme.colors.text.secondary }]}>
                    {formatMeetupDatetime(quest.meetupDatetime)}
                </Text>
            </View>

            {/* Footer: deposit + applicants */}
            <View style={styles.footer}>
                <View style={[
                    styles.depositBadge,
                    { backgroundColor: quest.depositPolicy === 'NONE' ? theme.colors.success.background : theme.colors.warning.background },
                ]}>
                    <MaterialCommunityIcons
                        name={quest.depositPolicy === 'NONE' ? 'check-circle-outline' : 'cash'}
                        size={12}
                        color={quest.depositPolicy === 'NONE' ? theme.colors.success.main : theme.colors.warning.main}
                    />
                    <Text style={[
                        styles.depositText,
                        { color: quest.depositPolicy === 'NONE' ? theme.colors.success.main : theme.colors.warning.main },
                    ]}>
                        {depositLabel}
                    </Text>
                </View>

                {!!quest.applicationCount && quest.applicationCount > 0 && (
                    <Text style={[styles.applicantsText, { color: theme.colors.text.disabled }]}>
                        {t('soloQuestFeed.applicantsCount', { count: quest.applicationCount })}
                    </Text>
                )}
            </View>
        </TouchableOpacity>
    );
};

const themeStyles = createStyles(theme => ({
    card: {
        borderRadius: theme.layout.borderRadius.md,
        padding: theme.spacing.md,
        marginBottom: theme.spacing.sm,
        ...theme.shadows.small,
    },
    creatorRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: theme.spacing.sm,
        gap: theme.spacing.xs,
    },
    avatar: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: theme.colors.background.tertiary,
    },
    creatorInfo: {
        flex: 1,
    },
    creatorName: {
        ...theme.typography.body.small,
        fontWeight: theme.typography.fontWeight.semibold,
    },
    reputationBadge: {
        ...theme.typography.caption,
    },
    statusBadge: {
        paddingHorizontal: theme.spacing.sm,
        paddingVertical: 2,
        borderRadius: theme.layout.borderRadius.xl,
    },
    statusText: {
        ...theme.typography.caption,
        fontWeight: theme.typography.fontWeight.bold,
    },
    title: {
        ...theme.typography.body.large,
        fontWeight: theme.typography.fontWeight.bold,
        marginBottom: theme.spacing.xs,
    },
    description: {
        ...theme.typography.body.small,
        marginBottom: theme.spacing.sm,
        lineHeight: 18,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: theme.spacing.xs,
        gap: theme.spacing.xs,
    },
    infoText: {
        flex: 1,
        ...theme.typography.caption,
    },
    distanceBadge: {
        paddingHorizontal: theme.spacing.xs,
        paddingVertical: 2,
        borderRadius: theme.layout.borderRadius.sm,
    },
    distanceText: {
        ...theme.typography.caption,
        fontWeight: theme.typography.fontWeight.bold,
    },
    footer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: theme.spacing.xs,
    },
    depositBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: theme.spacing.sm,
        paddingVertical: 3,
        borderRadius: theme.layout.borderRadius.xl,
        gap: 4,
    },
    depositText: {
        ...theme.typography.caption,
        fontWeight: theme.typography.fontWeight.medium,
    },
    applicantsText: {
        ...theme.typography.caption,
    },
}));

export default SoloQuestCard;
