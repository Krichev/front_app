// src/screens/SoloQuestDetailScreen/SoloQuestDetailScreen.tsx
import React, { useCallback, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Modal,
    SafeAreaView,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTranslation } from 'react-i18next';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { useAppStyles } from '../../shared/ui/hooks/useAppStyles';
import { createStyles } from '../../shared/ui/theme';
import { useSoloQuestDetail } from './hooks/useSoloQuestDetail';

type RoutePropType = RouteProp<RootStackParamList, 'SoloQuestDetail'>;
type NavProp = NativeStackNavigationProp<RootStackParamList>;

function formatDatetime(iso: string): string {
    return new Date(iso).toLocaleString(undefined, {
        weekday: 'short', month: 'short', day: 'numeric',
        hour: '2-digit', minute: '2-digit',
    });
}

const STATUS_COLORS: Record<string, string> = {
    OPEN: '#4CAF50',
    MATCHED: '#2196F3',
    COMPLETED: '#9C27B0',
    CANCELLED: '#9E9E9E',
    EXPIRED: '#FF5722',
};

const APPLICATION_STATUS_COLORS: Record<string, string> = {
    PENDING: '#FF9800',
    ACCEPTED: '#4CAF50',
    DECLINED: '#F44336',
    WITHDRAWN: '#9E9E9E',
    EXPIRED: '#FF5722',
};

const SoloQuestDetailScreen: React.FC = () => {
    const { t } = useTranslation();
    const { theme } = useAppStyles();
    const styles = themeStyles;
    const route = useRoute<RoutePropType>();
    const navigation = useNavigation<NavProp>();
    const { questId } = route.params;

    const {
        quest, isLoading, error, refetch,
        isCreator, isMatchedUser, myApplication, hasApplied,
        isApplying, isCancelling, applyToQuest, cancelSoloQuest,
    } = useSoloQuestDetail(questId);

    const [showApplyModal, setShowApplyModal] = useState(false);
    const [pitchMessage, setPitchMessage] = useState('');

    const handleApply = useCallback(async () => {
        const trimmed = pitchMessage.trim();
        if (trimmed.length < 10) {
            Alert.alert(t('common.error'), t('soloQuestDetail.pitchValidationMin'));
            return;
        }
        if (trimmed.length > 500) {
            Alert.alert(t('common.error'), t('soloQuestDetail.pitchValidationMax'));
            return;
        }
        try {
            await applyToQuest({ id: questId, body: { pitchMessage: trimmed } }).unwrap();
            setShowApplyModal(false);
            setPitchMessage('');
            Alert.alert(t('common.success'), t('soloQuestDetail.applySuccess'));
            refetch();
        } catch {
            Alert.alert(t('common.error'), t('soloQuestDetail.applyError'));
        }
    }, [pitchMessage, applyToQuest, questId, refetch, t]);

    const handleCancelQuest = useCallback(() => {
        Alert.alert(
            t('soloQuestDetail.cancelConfirmTitle'),
            t('soloQuestDetail.cancelConfirmMessage'),
            [
                { text: t('common.cancel'), style: 'cancel' },
                {
                    text: t('soloQuestDetail.cancelConfirm'),
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await cancelSoloQuest(questId).unwrap();
                            Alert.alert(t('common.success'), t('soloQuestDetail.cancelSuccess'));
                            navigation.goBack();
                        } catch {
                            Alert.alert(t('common.error'), t('soloQuestDetail.cancelError'));
                        }
                    },
                },
            ],
        );
    }, [cancelSoloQuest, questId, navigation, t]);

    const handleViewApplications = useCallback(() => {
        navigation.navigate('QuestApplications', { questId });
    }, [navigation, questId]);

    const handleCheckIn = useCallback(() => {
        navigation.navigate('SoloQuestCheckIn', { questId });
    }, [navigation, questId]);

    if (isLoading) {
        return (
            <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background.primary }]}>
                <View style={styles.centered}>
                    <ActivityIndicator size="large" color={theme.colors.success.main} />
                </View>
            </SafeAreaView>
        );
    }

    if (error || !quest) {
        return (
            <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background.primary }]}>
                <View style={[styles.header, { borderBottomColor: theme.colors.border.main }]}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconButton}>
                        <MaterialCommunityIcons name="arrow-left" size={24} color={theme.colors.text.primary} />
                    </TouchableOpacity>
                    <View style={styles.iconButton} />
                </View>
                <View style={styles.centered}>
                    <MaterialCommunityIcons name="alert-circle-outline" size={48} color={theme.colors.error.main} />
                    <Text style={[styles.errorText, { color: theme.colors.error.main }]}>
                        {t('soloQuest.errors.loadFailed')}
                    </Text>
                    <TouchableOpacity
                        style={[styles.retryButton, { backgroundColor: theme.colors.success.main }]}
                        onPress={() => refetch()}
                    >
                        <Text style={[styles.retryText, { color: theme.colors.text.inverse }]}>
                            {t('common.retry')}
                        </Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    const statusColor = STATUS_COLORS[quest.status] ?? theme.colors.text.secondary;
    const canApply = !isCreator && !isMatchedUser && quest.status === 'OPEN' && !hasApplied;
    const showApplyButton = !isCreator && !isMatchedUser && quest.status === 'OPEN';

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background.secondary }]}>
            {/* Header */}
            <View style={[styles.header, {
                backgroundColor: theme.colors.background.primary,
                borderBottomColor: theme.colors.border.main,
            }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconButton}>
                    <MaterialCommunityIcons name="arrow-left" size={24} color={theme.colors.text.primary} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: theme.colors.text.primary }]} numberOfLines={1}>
                    {t('soloQuestDetail.title')}
                </Text>
                <View style={[styles.statusPill, { backgroundColor: statusColor + '22' }]}>
                    <Text style={[styles.statusPillText, { color: statusColor }]}>
                        {t(`soloQuest.status.${quest.status}`)}
                    </Text>
                </View>
            </View>

            <ScrollView
                style={styles.flex}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Matched banner */}
                {isMatchedUser && (
                    <View style={[styles.banner, { backgroundColor: theme.colors.success.background }]}>
                        <MaterialCommunityIcons name="handshake" size={20} color={theme.colors.success.main} />
                        <Text style={[styles.bannerText, { color: theme.colors.success.main }]}>
                            {t('soloQuestDetail.matchedBanner')}
                        </Text>
                    </View>
                )}

                {/* My application status */}
                {hasApplied && myApplication && (
                    <View style={[styles.applicationStatusBanner, {
                        backgroundColor: (APPLICATION_STATUS_COLORS[myApplication.status] ?? theme.colors.text.secondary) + '22',
                    }]}>
                        <Text style={[styles.applicationStatusText, {
                            color: APPLICATION_STATUS_COLORS[myApplication.status] ?? theme.colors.text.secondary,
                        }]}>
                            {t('soloQuestDetail.applicationStatusLabel')}: {t(`soloQuest.applicationStatus.${myApplication.status}`)}
                        </Text>
                    </View>
                )}

                {/* ── DETAILS SECTION ── */}
                <View style={[styles.section, { backgroundColor: theme.colors.background.primary }]}>
                    <Text style={[styles.questTitle, { color: theme.colors.text.primary }]}>
                        {quest.title}
                    </Text>
                    <Text style={[styles.creatorLine, { color: theme.colors.text.secondary }]}>
                        by {quest.creatorUsername}
                        {quest.creatorReputationScore !== undefined && ` ★ ${quest.creatorReputationScore}`}
                    </Text>
                    {!!quest.description && (
                        <Text style={[styles.description, { color: theme.colors.text.secondary }]}>
                            {quest.description}
                        </Text>
                    )}
                </View>

                {/* ── WHEN / WHERE ── */}
                <View style={[styles.section, { backgroundColor: theme.colors.background.primary }]}>
                    <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>
                        {t('soloQuestDetail.sections.details')}
                    </Text>
                    <View style={styles.infoRow}>
                        <MaterialCommunityIcons name="calendar-clock" size={16} color={theme.colors.text.secondary} />
                        <Text style={[styles.infoText, { color: theme.colors.text.secondary }]}>
                            {formatDatetime(quest.meetupDatetime)}
                        </Text>
                    </View>
                    <View style={styles.infoRow}>
                        <MaterialCommunityIcons name="map-marker-outline" size={16} color={theme.colors.text.secondary} />
                        <Text style={[styles.infoText, { color: theme.colors.text.secondary }]}>
                            {quest.meetupLocationName}
                        </Text>
                        {quest.distanceKm !== undefined && (
                            <Text style={[styles.distanceText, { color: theme.colors.info?.main ?? theme.colors.success.main }]}>
                                {quest.distanceKm.toFixed(1)} {t('soloQuestFeed.distanceUnit')}
                            </Text>
                        )}
                    </View>
                </View>

                {/* ── AUDIENCE ── */}
                {(quest.targetGender || quest.targetAgeMin || quest.targetAgeMax ||
                    quest.targetRelationshipStatus || (quest.requiredInterests && quest.requiredInterests.length > 0) ||
                    quest.maxDistanceKm) && (
                    <View style={[styles.section, { backgroundColor: theme.colors.background.primary }]}>
                        <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>
                            {t('soloQuestDetail.sections.audience')}
                        </Text>
                        {quest.targetGender && (
                            <InfoRow label={t('soloQuestDetail.targetGenderLabel')}
                                value={t(`createSoloQuest.targetGender.${quest.targetGender}`)}
                                theme={theme} styles={styles} />
                        )}
                        {(quest.targetAgeMin || quest.targetAgeMax) && (
                            <InfoRow label={t('soloQuestDetail.ageRangeLabel')}
                                value={t('soloQuestDetail.ageRangeValue', {
                                    min: quest.targetAgeMin ?? '—',
                                    max: quest.targetAgeMax ?? '—',
                                })}
                                theme={theme} styles={styles} />
                        )}
                        {quest.targetRelationshipStatus && (
                            <InfoRow label={t('soloQuestDetail.relationshipStatusLabel')}
                                value={t(`editProfileDetails.relationshipStatus.${quest.targetRelationshipStatus}`)}
                                theme={theme} styles={styles} />
                        )}
                        {quest.maxDistanceKm && (
                            <InfoRow label={t('soloQuestDetail.maxDistanceLabel')}
                                value={t('soloQuestDetail.maxDistanceValue', { km: quest.maxDistanceKm })}
                                theme={theme} styles={styles} />
                        )}
                        {quest.requiredInterests && quest.requiredInterests.length > 0 && (
                            <View>
                                <Text style={[styles.infoLabel, { color: theme.colors.text.disabled }]}>
                                    {t('soloQuestDetail.requiredInterestsLabel')}
                                </Text>
                                <View style={styles.tagsRow}>
                                    {quest.requiredInterests.map((tag, i) => (
                                        <View key={i} style={[styles.tag, { backgroundColor: theme.colors.success.background }]}>
                                            <Text style={[styles.tagText, { color: theme.colors.success.main }]}>{tag}</Text>
                                        </View>
                                    ))}
                                </View>
                            </View>
                        )}
                    </View>
                )}

                {/* ── DEPOSIT ── */}
                {quest.depositPolicy !== 'NONE' && (
                    <View style={[styles.section, { backgroundColor: theme.colors.background.primary }]}>
                        <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>
                            {t('soloQuestDetail.sections.deposit')}
                        </Text>
                        <InfoRow label={t('soloQuestDetail.depositPolicyLabel')}
                            value={t(`soloQuest.depositPolicy.${quest.depositPolicy}`)}
                            theme={theme} styles={styles} />
                        {quest.stakeAmount && (
                            <InfoRow label={t('soloQuestDetail.stakeLabel')}
                                value={`${quest.stakeAmount} ${quest.stakeType ?? ''} ${quest.stakeCurrency ?? ''}`.trim()}
                                theme={theme} styles={styles} />
                        )}
                        {quest.socialPenaltyDescription && (
                            <InfoRow label={t('soloQuestDetail.socialPenaltyLabel')}
                                value={quest.socialPenaltyDescription}
                                theme={theme} styles={styles} />
                        )}
                    </View>
                )}

                {/* Matched user info (for creator) */}
                {isCreator && quest.matchedUsername && (
                    <View style={[styles.section, { backgroundColor: theme.colors.background.primary }]}>
                        <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>
                            {t('soloQuestDetail.sections.matchedUser')}
                        </Text>
                        <Text style={[styles.infoText, { color: theme.colors.text.primary }]}>
                            {quest.matchedUsername}
                        </Text>
                    </View>
                )}

                {/* Pitch message (if already applied) */}
                {hasApplied && myApplication && (
                    <View style={[styles.section, { backgroundColor: theme.colors.background.primary }]}>
                        <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>
                            {t('soloQuestDetail.applicationStatusLabel')}
                        </Text>
                        <Text style={[styles.pitchSnippet, { color: theme.colors.text.secondary }]}>
                            {myApplication.pitchMessage}
                        </Text>
                        {myApplication.creatorMessage && (
                            <>
                                <Text style={[styles.infoLabel, { color: theme.colors.text.disabled, marginTop: 8 }]}>
                                    {t('myApplications.creatorMessageLabel')}
                                </Text>
                                <Text style={[styles.pitchSnippet, { color: theme.colors.text.secondary }]}>
                                    {myApplication.creatorMessage}
                                </Text>
                            </>
                        )}
                    </View>
                )}

                <View style={{ height: 80 }} />
            </ScrollView>

            {/* ── ACTION FOOTER ── */}
            <View style={[styles.footer, {
                backgroundColor: theme.colors.background.primary,
                borderTopColor: theme.colors.border.main,
            }]}>
                {/* Creator actions */}
                {isCreator && (
                    <View style={styles.footerRow}>
                        {quest.status !== 'MATCHED' && (
                            <TouchableOpacity
                                style={[styles.actionButton, { backgroundColor: theme.colors.info?.main ?? theme.colors.success.main }]}
                                onPress={handleViewApplications}
                            >
                                <MaterialCommunityIcons name="account-group" size={20} color={theme.colors.text.inverse} />
                                <Text style={[styles.actionButtonText, { color: theme.colors.text.inverse }]}>
                                    {quest.applicationCount && quest.applicationCount > 0
                                        ? t('soloQuestDetail.viewApplicationsButton', { count: quest.applicationCount })
                                        : t('soloQuestDetail.viewApplicationsButtonEmpty')}
                                </Text>
                            </TouchableOpacity>
                        )}
                        {quest.status === 'MATCHED' && (
                            <TouchableOpacity
                                style={[styles.actionButton, { backgroundColor: theme.colors.success.main }]}
                                onPress={handleCheckIn}
                            >
                                <MaterialCommunityIcons name="map-marker-check" size={20} color={theme.colors.text.inverse} />
                                <Text style={[styles.actionButtonText, { color: theme.colors.text.inverse }]}>
                                    {t('soloQuestDetail.checkInButton')}
                                </Text>
                            </TouchableOpacity>
                        )}
                        {quest.status === 'OPEN' && (
                            <TouchableOpacity
                                style={[styles.cancelButton, { borderColor: theme.colors.error.main }]}
                                onPress={handleCancelQuest}
                                disabled={isCancelling}
                            >
                                {isCancelling
                                    ? <ActivityIndicator size="small" color={theme.colors.error.main} />
                                    : <Text style={[styles.cancelButtonText, { color: theme.colors.error.main }]}>
                                        {t('soloQuestDetail.cancelButton')}
                                    </Text>}
                            </TouchableOpacity>
                        )}
                    </View>
                )}

                {/* Matched user action */}
                {isMatchedUser && (
                    <TouchableOpacity
                        style={[styles.actionButton, { backgroundColor: theme.colors.success.main }]}
                        onPress={handleCheckIn}
                    >
                        <MaterialCommunityIcons name="map-marker-check" size={20} color={theme.colors.text.inverse} />
                        <Text style={[styles.actionButtonText, { color: theme.colors.text.inverse }]}>
                            {t('soloQuestDetail.checkInButton')}
                        </Text>
                    </TouchableOpacity>
                )}

                {/* Applicant actions */}
                {showApplyButton && (
                    <TouchableOpacity
                        style={[
                            styles.actionButton,
                            { backgroundColor: canApply ? theme.colors.success.main : theme.colors.text.disabled },
                        ]}
                        onPress={() => canApply && setShowApplyModal(true)}
                        disabled={!canApply}
                    >
                        <Text style={[styles.actionButtonText, { color: theme.colors.text.inverse }]}>
                            {hasApplied ? t('soloQuestDetail.alreadyApplied') : t('soloQuestDetail.applyButton')}
                        </Text>
                    </TouchableOpacity>
                )}
            </View>

            {/* Apply Modal */}
            <Modal
                visible={showApplyModal}
                transparent
                animationType="slide"
                onRequestClose={() => setShowApplyModal(false)}
            >
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => setShowApplyModal(false)}
                >
                    <TouchableOpacity
                        activeOpacity={1}
                        style={[styles.modalSheet, { backgroundColor: theme.colors.background.primary }]}
                    >
                        <Text style={[styles.modalTitle, { color: theme.colors.text.primary }]}>
                            {t('soloQuestDetail.pitchModalTitle')}
                        </Text>
                        <Text style={[styles.inputLabel, { color: theme.colors.text.secondary }]}>
                            {t('soloQuestDetail.pitchLabel')}
                        </Text>
                        <TextInput
                            style={[styles.pitchInput, {
                                borderColor: theme.colors.border.main,
                                color: theme.colors.text.primary,
                                backgroundColor: theme.colors.background.secondary,
                            }]}
                            value={pitchMessage}
                            onChangeText={setPitchMessage}
                            placeholder={t('soloQuestDetail.pitchPlaceholder')}
                            placeholderTextColor={theme.colors.text.disabled}
                            multiline
                            maxLength={500}
                        />
                        <Text style={[styles.charCount, { color: theme.colors.text.disabled }]}>
                            {pitchMessage.length}/500
                        </Text>
                        <TouchableOpacity
                            style={[
                                styles.actionButton,
                                { backgroundColor: theme.colors.success.main },
                                isApplying && { opacity: 0.6 },
                            ]}
                            onPress={handleApply}
                            disabled={isApplying}
                        >
                            {isApplying
                                ? <ActivityIndicator size="small" color={theme.colors.text.inverse} />
                                : <Text style={[styles.actionButtonText, { color: theme.colors.text.inverse }]}>
                                    {t('soloQuestDetail.pitchSubmit')}
                                </Text>}
                        </TouchableOpacity>
                    </TouchableOpacity>
                </TouchableOpacity>
            </Modal>
        </SafeAreaView>
    );
};

// Small helper to avoid repetition
const InfoRow: React.FC<{ label: string; value: string; theme: any; styles: any }> = ({ label, value, theme, styles }) => (
    <View style={styles.infoRowLabel}>
        <Text style={[styles.infoLabel, { color: theme.colors.text.disabled }]}>{label}</Text>
        <Text style={[styles.infoValue, { color: theme.colors.text.primary }]}>{value}</Text>
    </View>
);

const themeStyles = createStyles(theme => ({
    container: { flex: 1 },
    flex: { flex: 1 },
    centered: {
        flex: 1,
        justifyContent: 'center' as const,
        alignItems: 'center' as const,
        padding: theme.spacing.xl,
        gap: theme.spacing.md,
    },
    header: {
        flexDirection: 'row' as const,
        alignItems: 'center' as const,
        justifyContent: 'space-between' as const,
        paddingHorizontal: theme.spacing.md,
        paddingVertical: theme.spacing.sm,
        borderBottomWidth: 1,
    },
    iconButton: {
        width: 44,
        height: 44,
        justifyContent: 'center' as const,
        alignItems: 'center' as const,
    },
    headerTitle: {
        flex: 1,
        ...theme.typography.heading.h6,
        fontWeight: theme.typography.fontWeight.bold,
        textAlign: 'center' as const,
    },
    statusPill: {
        paddingHorizontal: theme.spacing.sm,
        paddingVertical: 4,
        borderRadius: theme.layout.borderRadius.xl,
        alignItems: 'center' as const,
    },
    statusPillText: {
        ...theme.typography.caption,
        fontWeight: theme.typography.fontWeight.bold,
    },
    scrollContent: {
        paddingBottom: theme.spacing.xl,
        gap: theme.spacing.xs,
    },
    banner: {
        flexDirection: 'row' as const,
        alignItems: 'center' as const,
        gap: theme.spacing.sm,
        paddingHorizontal: theme.spacing.lg,
        paddingVertical: theme.spacing.sm,
    },
    bannerText: {
        ...theme.typography.body.medium,
        fontWeight: theme.typography.fontWeight.semibold,
    },
    applicationStatusBanner: {
        paddingHorizontal: theme.spacing.lg,
        paddingVertical: theme.spacing.sm,
    },
    applicationStatusText: {
        ...theme.typography.body.small,
        fontWeight: theme.typography.fontWeight.semibold,
    },
    section: {
        paddingHorizontal: theme.spacing.lg,
        paddingVertical: theme.spacing.md,
        marginTop: theme.spacing.xs,
    },
    sectionTitle: {
        ...theme.typography.body.small,
        fontWeight: theme.typography.fontWeight.bold,
        textTransform: 'uppercase' as const,
        letterSpacing: 0.5,
        marginBottom: theme.spacing.sm,
        color: '#999',
    },
    questTitle: {
        ...theme.typography.heading.h5,
        fontWeight: theme.typography.fontWeight.bold,
        marginBottom: theme.spacing.xs,
    },
    creatorLine: {
        ...theme.typography.body.small,
        marginBottom: theme.spacing.sm,
    },
    description: {
        ...theme.typography.body.medium,
        lineHeight: 22,
    },
    infoRow: {
        flexDirection: 'row' as const,
        alignItems: 'center' as const,
        gap: theme.spacing.xs,
        marginBottom: theme.spacing.xs,
    },
    infoRowLabel: {
        marginBottom: theme.spacing.sm,
    },
    infoLabel: {
        ...theme.typography.caption,
        marginBottom: 2,
    },
    infoValue: {
        ...theme.typography.body.medium,
    },
    infoText: {
        flex: 1,
        ...theme.typography.body.small,
    },
    distanceText: {
        ...theme.typography.caption,
        fontWeight: theme.typography.fontWeight.bold,
    },
    tagsRow: {
        flexDirection: 'row' as const,
        flexWrap: 'wrap' as const,
        gap: theme.spacing.xs,
        marginTop: theme.spacing.xs,
    },
    tag: {
        paddingHorizontal: theme.spacing.sm,
        paddingVertical: 3,
        borderRadius: theme.layout.borderRadius.xl,
    },
    tagText: {
        ...theme.typography.caption,
        fontWeight: theme.typography.fontWeight.medium,
    },
    pitchSnippet: {
        ...theme.typography.body.small,
        lineHeight: 20,
    },
    footer: {
        paddingHorizontal: theme.spacing.lg,
        paddingVertical: theme.spacing.md,
        borderTopWidth: 1,
    },
    footerRow: {
        flexDirection: 'row' as const,
        gap: theme.spacing.sm,
    },
    actionButton: {
        flex: 1,
        flexDirection: 'row' as const,
        alignItems: 'center' as const,
        justifyContent: 'center' as const,
        paddingVertical: theme.spacing.md,
        borderRadius: theme.layout.borderRadius.md,
        gap: theme.spacing.xs,
    },
    actionButtonText: {
        ...theme.typography.body.medium,
        fontWeight: theme.typography.fontWeight.bold,
    },
    cancelButton: {
        paddingHorizontal: theme.spacing.lg,
        paddingVertical: theme.spacing.md,
        borderRadius: theme.layout.borderRadius.md,
        borderWidth: 1,
        alignItems: 'center' as const,
        justifyContent: 'center' as const,
    },
    cancelButtonText: {
        ...theme.typography.body.medium,
        fontWeight: theme.typography.fontWeight.semibold,
    },
    errorText: {
        ...theme.typography.body.large,
        textAlign: 'center' as const,
    },
    retryButton: {
        paddingHorizontal: theme.spacing.xl,
        paddingVertical: theme.spacing.sm,
        borderRadius: theme.layout.borderRadius.md,
    },
    retryText: {
        ...theme.typography.body.medium,
        fontWeight: theme.typography.fontWeight.bold,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end' as const,
    },
    modalSheet: {
        borderTopLeftRadius: theme.layout.borderRadius.xl,
        borderTopRightRadius: theme.layout.borderRadius.xl,
        padding: theme.spacing.xl,
        paddingBottom: theme.spacing['3xl'],
        gap: theme.spacing.sm,
    },
    modalTitle: {
        ...theme.typography.heading.h6,
        fontWeight: theme.typography.fontWeight.bold,
        marginBottom: theme.spacing.sm,
    },
    inputLabel: {
        ...theme.typography.body.small,
        fontWeight: theme.typography.fontWeight.medium,
    },
    pitchInput: {
        borderWidth: 1,
        borderRadius: theme.layout.borderRadius.sm,
        paddingHorizontal: theme.spacing.md,
        paddingVertical: theme.spacing.sm,
        minHeight: 120,
        textAlignVertical: 'top' as const,
        ...theme.typography.body.medium,
    },
    charCount: {
        ...theme.typography.caption,
        textAlign: 'right' as const,
    },
}));

export default SoloQuestDetailScreen;
