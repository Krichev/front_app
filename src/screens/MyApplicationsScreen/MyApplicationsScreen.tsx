// src/screens/MyApplicationsScreen/MyApplicationsScreen.tsx
import React, { useCallback } from 'react';
import {
    ActivityIndicator,
    FlatList,
    SafeAreaView,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTranslation } from 'react-i18next';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { useAppStyles } from '../../shared/ui/hooks/useAppStyles';
import { createStyles } from '../../shared/ui/theme';
import { SoloQuestApplication } from '../../entities/SoloQuestState/model/types';
import { useMyApplications } from './hooks/useMyApplications';

type NavProp = NativeStackNavigationProp<RootStackParamList>;

const STATUS_COLORS: Record<string, string> = {
    PENDING: '#FF9800',
    ACCEPTED: '#4CAF50',
    DECLINED: '#F44336',
    WITHDRAWN: '#9E9E9E',
    EXPIRED: '#FF5722',
};

function formatDatetime(iso: string | undefined): string {
    if (!iso) return '';
    return new Date(iso).toLocaleDateString(undefined, {
        month: 'short', day: 'numeric', year: 'numeric',
    });
}

const MyApplicationsScreen: React.FC = () => {
    const { t } = useTranslation();
    const { theme } = useAppStyles();
    const styles = themeStyles;
    const navigation = useNavigation<NavProp>();

    const { applications, isLoading, error, refetch, isWithdrawing, handleWithdraw } = useMyApplications();

    const renderApplication = useCallback(({ item }: { item: SoloQuestApplication }) => {
        const statusColor = STATUS_COLORS[item.status] ?? theme.colors.text.secondary;
        const isPending = item.status === 'PENDING';
        const isAccepted = item.status === 'ACCEPTED';

        return (
            <TouchableOpacity
                style={[styles.card, { backgroundColor: theme.colors.background.primary }]}
                activeOpacity={isAccepted ? 0.7 : 1}
                onPress={() => {
                    if (isAccepted) {
                        navigation.navigate('SoloQuestDetail', { questId: item.soloQuestId });
                    }
                }}
            >
                {/* Status badge */}
                <View style={styles.cardHeader}>
                    <View style={styles.questInfo}>
                        {item.questTitle && (
                            <Text style={[styles.questTitle, { color: theme.colors.text.primary }]} numberOfLines={1}>
                                {item.questTitle}
                            </Text>
                        )}
                        {item.questMeetupLocationName && (
                            <View style={styles.metaRow}>
                                <MaterialCommunityIcons name="map-marker-outline" size={13} color={theme.colors.text.secondary} />
                                <Text style={[styles.metaText, { color: theme.colors.text.secondary }]} numberOfLines={1}>
                                    {item.questMeetupLocationName}
                                </Text>
                            </View>
                        )}
                        {item.questMeetupDatetime && (
                            <View style={styles.metaRow}>
                                <MaterialCommunityIcons name="calendar-outline" size={13} color={theme.colors.text.secondary} />
                                <Text style={[styles.metaText, { color: theme.colors.text.secondary }]}>
                                    {formatDatetime(item.questMeetupDatetime)}
                                </Text>
                            </View>
                        )}
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: statusColor + '22' }]}>
                        <Text style={[styles.statusText, { color: statusColor }]}>
                            {t(`soloQuest.applicationStatus.${item.status}`)}
                        </Text>
                    </View>
                </View>

                {/* Pitch snippet */}
                <View style={[styles.pitchBox, { backgroundColor: theme.colors.background.secondary }]}>
                    <Text style={[styles.pitchLabel, { color: theme.colors.text.disabled }]}>
                        {t('myApplications.pitchLabel')}
                    </Text>
                    <Text style={[styles.pitchText, { color: theme.colors.text.primary }]} numberOfLines={3}>
                        {item.pitchMessage}
                    </Text>
                </View>

                {/* Creator counter-message thread */}
                {item.creatorMessage && (
                    <View style={[styles.messageThread, { borderLeftColor: theme.colors.info?.main ?? theme.colors.success.main }]}>
                        <Text style={[styles.messageMeta, { color: theme.colors.text.disabled }]}>
                            {t('myApplications.creatorMessageLabel')}
                        </Text>
                        <Text style={[styles.messageText, { color: theme.colors.text.primary }]}>
                            {item.creatorMessage}
                        </Text>
                        {item.applicantReply && (
                            <>
                                <Text style={[styles.messageMeta, { color: theme.colors.text.disabled, marginTop: 8 }]}>
                                    {t('myApplications.yourReplyLabel')}
                                </Text>
                                <Text style={[styles.messageText, { color: theme.colors.text.primary }]}>
                                    {item.applicantReply}
                                </Text>
                            </>
                        )}
                    </View>
                )}

                {/* Actions row */}
                <View style={styles.actionsRow}>
                    {isAccepted && (
                        <View style={styles.tapHint}>
                            <MaterialCommunityIcons name="arrow-right" size={14} color={theme.colors.success.main} />
                            <Text style={[styles.tapHintText, { color: theme.colors.success.main }]}>
                                {t('myApplications.tapToView')}
                            </Text>
                        </View>
                    )}
                    {isPending && (
                        <TouchableOpacity
                            style={[styles.withdrawButton, { borderColor: theme.colors.error.main }]}
                            onPress={() => handleWithdraw(item.id)}
                            disabled={isWithdrawing}
                        >
                            {isWithdrawing
                                ? <ActivityIndicator size="small" color={theme.colors.error.main} />
                                : <Text style={[styles.withdrawButtonText, { color: theme.colors.error.main }]}>
                                    {t('myApplications.withdrawButton')}
                                </Text>}
                        </TouchableOpacity>
                    )}
                </View>
            </TouchableOpacity>
        );
    }, [theme, t, navigation, handleWithdraw, isWithdrawing]);

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
                <Text style={[styles.headerTitle, { color: theme.colors.text.primary }]}>
                    {t('myApplications.title')}
                </Text>
                <View style={styles.iconButton} />
            </View>

            {isLoading && (
                <View style={styles.centered}>
                    <ActivityIndicator size="large" color={theme.colors.success.main} />
                </View>
            )}

            {error && !isLoading && (
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
            )}

            {!isLoading && !error && (
                <FlatList
                    data={applications}
                    renderItem={renderApplication}
                    keyExtractor={item => String(item.id)}
                    contentContainerStyle={styles.listContent}
                    onRefresh={refetch}
                    refreshing={isLoading}
                    ListEmptyComponent={
                        <View style={styles.emptyState}>
                            <MaterialCommunityIcons name="inbox-outline" size={64} color={theme.colors.text.disabled} />
                            <Text style={[styles.emptyText, { color: theme.colors.text.secondary }]}>
                                {t('myApplications.empty')}
                            </Text>
                        </View>
                    }
                />
            )}
        </SafeAreaView>
    );
};

const themeStyles = createStyles(theme => ({
    container: { flex: 1 },
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
    listContent: {
        padding: theme.spacing.md,
        paddingBottom: theme.spacing['3xl'],
        gap: theme.spacing.sm,
        flexGrow: 1,
    },
    card: {
        borderRadius: theme.layout.borderRadius.md,
        padding: theme.spacing.md,
        ...theme.shadows.small,
    },
    cardHeader: {
        flexDirection: 'row' as const,
        justifyContent: 'space-between' as const,
        alignItems: 'flex-start' as const,
        marginBottom: theme.spacing.sm,
    },
    questInfo: {
        flex: 1,
        marginRight: theme.spacing.sm,
        gap: 3,
    },
    questTitle: {
        ...theme.typography.body.medium,
        fontWeight: theme.typography.fontWeight.bold,
    },
    metaRow: {
        flexDirection: 'row' as const,
        alignItems: 'center' as const,
        gap: 4,
    },
    metaText: {
        flex: 1,
        ...theme.typography.caption,
    },
    statusBadge: {
        paddingHorizontal: theme.spacing.sm,
        paddingVertical: 3,
        borderRadius: theme.layout.borderRadius.xl,
        alignSelf: 'flex-start' as const,
    },
    statusText: {
        ...theme.typography.caption,
        fontWeight: theme.typography.fontWeight.bold,
    },
    pitchBox: {
        borderRadius: theme.layout.borderRadius.sm,
        padding: theme.spacing.sm,
        marginBottom: theme.spacing.sm,
    },
    pitchLabel: {
        ...theme.typography.caption,
        marginBottom: 4,
    },
    pitchText: {
        ...theme.typography.body.small,
        lineHeight: 18,
    },
    messageThread: {
        borderLeftWidth: 3,
        paddingLeft: theme.spacing.sm,
        marginBottom: theme.spacing.sm,
    },
    messageMeta: {
        ...theme.typography.caption,
        marginBottom: 2,
    },
    messageText: {
        ...theme.typography.body.small,
    },
    actionsRow: {
        flexDirection: 'row' as const,
        justifyContent: 'flex-end' as const,
        alignItems: 'center' as const,
        marginTop: theme.spacing.xs,
    },
    tapHint: {
        flexDirection: 'row' as const,
        alignItems: 'center' as const,
        gap: 4,
    },
    tapHintText: {
        ...theme.typography.caption,
        fontWeight: theme.typography.fontWeight.medium,
    },
    withdrawButton: {
        paddingHorizontal: theme.spacing.md,
        paddingVertical: theme.spacing.xs,
        borderRadius: theme.layout.borderRadius.sm,
        borderWidth: 1,
        alignItems: 'center' as const,
        justifyContent: 'center' as const,
    },
    withdrawButtonText: {
        ...theme.typography.body.small,
        fontWeight: theme.typography.fontWeight.semibold,
    },
    emptyState: {
        flex: 1,
        alignItems: 'center' as const,
        justifyContent: 'center' as const,
        paddingVertical: theme.spacing['3xl'],
        gap: theme.spacing.sm,
    },
    emptyText: {
        ...theme.typography.body.medium,
        textAlign: 'center' as const,
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
}));

export default MyApplicationsScreen;
