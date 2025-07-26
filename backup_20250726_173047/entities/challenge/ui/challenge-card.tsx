// src/entities/challenge/ui/challenge-card.tsx
import React from 'react';
import {StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {Badge, CustomCard} from '../../../shared/ui';
import {theme} from '../../../shared/config';
import {ChallengeStatusBadge} from './challenge-status-badge';
import {Challenge} from "../model/types.ts";
import {CustomIcon} from "../../../shared/components/Icon/CustomIcon.tsx";

interface ChallengeCardProps {
    challenge: Challenge;
    onPress?: () => void;
    showCreatorBadge?: boolean;
    showProgress?: boolean;
}

export const ChallengeCard: React.FC<ChallengeCardProps> = ({
                                                                challenge,
                                                                onPress,
                                                                showCreatorBadge = true,
                                                                showProgress = true,
                                                            }) => {
    const getTypeIcon = () => {
        switch (challenge.type) {
            case 'QUEST': return 'trophy';
            case 'QUIZ': return 'help-circle';
            case 'ACTIVITY_PARTNER': return 'account-group';
            case 'FITNESS_TRACKING': return 'run';
            case 'HABIT_BUILDING': return 'calendar-check';
            default: return 'star';
        }
    };

    const getTypeColor = () => {
        switch (challenge.type) {
            case 'QUEST': return '#FF9800';
            case 'QUIZ': return '#4CAF50';
            case 'ACTIVITY_PARTNER': return '#2196F3';
            case 'FITNESS_TRACKING': return '#F44336';
            case 'HABIT_BUILDING': return '#9C27B0';
            default: return theme.colors.primary;
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString();
    };

    const CardContent = () => (
        <CustomCard style={styles.card}>
            <View style={styles.header}>
                <View style={[styles.iconContainer, { backgroundColor: `${getTypeColor()}20` }]}>
                    <CustomIcon
                        name={getTypeIcon()}
                        size={24}
                        color={getTypeColor()}
                    />
                </View>

                <View style={styles.headerContent}>
                    <View style={styles.titleRow}>
                        <Text style={styles.title} numberOfLines={1}>
                            {challenge.title}
                        </Text>
                        {showCreatorBadge && challenge.userIsCreator && (
                            <Badge text="Creator" variant="primary" size="sm" />
                        )}
                    </View>

                    <View style={styles.metaRow}>
                        <Badge
                            text={challenge.type.replace('_', ' ')}
                            variant="neutral"
                            size="sm"
                        />
                        <Text style={styles.date}>
                            {formatDate(challenge.createdAt)}
                        </Text>
                    </View>
                </View>
            </View>

            {challenge.description && (
                <Text style={styles.description} numberOfLines={2}>
                    {challenge.description}
                </Text>
            )}

            <View style={styles.footer}>
                <ChallengeStatusBadge status={challenge.status} />

                <View style={styles.participants}>
                    <CustomIcon
                        name="account-group"
                        size={16}
                        color={theme.colors.text.light}
                    />
                    <Text style={styles.participantCount}>
                        {Array.isArray(challenge.participants)
                            ? challenge.participants.length
                            : 0} participants
                    </Text>
                </View>
            </View>

            {challenge.reward && (
                <View style={styles.reward}>
                    <CustomIcon
                        name="gift"
                        size={16}
                        color={theme.colors.warning}
                    />
                    <Text style={styles.rewardText}>{challenge.reward}</Text>
                </View>
            )}
        </CustomCard>
    );

    if (onPress) {
        return (
            <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
                <CardContent />
            </TouchableOpacity>
        );
    }

    return <CardContent />;
};

const styles = StyleSheet.create({
    card: {
        marginBottom: theme.spacing.md,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: theme.spacing.sm,
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: theme.spacing.md,
    },
    headerContent: {
        flex: 1,
    },
    titleRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: theme.spacing.xs,
    },
    title: {
        fontSize: theme.fontSize.lg,
        fontWeight: theme.fontWeight.bold,
        color: theme.colors.text.primary,
        flex: 1,
        marginRight: theme.spacing.sm,
    },
    metaRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    date: {
        fontSize: theme.fontSize.xs,
        color: theme.colors.text.light,
    },
    description: {
        fontSize: theme.fontSize.sm,
        color: theme.colors.text.secondary,
        lineHeight: 20,
        marginBottom: theme.spacing.sm,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: theme.spacing.sm,
    },
    participants: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    participantCount: {
        fontSize: theme.fontSize.xs,
        color: theme.colors.text.light,
        marginLeft: theme.spacing.xs,
    },
    reward: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.background,
        padding: theme.spacing.sm,
        borderRadius: theme.borderRadius.sm,
    },
    rewardText: {
        fontSize: theme.fontSize.sm,
        color: theme.colors.text.primary,
        marginLeft: theme.spacing.xs,
        fontWeight: theme.fontWeight.medium,
    },
});