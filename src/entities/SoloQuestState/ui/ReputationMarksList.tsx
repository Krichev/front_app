// src/entities/SoloQuestState/ui/ReputationMarksList.tsx
import React, { useCallback, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Modal,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useAppStyles } from '../../../shared/ui/hooks/useAppStyles';
import { createStyles } from '../../../shared/ui/theme';
import {
    useGetUserReputationQuery,
    useAppealMarkMutation,
} from '../model/slice/soloQuestApi';
import ReputationScoreBadge from './ReputationScoreBadge';
import ReputationMarkCard from './ReputationMarkCard';

interface ReputationMarksListProps {
    userId: number | string;
    isOwnProfile: boolean;
}

const ReputationMarksList: React.FC<ReputationMarksListProps> = ({ userId, isOwnProfile }) => {
    const { t } = useTranslation();
    const { theme } = useAppStyles();
    const styles = themeStyles;

    const numericId = typeof userId === 'string' ? parseInt(userId, 10) : userId;

    const { data, isLoading, error } = useGetUserReputationQuery(numericId, { skip: !numericId });
    const [appealMark, { isLoading: isAppealing }] = useAppealMarkMutation();

    const [appealingMarkId, setAppealingMarkId] = useState<number | null>(null);
    const [appealReason, setAppealReason] = useState('');

    const handleOpenAppeal = useCallback((markId: number) => {
        setAppealingMarkId(markId);
        setAppealReason('');
    }, []);

    const handleCloseAppeal = useCallback(() => {
        setAppealingMarkId(null);
        setAppealReason('');
    }, []);

    const handleSubmitAppeal = useCallback(async () => {
        if (!appealingMarkId || !appealReason.trim()) {return;}
        try {
            await appealMark({ userId: numericId, body: { markId: appealingMarkId, reason: appealReason.trim() } }).unwrap();
            Alert.alert('', t('soloQuest.reputation.appealSuccess'));
            handleCloseAppeal();
        } catch {
            Alert.alert('', t('soloQuest.reputation.appealError'));
        }
    }, [appealingMarkId, appealReason, appealMark, numericId, t, handleCloseAppeal]);

    if (isLoading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="small" color={theme.colors.success.main} />
            </View>
        );
    }

    if (error || !data) {
        return (
            <View style={styles.center}>
                <Text style={[styles.emptyText, { color: theme.colors.text.disabled }]}>
                    {t('soloQuest.reputation.noMarks')}
                </Text>
            </View>
        );
    }

    return (
        <View>
            {/* Score */}
            <View style={styles.scoreRow}>
                <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>
                    {t('soloQuest.reputation.title')}
                </Text>
                <ReputationScoreBadge score={data.reputationScore} size="medium" />
            </View>

            {/* Marks */}
            {data.marks.length === 0 ? (
                <Text style={[styles.emptyText, { color: theme.colors.text.disabled }]}>
                    {t('soloQuest.reputation.noMarks')}
                </Text>
            ) : (
                data.marks.map(mark => (
                    <ReputationMarkCard
                        key={mark.id}
                        mark={mark}
                        showAppeal={isOwnProfile}
                        onAppeal={handleOpenAppeal}
                    />
                ))
            )}

            {/* Appeal Modal */}
            <Modal visible={appealingMarkId !== null} transparent animationType="fade" onRequestClose={handleCloseAppeal}>
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalCard, { backgroundColor: theme.colors.background.primary }]}>
                        <Text style={[styles.modalTitle, { color: theme.colors.text.primary }]}>
                            {t('soloQuest.reputation.appealButton')}
                        </Text>
                        <Text style={[styles.modalLabel, { color: theme.colors.text.secondary }]}>
                            {t('soloQuest.reputation.appealReasonLabel')}
                        </Text>
                        <TextInput
                            style={[styles.textInput, { color: theme.colors.text.primary, borderColor: theme.colors.background.tertiary }]}
                            placeholder={t('soloQuest.reputation.appealReasonPlaceholder')}
                            placeholderTextColor={theme.colors.text.disabled}
                            multiline
                            numberOfLines={4}
                            value={appealReason}
                            onChangeText={setAppealReason}
                        />
                        <View style={styles.modalButtons}>
                            <TouchableOpacity
                                style={[styles.modalBtn, { backgroundColor: theme.colors.background.secondary }]}
                                onPress={handleCloseAppeal}
                            >
                                <Text style={[styles.modalBtnText, { color: theme.colors.text.secondary }]}>
                                    {t('common.cancel')}
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.modalBtn, { backgroundColor: theme.colors.success.main }]}
                                onPress={handleSubmitAppeal}
                                disabled={isAppealing || !appealReason.trim()}
                            >
                                {isAppealing ? (
                                    <ActivityIndicator size="small" color={theme.colors.text.inverse} />
                                ) : (
                                    <Text style={[styles.modalBtnText, { color: theme.colors.text.inverse }]}>
                                        {t('common.submit')}
                                    </Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

const themeStyles = createStyles(theme => ({
    center: {
        alignItems: 'center',
        padding: theme.spacing.md,
    },
    scoreRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: theme.spacing.sm,
    },
    sectionTitle: {
        ...theme.typography.body.medium,
        fontWeight: theme.typography.fontWeight.bold,
    },
    emptyText: {
        ...theme.typography.body.small,
        textAlign: 'center',
        padding: theme.spacing.sm,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: theme.spacing.xl,
    },
    modalCard: {
        width: '100%',
        borderRadius: theme.layout.borderRadius.lg,
        padding: theme.spacing.xl,
        ...theme.shadows.medium,
    },
    modalTitle: {
        ...theme.typography.body.large,
        fontWeight: theme.typography.fontWeight.bold,
        marginBottom: theme.spacing.md,
    },
    modalLabel: {
        ...theme.typography.caption,
        marginBottom: theme.spacing.xs,
    },
    textInput: {
        borderWidth: 1,
        borderRadius: theme.layout.borderRadius.sm,
        padding: theme.spacing.sm,
        ...theme.typography.body.small,
        minHeight: 80,
        textAlignVertical: 'top',
        marginBottom: theme.spacing.md,
    },
    modalButtons: {
        flexDirection: 'row',
        gap: theme.spacing.sm,
    },
    modalBtn: {
        flex: 1,
        paddingVertical: theme.spacing.sm,
        borderRadius: theme.layout.borderRadius.sm,
        alignItems: 'center',
    },
    modalBtnText: {
        ...theme.typography.body.small,
        fontWeight: theme.typography.fontWeight.semibold,
    },
}));

export default ReputationMarksList;
