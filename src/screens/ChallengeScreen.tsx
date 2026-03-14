// src/screens/ChallengeScreen.tsx - COMPLETE FINAL VERSION
import React, {useMemo, useState} from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    SafeAreaView,
    ScrollView,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import {RouteProp, useNavigation, useRoute} from '@react-navigation/native';
import {useTranslation} from 'react-i18next';
import {NativeStackNavigationProp} from "@react-navigation/native-stack";
import {useGetChallengesQuery, useGetCompletedChallengesQuery} from "../entities/ChallengeState/model/slice/challengeApi";
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import ChallengeFilters from './components/ChallengeFilters';
import QuizChallengeCard from '../entities/ChallengeState/ui/QuizChallengeCard';
import {CompletedQuestCard} from '../components/CompletedQuestCard/CompletedQuestCard';
import {useSelector} from 'react-redux';
import {RootState} from '../app/providers/StoreProvider/store';
import { useSafeRefetch } from '../shared/hooks/useSafeRefetch';
import { createStyles } from '../shared/ui/theme';
import { useAppStyles } from '../shared/ui/hooks/useAppStyles';

// Define the types for the navigation parameters
type RootStackParamList = {
    Challenges: { initialFilter?: string };
    ChallengeDetails: { challengeId: string };
    CreateChallenge: undefined;
    CreateWWWQuest: undefined;
};

type MainTabParamList = {
    Challenges: { initialFilter?: string };
};

type ChallengesScreenRouteProp = RouteProp<MainTabParamList, 'Challenges'>;
type ChallengesScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Challenges'>;

type SortOption = 'newest' | 'oldest' | 'titleAZ' | 'titleZA';

const ChallengesScreen: React.FC = () => {
    const { t } = useTranslation();
    const route = useRoute<ChallengesScreenRouteProp>();
    const navigation = useNavigation<ChallengesScreenNavigationProp>();
    const {user} = useSelector((state: RootState) => state.auth);
    const { theme } = useAppStyles();
    const styles = themeStyles;

    // If the screen was navigated to with an initial filter, use it
    const initialFilterType = route.params?.initialFilter || null;
    const [selectedType, setSelectedType] = useState<string | null>(initialFilterType);

    const [showParticipating, setShowParticipating] = useState<boolean>(true);
    const [showCreated, setShowCreated] = useState<boolean>(false);
    const [showCompleted, setShowCompleted] = useState<boolean>(false);
    const [sortBy, setSortBy] = useState<SortOption>('newest');

    // RTK Query call to fetch challenges
    const {
        data: challenges, 
        error, 
        isLoading, 
        refetch: refetchRaw,
        isUninitialized
    } = useGetChallengesQuery({
        page: 0,
        limit: 50,
        type: selectedType === 'WWW_QUIZ' ? 'QUIZ' : selectedType,
        participant_id: showParticipating ? user?.id : undefined,
        creator_id: showCreated ? user?.id : undefined,
    }, { skip: showCompleted });

    // RTK Query call for completed challenges
    const {
        data: completedChallenges,
        isLoading: isCompletedLoading,
        error: completedError,
        refetch: refetchCompletedRaw,
        isUninitialized: isCompletedUninitialized
    } = useGetCompletedChallengesQuery({
        page: 0,
        size: 50,
        type: selectedType === 'WWW_QUIZ' ? 'QUIZ' : selectedType || undefined,
    }, { skip: !showCompleted });

    const refetch = useSafeRefetch(refetchRaw, isUninitialized);
    const refetchCompleted = useSafeRefetch(refetchCompletedRaw, isCompletedUninitialized);

    const filteredChallenges = useMemo(() => {
        if (!challenges) return [];

        const filtered = challenges.filter(challenge => {
            // participants can be string[], string, or null - need to handle all cases
            const participants = Array.isArray(challenge.participants)
                ? challenge.participants
                : typeof challenge.participants === 'string'
                    ? [challenge.participants]
                    : [];

            const isParticipant = participants.includes(user?.id || '');
            const isCreator = challenge.creator_id === user?.id;

            if (showParticipating && !showCreated) {
                return isParticipant && !isCreator;
            }
            if (!showParticipating && showCreated) {
                return isCreator;
            }
            if (showParticipating && showCreated) {
                return isParticipant || isCreator;
            }
            return false;
        });

        // Sort
        return [...filtered].sort((a, b) => {
            switch (sortBy) {
                case 'newest':
                    return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
                case 'oldest':
                    return new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime();
                case 'titleAZ':
                    return (a.title || '').localeCompare(b.title || '');
                case 'titleZA':
                    return (b.title || '').localeCompare(a.title || '');
                default:
                    return 0;
            }
        });
    }, [challenges, showParticipating, showCreated, user?.id, sortBy]);

    const handleToggleFilter = (filter: 'participating' | 'created' | 'completed') => {
        if (filter === 'completed') {
            setShowCompleted(true);
            setShowParticipating(false);
            setShowCreated(false);
        } else {
            setShowCompleted(false);
            if (filter === 'participating') {
                setShowParticipating(!showParticipating || showCreated === false);
                if (showParticipating && !showCreated) {
                    setShowCreated(true);
                    setShowParticipating(false);
                }
            } else {
                setShowCreated(!showCreated || showParticipating === false);
                if (showCreated && !showParticipating) {
                    setShowParticipating(true);
                    setShowCreated(false);
                }
            }
        }
    };

    const displayData = showCompleted ? completedChallenges : filteredChallenges;
    const isDisplayLoading = showCompleted ? isCompletedLoading : isLoading;
    const displayError = showCompleted ? completedError : error;
    const handleRefetch = showCompleted ? refetchCompleted : refetch;

    // Simplified create challenge menu - 2 options
    const handleCreateChallengePress = () => {
        Alert.alert(
            t('challenges.createTitle'),
            t('challenges.createMessage'),
            [
                {
                    text: t('challenges.quizChallenge'),
                    onPress: () => navigation.navigate('CreateWWWQuest')
                },
                {
                    text: t('challenges.standardChallenge'),
                    onPress: () => navigation.navigate('CreateChallenge')
                },
                {
                    text: t('common.cancel'),
                    style: 'cancel'
                }
            ]
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            {/* Screen Header */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>{t('challenges.title')}</Text>

                <TouchableOpacity
                    style={styles.refreshButton}
                    onPress={() => handleRefetch()}
                >
                    <MaterialCommunityIcons name="refresh" size={24} color="white"/>
                </TouchableOpacity>
            </View>

            {/* Challenge Filters */}
            <ChallengeFilters
                selectedType={selectedType}
                onSelectType={setSelectedType}
            />
            <View style={styles.roleFiltersContainer}>
                <Text style={styles.filterLabel}>{t('challenges.filterLabel')}</Text>
                <View style={styles.checkboxRow}>
                    <TouchableOpacity
                        style={styles.checkboxContainer}
                        onPress={() => handleToggleFilter('participating')}
                    >
                        <View style={[styles.checkbox, showParticipating && styles.checkboxChecked]}>
                            {showParticipating && (
                                <MaterialCommunityIcons name="check" size={16} color="white" />
                            )}
                        </View>
                        <Text style={styles.checkboxLabel}>{t('challenges.participant')}</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.checkboxContainer}
                        onPress={() => handleToggleFilter('created')}
                    >
                        <View style={[styles.checkbox, showCreated && styles.checkboxChecked]}>
                            {showCreated && (
                                <MaterialCommunityIcons name="check" size={16} color="white" />
                            )}
                        </View>
                        <Text style={styles.checkboxLabel}>{t('challenges.creator')}</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.checkboxContainer}
                        onPress={() => handleToggleFilter('completed')}
                    >
                        <View style={[styles.checkbox, showCompleted && styles.checkboxChecked]}>
                            {showCompleted && (
                                <MaterialCommunityIcons name="check" size={16} color="white" />
                            )}
                        </View>
                        <Text style={styles.checkboxLabel}>{t('challenges.completed')}</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Sort Options */}
            <View style={styles.sortContainer}>
                <Text style={styles.sortLabel}>{t('challenges.sortLabel')}</Text>
                <ScrollView 
                    horizontal 
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.sortChipsContainer}
                >
                    {([
                        { key: 'newest' as SortOption, label: t('challenges.sortNewest'), icon: 'sort-calendar-descending' },
                        { key: 'oldest' as SortOption, label: t('challenges.sortOldest'), icon: 'sort-calendar-ascending' },
                        { key: 'titleAZ' as SortOption, label: t('challenges.sortTitleAZ'), icon: 'sort-alphabetical-ascending' },
                        { key: 'titleZA' as SortOption, label: t('challenges.sortTitleZA'), icon: 'sort-alphabetical-descending' },
                    ] as const).map(option => (
                        <TouchableOpacity
                            key={option.key}
                            style={[
                                styles.sortChip,
                                sortBy === option.key && styles.sortChipActive,
                            ]}
                            onPress={() => setSortBy(option.key)}
                        >
                            <MaterialCommunityIcons
                                name={option.icon as any}
                                size={16}
                                color={sortBy === option.key ? theme.colors.primary.main : theme.colors.text.secondary}
                            />
                            <Text style={[
                                styles.sortChipText,
                                sortBy === option.key && styles.sortChipTextActive,
                            ]}>
                                {option.label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            {/* Main content area */}
            <View style={styles.content}>
                {isDisplayLoading ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color={theme.colors.primary.main}/>
                        <Text style={styles.loadingText}>{t('challenges.loading')}</Text>
                    </View>
                ) : displayError ? (
                    <View style={styles.errorContainer}>
                        <MaterialCommunityIcons name="alert-circle" size={48} color={theme.colors.error.main}/>
                        <Text style={styles.errorText}>{t('challenges.error')}</Text>
                        <TouchableOpacity style={styles.retryButton} onPress={() => handleRefetch()}>
                            <Text style={styles.retryButtonText}>{t('challenges.retry')}</Text>
                        </TouchableOpacity>
                    </View>
                ) : !displayData || displayData.length === 0 ? (
                    <View style={styles.emptyContainer}>
                        <MaterialCommunityIcons 
                            name={showCompleted ? "trophy" : "trophy-outline"} 
                            size={64} 
                            color={theme.colors.text.disabled}
                        />
                        <Text style={styles.emptyText}>
                            {showCompleted ? t('challenges.emptyCompleted') : t('challenges.emptyTitle')}
                        </Text>
                        <Text style={styles.emptySubtext}>
                            {showCompleted 
                                ? t('challenges.emptyCompletedHint')
                                : (showParticipating && !showCreated
                                    ? t('challenges.emptyJoined')
                                    : !showParticipating && showCreated
                                        ? t('challenges.emptyCreated')
                                        : t('challenges.emptyAdjust'))}
                        </Text>
                    </View>
                ) : (
                    <FlatList
                        data={displayData}
                        keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
                        renderItem={({item}) => (
                            showCompleted ? (
                                <CompletedQuestCard
                                    challenge={item as any}
                                    onPress={() => navigation.navigate('ChallengeDetails', {challengeId: item.id!.toString()})}
                                />
                            ) : (
                                <QuizChallengeCard
                                    challenge={item}
                                    onPress={() => navigation.navigate('ChallengeDetails', {challengeId: item.id!.toString()})}
                                />
                            )
                        )}
                        contentContainerStyle={styles.listContent}
                        showsVerticalScrollIndicator={false}
                    />
                )}
            </View>

            {/* Floating Action Button */}
            <TouchableOpacity
                style={styles.fab}
                onPress={handleCreateChallengePress}
            >
                <MaterialCommunityIcons name="plus" size={30} color="white"/>
            </TouchableOpacity>
        </SafeAreaView>
    );
};

const themeStyles = createStyles(theme => ({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background.secondary,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: theme.spacing.lg,
        backgroundColor: theme.colors.primary.main,
    },
    headerTitle: {
        fontSize: theme.typography.fontSize['2xl'],
        fontWeight: theme.typography.fontWeight.bold,
        color: theme.colors.text.inverse,
    },
    refreshButton: {
        padding: theme.spacing.sm,
    },
    roleFiltersContainer: {
        backgroundColor: theme.colors.background.paper,
        padding: theme.spacing.lg,
        borderBottomWidth: theme.layout.borderWidth.thin,
        borderBottomColor: theme.colors.border.light,
    },
    filterLabel: {
        fontSize: theme.typography.fontSize.sm,
        color: theme.colors.text.secondary,
        marginBottom: theme.spacing.md,
        fontWeight: theme.typography.fontWeight.medium,
    },
    checkboxRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: theme.spacing.lg,
        rowGap: theme.spacing.sm,
    },
    checkboxContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.sm,
        minHeight: 44,
        flexShrink: 1,
    },
    checkbox: {
        width: 24,
        height: 24,
        borderWidth: 2,
        borderColor: theme.colors.primary.main,
        borderRadius: theme.layout.borderRadius.sm,
        justifyContent: 'center',
        alignItems: 'center',
    },
    checkboxChecked: {
        backgroundColor: theme.colors.primary.main,
    },
    checkboxLabel: {
        fontSize: theme.typography.fontSize.sm,
        color: theme.colors.text.primary,
        flexShrink: 1,
    },
    sortContainer: {
        backgroundColor: theme.colors.background.paper,
        paddingHorizontal: theme.spacing.lg,
        paddingVertical: theme.spacing.sm,
        borderBottomWidth: theme.layout.borderWidth.thin,
        borderBottomColor: theme.colors.border.light,
    },
    sortLabel: {
        fontSize: theme.typography.fontSize.sm,
        color: theme.colors.text.secondary,
        fontWeight: theme.typography.fontWeight.medium,
        marginBottom: theme.spacing.sm,
    },
    sortChipsContainer: {
        gap: theme.spacing.sm,
        paddingRight: theme.spacing.lg,
    },
    sortChip: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: theme.spacing.md,
        paddingVertical: theme.spacing.sm,
        borderRadius: theme.layout.borderRadius.full,
        backgroundColor: theme.colors.background.secondary,
        gap: theme.spacing.xs,
        minHeight: 44,
    },
    sortChipActive: {
        backgroundColor: theme.colors.primary.light,
        borderWidth: theme.layout.borderWidth.thin,
        borderColor: theme.colors.primary.main,
    },
    sortChipText: {
        fontSize: theme.typography.fontSize.sm,
        color: theme.colors.text.secondary,
        fontWeight: theme.typography.fontWeight.medium,
    },
    sortChipTextActive: {
        color: theme.colors.primary.main,
        fontWeight: theme.typography.fontWeight.semibold,
    },
    content: {
        flex: 1,
    },
    listContent: {
        padding: theme.spacing.lg,
        paddingBottom: 80,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: theme.spacing.lg,
        fontSize: theme.typography.fontSize.base,
        color: theme.colors.text.secondary,
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: theme.spacing['3xl'],
    },
    errorText: {
        fontSize: theme.typography.fontSize.lg,
        fontWeight: theme.typography.fontWeight.semibold,
        color: theme.colors.text.primary,
        marginTop: theme.spacing.lg,
        marginBottom: theme.spacing.sm,
    },
    retryButton: {
        marginTop: theme.spacing.lg,
        backgroundColor: theme.colors.primary.main,
        paddingHorizontal: theme.spacing.xl,
        paddingVertical: theme.spacing.md,
        borderRadius: theme.layout.borderRadius.md,
    },
    retryButtonText: {
        color: theme.colors.text.inverse,
        fontSize: theme.typography.fontSize.base,
        fontWeight: theme.typography.fontWeight.semibold,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: theme.spacing['3xl'],
    },
    emptyText: {
        fontSize: theme.typography.fontSize.lg,
        fontWeight: theme.typography.fontWeight.semibold,
        color: theme.colors.text.primary,
        marginTop: theme.spacing.lg,
        marginBottom: theme.spacing.sm,
    },
    emptySubtext: {
        fontSize: theme.typography.fontSize.sm,
        color: theme.colors.text.secondary,
        textAlign: 'center',
    },
    fab: {
        position: 'absolute',
        right: 20,
        bottom: 20,
        width: 60,
        height: 60,
        borderRadius: theme.layout.borderRadius.full,
        backgroundColor: theme.colors.primary.main,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 4},
        shadowOpacity: 0.3,
        shadowRadius: 4,
    },
}));

export default ChallengesScreen;
