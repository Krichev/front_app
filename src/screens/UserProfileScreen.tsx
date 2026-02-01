import React, {useState, useMemo} from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Image,
    RefreshControl,
    SafeAreaView,
    ScrollView,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import {RouteProp, useNavigation, useRoute} from '@react-navigation/native';
import {useGetUserProfileQuery, useGetUserStatsQuery} from '../entities/UserState/model/slice/userApi';
import {
    useGetRelationshipsQuery,
    useCreateRelationshipMutation,
    useGetMutualConnectionsQuery,
} from '../entities/UserState/model/slice/relationshipApi';
import {useGetChallengesQuery} from '../entities/ChallengeState/model/slice/challengeApi';
import {NativeStackNavigationProp} from "@react-navigation/native-stack";
import {useTranslation} from 'react-i18next';
import {useSelector} from 'react-redux';
import {RootState} from '../app/providers/StoreProvider/store';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { RelationshipStatus, RelationshipType } from '../entities/QuizState/model/types/question.types';
import {RootStackParamList} from '../navigation/AppNavigator';
import {ApiChallenge} from '../entities/ChallengeState/model/types';
import {useAppStyles} from '../shared/ui/hooks/useAppStyles';
import {createStyles} from '../shared/ui/theme';
import { ScreenTimeBudgetWidget } from '../features/ScreenTime/ui/ScreenTimeBudgetWidget';

type UserProfileRouteProp = RouteProp<RootStackParamList, 'UserProfile'>;
type UserProfileNavigationProp = NativeStackNavigationProp<RootStackParamList, 'UserProfile'>;

const UserProfileScreen: React.FC = () => {
    const { t } = useTranslation();
    const route = useRoute<UserProfileRouteProp>();
    const navigation = useNavigation<UserProfileNavigationProp>();
    const { user: currentUser } = useSelector((state: RootState) => state.auth);
    const {screen, theme} = useAppStyles();
    const styles = themeStyles;

    // FIXED: Handle missing route params and use current user's ID as fallback
    const userId = route.params?.userId || currentUser?.id;

    // Check if this is the current user's profile
    const isCurrentUser = currentUser?.id === userId;

    // State for tab selection
    const [activeTab, setActiveTab] = useState<'created' | 'joined'>('created');
    const [refreshing, setRefreshing] = useState(false);
    const [showCancelled, setShowCancelled] = useState(false);

    // Handle editing profile
    const handleEditProfile = () => {
        if (userId) {
            navigation.navigate('EditProfile', { userId });
        }
    };

    const {
        data: user,
        isLoading: loadingUser,
        error: userError,
        refetch: refetchUser,
    } = useGetUserProfileQuery(userId!, {
        skip: !userId,
    });

    const {
        data: userStats,
        refetch: refetchStats,
    } = useGetUserStatsQuery(userId!, {
        skip: !userId,
    });

    const {
        data: createdChallenges,
        isLoading: loadingCreated,
        refetch: refetchCreated,
    } = useGetChallengesQuery({
        creator_id: userId!,
        excludeCancelled: !showCancelled,
    }, { skip: !userId });

    const {
        data: joinedChallenges,
        isLoading: loadingJoined,
        refetch: refetchJoined,
    } = useGetChallengesQuery({
        participant_id: userId!,
        excludeCancelled: !showCancelled,
    }, { skip: !userId });

    // Client-side filtering as backup
    const activeCreatedChallenges = useMemo(() => {
        if (!createdChallenges) {return [];}
        if (showCancelled) {return createdChallenges;}
        return createdChallenges.filter(c =>
            c.status !== 'CANCELLED' && c.status !== 'COMPLETED'
        );
    }, [createdChallenges, showCancelled]);

    const activeJoinedChallenges = useMemo(() => {
        if (!joinedChallenges) {return [];}
        if (showCancelled) {return joinedChallenges;}
        return joinedChallenges.filter(c =>
            c.status !== 'CANCELLED' && c.status !== 'COMPLETED'
        );
    }, [joinedChallenges, showCancelled]);

    // Relationship status
    const { data: relationshipData, refetch: refetchRelationship } = useGetRelationshipsQuery(
        { relatedUserId: userId, status: undefined },
        { skip: isCurrentUser || !userId }
    );
    const relationship = relationshipData?.content?.[0];

    const { data: mutualConnections, refetch: refetchMutual } = useGetMutualConnectionsQuery(
        userId!,
        { skip: isCurrentUser || !userId }
    );

    const [createRelationship, { isLoading: isSendingRequest }] = useCreateRelationshipMutation();

    // Handle refresh
    const onRefresh = async () => {
        setRefreshing(true);
        try {
            const promises: Promise<any>[] = [
                refetchUser(),
                refetchStats(),
                refetchCreated(),
                refetchJoined(),
            ];
            if (!isCurrentUser && userId) {
                promises.push(refetchRelationship());
                promises.push(refetchMutual());
            }
            await Promise.all(promises);
        } catch (error) {
            console.error('Error refreshing profile:', error);
        } finally {
            setRefreshing(false);
        }
    };

    // Handle challenge tap
    const navigateToChallengeDetails = (challengeId: string) => {
        navigation.navigate('ChallengeDetails', { challengeId });
    };

    const handleAddContact = async () => {
        if (!userId || isSendingRequest) {return;}
        try {
            await createRelationship({
                relatedUserId: userId,
                relationshipType: RelationshipType.FRIEND,
            }).unwrap();
            Alert.alert('Success', 'Relationship request sent');
        } catch (error) {
            Alert.alert('Error', 'Failed to send request');
        }
    };

    // Format date
    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    // Format join date
    const formatJoinDate = (dateString: string) => {
        const date = new Date(dateString);
        return t('profile.joinedDate', { date: date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' }) });
    };

    // Render loading state
    if (loadingUser) {
        return (
            <SafeAreaView style={screen.container}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={theme.colors.success.main} />
                    <Text style={styles.loadingText}>{t('profile.loadingProfile')}</Text>
                </View>
            </SafeAreaView>
        );
    }

    // Render error state
    if (userError || !user) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.errorContainer}>
                    <MaterialCommunityIcons name="alert-circle-outline" size={48} color={theme.colors.error.main} />
                    <Text style={styles.errorText}>{t('profile.errorProfile')}</Text>
                    <TouchableOpacity style={styles.retryButton} onPress={onRefresh}>
                        <Text style={styles.retryButtonText}>{t('profile.tryAgain')}</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    // Render stats item
    const renderStatsItem = (icon: string, label: string, value: number | undefined) => (
        <View style={styles.statItem}>
            <MaterialCommunityIcons name={icon} size={24} color={theme.colors.success.main} />
            <Text style={styles.statValue}>{value || 0}</Text>
            <Text style={styles.statLabel}>{label}</Text>
        </View>
    );

    // Render challenge item
    const renderChallengeItem = ({ item }: { item: ApiChallenge }) => {
        const isCancelled = item.status === 'CANCELLED';
        const isCompleted = item.status === 'COMPLETED';

        return (
            <TouchableOpacity
                style={[
                    styles.challengeItem,
                    isCancelled && styles.cancelledChallenge,
                ]}
                onPress={() => navigateToChallengeDetails(item.id)}
            >
                <View style={styles.challengeHeader}>
                    <Text
                        style={[
                            styles.challengeTitle,
                            isCancelled && styles.cancelledText,
                        ]}
                        numberOfLines={1}
                    >
                        {item.title}
                    </Text>
                    {isCancelled && (
                        <View style={styles.statusBadge}>
                            <Text style={styles.statusBadgeText}>CANCELLED</Text>
                        </View>
                    )}
                    {isCompleted && (
                        <View style={[styles.statusBadge, styles.completedBadge]}>
                            <Text style={styles.statusBadgeText}>COMPLETED</Text>
                        </View>
                    )}
                    <Text style={styles.challengeDate}>
                        {formatDate(item.created_at)}
                    </Text>
                </View>
                {item.description && (
                    <Text
                        style={[
                            styles.challengeDescription,
                            isCancelled && styles.cancelledText,
                        ]}
                        numberOfLines={2}
                    >
                        {item.description}
                    </Text>
                )}
                <View style={styles.challengeFooter}>
                    <View style={styles.challengeTag}>
                        <MaterialCommunityIcons name="trophy-outline" size={16} color={theme.colors.success.main} />
                        <Text style={styles.challengeTagText}>{item.targetGroup || 'General'}</Text>
                    </View>
                    <Text style={styles.challengeDifficulty}>
                        {item.status || 'Medium'}
                    </Text>
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <SafeAreaView style={screen.container}>
            <ScrollView
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
                style={styles.scrollView}
            >
                {/* Profile Header */}
                <View style={styles.profileHeader}>
                    <View style={styles.avatarContainer}>
                        <Image
                            source={{
                                uri: user.avatar || 'https://via.placeholder.com/100x100?text=User',
                            }}
                            style={styles.avatar}
                        />
                        {isCurrentUser && (
                            <TouchableOpacity
                                style={styles.editAvatarButton}
                                onPress={handleEditProfile}
                            >
                                <MaterialCommunityIcons name="camera" size={20} color={theme.colors.text.inverse} />
                            </TouchableOpacity>
                        )}
                    </View>

                    <View style={styles.userInfo}>
                        <Text style={styles.username}>{user.username}</Text>
                        {user.bio && <Text style={styles.bio}>{user.bio}</Text>}
                        <Text style={styles.joinDate}>{formatJoinDate(user.createdAt)}</Text>

                        {!isCurrentUser && relationship && (
                            <View style={styles.relationshipBadge}>
                                <Text style={styles.relationshipText}>
                                    {relationship.status === RelationshipStatus.ACCEPTED
                                        ? relationship.relationshipType
                                        : `Request ${relationship.status}`}
                                </Text>
                            </View>
                        )}
                    </View>

                                            {isCurrentUser ? (
                                            <TouchableOpacity
                                                style={styles.editProfileButton}
                                                onPress={handleEditProfile}
                                            >
                                                <MaterialCommunityIcons name="pencil" size={18} color={theme.colors.text.inverse} />
                                                <Text style={styles.editProfileButtonText}>{t('profile.editProfile')}</Text>
                                            </TouchableOpacity>
                                        ) : (
                                            !relationship ? (
                                                <TouchableOpacity
                                                    style={styles.addContactButton}
                                                    onPress={handleAddContact}
                                                    disabled={isSendingRequest}
                                                >
                                                    {isSendingRequest ? (
                                                        <ActivityIndicator size="small" color={theme.colors.text.inverse} />
                                                    ) : (
                                                        <>
                                                            <MaterialCommunityIcons name="account-plus" size={18} color={theme.colors.text.inverse} />
                                                            <Text style={styles.addContactButtonText}>{t('profile.addToContacts')}</Text>
                                                        </>
                                                    )}
                                                </TouchableOpacity>
                                            ) : relationship.status === RelationshipStatus.PENDING ? (
                                                <View style={styles.pendingBadge}>
                                                    <Text style={styles.pendingText}>{t('profile.requestPending')}</Text>
                                                </View>
                                            ) : null
                                        )}                </View>

                {/* Screen Time Section (Self Only) */}
                {isCurrentUser && <ScreenTimeBudgetWidget />}

                {/* Mutual Connections Section */}
                {!isCurrentUser && mutualConnections && mutualConnections.length > 0 && (
                    <View style={styles.mutualSection}>
                        <Text style={styles.sectionTitle}>{t('profile.mutualConnections')}</Text>
                        <View style={styles.mutualAvatars}>
                            {mutualConnections.slice(0, 5).map((conn, index) => (
                                <View key={conn.id} style={[styles.mutualAvatarWrapper, { marginLeft: index === 0 ? 0 : -15 }]}>
                                    <Image
                                        source={{ uri: conn.avatar || 'https://via.placeholder.com/40x40?text=U' }}
                                        style={styles.mutualAvatar}
                                    />
                                </View>
                            ))}
                            {mutualConnections.length > 5 && (
                                <Text style={styles.mutualMore}>+{mutualConnections.length - 5} more</Text>
                            )}
                        </View>
                    </View>
                )}

                {/* Stats Section */}
                <View style={styles.statsSection}>
                    <Text style={styles.sectionTitle}>{t('profile.stats')}</Text>
                    <View style={styles.statsContainer}>
                        {renderStatsItem('trophy', t('profile.completed'), userStats?.completed)}
                        {renderStatsItem('plus-circle', t('profile.created'), userStats?.created)}
                        {renderStatsItem('check-circle', t('profile.winRate'), userStats?.success)}
                    </View>
                    
                    {isCurrentUser && (
                        <TouchableOpacity 
                            style={[styles.penaltyButton, { marginTop: theme.spacing.lg }]}
                            onPress={() => navigation.navigate('PenaltyDashboard')}
                        >
                            <MaterialCommunityIcons name="alert-octagon" size={24} color={theme.colors.error.main} />
                            <Text style={[styles.penaltyButtonText, { color: theme.colors.text.primary }]}>My Penalties</Text>
                            <MaterialCommunityIcons name="chevron-right" size={24} color={theme.colors.text.secondary} />
                        </TouchableOpacity>
                    )}
                </View>

                {/* Challenges Section */}
                <View style={styles.challengesSection}>
                    <View style={styles.tabContainer}>
                        <TouchableOpacity
                            style={[styles.tab, activeTab === 'created' && styles.activeTab]}
                            onPress={() => setActiveTab('created')}
                        >
                            <Text style={[styles.tabText, activeTab === 'created' && styles.activeTabText]}>
                                {t('profile.createdTab')} ({activeCreatedChallenges?.length || 0})
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.tab, activeTab === 'joined' && styles.activeTab]}
                            onPress={() => setActiveTab('joined')}
                        >
                            <Text style={[styles.tabText, activeTab === 'joined' && styles.activeTabText]}>
                                {t('profile.joinedTab')} ({activeJoinedChallenges?.length || 0})
                            </Text>
                        </TouchableOpacity>
                    </View>

                    {/* NEW: Toggle for cancelled challenges */}
                    <TouchableOpacity
                        style={styles.toggleCancelled}
                        onPress={() => setShowCancelled(!showCancelled)}
                    >
                        <MaterialCommunityIcons
                            name={showCancelled ? 'eye-off-outline' : 'eye-outline'}
                            size={16}
                            color={theme.colors.text.secondary}
                        />
                        <Text style={styles.toggleCancelledText}>
                            {showCancelled ? t('profile.hideCancelled') : t('profile.showAll')}
                        </Text>
                    </TouchableOpacity>

                    {/* Challenge List */}
                    <View style={styles.challengesList}>
                        {activeTab === 'created' ? (
                            loadingCreated ? (
                                <View style={styles.loadingContainer}>
                                    <ActivityIndicator size="small" color={theme.colors.success.main} />
                                    <Text style={styles.loadingText}>{t('profile.loadingCreated')}</Text>
                                </View>
                            ) : activeCreatedChallenges && activeCreatedChallenges.length > 0 ? (
                                <FlatList
                                    data={activeCreatedChallenges}
                                    renderItem={renderChallengeItem}
                                    keyExtractor={(item) => item.id}
                                    scrollEnabled={false}
                                    ItemSeparatorComponent={() => <View style={styles.separator} />}
                                />
                            ) : (
                                <View style={styles.emptyState}>
                                    <MaterialCommunityIcons name="trophy-outline" size={48} color={theme.colors.text.disabled} />
                                    <Text style={styles.emptyStateText}>
                                        {isCurrentUser ? t('profile.noCreatedSelf') : t('profile.noCreated')}
                                    </Text>
                                </View>
                            )
                        ) : (
                            loadingJoined ? (
                                <View style={styles.loadingContainer}>
                                    <ActivityIndicator size="small" color={theme.colors.success.main} />
                                    <Text style={styles.loadingText}>{t('profile.loadingJoined')}</Text>
                                </View>
                            ) : activeJoinedChallenges && activeJoinedChallenges.length > 0 ? (
                                <FlatList
                                    data={activeJoinedChallenges}
                                    renderItem={renderChallengeItem}
                                    keyExtractor={(item) => item.id}
                                    scrollEnabled={false}
                                    ItemSeparatorComponent={() => <View style={styles.separator} />}
                                />
                            ) : (
                                <View style={styles.emptyState}>
                                    <MaterialCommunityIcons name="account-group-outline" size={48} color={theme.colors.text.disabled} />
                                    <Text style={styles.emptyStateText}>
                                        {isCurrentUser ? t('profile.noJoinedSelf') : t('profile.noJoined')}
                                    </Text>
                                </View>
                            )
                        )}
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

const themeStyles = createStyles(theme => ({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background.secondary,
    },
    scrollView: {
        flex: 1,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: theme.spacing.xl,
    },
    loadingText: {
        marginTop: theme.spacing.sm,
        ...theme.typography.body.medium,
        color: theme.colors.text.secondary,
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: theme.spacing.xl,
    },
    errorText: {
        ...theme.typography.body.large,
        color: theme.colors.error.main,
        textAlign: 'center',
        marginVertical: theme.spacing.sm,
    },
    retryButton: {
        backgroundColor: theme.colors.success.main,
        paddingHorizontal: theme.spacing.xl,
        paddingVertical: theme.spacing.sm,
        borderRadius: theme.layout.borderRadius.sm,
        marginTop: theme.spacing.sm,
    },
    retryButtonText: {
        color: theme.colors.text.inverse,
        ...theme.typography.body.medium,
        fontWeight: theme.typography.fontWeight.bold,
    },
    profileHeader: {
        backgroundColor: theme.colors.background.primary,
        padding: theme.spacing.xl,
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border.light,
    },
    avatarContainer: {
        position: 'relative',
        marginBottom: theme.spacing.md,
    },
    avatar: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: theme.colors.background.tertiary,
    },
    editAvatarButton: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: theme.colors.success.main,
        borderRadius: 15,
        width: 30,
        height: 30,
        justifyContent: 'center',
        alignItems: 'center',
    },
    userInfo: {
        alignItems: 'center',
        marginBottom: theme.spacing.md,
    },
    username: {
        ...theme.typography.heading.h5,
        fontWeight: theme.typography.fontWeight.bold,
        color: theme.colors.text.primary,
        marginBottom: theme.spacing.xs,
    },
    bio: {
        ...theme.typography.body.medium,
        color: theme.colors.text.secondary,
        textAlign: 'center',
        marginBottom: theme.spacing.xs,
    },
    joinDate: {
        ...theme.typography.body.small,
        color: theme.colors.text.disabled,
    },
    editProfileButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.success.main,
        paddingHorizontal: theme.spacing.xl,
        paddingVertical: theme.spacing.sm,
        borderRadius: theme.layout.borderRadius.xl,
    },
    editProfileButtonText: {
        color: theme.colors.text.inverse,
        ...theme.typography.body.medium,
        fontWeight: theme.typography.fontWeight.bold,
        marginLeft: theme.spacing.xs,
    },
    addContactButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.success.main,
        paddingHorizontal: theme.spacing.xl,
        paddingVertical: theme.spacing.sm,
        borderRadius: theme.layout.borderRadius.xl,
    },
    addContactButtonText: {
        color: theme.colors.text.inverse,
        ...theme.typography.body.medium,
        fontWeight: theme.typography.fontWeight.bold,
        marginLeft: theme.spacing.xs,
    },
    relationshipBadge: {
        backgroundColor: theme.colors.success.background,
        paddingHorizontal: theme.spacing.md,
        paddingVertical: theme.spacing.xs,
        borderRadius: theme.layout.borderRadius.md,
        marginTop: theme.spacing.xs,
    },
    relationshipText: {
        color: theme.colors.success.main,
        ...theme.typography.caption,
        fontWeight: theme.typography.fontWeight.bold,
        textTransform: 'uppercase',
    },
    pendingBadge: {
        backgroundColor: theme.colors.warning.background,
        paddingHorizontal: theme.spacing.xl,
        paddingVertical: theme.spacing.sm,
        borderRadius: theme.layout.borderRadius.xl,
    },
    pendingText: {
        color: theme.colors.warning.main,
        ...theme.typography.body.medium,
        fontWeight: theme.typography.fontWeight.bold,
    },
    mutualSection: {
        backgroundColor: theme.colors.background.primary,
        margin: theme.spacing.sm,
        padding: theme.spacing.xl,
        borderRadius: theme.layout.borderRadius.md,
    },
    mutualAvatars: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: theme.spacing.sm,
    },
    mutualAvatarWrapper: {
        borderWidth: 2,
        borderColor: theme.colors.background.primary,
        borderRadius: theme.layout.borderRadius.lg,
    },
    mutualAvatar: {
        width: 40,
        height: 40,
        borderRadius: theme.layout.borderRadius.lg,
    },
    mutualMore: {
        marginLeft: theme.spacing.sm,
        color: theme.colors.text.secondary,
        ...theme.typography.body.small,
    },
    statsSection: {
        backgroundColor: theme.colors.background.primary,
        margin: theme.spacing.sm,
        padding: theme.spacing.xl,
        borderRadius: theme.layout.borderRadius.md,
        ...theme.shadows.small,
    },
    sectionTitle: {
        ...theme.typography.heading.h6,
        fontWeight: theme.typography.fontWeight.bold,
        color: theme.colors.text.primary,
        marginBottom: theme.spacing.md,
    },
    statsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
    },
    statItem: {
        alignItems: 'center',
        flex: 1,
    },
    statValue: {
        ...theme.typography.heading.h5,
        fontWeight: theme.typography.fontWeight.bold,
        color: theme.colors.text.primary,
        marginTop: theme.spacing.xs,
    },
    statLabel: {
        ...theme.typography.caption,
        color: theme.colors.text.secondary,
        marginTop: theme.spacing.xs,
    },
    penaltyButton: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: theme.spacing.md,
        backgroundColor: theme.colors.background.secondary,
        borderRadius: theme.layout.borderRadius.md,
    },
    penaltyButtonText: {
        flex: 1,
        marginLeft: theme.spacing.md,
        fontWeight: 'bold',
    },
    challengesSection: {
        backgroundColor: theme.colors.background.primary,
        margin: theme.spacing.sm,
        borderRadius: theme.layout.borderRadius.md,
        ...theme.shadows.small,
    },
    tabContainer: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border.light,
    },
    tab: {
        flex: 1,
        paddingVertical: theme.spacing.md,
        alignItems: 'center',
    },
    activeTab: {
        borderBottomWidth: 2,
        borderBottomColor: theme.colors.success.main,
    },
    tabText: {
        ...theme.typography.body.medium,
        color: theme.colors.text.secondary,
    },
    activeTabText: {
        color: theme.colors.success.main,
        fontWeight: theme.typography.fontWeight.bold,
    },
    challengesList: {
        padding: theme.spacing.xl,
    },
    challengeItem: {
        padding: theme.spacing.md,
        borderRadius: theme.layout.borderRadius.md,
        backgroundColor: theme.colors.background.secondary,
        marginVertical: theme.spacing.xs,
    },
    challengeHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: theme.spacing.sm,
    },
    challengeTitle: {
        ...theme.typography.body.medium,
        fontWeight: theme.typography.fontWeight.bold,
        color: theme.colors.text.primary,
        flex: 1,
        marginRight: theme.spacing.sm,
    },
    challengeDate: {
        ...theme.typography.caption,
        color: theme.colors.text.disabled,
    },
    challengeDescription: {
        ...theme.typography.body.small,
        color: theme.colors.text.secondary,
        marginBottom: theme.spacing.sm,
    },
    challengeFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    challengeTag: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.success.background,
        paddingHorizontal: theme.spacing.sm,
        paddingVertical: theme.spacing.xs,
        borderRadius: theme.layout.borderRadius.md,
    },
    challengeTagText: {
        ...theme.typography.caption,
        color: theme.colors.success.main,
        marginLeft: theme.spacing.xs,
    },
    challengeDifficulty: {
        ...theme.typography.caption,
        color: theme.colors.text.secondary,
        fontWeight: theme.typography.fontWeight.medium,
    },
    separator: {
        height: 1,
        backgroundColor: theme.colors.border.light,
        marginVertical: theme.spacing.xs,
    },
    emptyState: {
        alignItems: 'center',
        padding: theme.spacing['3xl'],
    },
    emptyStateText: {
        ...theme.typography.body.medium,
        color: theme.colors.text.disabled,
        textAlign: 'center',
        marginTop: theme.spacing.sm,
    },
    toggleCancelled: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: theme.spacing.sm,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border.light,
        gap: theme.spacing.xs,
    },
    toggleCancelledText: {
        ...theme.typography.caption,
        color: theme.colors.text.secondary,
    },
    cancelledChallenge: {
        opacity: 0.6,
        backgroundColor: theme.colors.background.secondary,
    },
    cancelledText: {
        textDecorationLine: 'line-through',
        color: theme.colors.text.disabled,
    },
    statusBadge: {
        backgroundColor: theme.colors.error.main,
        paddingHorizontal: theme.spacing.sm,
        paddingVertical: theme.spacing.xs,
        borderRadius: theme.layout.borderRadius.sm,
        marginRight: theme.spacing.sm,
    },
    completedBadge: {
        backgroundColor: theme.colors.success.main,
    },
    statusBadgeText: {
        color: theme.colors.text.inverse,
        ...theme.typography.caption,
        fontWeight: theme.typography.fontWeight.bold,
    },
}));

export default UserProfileScreen;