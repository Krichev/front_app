import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTranslation } from 'react-i18next';
import { FormatterService } from '../../../services/verification/ui/Services';
import { ApiChallenge } from "../model/slice/challengeApi";
import { isWWWQuiz, parseQuizConfig } from "../model/types";
import { Wager, StakeType } from '../../WagerState/model/types';
import { useAppStyles } from '../../../shared/ui/hooks/useAppStyles';
import { createStyles } from '../../../shared/ui/theme/createStyles';
import { TFunction } from 'i18next';

interface QuizChallengeCardProps {
    challenge: ApiChallenge;
    wager?: Wager | null;
    onPress: () => void;
}

const QuizChallengeCard: React.FC<QuizChallengeCardProps> = ({ challenge, wager, onPress }) => {
    const { t } = useTranslation();
    const { theme } = useAppStyles();
    const styles = themeStyles;

    // Parse quiz configuration using our new helper function
    const quizConfig = parseQuizConfig(challenge.quizConfig);
    const isWWW = isWWWQuiz(quizConfig);

    const getStatusLabel = (status: string): string => {
        const key = status.toLowerCase().replace(/\s+/g, '_');
        return t(`quizChallengeCard.status.${key}`, { defaultValue: status.toUpperCase() });
    };

    const getQuizIcon = () => {
        if (isWWW) {
            return 'brain';
        }
        return 'help-circle';
    };

    const getQuizTypeLabel = () => {
        if (isWWW) {
            return t('quizChallengeCard.type.www');
        }
        return t('quizChallengeCard.type.quiz');
    };

    const getStakeIconName = (stakeType: StakeType): string => {
        switch (stakeType) {
            case 'POINTS': return 'diamond-stone';
            case 'SCREEN_TIME': return 'clock-outline';
            case 'MONEY': return 'cash';
            case 'SOCIAL_QUEST': return 'drama-masks';
            default: return 'help-circle-outline';
        }
    };

    const formatCurrency = (amount: number, currency: string) => {
        if (currency === 'POINTS') {
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

    const formatWagerAmount = (wager: Wager, t: TFunction): string => {
        switch (wager.stakeType) {
            case 'POINTS':
                return t('challengeCard.wager.points', { amount: wager.stakeAmount });
            case 'SCREEN_TIME':
                return t('challengeCard.wager.screenTime', { amount: wager.screenTimeMinutes || wager.stakeAmount });
            case 'MONEY':
                return t('challengeCard.wager.money', { 
                    amount: formatCurrency(wager.stakeAmount, wager.stakeCurrency || 'USD') 
                });
            case 'SOCIAL_QUEST':
                return t('challengeCard.wager.socialQuest');
            default:
                return '';
        }
    };

    const renderQuizDetails = () => {
        if (!quizConfig) return null;

        return (
            <View style={styles.quizDetails}>
                {isWWW && quizConfig.difficulty && (
                    <View style={styles.badge}>
                        <Text style={styles.badgeText}>{quizConfig.difficulty}</Text>
                    </View>
                )}

                {isWWW && quizConfig.roundCount && (
                    <View style={styles.badge}>
                        <Text style={styles.badgeText}>
                            {t('quizChallengeCard.badge.questions', { count: quizConfig.roundCount })}
                        </Text>
                    </View>
                )}

                {isWWW && quizConfig.teamBased && (
                    <View style={styles.badge}>
                        <Text style={styles.badgeText}>{t('quizChallengeCard.badge.team')}</Text>
                    </View>
                )}
            </View>
        );
    };

    const getStatusStyle = () => {
        const normalizedStatus = challenge.status.toLowerCase();

        switch (normalizedStatus) {
            case 'active':
            case 'open':
                return styles.status_active;
            case 'completed':
                return styles.status_completed;
            case 'failed':
                return styles.status_failed;
            case 'in_progress':
                return styles.status_in_progress;
            default:
                return {};
        }
    };

    const renderCreatorBadge = () => {
        if (challenge.userIsCreator) {
            return (
                <View style={styles.creatorBadge}>
                    <MaterialCommunityIcons name="crown" size={12} color={theme.colors.warning.main} />
                    <Text style={styles.creatorBadgeText}>{t('quizChallengeCard.creator')}</Text>
                </View>
            );
        }
        return null;
    };

    return (
        <TouchableOpacity style={styles.container} onPress={onPress}>
            <View style={styles.iconContainer}>
                <MaterialCommunityIcons
                    name={getQuizIcon()}
                    size={28}
                    color={theme.colors.success.main}
                />
            </View>

            <View style={styles.content}>
                <View style={styles.titleRow}>
                    <Text style={styles.title} numberOfLines={1}>{challenge.title}</Text>
                    {renderCreatorBadge()}
                </View>

                <View style={styles.typeContainer}>
                    <Text style={styles.typeLabel}>{getQuizTypeLabel()}</Text>
                    <Text style={styles.date}>
                        {challenge.created_at ? FormatterService.formatDate(challenge.created_at) : ''}
                    </Text>
                </View>

                {renderQuizDetails()}

                {wager && (
                    <View style={styles.wagerRow}>
                        <MaterialCommunityIcons
                            name={getStakeIconName(wager.stakeType)}
                            size={14}
                            color={theme.colors.primary.main}
                        />
                        <Text style={styles.wagerText}>
                            {formatWagerAmount(wager, t)}
                        </Text>
                    </View>
                )}

                <View style={styles.statusContainer}>
                    <View style={[styles.statusBadge, getStatusStyle()]}>
                        <Text style={styles.statusText}>
                            {getStatusLabel(challenge.status)}
                        </Text>
                    </View>

                    {challenge.reward && (
                        <Text style={styles.rewards} numberOfLines={1}>
                            {t('quizChallengeCard.reward', { reward: challenge.reward })}
                        </Text>
                    )}
                </View>
            </View>
        </TouchableOpacity>
    );
};

const themeStyles = createStyles(theme => ({
    container: {
        flexDirection: 'row',
        backgroundColor: theme.colors.background.primary,
        borderRadius: theme.layout.borderRadius.md,
        padding: theme.spacing.lg,
        marginBottom: theme.spacing.md,
        elevation: 2,
        shadowColor: theme.colors.text.primary,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    iconContainer: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: theme.colors.success.background,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: theme.spacing.lg,
    },
    content: {
        flex: 1,
    },
    titleRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: theme.spacing.xs,
    },
    title: {
        flex: 1,
        fontSize: theme.typography.fontSize.base,
        fontWeight: theme.typography.fontWeight.bold,
        color: theme.colors.text.primary,
        marginRight: theme.spacing.sm,
    },
    typeContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: theme.spacing.sm,
    },
    typeLabel: {
        fontSize: theme.typography.fontSize.sm,
        color: theme.colors.success.main,
        fontWeight: theme.typography.fontWeight.medium,
    },
    date: {
        fontSize: theme.typography.fontSize.xs,
        color: theme.colors.text.disabled,
    },
    quizDetails: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginBottom: theme.spacing.xs,
    },
    badge: {
        backgroundColor: theme.colors.background.secondary,
        paddingHorizontal: theme.spacing.sm,
        paddingVertical: 2,
        borderRadius: theme.layout.borderRadius.sm,
        marginRight: theme.spacing.sm,
        marginBottom: theme.spacing.xs,
    },
    badgeText: {
        fontSize: theme.typography.fontSize.xs,
        color: theme.colors.text.secondary,
    },
    wagerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginBottom: theme.spacing.sm,
    },
    wagerText: {
        fontSize: theme.typography.fontSize.xs,
        fontWeight: theme.typography.fontWeight.semibold,
        color: theme.colors.primary.main,
    },
    statusContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: theme.spacing.xs,
    },
    statusBadge: {
        paddingHorizontal: theme.spacing.md,
        paddingVertical: theme.spacing.xs,
        borderRadius: theme.layout.borderRadius.sm,
        backgroundColor: theme.colors.background.secondary,
    },
    status_active: {
        backgroundColor: theme.colors.success.background,
    },
    status_completed: {
        backgroundColor: theme.colors.primary.background,
    },
    status_failed: {
        backgroundColor: theme.colors.error.background,
    },
    status_in_progress: {
        backgroundColor: theme.colors.warning.background,
    },
    statusText: {
        fontSize: theme.typography.fontSize.xs,
        fontWeight: theme.typography.fontWeight.bold,
        color: theme.colors.text.secondary,
    },
    rewards: {
        fontSize: theme.typography.fontSize.xs,
        color: theme.colors.text.secondary,
        flex: 1,
        textAlign: 'right',
        marginLeft: theme.spacing.sm,
    },
    creatorBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.warning.background,
        paddingHorizontal: theme.spacing.sm,
        paddingVertical: 2,
        borderRadius: theme.layout.borderRadius.lg,
    },
    creatorBadgeText: {
        fontSize: 10,
        fontWeight: theme.typography.fontWeight.bold,
        color: theme.colors.warning.main,
        marginLeft: 4,
    },
}));

export default QuizChallengeCard;
