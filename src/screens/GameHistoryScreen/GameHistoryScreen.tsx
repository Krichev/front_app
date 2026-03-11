import * as React from 'react';
import { useCallback } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    FlatList,
    TextInput,
    ScrollView,
    ActivityIndicator,
    RefreshControl,
    SafeAreaView,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

import { useAppStyles } from '../../shared/ui/hooks/useAppStyles';
import { createStyles } from '../../shared/ui/theme';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { useGameHistory } from './lib/useGameHistory';
import type { StatusFilter, DifficultyFilter, GameModeFilter } from './lib/useGameHistory';
import { QuizSession } from '../../entities/QuizState/model/slice/quizApi';
import { FormatterService } from '../../services/verification/FormatterService';

const GameHistoryScreen = () => {
    const { t } = useTranslation();
    const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
    const { theme } = useAppStyles();
    const styles = themeStyles;

    const {
        sessions,
        isLoading,
        isError,
        isFetching,
        searchQuery,
        handleSearchChange,
        clearSearch,
        statusFilter,
        setStatusFilter,
        difficultyFilter,
        setDifficultyFilter,
        gameModeFilter,
        setGameModeFilter,
        hasActiveFilters,
        clearAllFilters,
        refetch,
        filteredCount,
    } = useGameHistory();

    const handleSessionPress = useCallback((session: QuizSession) => {
        if (session.status === 'COMPLETED') {
            navigation.navigate('WWWGameResults', {
                teamName: session.teamName,
                score: session.correctAnswers,
                totalRounds: session.totalRounds,
                roundsData: [], // We don't have this in the session list, user can view full results if API supports it or we just show summary
                sessionId: session.id,
                challengeId: session.challengeId,
            });
        } else if (session.status === 'PAUSED' || session.status === 'IN_PROGRESS') {
            navigation.navigate('WWWGamePlay', {
                sessionId: session.id,
                challengeId: session.challengeId,
            });
        }
    }, [navigation]);

    const renderFilterChip = <T extends string>(
        label: string,
        value: T,
        currentValue: T,
        onPress: (val: T) => void
    ) => {
        const isActive = value === currentValue;
        return (
            <TouchableOpacity
                key={value}
                style={[styles.chip, isActive && styles.activeChip]}
                onPress={() => onPress(value)}
            >
                <Text style={[styles.chipText, isActive && styles.activeChipText]}>
                    {label}
                </Text>
            </TouchableOpacity>
        );
    };

    const renderSessionItem = ({ item }: { item: QuizSession }) => {
        const difficultyColor = 
            item.difficulty === 'EASY' ? '#4CAF50' : 
            item.difficulty === 'MEDIUM' ? '#FF9800' : 
            '#F44336';

        const statusColor = 
            item.status === 'COMPLETED' ? theme.colors.success.main :
            item.status === 'PAUSED' ? theme.colors.warning.main :
            item.status === 'IN_PROGRESS' ? theme.colors.info.main :
            item.status === 'ABANDONED' || item.status === 'CANCELLED' ? theme.colors.error.main :
            theme.colors.text.disabled;

        const durationMinutes = item.totalDurationSeconds ? Math.floor(item.totalDurationSeconds / 60) : 0;

        return (
            <TouchableOpacity 
                style={styles.card} 
                onPress={() => handleSessionPress(item)}
                activeOpacity={0.7}
            >
                <View style={[styles.difficultyStrip, { backgroundColor: difficultyColor }]} />
                <View style={styles.cardContent}>
                    <View style={styles.cardHeader}>
                        <View style={styles.titleContainer}>
                            <Text style={styles.cardTitle} numberOfLines={1}>
                                {item.challengeTitle || t('common.noResults')}
                            </Text>
                            <Text style={styles.cardSubtitle}>
                                {t('games.gameHistory.card.team', { name: item.teamName })}
                                {item.teamMembers && ` • ${t('games.gameHistory.card.players', { count: item.teamMembers.length })}`}
                            </Text>
                        </View>
                        <View style={styles.scoreContainer}>
                            <Text style={styles.scoreText}>
                                {t('games.gameHistory.card.score', { correct: item.correctAnswers, total: item.totalRounds })}
                            </Text>
                            <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
                                <Text style={styles.statusBadgeText}>
                                    {t(`games.gameHistory.status.${item.status.toLowerCase() as any}`)}
                                </Text>
                            </View>
                        </View>
                    </View>

                    <View style={styles.cardFooter}>
                        <View style={styles.footerInfo}>
                            <MaterialCommunityIcons name="calendar" size={14} color={theme.colors.text.secondary} />
                            <Text style={styles.footerText}>
                                {FormatterService.formatDate(item.createdAt)}
                            </Text>
                        </View>
                        {durationMinutes > 0 && (
                            <View style={styles.footerInfo}>
                                <MaterialCommunityIcons name="clock-outline" size={14} color={theme.colors.text.secondary} />
                                <Text style={styles.footerText}>
                                    {t('games.gameHistory.card.duration', { minutes: durationMinutes })}
                                </Text>
                            </View>
                        )}
                        <View style={styles.footerInfo}>
                            <MaterialCommunityIcons name="controller-classic" size={14} color={theme.colors.text.secondary} />
                            <Text style={styles.footerText}>
                                {t(`games.gameHistory.gameMode.${item.gameMode.toLowerCase() as any}`)}
                            </Text>
                        </View>
                        {item.enableAiHost && (
                            <View style={styles.aiBadge}>
                                <MaterialCommunityIcons name="robot" size={12} color={theme.colors.primary.main} />
                                <Text style={styles.aiBadgeText}>{t('games.gameHistory.card.aiHost')}</Text>
                            </View>
                        )}
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    const renderEmptyState = () => (
        <View style={styles.emptyState}>
            <MaterialCommunityIcons name="gamepad-variant-outline" size={80} color={theme.colors.text.disabled} />
            <Text style={styles.emptyStateTitle}>{t('games.gameHistory.noHistory')}</Text>
            <Text style={styles.emptyStateSubtitle}>{t('games.gameHistory.noHistorySubtext')}</Text>
        </View>
    );

    const renderNoResultsState = () => (
        <View style={styles.emptyState}>
            <MaterialCommunityIcons name="magnify-close" size={80} color={theme.colors.text.disabled} />
            <Text style={styles.emptyStateTitle}>{t('games.gameHistory.noResults')}</Text>
            <Text style={styles.emptyStateSubtitle}>{t('games.gameHistory.noResultsSubtext')}</Text>
            <TouchableOpacity style={styles.clearFiltersButton} onPress={clearAllFilters}>
                <Text style={styles.clearFiltersButtonText}>{t('common.cancel')}</Text>
            </TouchableOpacity>
        </View>
    );

    const renderErrorState = () => (
        <View style={styles.emptyState}>
            <MaterialCommunityIcons name="alert-circle-outline" size={80} color={theme.colors.error.main} />
            <Text style={styles.emptyStateTitle}>{t('games.gameHistory.loadError')}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={refetch}>
                <Text style={styles.retryButtonText}>{t('games.gameHistory.retry')}</Text>
            </TouchableOpacity>
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <MaterialCommunityIcons name="arrow-left" size={24} color={theme.colors.text.primary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{t('games.gameHistory.title')}</Text>
                <View style={{ width: 40 }} />
            </View>

            {/* Search Bar */}
            <View style={styles.searchContainer}>
                <View style={styles.searchBar}>
                    <MaterialCommunityIcons name="magnify" size={20} color={theme.colors.text.secondary} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder={t('games.gameHistory.searchPlaceholder')}
                        value={searchQuery}
                        onChangeText={handleSearchChange}
                        placeholderTextColor={theme.colors.text.disabled}
                    />
                    {searchQuery.length > 0 && (
                        <TouchableOpacity onPress={clearSearch}>
                            <MaterialCommunityIcons name="close-circle" size={20} color={theme.colors.text.secondary} />
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            {/* Filters */}
            <View style={styles.filtersWrapper}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filtersContainer}>
                    <View style={styles.filterGroup}>
                        <Text style={styles.filterLabel}>{t('games.gameHistory.filters.status')}:</Text>
                        {renderFilterChip(t('games.gameHistory.filters.all'), 'ALL', statusFilter, setStatusFilter as any)}
                        {renderFilterChip(t('games.gameHistory.status.completed'), 'COMPLETED', statusFilter, setStatusFilter as any)}
                        {renderFilterChip(t('games.gameHistory.status.inProgress'), 'IN_PROGRESS', statusFilter, setStatusFilter as any)}
                        {renderFilterChip(t('games.gameHistory.status.paused'), 'PAUSED', statusFilter, setStatusFilter as any)}
                        {renderFilterChip(t('games.gameHistory.status.abandoned'), 'ABANDONED', statusFilter, setStatusFilter as any)}
                    </View>
                    <View style={styles.filterDivider} />
                    <View style={styles.filterGroup}>
                        <Text style={styles.filterLabel}>{t('games.gameHistory.filters.difficulty')}:</Text>
                        {renderFilterChip(t('games.gameHistory.filters.all'), 'ALL', difficultyFilter, setDifficultyFilter as any)}
                        {renderFilterChip(t('games.gameHistory.difficulty.easy'), 'EASY', difficultyFilter, setDifficultyFilter as any)}
                        {renderFilterChip(t('games.gameHistory.difficulty.medium'), 'MEDIUM', difficultyFilter, setDifficultyFilter as any)}
                        {renderFilterChip(t('games.gameHistory.difficulty.hard'), 'HARD', difficultyFilter, setDifficultyFilter as any)}
                    </View>
                    <View style={styles.filterDivider} />
                    <View style={styles.filterGroup}>
                        <Text style={styles.filterLabel}>{t('games.gameHistory.filters.gameMode')}:</Text>
                        {renderFilterChip(t('games.gameHistory.filters.all'), 'ALL', gameModeFilter, setGameModeFilter as any)}
                        {renderFilterChip(t('games.gameHistory.gameMode.standard'), 'STANDARD', gameModeFilter, setGameModeFilter as any)}
                        {renderFilterChip(t('games.gameHistory.gameMode.brainRing'), 'BRAIN_RING', gameModeFilter, setGameModeFilter as any)}
                        {renderFilterChip(t('games.gameHistory.gameMode.blitz'), 'BLITZ', gameModeFilter, setGameModeFilter as any)}
                    </View>
                </ScrollView>
            </View>

            {/* Active Filters Indicator */}
            {hasActiveFilters && (
                <View style={styles.activeFiltersRow}>
                    <Text style={styles.resultsCount}>
                        {t('search.foundResults', { count: filteredCount, plural: filteredCount === 1 ? '' : 's', query: searchQuery })}
                    </Text>
                    <TouchableOpacity onPress={clearAllFilters}>
                        <Text style={styles.clearAllText}>{t('common.cancel')}</Text>
                    </TouchableOpacity>
                </View>
            )}

            {/* List */}
            {isLoading && !isFetching ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={theme.colors.primary.main} />
                </View>
            ) : isError ? (
                renderErrorState()
            ) : (
                <FlatList
                    data={sessions}
                    renderItem={renderSessionItem}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.listContainer}
                    ListEmptyComponent={hasActiveFilters ? renderNoResultsState() : renderEmptyState()}
                    refreshControl={
                        <RefreshControl
                            refreshing={isFetching}
                            onRefresh={refetch}
                            colors={[theme.colors.primary.main]}
                        />
                    }
                />
            )}
        </SafeAreaView>
    );
};

const themeStyles = createStyles(theme => ({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background.primary,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.divider,
    },
    backButton: {
        padding: 8,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: theme.colors.text.primary,
    },
    searchContainer: {
        padding: 16,
    },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.background.secondary,
        borderRadius: 12,
        paddingHorizontal: 12,
        height: 48,
    },
    searchInput: {
        flex: 1,
        marginLeft: 8,
        fontSize: 16,
        color: theme.colors.text.primary,
    },
    filtersWrapper: {
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.divider,
    },
    filtersContainer: {
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    filterGroup: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    filterLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: theme.colors.text.secondary,
        marginRight: 8,
    },
    filterDivider: {
        width: 1,
        height: 24,
        backgroundColor: theme.colors.divider,
        marginHorizontal: 16,
    },
    chip: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        backgroundColor: theme.colors.background.secondary,
        marginRight: 8,
        borderWidth: 1,
        borderColor: theme.colors.divider,
    },
    activeChip: {
        backgroundColor: theme.colors.primary.main,
        borderColor: theme.colors.primary.main,
    },
    chipText: {
        fontSize: 12,
        color: theme.colors.text.secondary,
    },
    activeChipText: {
        color: '#FFFFFF',
        fontWeight: 'bold',
    },
    activeFiltersRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 8,
        backgroundColor: theme.colors.background.secondary,
    },
    resultsCount: {
        fontSize: 12,
        color: theme.colors.text.secondary,
    },
    clearAllText: {
        fontSize: 12,
        color: theme.colors.primary.main,
        fontWeight: 'bold',
    },
    listContainer: {
        padding: 16,
        paddingBottom: 32,
        flexGrow: 1,
    },
    card: {
        flexDirection: 'row',
        backgroundColor: theme.colors.background.secondary,
        borderRadius: 12,
        marginBottom: 16,
        overflow: 'hidden',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    difficultyStrip: {
        width: 6,
    },
    cardContent: {
        flex: 1,
        padding: 12,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    titleContainer: {
        flex: 1,
        marginRight: 8,
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: theme.colors.text.primary,
        marginBottom: 4,
    },
    cardSubtitle: {
        fontSize: 13,
        color: theme.colors.text.secondary,
    },
    scoreContainer: {
        alignItems: 'flex-end',
    },
    scoreText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: theme.colors.primary.main,
        marginBottom: 4,
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 4,
    },
    statusBadgeText: {
        fontSize: 10,
        color: '#FFFFFF',
        fontWeight: 'bold',
    },
    cardFooter: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        borderTopWidth: 1,
        borderTopColor: theme.colors.divider,
        paddingTop: 8,
    },
    footerInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: 12,
        marginBottom: 4,
    },
    footerText: {
        fontSize: 12,
        color: theme.colors.text.secondary,
        marginLeft: 4,
    },
    aiBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.primary.main + '15',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
        marginBottom: 4,
    },
    aiBadgeText: {
        fontSize: 10,
        color: theme.colors.primary.main,
        fontWeight: 'bold',
        marginLeft: 4,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 40,
        paddingVertical: 60,
    },
    emptyStateTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: theme.colors.text.primary,
        marginTop: 16,
        textAlign: 'center',
    },
    emptyStateSubtitle: {
        fontSize: 14,
        color: theme.colors.text.secondary,
        marginTop: 8,
        textAlign: 'center',
    },
    clearFiltersButton: {
        marginTop: 24,
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 8,
        backgroundColor: theme.colors.primary.main,
    },
    clearFiltersButtonText: {
        color: '#FFFFFF',
        fontWeight: 'bold',
    },
    retryButton: {
        marginTop: 24,
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: theme.colors.primary.main,
    },
    retryButtonText: {
        color: theme.colors.primary.main,
        fontWeight: 'bold',
    },
}));

export default GameHistoryScreen;
