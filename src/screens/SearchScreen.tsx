import React, { useCallback } from 'react';
import {
    ActivityIndicator,
    SafeAreaView,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAppStyles } from '../shared/ui/hooks/useAppStyles';
import { createStyles } from '../shared/ui/theme/createStyles';
import { useSearchResults } from './hooks/useSearchResults';
import { SearchResultSection } from './components/SearchResultSection';
import { UserSearchCard } from './components/UserSearchCard';
import { ChallengeSearchCard } from './components/ChallengeSearchCard';
import { UserSearchResult } from '../entities/QuizState/model/types/question.types';
import { ApiChallenge } from '../entities/ChallengeState/model/types';

/**
 * SearchScreen component - allows searching for users, quizzes, and challenges
 * Refactored to follow FSD and theme patterns.
 */
const SearchScreen: React.FC = () => {
    const { t } = useTranslation();
    const { theme } = useAppStyles();
    const styles = themeStyles;

    const {
        searchQuery,
        setSearchQuery,
        debouncedQuery,
        isLoading,
        hasResults,
        totalResults,
        users,
        quizResults,
        challengeOnlyResults,
        expandedSections,
        toggleSection,
        recentSearches,
        navigateToUserProfile,
        navigateToChallengeDetails,
    } = useSearchResults();

    const renderUserItem = useCallback((user: UserSearchResult) => (
        <UserSearchCard user={user} onPress={navigateToUserProfile} />
    ), [navigateToUserProfile]);

    const renderQuizItem = useCallback((quiz: ApiChallenge) => (
        <ChallengeSearchCard challenge={quiz} isQuiz onPress={navigateToChallengeDetails} />
    ), [navigateToChallengeDetails]);

    const renderChallengeItem = useCallback((challenge: ApiChallenge) => (
        <ChallengeSearchCard challenge={challenge} isQuiz={false} onPress={navigateToChallengeDetails} />
    ), [navigateToChallengeDetails]);

    return (
        <SafeAreaView style={styles.container}>
            {/* Search Input */}
            <View style={styles.searchContainer}>
                <View style={styles.searchInputWrapper}>
                    <MaterialCommunityIcons name='magnify' size={22} color={theme.colors.text.disabled} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder={t('search.placeholder')}
                        placeholderTextColor={theme.colors.text.disabled}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        autoCapitalize='none'
                        returnKeyType='search'
                    />
                    {searchQuery.length > 0 && (
                        <TouchableOpacity onPress={() => setSearchQuery('')}>
                            <MaterialCommunityIcons name='close-circle' size={20} color={theme.colors.text.disabled} />
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            {/* Results */}
            <ScrollView
                style={styles.resultsContainer}
                showsVerticalScrollIndicator={false}
            >
                {/* Loading State */}
                {isLoading && debouncedQuery.length >= 2 && (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size='large' color={theme.colors.primary.main} />
                        <Text style={styles.loadingText}>{t('search.loading')}</Text>
                    </View>
                )}

                {/* Empty Query State */}
                {debouncedQuery.length < 2 && searchQuery.length === 0 && (
                    <View style={styles.emptyState}>
                        <MaterialCommunityIcons name='magnify' size={64} color={theme.colors.background.tertiary} />
                        <Text style={styles.emptyStateTitle}>{t('search.title')}</Text>
                        <Text style={styles.emptyStateText}>
                            {t('search.subtitle')}
                        </Text>

                        {/* Recent Searches */}
                        {recentSearches.length > 0 && (
                            <View style={styles.recentContainer}>
                                <Text style={styles.recentTitle}>{t('search.recent')}</Text>
                                {recentSearches.map((term, i) => (
                                    <TouchableOpacity
                                        key={i}
                                        style={styles.recentItem}
                                        onPress={() => setSearchQuery(term)}
                                    >
                                        <MaterialCommunityIcons name='history' size={18} color={theme.colors.text.secondary} />
                                        <Text style={styles.recentText}>{term}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        )}
                    </View>
                )}

                {/* Min chars hint */}
                {searchQuery.length > 0 && searchQuery.length < 2 && (
                    <View style={styles.hintContainer}>
                        <Text style={styles.hintText}>{t('search.minChars')}</Text>
                    </View>
                )}

                {/* No Results */}
                {!isLoading && debouncedQuery.length >= 2 && !hasResults && (
                    <View style={styles.emptyState}>
                        <MaterialCommunityIcons name='emoticon-sad-outline' size={64} color={theme.colors.background.tertiary} />
                        <Text style={styles.emptyStateTitle}>{t('search.noResults')}</Text>
                        <Text style={styles.emptyStateText}>
                            {t('search.tryDifferent')}
                        </Text>
                    </View>
                )}

                {/* Results Summary */}
                {!isLoading && hasResults && (
                    <View style={styles.summaryContainer}>
                        <Text style={styles.summaryText}>
                            {t('search.foundResults', { count: totalResults, plural: totalResults !== 1 ? 's' : '', query: debouncedQuery })}
                        </Text>
                    </View>
                )}

                {/* Sections */}
                {!isLoading && (
                    <>
                        <SearchResultSection
                            title={t('search.users')}
                            icon='account-group'
                            items={users}
                            sectionKey='users'
                            isExpanded={expandedSections.users}
                            onToggle={() => toggleSection('users')}
                            renderItem={renderUserItem}
                        />
                        <SearchResultSection
                            title={t('search.quizzes')}
                            icon='brain'
                            items={quizResults}
                            sectionKey='quizzes'
                            isExpanded={expandedSections.quizzes}
                            onToggle={() => toggleSection('quizzes')}
                            renderItem={renderQuizItem}
                        />
                        <SearchResultSection
                            title={t('search.challenges')}
                            icon='trophy'
                            items={challengeOnlyResults}
                            sectionKey='challenges'
                            isExpanded={expandedSections.challenges}
                            onToggle={() => toggleSection('challenges')}
                            renderItem={renderChallengeItem}
                        />
                    </>
                )}

                <View style={{ height: theme.spacing['4xl'] }} />
            </ScrollView>
        </SafeAreaView>
    );
};

const themeStyles = createStyles(theme => ({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background.secondary,
    },
    searchContainer: {
        padding: theme.spacing.lg,
        backgroundColor: theme.colors.background.primary,
        borderBottomWidth: theme.layout.borderWidth.thin,
        borderBottomColor: theme.colors.background.tertiary,
    },
    searchInputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.background.secondary,
        borderRadius: theme.layout.borderRadius.lg,
        paddingHorizontal: theme.spacing.md,
        paddingVertical: theme.spacing.md,
    },
    searchInput: {
        flex: 1,
        marginLeft: theme.spacing.md,
        fontSize: theme.typography.fontSize.base,
        color: theme.colors.text.primary,
    },
    resultsContainer: {
        flex: 1,
    },
    loadingContainer: {
        padding: theme.spacing['4xl'],
        alignItems: 'center',
    },
    loadingText: {
        marginTop: theme.spacing.md,
        color: theme.colors.text.secondary,
        fontSize: theme.typography.fontSize.sm,
    },
    emptyState: {
        padding: theme.spacing['4xl'],
        alignItems: 'center',
    },
    emptyStateTitle: {
        fontSize: theme.typography.fontSize.lg,
        fontWeight: theme.typography.fontWeight.semibold,
        color: theme.colors.text.primary,
        marginTop: theme.spacing.lg,
    },
    emptyStateText: {
        fontSize: theme.typography.fontSize.sm,
        color: theme.colors.text.secondary,
        marginTop: theme.spacing.sm,
        textAlign: 'center',
    },
    hintContainer: {
        padding: theme.spacing.xl,
        alignItems: 'center',
    },
    hintText: {
        color: theme.colors.text.secondary,
        fontSize: theme.typography.fontSize.sm,
    },
    summaryContainer: {
        paddingHorizontal: theme.spacing.lg,
        paddingVertical: theme.spacing.md,
    },
    summaryText: {
        color: theme.colors.text.secondary,
        fontSize: theme.typography.fontSize.xs,
    },
    recentContainer: {
        width: '100%',
        marginTop: theme.spacing['2xl'],
        paddingHorizontal: theme.spacing.lg,
    },
    recentTitle: {
        fontSize: theme.typography.fontSize.sm,
        fontWeight: theme.typography.fontWeight.semibold,
        color: theme.colors.text.secondary,
        marginBottom: theme.spacing.md,
    },
    recentItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: theme.spacing.md,
        borderBottomWidth: theme.layout.borderWidth.thin,
        borderBottomColor: theme.colors.background.tertiary,
    },
    recentText: {
        marginLeft: theme.spacing.md,
        fontSize: theme.typography.fontSize.base,
        color: theme.colors.text.primary,
    },
}));

export default SearchScreen;
