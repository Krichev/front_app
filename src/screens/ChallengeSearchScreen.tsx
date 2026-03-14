// src/screens/ChallengeSearchScreen.tsx
import React, {useState} from 'react';
import {
    ActivityIndicator,
    FlatList,
    SafeAreaView,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import {useTranslation} from 'react-i18next';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {useSearchChallengesQuery} from "../entities/ChallengeState/model/slice/challengeApi";
import {useSafeRefetch} from "../shared/hooks/useSafeRefetch";
import {useAppStyles} from '../shared/ui/hooks/useAppStyles';
import {createStyles} from '../shared/ui/theme/createStyles';
import QuizChallengeCard from '../entities/ChallengeState/ui/QuizChallengeCard';
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';

type RootStackParamList = {
    ChallengeDetails: { challengeId: string };
};

type ChallengeSearchNavigationProp = NativeStackNavigationProp<RootStackParamList>;

const ChallengeSearchScreen: React.FC = () => {
    const { t } = useTranslation();
    const { theme } = useAppStyles();
    const styles = themeStyles;
    const navigation = useNavigation<ChallengeSearchNavigationProp>();

    const [searchQuery, setSearchQuery] = useState('');
    const [filter, setFilter] = useState<'ALL' | 'FREE' | 'PAID' | 'PRIVATE'>('ALL');

    const {
        data: challenges,
        isLoading,
        error,
        refetch: refetchRaw,
        isUninitialized
    } = useSearchChallengesQuery({
        q: searchQuery,
        limit: 50
    });

    const refetch = useSafeRefetch(refetchRaw, isUninitialized);

    const filteredChallenges = (challenges || []).filter(challenge => {
        if (filter === 'ALL') return true;
        if (filter === 'FREE') return challenge.paymentType === 'FREE' || !challenge.hasEntryFee;
        if (filter === 'PAID') return challenge.paymentType === 'ENTRY_FEE' || challenge.hasEntryFee;
        if (filter === 'PRIVATE') return challenge.visibility === 'PRIVATE';
        return true;
    });

    const handleChallengePress = (challengeId: string) => {
        navigation.navigate('ChallengeDetails', {challengeId});
    };

    const renderHeader = () => (
        <View style={styles.headerContainer}>
            <Text style={styles.title}>{t('challengeSearch.title')}</Text>
            
            <View style={styles.searchBarContainer}>
                <MaterialCommunityIcons 
                    name="magnify" 
                    size={20} 
                    color={theme.colors.text.disabled} 
                    style={styles.searchIcon}
                />
                <TextInput
                    style={styles.searchInput}
                    placeholder={t('challengeSearch.placeholder')}
                    placeholderTextColor={theme.colors.text.disabled}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    autoCapitalize="none"
                />
                {searchQuery.length > 0 && (
                    <TouchableOpacity onPress={() => setSearchQuery('')}>
                        <MaterialCommunityIcons 
                            name="close-circle" 
                            size={20} 
                            color={theme.colors.text.disabled} 
                        />
                    </TouchableOpacity>
                )}
            </View>

            <View style={styles.filterContainer}>
                <TouchableOpacity
                    style={[styles.filterButton, filter === 'ALL' && styles.filterButtonActive]}
                    onPress={() => setFilter('ALL')}
                >
                    <Text style={[styles.filterButtonText, filter === 'ALL' && styles.filterButtonTextActive]}>
                        {t('challengeSearch.filters.all')}
                    </Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                    style={[styles.filterButton, filter === 'FREE' && styles.filterButtonActive]}
                    onPress={() => setFilter('FREE')}
                >
                    <MaterialCommunityIcons 
                        name="gift-outline" 
                        size={16} 
                        color={filter === 'FREE' ? theme.colors.text.inverse : theme.colors.text.secondary} 
                    />
                    <Text style={[styles.filterButtonText, filter === 'FREE' && styles.filterButtonTextActive]}>
                        {t('challengeSearch.filters.free')}
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.filterButton, filter === 'PAID' && styles.filterButtonActive]}
                    onPress={() => setFilter('PAID')}
                >
                    <MaterialCommunityIcons 
                        name="cash" 
                        size={16} 
                        color={filter === 'PAID' ? theme.colors.text.inverse : theme.colors.text.secondary} 
                    />
                    <Text style={[styles.filterButtonText, filter === 'PAID' && styles.filterButtonTextActive]}>
                        {t('challengeSearch.filters.paid')}
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.filterButton, filter === 'PRIVATE' && styles.filterButtonActive]}
                    onPress={() => setFilter('PRIVATE')}
                >
                    <MaterialCommunityIcons 
                        name="lock" 
                        size={16} 
                        color={filter === 'PRIVATE' ? theme.colors.text.inverse : theme.colors.text.secondary} 
                    />
                    <Text style={[styles.filterButtonText, filter === 'PRIVATE' && styles.filterButtonTextActive]}>
                        {t('challengeSearch.filters.private')}
                    </Text>
                </TouchableOpacity>
            </View>

            {filteredChallenges.length > 0 && !isLoading && (
                <Text style={styles.resultsCount}>
                    {t('challengeSearch.results.count', { count: filteredChallenges.length })}
                </Text>
            )}
        </View>
    );

    const renderEmpty = () => {
        if (isLoading) {
            return (
                <View style={styles.centerContainer}>
                    <ActivityIndicator size="large" color={theme.colors.primary.main} />
                    <Text style={styles.loadingText}>{t('challengeSearch.loading')}</Text>
                </View>
            );
        }

        if (error) {
            return (
                <View style={styles.centerContainer}>
                    <MaterialCommunityIcons name="alert-circle-outline" size={64} color={theme.colors.error.main} />
                    <Text style={styles.errorText}>{t('challengeSearch.error')}</Text>
                    <TouchableOpacity style={styles.retryButton} onPress={() => refetch()}>
                        <Text style={styles.retryButtonText}>{t('challengeSearch.retry')}</Text>
                    </TouchableOpacity>
                </View>
            );
        }

        return (
            <View style={styles.centerContainer}>
                <MaterialCommunityIcons name="magnify" size={64} color={theme.colors.text.disabled} />
                <Text style={styles.emptyTitle}>{t('challengeSearch.empty.title')}</Text>
                <Text style={styles.emptyDescription}>
                    {searchQuery 
                        ? t('challengeSearch.empty.withQuery', { query: searchQuery })
                        : t('challengeSearch.empty.noQuery')}
                </Text>
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <FlatList
                data={filteredChallenges}
                keyExtractor={(item) => item.id.toString()}
                renderItem={({item}) => (
                    <QuizChallengeCard
                        challenge={item}
                        onPress={() => handleChallengePress(item.id.toString())}
                    />
                )}
                ListHeaderComponent={renderHeader}
                ListEmptyComponent={renderEmpty}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
            />
        </SafeAreaView>
    );
};

const themeStyles = createStyles(theme => ({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background.secondary,
    },
    headerContainer: {
        paddingHorizontal: theme.spacing.lg,
        paddingTop: theme.spacing['3xl'],
        paddingBottom: theme.spacing.md,
        backgroundColor: theme.colors.background.primary,
        borderBottomLeftRadius: theme.layout.borderRadius.lg,
        borderBottomRightRadius: theme.layout.borderRadius.lg,
        ...theme.shadows.small,
    },
    title: {
        fontSize: theme.typography.fontSize['2xl'],
        fontWeight: theme.typography.fontWeight.bold,
        color: theme.colors.text.primary,
        marginBottom: theme.spacing.lg,
    },
    searchBarContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.background.secondary,
        borderRadius: theme.layout.borderRadius.full,
        paddingHorizontal: theme.spacing.md,
        height: 48,
        marginBottom: theme.spacing.lg,
        borderWidth: 1,
        borderColor: theme.colors.border.light,
    },
    searchIcon: {
        marginRight: theme.spacing.sm,
    },
    searchInput: {
        flex: 1,
        fontSize: theme.typography.fontSize.base,
        color: theme.colors.text.primary,
        paddingVertical: 0,
    },
    filterContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: theme.spacing.sm,
        marginBottom: theme.spacing.md,
    },
    filterButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: theme.spacing.md,
        paddingVertical: theme.spacing.sm,
        borderRadius: theme.layout.borderRadius.full,
        backgroundColor: theme.colors.background.secondary,
        borderWidth: 1,
        borderColor: theme.colors.border.light,
        minHeight: 44,
        gap: theme.spacing.xs,
    },
    filterButtonActive: {
        backgroundColor: theme.colors.primary.main,
        borderColor: theme.colors.primary.main,
    },
    filterButtonText: {
        fontSize: theme.typography.fontSize.sm,
        color: theme.colors.text.secondary,
        fontWeight: theme.typography.fontWeight.medium,
    },
    filterButtonTextActive: {
        color: theme.colors.text.inverse,
        fontWeight: theme.typography.fontWeight.bold,
    },
    resultsCount: {
        fontSize: theme.typography.fontSize.xs,
        color: theme.colors.text.secondary,
        marginTop: theme.spacing.xs,
    },
    listContent: {
        paddingBottom: theme.spacing['2xl'],
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingTop: 100,
        paddingHorizontal: theme.spacing['3xl'],
    },
    loadingText: {
        marginTop: theme.spacing.md,
        fontSize: theme.typography.fontSize.base,
        color: theme.colors.text.secondary,
    },
    errorText: {
        fontSize: theme.typography.fontSize.base,
        color: theme.colors.text.primary,
        textAlign: 'center',
        marginTop: theme.spacing.md,
        marginBottom: theme.spacing.lg,
    },
    retryButton: {
        backgroundColor: theme.colors.primary.main,
        paddingHorizontal: theme.spacing.xl,
        paddingVertical: theme.spacing.md,
        borderRadius: theme.layout.borderRadius.md,
    },
    retryButtonText: {
        color: theme.colors.text.inverse,
        fontWeight: theme.typography.fontWeight.bold,
    },
    emptyTitle: {
        fontSize: theme.typography.fontSize.xl,
        fontWeight: theme.typography.fontWeight.bold,
        color: theme.colors.text.primary,
        marginTop: theme.spacing.md,
        marginBottom: theme.spacing.sm,
    },
    emptyDescription: {
        fontSize: theme.typography.fontSize.sm,
        color: theme.colors.text.secondary,
        textAlign: 'center',
    },
}));

export default ChallengeSearchScreen;
