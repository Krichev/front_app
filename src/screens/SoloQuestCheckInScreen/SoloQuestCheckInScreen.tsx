// src/screens/SoloQuestCheckInScreen/SoloQuestCheckInScreen.tsx
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Animated,
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
import { formatDistance } from '../../shared/utils/geoUtils';
import { useSoloQuestCheckIn } from './hooks/useSoloQuestCheckIn';

type RoutePropType = RouteProp<RootStackParamList, 'SoloQuestCheckIn'>;
type NavProp = NativeStackNavigationProp<RootStackParamList>;

function formatDatetime(iso: string): string {
    return new Date(iso).toLocaleString(undefined, {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

function formatCountdown(diffMs: number): string {
    if (diffMs <= 0) return '';
    const totalSec = Math.floor(diffMs / 1000);
    const days = Math.floor(totalSec / 86400);
    const hours = Math.floor((totalSec % 86400) / 3600);
    const minutes = Math.floor((totalSec % 3600) / 60);
    const seconds = totalSec % 60;
    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    if (minutes > 0) return `${minutes}m ${seconds}s`;
    return `${seconds}s`;
}

const SoloQuestCheckInScreen: React.FC = () => {
    const { t } = useTranslation();
    const { theme } = useAppStyles();
    const styles = themeStyles;
    const route = useRoute<RoutePropType>();
    const navigation = useNavigation<NavProp>();
    const { questId } = route.params;

    const {
        quest,
        wager,
        questLoading,
        questError,
        currentDistance,
        locationError,
        hasCheckedIn,
        checkInError,
        setCheckInError,
        isCheckingIn,
        isDisputing,
        isCreator,
        isMatchedUser,
        handleCheckIn,
        handleDispute,
        refetchQuest,
        fetchPosition,
    } = useSoloQuestCheckIn(questId);

    // Countdown timer
    const [now, setNow] = useState(Date.now());
    useEffect(() => {
        const interval = setInterval(() => setNow(Date.now()), 1000);
        return () => clearInterval(interval);
    }, []);

    // Check-in success animation
    const checkInAnim = useRef(new Animated.Value(0)).current;
    useEffect(() => {
        if (hasCheckedIn) {
            Animated.spring(checkInAnim, {
                toValue: 1,
                useNativeDriver: true,
                friction: 4,
                tension: 80,
            }).start();
        }
    }, [hasCheckedIn, checkInAnim]);

    // Dispute modal
    const [showDisputeModal, setShowDisputeModal] = useState(false);
    const [disputeReason, setDisputeReason] = useState('');

    const handleDisputeSubmit = useCallback(async () => {
        try {
            await handleDispute();
            setShowDisputeModal(false);
            setDisputeReason('');
            Alert.alert(t('common.success'), t('soloQuestCheckIn.disputeSuccess'));
            refetchQuest();
        } catch {
            Alert.alert(t('common.error'), t('soloQuestCheckIn.disputeError'));
        }
    }, [handleDispute, refetchQuest, t]);

    const handleCheckInPress = useCallback(async () => {
        if (!quest) return;
        try {
            await handleCheckIn();
        } catch {
            // errors surfaced via checkInError state
        }
    }, [handleCheckIn, quest]);

    // ── Loading ──────────────────────────────────────────────────────────────
    if (questLoading) {
        return (
            <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background.primary }]}>
                <View style={styles.centered}>
                    <ActivityIndicator size="large" color={theme.colors.success.main} />
                </View>
            </SafeAreaView>
        );
    }

    // ── Error ────────────────────────────────────────────────────────────────
    if (questError || !quest) {
        return (
            <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background.primary }]}>
                <View style={[styles.header, { borderBottomColor: theme.colors.border.main }]}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconButton}>
                        <MaterialCommunityIcons name="arrow-left" size={24} color={theme.colors.text.primary} />
                    </TouchableOpacity>
                </View>
                <View style={styles.centered}>
                    <MaterialCommunityIcons name="alert-circle-outline" size={48} color={theme.colors.error.main} />
                    <Text style={[styles.errorText, { color: theme.colors.error.main }]}>
                        {t('soloQuest.errors.loadFailed')}
                    </Text>
                    <TouchableOpacity
                        style={[styles.retryButton, { backgroundColor: theme.colors.success.main }]}
                        onPress={() => refetchQuest()}
                    >
                        <Text style={[styles.retryText, { color: theme.colors.text.inverse }]}>
                            {t('common.retry')}
                        </Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    const meetupTime = new Date(quest.meetupDatetime).getTime();
    const diffMs = meetupTime - now;
    const isFuture = diffMs > 0;

    const bothCheckedIn = quest.status === 'COMPLETED';
    const canCheckIn = (isCreator || isMatchedUser) && !hasCheckedIn && !bothCheckedIn;

    // ── Render ───────────────────────────────────────────────────────────────
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
                    {t('soloQuestCheckIn.title')}
                </Text>
                <View style={styles.iconButton} />
            </View>

            <ScrollView
                style={styles.flex}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* ── Both checked in banner ── */}
                {bothCheckedIn && (
                    <View style={[styles.banner, { backgroundColor: theme.colors.success.background }]}>
                        <Text style={[styles.bannerText, { color: theme.colors.success.main }]}>
                            {t('soloQuestCheckIn.bothConfirmed')}
                        </Text>
                    </View>
                )}

                {/* ── 1. Meetup info card ── */}
                <View style={[styles.card, { backgroundColor: theme.colors.background.primary }]}>
                    <Text style={[styles.cardTitle, { color: theme.colors.text.primary }]}>
                        {quest.title}
                    </Text>
                    <View style={styles.infoRow}>
                        <MaterialCommunityIcons name="map-marker-outline" size={16} color={theme.colors.text.secondary} />
                        <Text style={[styles.infoText, { color: theme.colors.text.secondary }]}>
                            {quest.meetupLocationName}
                        </Text>
                    </View>
                    <View style={styles.infoRow}>
                        <MaterialCommunityIcons name="calendar-clock" size={16} color={theme.colors.text.secondary} />
                        <Text style={[styles.infoText, { color: theme.colors.text.secondary }]}>
                            {formatDatetime(quest.meetupDatetime)}
                        </Text>
                        {isFuture && (
                            <View style={[styles.countdownPill, { backgroundColor: theme.colors.info?.main ?? theme.colors.success.main }]}>
                                <Text style={[styles.countdownText, { color: '#fff' }]}>
                                    {t('soloQuestCheckIn.startsIn', { time: formatCountdown(diffMs) })}
                                </Text>
                            </View>
                        )}
                    </View>
                </View>

                {/* ── 2. Wager info card ── */}
                {(quest.depositPolicy !== 'NONE' || quest.socialPenaltyDescription) && (
                    <View style={[styles.card, { backgroundColor: theme.colors.background.primary }]}>
                        <Text style={[styles.sectionTitle, { color: theme.colors.text.secondary }]}>
                            {t('soloQuestCheckIn.wagerTitle')}
                        </Text>
                        {quest.depositPolicy !== 'NONE' && (
                            <View style={styles.infoRowLabel}>
                                <Text style={[styles.infoLabel, { color: theme.colors.text.disabled }]}>
                                    {t('soloQuestDetail.depositPolicyLabel')}
                                </Text>
                                <Text style={[styles.infoValue, { color: theme.colors.text.primary }]}>
                                    {t(`soloQuest.depositPolicy.${quest.depositPolicy}`)}
                                </Text>
                            </View>
                        )}
                        {!!quest.stakeAmount && (
                            <View style={styles.infoRowLabel}>
                                <Text style={[styles.infoLabel, { color: theme.colors.text.disabled }]}>
                                    {t('soloQuestDetail.stakeLabel')}
                                </Text>
                                <Text style={[styles.infoValue, { color: theme.colors.text.primary }]}>
                                    {`${quest.stakeAmount} ${quest.stakeType ?? ''} ${quest.stakeCurrency ?? ''}`.trim()}
                                </Text>
                            </View>
                        )}
                        {!!quest.socialPenaltyDescription && (
                            <View style={styles.infoRowLabel}>
                                <Text style={[styles.infoLabel, { color: theme.colors.text.disabled }]}>
                                    {t('soloQuestDetail.socialPenaltyLabel')}
                                </Text>
                                <Text style={[styles.infoValue, { color: theme.colors.text.primary }]}>
                                    {quest.socialPenaltyDescription}
                                </Text>
                            </View>
                        )}
                        {/* Extra wager fields from API if available */}
                        {wager && typeof wager === 'object' && (wager as any).depositAmount !== undefined && (
                            <View style={styles.infoRowLabel}>
                                <Text style={[styles.infoLabel, { color: theme.colors.text.disabled }]}>
                                    {t('soloQuestCheckIn.depositAmount')}
                                </Text>
                                <Text style={[styles.infoValue, { color: theme.colors.text.primary }]}>
                                    {(wager as any).depositAmount}
                                </Text>
                            </View>
                        )}
                    </View>
                )}

                {/* ── 3. Check-in section ── */}
                <View style={[styles.card, { backgroundColor: theme.colors.background.primary }]}>
                    <Text style={[styles.sectionTitle, { color: theme.colors.text.secondary }]}>
                        {t('soloQuestCheckIn.checkInSection')}
                    </Text>

                    {/* Distance indicator */}
                    {locationError === 'permission_denied' ? (
                        <View style={[styles.alertBox, { backgroundColor: theme.colors.error.main + '22' }]}>
                            <MaterialCommunityIcons name="map-marker-off" size={18} color={theme.colors.error.main} />
                            <Text style={[styles.alertText, { color: theme.colors.error.main }]}>
                                {t('soloQuestCheckIn.permissionDenied')}
                            </Text>
                        </View>
                    ) : locationError ? (
                        <View style={[styles.alertBox, { backgroundColor: theme.colors.error.main + '22' }]}>
                            <MaterialCommunityIcons name="alert-circle-outline" size={18} color={theme.colors.error.main} />
                            <Text style={[styles.alertText, { color: theme.colors.error.main }]}>
                                {t('soloQuestCheckIn.gpsError')}
                            </Text>
                            <TouchableOpacity onPress={fetchPosition}>
                                <Text style={[styles.retryInline, { color: theme.colors.info?.main ?? theme.colors.success.main }]}>
                                    {t('common.retry')}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    ) : currentDistance !== null ? (
                        <View style={styles.distanceRow}>
                            <MaterialCommunityIcons
                                name="map-marker-radius"
                                size={20}
                                color={currentDistance <= 200 ? theme.colors.success.main : theme.colors.warning?.main ?? '#FF9800'}
                            />
                            <Text style={[
                                styles.distanceValue,
                                { color: currentDistance <= 200 ? theme.colors.success.main : theme.colors.warning?.main ?? '#FF9800' },
                            ]}>
                                {t('soloQuestCheckIn.distanceFromMeetup', { distance: formatDistance(currentDistance) })}
                            </Text>
                        </View>
                    ) : (
                        <View style={styles.distanceRow}>
                            <ActivityIndicator size="small" color={theme.colors.text.secondary} />
                            <Text style={[styles.infoText, { color: theme.colors.text.secondary }]}>
                                {t('soloQuestCheckIn.locating')}
                            </Text>
                        </View>
                    )}

                    {/* Check-in error */}
                    {!!checkInError && (
                        <View style={[styles.alertBox, { backgroundColor: theme.colors.error.main + '22', marginTop: 8 }]}>
                            <MaterialCommunityIcons name="alert" size={16} color={theme.colors.error.main} />
                            <Text style={[styles.alertText, { color: theme.colors.error.main }]}>
                                {checkInError === 'network_error'
                                    ? t('soloQuestCheckIn.networkError')
                                    : t('soloQuestCheckIn.tooFar', { distance: checkInError })}
                            </Text>
                        </View>
                    )}

                    {/* Status indicators */}
                    <View style={styles.statusRow}>
                        <CheckInPartyStatus
                            label={quest.creatorUsername}
                            checkedIn={
                                isCreator ? hasCheckedIn || bothCheckedIn : bothCheckedIn
                            }
                            theme={theme}
                            styles={styles}
                        />
                        <View style={[styles.statusDivider, { backgroundColor: theme.colors.border.main }]} />
                        <CheckInPartyStatus
                            label={quest.matchedUsername ?? t('soloQuestCheckIn.matchedUser')}
                            checkedIn={
                                isMatchedUser ? hasCheckedIn || bothCheckedIn : bothCheckedIn
                            }
                            theme={theme}
                            styles={styles}
                        />
                    </View>

                    {/* Check-in CTA */}
                    {canCheckIn && (
                        <Animated.View style={{
                            transform: [{ scale: checkInAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 1] }) }],
                        }}>
                            <TouchableOpacity
                                style={[
                                    styles.checkInButton,
                                    { backgroundColor: theme.colors.success.main },
                                    (!currentDistance || isCheckingIn) && { opacity: 0.6 },
                                ]}
                                onPress={handleCheckInPress}
                                disabled={!currentDistance || isCheckingIn}
                            >
                                {isCheckingIn ? (
                                    <ActivityIndicator size="small" color="#fff" />
                                ) : (
                                    <>
                                        <MaterialCommunityIcons name="map-marker-check" size={22} color="#fff" />
                                        <Text style={styles.checkInButtonText}>
                                            {t('soloQuestCheckIn.checkInButton')}
                                        </Text>
                                    </>
                                )}
                            </TouchableOpacity>
                        </Animated.View>
                    )}

                    {/* Success state */}
                    {hasCheckedIn && !bothCheckedIn && (
                        <View style={[styles.successBox, { backgroundColor: theme.colors.success.background }]}>
                            <MaterialCommunityIcons name="check-circle" size={20} color={theme.colors.success.main} />
                            <Text style={[styles.successText, { color: theme.colors.success.main }]}>
                                {t('soloQuestCheckIn.waitingOther')}
                            </Text>
                        </View>
                    )}
                </View>

                <View style={{ height: 80 }} />
            </ScrollView>

            {/* ── Dispute footer ── */}
            {!bothCheckedIn && (
                <View style={[styles.footer, {
                    backgroundColor: theme.colors.background.primary,
                    borderTopColor: theme.colors.border.main,
                }]}>
                    <TouchableOpacity
                        style={[styles.disputeButton, { borderColor: theme.colors.error.main }]}
                        onPress={() => setShowDisputeModal(true)}
                    >
                        <MaterialCommunityIcons name="flag-outline" size={18} color={theme.colors.error.main} />
                        <Text style={[styles.disputeButtonText, { color: theme.colors.error.main }]}>
                            {t('soloQuestCheckIn.reportIssue')}
                        </Text>
                    </TouchableOpacity>
                </View>
            )}

            {/* ── Dispute Modal ── */}
            <Modal
                visible={showDisputeModal}
                transparent
                animationType="slide"
                onRequestClose={() => setShowDisputeModal(false)}
            >
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => setShowDisputeModal(false)}
                >
                    <TouchableOpacity
                        activeOpacity={1}
                        style={[styles.modalSheet, { backgroundColor: theme.colors.background.primary }]}
                    >
                        <Text style={[styles.modalTitle, { color: theme.colors.text.primary }]}>
                            {t('soloQuestCheckIn.disputeModalTitle')}
                        </Text>
                        <Text style={[styles.inputLabel, { color: theme.colors.text.secondary }]}>
                            {t('soloQuestCheckIn.disputeReasonLabel')}
                        </Text>
                        <TextInput
                            style={[styles.textInput, {
                                borderColor: theme.colors.border.main,
                                color: theme.colors.text.primary,
                                backgroundColor: theme.colors.background.secondary,
                            }]}
                            value={disputeReason}
                            onChangeText={setDisputeReason}
                            placeholder={t('soloQuestCheckIn.disputeReasonPlaceholder')}
                            placeholderTextColor={theme.colors.text.disabled}
                            multiline
                            maxLength={500}
                        />
                        <TouchableOpacity
                            style={[
                                styles.actionButton,
                                { backgroundColor: theme.colors.error.main },
                                isDisputing && { opacity: 0.6 },
                            ]}
                            onPress={handleDisputeSubmit}
                            disabled={isDisputing}
                        >
                            {isDisputing ? (
                                <ActivityIndicator size="small" color="#fff" />
                            ) : (
                                <Text style={[styles.actionButtonText, { color: '#fff' }]}>
                                    {t('soloQuestCheckIn.disputeSubmit')}
                                </Text>
                            )}
                        </TouchableOpacity>
                    </TouchableOpacity>
                </TouchableOpacity>
            </Modal>
        </SafeAreaView>
    );
};

const CheckInPartyStatus: React.FC<{
    label: string;
    checkedIn: boolean;
    theme: any;
    styles: any;
}> = ({ label, checkedIn, theme, styles }) => (
    <View style={styles.partyStatus}>
        <Text style={[styles.partyLabel, { color: theme.colors.text.secondary }]} numberOfLines={1}>
            {label}
        </Text>
        {checkedIn ? (
            <MaterialCommunityIcons name="check-circle" size={24} color={theme.colors.success.main} />
        ) : (
            <MaterialCommunityIcons name="clock-outline" size={24} color={theme.colors.text.disabled} />
        )}
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
    scrollContent: {
        paddingBottom: theme.spacing.xl,
        gap: theme.spacing.xs,
    },
    banner: {
        paddingHorizontal: theme.spacing.lg,
        paddingVertical: theme.spacing.md,
        alignItems: 'center' as const,
    },
    bannerText: {
        ...theme.typography.heading.h6,
        fontWeight: theme.typography.fontWeight.bold,
        textAlign: 'center' as const,
    },
    card: {
        paddingHorizontal: theme.spacing.lg,
        paddingVertical: theme.spacing.md,
        marginTop: theme.spacing.xs,
        gap: theme.spacing.xs,
    },
    cardTitle: {
        ...theme.typography.heading.h5,
        fontWeight: theme.typography.fontWeight.bold,
        marginBottom: theme.spacing.xs,
    },
    sectionTitle: {
        ...theme.typography.body.small,
        fontWeight: theme.typography.fontWeight.bold,
        textTransform: 'uppercase' as const,
        letterSpacing: 0.5,
        marginBottom: theme.spacing.xs,
    },
    infoRow: {
        flexDirection: 'row' as const,
        alignItems: 'center' as const,
        gap: theme.spacing.xs,
    },
    infoText: {
        flex: 1,
        ...theme.typography.body.small,
    },
    infoRowLabel: {
        marginBottom: theme.spacing.xs,
    },
    infoLabel: {
        ...theme.typography.caption,
        marginBottom: 2,
    },
    infoValue: {
        ...theme.typography.body.medium,
    },
    countdownPill: {
        paddingHorizontal: theme.spacing.sm,
        paddingVertical: 2,
        borderRadius: theme.layout.borderRadius.xl,
    },
    countdownText: {
        ...theme.typography.caption,
        fontWeight: theme.typography.fontWeight.bold,
    },
    distanceRow: {
        flexDirection: 'row' as const,
        alignItems: 'center' as const,
        gap: theme.spacing.sm,
        paddingVertical: theme.spacing.xs,
    },
    distanceValue: {
        ...theme.typography.body.medium,
        fontWeight: theme.typography.fontWeight.semibold,
    },
    alertBox: {
        flexDirection: 'row' as const,
        alignItems: 'center' as const,
        gap: theme.spacing.xs,
        padding: theme.spacing.sm,
        borderRadius: theme.layout.borderRadius.sm,
    },
    alertText: {
        flex: 1,
        ...theme.typography.body.small,
    },
    retryInline: {
        ...theme.typography.body.small,
        fontWeight: theme.typography.fontWeight.bold,
    },
    statusRow: {
        flexDirection: 'row' as const,
        alignItems: 'center' as const,
        marginVertical: theme.spacing.sm,
        gap: theme.spacing.sm,
    },
    statusDivider: {
        width: 1,
        height: 36,
    },
    partyStatus: {
        flex: 1,
        alignItems: 'center' as const,
        gap: theme.spacing.xs,
    },
    partyLabel: {
        ...theme.typography.body.small,
        textAlign: 'center' as const,
    },
    checkInButton: {
        flexDirection: 'row' as const,
        alignItems: 'center' as const,
        justifyContent: 'center' as const,
        paddingVertical: theme.spacing.lg,
        borderRadius: theme.layout.borderRadius.md,
        gap: theme.spacing.sm,
        marginTop: theme.spacing.sm,
    },
    checkInButtonText: {
        ...theme.typography.heading.h6,
        fontWeight: theme.typography.fontWeight.bold,
        color: '#fff',
    },
    successBox: {
        flexDirection: 'row' as const,
        alignItems: 'center' as const,
        gap: theme.spacing.sm,
        padding: theme.spacing.md,
        borderRadius: theme.layout.borderRadius.sm,
        marginTop: theme.spacing.sm,
    },
    successText: {
        ...theme.typography.body.medium,
        fontWeight: theme.typography.fontWeight.semibold,
    },
    footer: {
        paddingHorizontal: theme.spacing.lg,
        paddingVertical: theme.spacing.md,
        borderTopWidth: 1,
    },
    disputeButton: {
        flexDirection: 'row' as const,
        alignItems: 'center' as const,
        justifyContent: 'center' as const,
        paddingVertical: theme.spacing.sm,
        borderRadius: theme.layout.borderRadius.md,
        borderWidth: 1,
        gap: theme.spacing.xs,
    },
    disputeButtonText: {
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
    textInput: {
        borderWidth: 1,
        borderRadius: theme.layout.borderRadius.sm,
        paddingHorizontal: theme.spacing.md,
        paddingVertical: theme.spacing.sm,
        minHeight: 100,
        textAlignVertical: 'top' as const,
        ...theme.typography.body.medium,
    },
    actionButton: {
        flexDirection: 'row' as const,
        alignItems: 'center' as const,
        justifyContent: 'center' as const,
        paddingVertical: theme.spacing.md,
        borderRadius: theme.layout.borderRadius.md,
    },
    actionButtonText: {
        ...theme.typography.body.medium,
        fontWeight: theme.typography.fontWeight.bold,
    },
}));

export default SoloQuestCheckInScreen;
