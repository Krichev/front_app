// src/screens/SoloQuestFeedScreen.tsx
import React, { useCallback, useRef, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    Modal,
    SafeAreaView,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useGetSoloQuestFeedQuery } from '../entities/SoloQuestState/model/slice/soloQuestApi';
import { SoloQuestDetails } from '../entities/SoloQuestState/model/types';
import SoloQuestCard from '../entities/SoloQuestState/ui/SoloQuestCard';
import { useLocationPermission } from '../shared/hooks/useLocationPermission';
import { useAppStyles } from '../shared/ui/hooks/useAppStyles';
import { createStyles } from '../shared/ui/theme';
import InterestTagInput from '../shared/ui/InterestTagInput/InterestTagInput';

type SoloQuestFeedNavProp = NativeStackNavigationProp<RootStackParamList, 'SoloQuestFeed'>;

const PAGE_SIZE = 20;
const DEFAULT_MAX_DISTANCE = 10;

const SoloQuestFeedScreen: React.FC = () => {
    const { t } = useTranslation();
    const { theme } = useAppStyles();
    const styles = themeStyles;
    const navigation = useNavigation<SoloQuestFeedNavProp>();

    // Location
    const { latitude, longitude, city, loading: locationLoading, error: locationError, refresh: refreshLocation } =
        useLocationPermission();

    // Pagination
    const [page, setPage] = useState(0);
    const allQuestsRef = useRef<SoloQuestDetails[]>([]);

    // Filters
    const [showFilterModal, setShowFilterModal] = useState(false);
    const [maxDistanceKm, setMaxDistanceKm] = useState(DEFAULT_MAX_DISTANCE);
    const [pendingMaxDistance, setPendingMaxDistance] = useState(DEFAULT_MAX_DISTANCE);
    const [interestFilter, setInterestFilter] = useState<string[]>([]);
    const [pendingInterests, setPendingInterests] = useState<string[]>([]);

    const locationReady = latitude !== null && longitude !== null;

    const { data: feedData, isLoading, isFetching, error, refetch } = useGetSoloQuestFeedQuery(
        {
            page,
            size: PAGE_SIZE,
            latitude: latitude ?? undefined,
            longitude: longitude ?? undefined,
            maxDistanceKm: locationReady ? maxDistanceKm : undefined,
            interests: interestFilter.length > 0 ? interestFilter : undefined,
        },
        { skip: locationLoading }
    );

    // Accumulate pages
    if (feedData) {
        if (page === 0) {
            allQuestsRef.current = feedData;
        } else {
            const ids = new Set(allQuestsRef.current.map(q => q.id));
            const newItems = feedData.filter(q => !ids.has(q.id));
            if (newItems.length > 0) {
                allQuestsRef.current = [...allQuestsRef.current, ...newItems];
            }
        }
    }

    const quests = allQuestsRef.current;
    const hasMore = feedData ? feedData.length === PAGE_SIZE : false;

    const handleRefresh = useCallback(() => {
        allQuestsRef.current = [];
        setPage(0);
        refreshLocation();
        if (page === 0) refetch();
    }, [page, refetch, refreshLocation]);

    const handleEndReached = useCallback(() => {
        if (!isFetching && hasMore) {
            setPage(p => p + 1);
        }
    }, [isFetching, hasMore]);

    const handleCardPress = useCallback((questId: number) => {
        navigation.navigate('SoloQuestDetail', { questId });
    }, [navigation]);

    const handleApplyFilters = useCallback(() => {
        allQuestsRef.current = [];
        setPage(0);
        setMaxDistanceKm(pendingMaxDistance);
        setInterestFilter(pendingInterests);
        setShowFilterModal(false);
    }, [pendingMaxDistance, pendingInterests]);

    const handleResetFilters = useCallback(() => {
        setPendingMaxDistance(DEFAULT_MAX_DISTANCE);
        setPendingInterests([]);
    }, []);

    const handleCreateQuest = useCallback(() => {
        navigation.navigate('CreateSoloQuest');
    }, [navigation]);

    const renderCard = useCallback(({ item }: { item: SoloQuestDetails }) => (
        <SoloQuestCard quest={item} onPress={handleCardPress} />
    ), [handleCardPress]);

    const renderEmpty = () => {
        if (isLoading || locationLoading) return null;
        return (
            <View style={styles.emptyState}>
                <MaterialCommunityIcons name="account-search-outline" size={64} color={theme.colors.text.disabled} />
                <Text style={[styles.emptyTitle, { color: theme.colors.text.primary }]}>
                    {t('soloQuestFeed.emptyTitle')}
                </Text>
                <Text style={[styles.emptyDescription, { color: theme.colors.text.secondary }]}>
                    {t('soloQuestFeed.emptyDescription')}
                </Text>
                <TouchableOpacity
                    style={[styles.ctaButton, { backgroundColor: theme.colors.success.main }]}
                    onPress={() => navigation.navigate('CreateWWWQuest')}
                >
                    <Text style={[styles.ctaButtonText, { color: theme.colors.text.inverse }]}>
                        {t('soloQuestFeed.createQuestButton')}
                    </Text>
                </TouchableOpacity>
            </View>
        );
    };

    const renderFooter = () => {
        if (!isFetching || page === 0) return null;
        return (
            <View style={styles.footerLoader}>
                <ActivityIndicator size="small" color={theme.colors.success.main} />
                <Text style={[styles.footerText, { color: theme.colors.text.secondary }]}>
                    {t('soloQuestFeed.loadingMore')}
                </Text>
            </View>
        );
    };

    // Distance step buttons
    const DISTANCE_OPTIONS = [5, 10, 20, 30, 50];

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background.secondary }]}>
            {/* Header */}
            <View style={[styles.header, { backgroundColor: theme.colors.background.primary, borderBottomColor: theme.colors.border.light }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconButton}>
                    <MaterialCommunityIcons name="arrow-left" size={24} color={theme.colors.text.primary} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: theme.colors.text.primary }]}>
                    {t('soloQuestFeed.title')}
                </Text>
                <TouchableOpacity onPress={() => { setPendingMaxDistance(maxDistanceKm); setPendingInterests(interestFilter); setShowFilterModal(true); }} style={styles.iconButton}>
                    <MaterialCommunityIcons
                        name="filter-variant"
                        size={24}
                        color={interestFilter.length > 0 || maxDistanceKm !== DEFAULT_MAX_DISTANCE ? theme.colors.success.main : theme.colors.text.primary}
                    />
                </TouchableOpacity>
            </View>

            {/* Location bar */}
            <View style={[styles.locationBar, { backgroundColor: theme.colors.background.primary, borderBottomColor: theme.colors.border.light }]}>
                <MaterialCommunityIcons name="map-marker" size={16} color={theme.colors.text.secondary} />
                <Text style={[styles.locationText, { color: theme.colors.text.secondary }]} numberOfLines={1}>
                    {locationLoading
                        ? '...'
                        : city
                        ? t('soloQuestFeed.locationLabel', { city })
                        : t('soloQuestFeed.locationUnknown')}
                </Text>
                <TouchableOpacity onPress={handleRefresh} style={styles.refreshButton}>
                    <Text style={[styles.refreshText, { color: theme.colors.success.main }]}>
                        {t('soloQuestFeed.refreshLocation')}
                    </Text>
                </TouchableOpacity>
            </View>

            {/* Location permission banner */}
            {locationError === 'permission_denied' && (
                <View style={[styles.banner, { backgroundColor: theme.colors.warning.background }]}>
                    <MaterialCommunityIcons name="map-marker-off" size={16} color={theme.colors.warning.main} />
                    <Text style={[styles.bannerText, { color: theme.colors.warning.main }]}>
                        {t('soloQuestFeed.locationBanner')}
                    </Text>
                </View>
            )}

            {/* Error state */}
            {error && !isLoading && (
                <View style={styles.errorState}>
                    <MaterialCommunityIcons name="alert-circle-outline" size={48} color={theme.colors.error.main} />
                    <Text style={[styles.errorText, { color: theme.colors.error.main }]}>
                        {t('soloQuestFeed.errorTitle')}
                    </Text>
                    <TouchableOpacity
                        style={[styles.retryButton, { backgroundColor: theme.colors.success.main }]}
                        onPress={() => refetch()}
                    >
                        <Text style={[styles.retryText, { color: theme.colors.text.inverse }]}>
                            {t('soloQuestFeed.retry')}
                        </Text>
                    </TouchableOpacity>
                </View>
            )}

            {/* Loading skeleton */}
            {(isLoading || (locationLoading && !error)) && !isFetching && (
                <View style={styles.centered}>
                    <ActivityIndicator size="large" color={theme.colors.success.main} />
                </View>
            )}

            {/* Feed */}
            {!error && (
                <FlatList
                    data={quests}
                    renderItem={renderCard}
                    keyExtractor={(item) => String(item.id)}
                    contentContainerStyle={styles.listContent}
                    onRefresh={handleRefresh}
                    refreshing={isFetching && page === 0}
                    onEndReached={handleEndReached}
                    onEndReachedThreshold={0.3}
                    ListEmptyComponent={renderEmpty}
                    ListFooterComponent={renderFooter}
                    showsVerticalScrollIndicator={false}
                />
            )}

            {/* FAB: Create Solo Quest */}
            <TouchableOpacity
                style={[styles.fab, { backgroundColor: theme.colors.success.main }]}
                onPress={handleCreateQuest}
                activeOpacity={0.85}
            >
                <MaterialCommunityIcons name="plus" size={28} color={theme.colors.text.inverse} />
            </TouchableOpacity>

            {/* Filter Modal */}
            <Modal
                visible={showFilterModal}
                transparent
                animationType="slide"
                onRequestClose={() => setShowFilterModal(false)}
            >
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => setShowFilterModal(false)}
                >
                    <TouchableOpacity
                        activeOpacity={1}
                        style={[styles.filterSheet, { backgroundColor: theme.colors.background.primary }]}
                    >
                        <Text style={[styles.filterTitle, { color: theme.colors.text.primary }]}>
                            {t('soloQuestFeed.filterTitle')}
                        </Text>

                        {/* Max distance */}
                        <Text style={[styles.filterLabel, { color: theme.colors.text.secondary }]}>
                            {t('soloQuestFeed.maxDistanceLabel')}: {pendingMaxDistance} {t('soloQuestFeed.distanceUnit')}
                        </Text>
                        <View style={styles.distanceOptions}>
                            {DISTANCE_OPTIONS.map(d => (
                                <TouchableOpacity
                                    key={d}
                                    style={[
                                        styles.distanceOption,
                                        { borderColor: theme.colors.border.main },
                                        pendingMaxDistance === d && { backgroundColor: theme.colors.success.main, borderColor: theme.colors.success.main },
                                    ]}
                                    onPress={() => setPendingMaxDistance(d)}
                                >
                                    <Text style={[
                                        styles.distanceOptionText,
                                        { color: theme.colors.text.primary },
                                        pendingMaxDistance === d && { color: theme.colors.text.inverse },
                                    ]}>
                                        {d} {t('soloQuestFeed.distanceUnit')}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        {/* Interests filter */}
                        <Text style={[styles.filterLabel, { color: theme.colors.text.secondary }]}>
                            {t('soloQuestFeed.interestsFilterLabel')}
                        </Text>
                        <InterestTagInput
                            tags={pendingInterests}
                            onTagsChange={setPendingInterests}
                            maxTags={10}
                            placeholder={t('editProfileDetails.interestsPlaceholder')}
                        />

                        {/* Actions */}
                        <View style={styles.filterActions}>
                            <TouchableOpacity
                                style={[styles.filterButton, { borderColor: theme.colors.border.main, borderWidth: 1 }]}
                                onPress={handleResetFilters}
                            >
                                <Text style={[styles.filterButtonText, { color: theme.colors.text.primary }]}>
                                    {t('soloQuestFeed.resetFilter')}
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.filterButton, { backgroundColor: theme.colors.success.main }]}
                                onPress={handleApplyFilters}
                            >
                                <Text style={[styles.filterButtonText, { color: theme.colors.text.inverse }]}>
                                    {t('soloQuestFeed.applyFilter')}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </TouchableOpacity>
                </TouchableOpacity>
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
        justifyContent: 'space-between',
        paddingHorizontal: theme.spacing.sm,
        paddingVertical: theme.spacing.sm,
        borderBottomWidth: 1,
    },
    iconButton: {
        width: 44,
        height: 44,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        ...theme.typography.heading.h6,
        fontWeight: theme.typography.fontWeight.bold,
    },
    locationBar: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: theme.spacing.md,
        paddingVertical: theme.spacing.xs,
        borderBottomWidth: 1,
        gap: theme.spacing.xs,
    },
    locationText: {
        flex: 1,
        ...theme.typography.body.small,
    },
    refreshButton: {
        paddingHorizontal: theme.spacing.xs,
        paddingVertical: theme.spacing.xs,
    },
    refreshText: {
        ...theme.typography.caption,
        fontWeight: theme.typography.fontWeight.semibold,
    },
    banner: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: theme.spacing.md,
        paddingVertical: theme.spacing.sm,
        gap: theme.spacing.xs,
    },
    bannerText: {
        flex: 1,
        ...theme.typography.caption,
    },
    listContent: {
        padding: theme.spacing.md,
        paddingBottom: theme.spacing['3xl'],
        flexGrow: 1,
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyState: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: theme.spacing.xl,
        paddingTop: theme.spacing['3xl'],
        gap: theme.spacing.sm,
    },
    emptyTitle: {
        ...theme.typography.heading.h6,
        fontWeight: theme.typography.fontWeight.bold,
        textAlign: 'center',
    },
    emptyDescription: {
        ...theme.typography.body.medium,
        textAlign: 'center',
    },
    ctaButton: {
        paddingHorizontal: theme.spacing.xl,
        paddingVertical: theme.spacing.sm,
        borderRadius: theme.layout.borderRadius.xl,
        marginTop: theme.spacing.sm,
    },
    ctaButtonText: {
        ...theme.typography.body.medium,
        fontWeight: theme.typography.fontWeight.bold,
    },
    errorState: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: theme.spacing.xl,
        gap: theme.spacing.sm,
    },
    errorText: {
        ...theme.typography.body.large,
        textAlign: 'center',
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
    footerLoader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: theme.spacing.md,
        gap: theme.spacing.xs,
    },
    footerText: {
        ...theme.typography.body.small,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    filterSheet: {
        borderTopLeftRadius: theme.layout.borderRadius.xl,
        borderTopRightRadius: theme.layout.borderRadius.xl,
        padding: theme.spacing.xl,
        paddingBottom: theme.spacing['3xl'],
        ...theme.shadows.large,
    },
    filterTitle: {
        ...theme.typography.heading.h6,
        fontWeight: theme.typography.fontWeight.bold,
        marginBottom: theme.spacing.lg,
    },
    filterLabel: {
        ...theme.typography.body.small,
        fontWeight: theme.typography.fontWeight.medium,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: theme.spacing.sm,
        marginTop: theme.spacing.md,
    },
    distanceOptions: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: theme.spacing.xs,
    },
    distanceOption: {
        paddingHorizontal: theme.spacing.md,
        paddingVertical: theme.spacing.xs,
        borderRadius: theme.layout.borderRadius.xl,
        borderWidth: 1,
    },
    distanceOptionText: {
        ...theme.typography.body.small,
        fontWeight: theme.typography.fontWeight.medium,
    },
    filterActions: {
        flexDirection: 'row',
        gap: theme.spacing.sm,
        marginTop: theme.spacing.xl,
    },
    filterButton: {
        flex: 1,
        paddingVertical: theme.spacing.md,
        borderRadius: theme.layout.borderRadius.md,
        alignItems: 'center',
    },
    filterButtonText: {
        ...theme.typography.body.medium,
        fontWeight: theme.typography.fontWeight.bold,
    },
    fab: {
        position: 'absolute',
        right: theme.spacing.lg,
        bottom: theme.spacing.xl,
        width: 56,
        height: 56,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
        ...theme.shadows.large,
    },
}));

export default SoloQuestFeedScreen;
