// src/screens/QuestApplicationsScreen/QuestApplicationsScreen.tsx
import React, { useCallback } from 'react';
import {
    ActivityIndicator,
    FlatList,
    Modal,
    SafeAreaView,
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
import { SoloQuestApplication } from '../../entities/SoloQuestState/model/types';
import { useQuestApplications } from './hooks/useQuestApplications';

type RoutePropType = RouteProp<RootStackParamList, 'QuestApplications'>;
type NavProp = NativeStackNavigationProp<RootStackParamList>;

const APPLICATION_STATUS_COLORS: Record<string, string> = {
    PENDING: '#FF9800',
    ACCEPTED: '#4CAF50',
    DECLINED: '#F44336',
    WITHDRAWN: '#9E9E9E',
    EXPIRED: '#FF5722',
};

const QuestApplicationsScreen: React.FC = () => {
    const { t } = useTranslation();
    const { theme } = useAppStyles();
    const styles = themeStyles;
    const route = useRoute<RoutePropType>();
    const navigation = useNavigation<NavProp>();
    const { questId } = route.params;

    const {
        applications, isLoading, error, refetch,
        activeModal, modalText, setModalText,
        isAccepting, isDeclining, isSending,
        handleAccept, handleDeclineSubmit, handleSendMessage,
        openMessageModal, openDeclineModal, closeModal,
    } = useQuestApplications(questId);

    const renderApplication = useCallback(({ item }: { item: SoloQuestApplication }) => {
        const statusColor = APPLICATION_STATUS_COLORS[item.status] ?? theme.colors.text.secondary;
        const isPending = item.status === 'PENDING';

        return (
            <View style={[styles.card, { backgroundColor: theme.colors.background.primary }]}>
                {/* Header row */}
                <View style={styles.cardHeader}>
                    <View style={styles.applicantInfo}>
                        <Text style={[styles.applicantName, { color: theme.colors.text.primary }]}>
                            {item.applicantUsername}
                        </Text>
                        {item.applicantAge !== undefined && (
                            <Text style={[styles.applicantAge, { color: theme.colors.text.secondary }]}>
                                {t('questApplications.ageLabel', { age: item.applicantAge })}
                            </Text>
                        )}
                        {item.applicantReputationScore !== undefined && (
                            <Text style={[styles.reputationText, { color: theme.colors.warning.main }]}>
                                ★ {item.applicantReputationScore}
                            </Text>
                        )}
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: statusColor + '22' }]}>
                        <Text style={[styles.statusText, { color: statusColor }]}>
                            {t(`soloQuest.applicationStatus.${item.status}`)}
                        </Text>
                    </View>
                </View>

                {/* Interests */}
                {item.applicantInterests && item.applicantInterests.length > 0 && (
                    <View style={styles.tagsRow}>
                        {item.applicantInterests.slice(0, 5).map((tag, i) => (
                            <View key={i} style={[styles.tag, { backgroundColor: theme.colors.success.background }]}>
                                <Text style={[styles.tagText, { color: theme.colors.success.main }]}>{tag}</Text>
                            </View>
                        ))}
                    </View>
                )}

                {/* About me */}
                {item.applicantAboutMe && (
                    <Text style={[styles.aboutMe, { color: theme.colors.text.secondary }]} numberOfLines={2}>
                        {item.applicantAboutMe}
                    </Text>
                )}

                {/* Pitch */}
                <View style={[styles.pitchBox, { backgroundColor: theme.colors.background.secondary }]}>
                    <Text style={[styles.pitchLabel, { color: theme.colors.text.disabled }]}>
                        {t('questApplications.pitchLabel')}
                    </Text>
                    <Text style={[styles.pitchText, { color: theme.colors.text.primary }]}>
                        {item.pitchMessage}
                    </Text>
                </View>

                {/* Counter-message thread */}
                {item.creatorMessage && (
                    <View style={[styles.messageBox, { borderLeftColor: theme.colors.success.main }]}>
                        <Text style={[styles.messageMeta, { color: theme.colors.text.disabled }]}>
                            {t('questApplications.creatorMessageLabel')}
                        </Text>
                        <Text style={[styles.messageText, { color: theme.colors.text.primary }]}>
                            {item.creatorMessage}
                        </Text>
                        {item.applicantReply && (
                            <>
                                <Text style={[styles.messageMeta, { color: theme.colors.text.disabled, marginTop: 8 }]}>
                                    {t('questApplications.applicantReplyLabel')}
                                </Text>
                                <Text style={[styles.messageText, { color: theme.colors.text.primary }]}>
                                    {item.applicantReply}
                                </Text>
                            </>
                        )}
                    </View>
                )}

                {/* Action buttons (PENDING only) */}
                {isPending && (
                    <View style={styles.actions}>
                        <TouchableOpacity
                            style={[styles.msgButton, { borderColor: theme.colors.border.main }]}
                            onPress={() => openMessageModal(item.id)}
                        >
                            <MaterialCommunityIcons name="message-outline" size={16} color={theme.colors.text.primary} />
                            <Text style={[styles.msgButtonText, { color: theme.colors.text.primary }]}>
                                {t('questApplications.messageButton')}
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.declineButton, { borderColor: theme.colors.error.main }]}
                            onPress={() => openDeclineModal(item.id)}
                        >
                            <Text style={[styles.declineButtonText, { color: theme.colors.error.main }]}>
                                {t('questApplications.declineButton')}
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.acceptButton, { backgroundColor: theme.colors.success.main }]}
                            onPress={() => handleAccept(item.id)}
                            disabled={isAccepting}
                        >
                            {isAccepting
                                ? <ActivityIndicator size="small" color={theme.colors.text.inverse} />
                                : <Text style={[styles.acceptButtonText, { color: theme.colors.text.inverse }]}>
                                    {t('questApplications.acceptButton')}
                                </Text>}
                        </TouchableOpacity>
                    </View>
                )}
            </View>
        );
    }, [theme, t, openMessageModal, openDeclineModal, handleAccept, isAccepting]);

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
                    {t('questApplications.title')}
                    {applications && applications.length > 0 ? ` (${applications.length})` : ''}
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
                            <MaterialCommunityIcons name="account-off-outline" size={48} color={theme.colors.text.disabled} />
                            <Text style={[styles.emptyText, { color: theme.colors.text.secondary }]}>
                                {t('questApplications.empty')}
                            </Text>
                        </View>
                    }
                />
            )}

            {/* Message / Decline modal */}
            <Modal
                visible={activeModal !== null}
                transparent
                animationType="slide"
                onRequestClose={closeModal}
            >
                <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={closeModal}>
                    <TouchableOpacity
                        activeOpacity={1}
                        style={[styles.modalSheet, { backgroundColor: theme.colors.background.primary }]}
                    >
                        <Text style={[styles.modalTitle, { color: theme.colors.text.primary }]}>
                            {activeModal?.type === 'message'
                                ? t('questApplications.messageModalTitle')
                                : t('questApplications.declineConfirmTitle')}
                        </Text>
                        <TextInput
                            style={[styles.textInput, {
                                borderColor: theme.colors.border.main,
                                color: theme.colors.text.primary,
                                backgroundColor: theme.colors.background.secondary,
                            }]}
                            value={modalText}
                            onChangeText={setModalText}
                            placeholder={activeModal?.type === 'message'
                                ? t('questApplications.messagePlaceholder')
                                : t('questApplications.declineReasonPlaceholder')}
                            placeholderTextColor={theme.colors.text.disabled}
                            multiline
                            maxLength={500}
                        />
                        <Text style={[styles.charCount, { color: theme.colors.text.disabled }]}>
                            {modalText.length}/500
                        </Text>
                        <TouchableOpacity
                            style={[
                                styles.submitButton,
                                {
                                    backgroundColor: activeModal?.type === 'decline'
                                        ? theme.colors.error.main
                                        : theme.colors.success.main,
                                },
                                (isDeclining || isSending) && { opacity: 0.6 },
                            ]}
                            onPress={activeModal?.type === 'message' ? handleSendMessage : handleDeclineSubmit}
                            disabled={isDeclining || isSending}
                        >
                            {(isDeclining || isSending)
                                ? <ActivityIndicator size="small" color={theme.colors.text.inverse} />
                                : <Text style={[styles.submitButtonText, { color: theme.colors.text.inverse }]}>
                                    {activeModal?.type === 'message'
                                        ? t('questApplications.messageSend')
                                        : t('questApplications.declineSubmit')}
                                </Text>}
                        </TouchableOpacity>
                    </TouchableOpacity>
                </TouchableOpacity>
            </Modal>
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
    applicantInfo: {
        flex: 1,
        gap: 2,
    },
    applicantName: {
        ...theme.typography.body.medium,
        fontWeight: theme.typography.fontWeight.bold,
    },
    applicantAge: {
        ...theme.typography.caption,
    },
    reputationText: {
        ...theme.typography.caption,
        fontWeight: theme.typography.fontWeight.medium,
    },
    statusBadge: {
        paddingHorizontal: theme.spacing.sm,
        paddingVertical: 3,
        borderRadius: theme.layout.borderRadius.xl,
    },
    statusText: {
        ...theme.typography.caption,
        fontWeight: theme.typography.fontWeight.bold,
    },
    tagsRow: {
        flexDirection: 'row' as const,
        flexWrap: 'wrap' as const,
        gap: theme.spacing.xs,
        marginBottom: theme.spacing.sm,
    },
    tag: {
        paddingHorizontal: theme.spacing.sm,
        paddingVertical: 2,
        borderRadius: theme.layout.borderRadius.xl,
    },
    tagText: {
        ...theme.typography.caption,
        fontWeight: theme.typography.fontWeight.medium,
    },
    aboutMe: {
        ...theme.typography.body.small,
        marginBottom: theme.spacing.sm,
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
    messageBox: {
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
    actions: {
        flexDirection: 'row' as const,
        gap: theme.spacing.xs,
        marginTop: theme.spacing.xs,
    },
    msgButton: {
        flexDirection: 'row' as const,
        alignItems: 'center' as const,
        gap: theme.spacing.xs,
        paddingHorizontal: theme.spacing.sm,
        paddingVertical: theme.spacing.xs,
        borderRadius: theme.layout.borderRadius.sm,
        borderWidth: 1,
    },
    msgButtonText: {
        ...theme.typography.body.small,
        fontWeight: theme.typography.fontWeight.medium,
    },
    declineButton: {
        paddingHorizontal: theme.spacing.sm,
        paddingVertical: theme.spacing.xs,
        borderRadius: theme.layout.borderRadius.sm,
        borderWidth: 1,
        alignItems: 'center' as const,
        justifyContent: 'center' as const,
    },
    declineButtonText: {
        ...theme.typography.body.small,
        fontWeight: theme.typography.fontWeight.medium,
    },
    acceptButton: {
        flex: 1,
        paddingVertical: theme.spacing.xs,
        borderRadius: theme.layout.borderRadius.sm,
        alignItems: 'center' as const,
        justifyContent: 'center' as const,
    },
    acceptButtonText: {
        ...theme.typography.body.small,
        fontWeight: theme.typography.fontWeight.bold,
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
    charCount: {
        ...theme.typography.caption,
        textAlign: 'right' as const,
    },
    submitButton: {
        paddingVertical: theme.spacing.md,
        borderRadius: theme.layout.borderRadius.md,
        alignItems: 'center' as const,
    },
    submitButtonText: {
        ...theme.typography.body.medium,
        fontWeight: theme.typography.fontWeight.bold,
    },
}));

export default QuestApplicationsScreen;
