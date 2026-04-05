// src/screens/ReputationDetailScreen/ReputationDetailScreen.tsx
import React, { useCallback, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
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
import { useSelector } from 'react-redux';
import { RootState } from '../../app/providers/StoreProvider/store';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { useAppStyles } from '../../shared/ui/hooks/useAppStyles';
import { createStyles } from '../../shared/ui/theme';
import {
    useGetUserReputationQuery,
    useAppealMarkMutation,
} from '../../entities/SoloQuestState/model/slice/soloQuestApi';
import { ReputationMark } from '../../entities/SoloQuestState/model/types';
import ReputationScoreBadge from '../../entities/SoloQuestState/ui/ReputationScoreBadge';
import ReputationMarkCard from '../../entities/SoloQuestState/ui/ReputationMarkCard';

type RoutePropType = RouteProp<RootStackParamList, 'ReputationDetail'>;
type NavProp = NativeStackNavigationProp<RootStackParamList>;

type FilterType = 'all' | 'positive' | 'negative';

const ReputationDetailScreen: React.FC = () => {
    const { t } = useTranslation();
    const { theme } = useAppStyles();
    const styles = themeStyles;
    const route = useRoute<RoutePropType>();
    const navigation = useNavigation<NavProp>();
    const { user: currentUser } = useSelector((state: RootState) => state.auth);

    const { userId } = route.params;
    const numericId = parseInt(userId, 10);
    const isOwnProfile = String(currentUser?.id) === userId;

    const { data, isLoading, error } = useGetUserReputationQuery(numericId, { skip: !numericId });
    const [appealMark, { isLoading: isAppealing }] = useAppealMarkMutation();

    const [filter, setFilter] = useState<FilterType>('all');
    const [appealingMarkId, setAppealingMarkId] = useState<number | null>(null);
    const [appealReason, setAppealReason] = useState('');

    const filteredMarks: ReputationMark[] = (data?.marks ?? []).filter(m => {
        if (filter === 'positive') {return m.type === 'POSITIVE';}
        if (filter === 'negative') {return m.type === 'NEGATIVE';}
        return true;
    });

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

    const renderMark = useCallback(({ item }: { item: ReputationMark }) => (
        <ReputationMarkCard
            mark={item}
            showAppeal={isOwnProfile}
            onAppeal={handleOpenAppeal}
        />
    ), [isOwnProfile, handleOpenAppeal]);

    const FILTERS: { key: FilterType; label: string }[] = [
        { key: 'all', label: t('soloQuest.reputation.all') },
        { key: 'positive', label: t('soloQuest.reputation.positive') },
        { key: 'negative', label: t('soloQuest.reputation.negative') },
    ];

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background.secondary }]}>
            {/* Header */}
            <View style={[styles.header, { backgroundColor: theme.colors.background.primary }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <MaterialCommunityIcons name="arrow-left" size={24} color={theme.colors.text.primary} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: theme.colors.text.primary }]}>
                    {t('soloQuest.reputation.title')}
                </Text>
                <View style={styles.headerScore}>
                    <ReputationScoreBadge score={data?.reputationScore} size="medium" />
                </View>
            </View>

            {/* Filter tabs */}
            <View style={[styles.filterRow, { backgroundColor: theme.colors.background.primary }]}>
                {FILTERS.map(f => (
                    <TouchableOpacity
                        key={f.key}
                        style={[
                            styles.filterTab,
                            filter === f.key && { borderBottomColor: theme.colors.success.main, borderBottomWidth: 2 },
                        ]}
                        onPress={() => setFilter(f.key)}
                    >
                        <Text style={[
                            styles.filterText,
                            { color: filter === f.key ? theme.colors.success.main : theme.colors.text.secondary },
                        ]}>
                            {f.label}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            {isLoading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color={theme.colors.success.main} />
                </View>
            ) : error ? (
                <View style={styles.center}>
                    <Text style={[styles.emptyText, { color: theme.colors.text.disabled }]}>
                        {t('soloQuest.reputation.noMarks')}
                    </Text>
                </View>
            ) : (
                <FlatList
                    data={filteredMarks}
                    keyExtractor={item => String(item.id)}
                    renderItem={renderMark}
                    contentContainerStyle={styles.list}
                    ListEmptyComponent={
                        <View style={styles.center}>
                            <Text style={[styles.emptyText, { color: theme.colors.text.disabled }]}>
                                {t('soloQuest.reputation.noMarks')}
                            </Text>
                        </View>
                    }
                />
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
        </SafeAreaView>
    );
};

const themeStyles = createStyles(theme => ({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: theme.spacing.md,
        paddingVertical: theme.spacing.sm,
        ...theme.shadows.small,
    },
    backBtn: {
        padding: theme.spacing.xs,
        marginRight: theme.spacing.sm,
    },
    headerTitle: {
        ...theme.typography.body.large,
        fontWeight: theme.typography.fontWeight.bold,
        flex: 1,
    },
    headerScore: {
        marginLeft: theme.spacing.sm,
    },
    filterRow: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: 'transparent',
    },
    filterTab: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: theme.spacing.sm,
    },
    filterText: {
        ...theme.typography.body.small,
        fontWeight: theme.typography.fontWeight.semibold,
    },
    list: {
        padding: theme.spacing.md,
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: theme.spacing.xl,
    },
    emptyText: {
        ...theme.typography.body.medium,
        textAlign: 'center',
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

export default ReputationDetailScreen;
