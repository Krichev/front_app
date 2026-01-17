import React, {useState, useMemo} from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Image,
    RefreshControl,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import {RouteProp, useNavigation, useRoute} from '@react-navigation/native';
import {useGetUserProfileQuery, useGetUserStatsQuery} from '../entities/UserState/model/slice/userApi';
import {
    useGetRelationshipsQuery,
    useCreateRelationshipMutation,
    useGetMutualConnectionsQuery
} from '../entities/UserState/model/slice/relationshipApi';
import {useGetChallengesQuery} from '../entities/ChallengeState/model/slice/challengeApi';
import {NativeStackNavigationProp} from "@react-navigation/native-stack";
import {useSelector} from 'react-redux';
import {RootState} from '../app/providers/StoreProvider/store';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { RelationshipStatus, RelationshipType } from '../entities/QuizState/model/types/question.types';
import {RootStackParamList} from '../navigation/AppNavigator';
import {ApiChallenge} from '../entities/ChallengeState/model/types';

type UserProfileRouteProp = RouteProp<RootStackParamList, 'UserProfile'>;
type UserProfileNavigationProp = NativeStackNavigationProp<RootStackParamList, 'UserProfile'>;

const UserProfileScreen: React.FC = () => {
    const route = useRoute<UserProfileRouteProp>();
    const navigation = useNavigation<UserProfileNavigationProp>();
    const { user: currentUser } = useSelector((state: RootState) => state.auth);

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
        refetch: refetchUser
    } = useGetUserProfileQuery(userId!, {
        skip: !userId,
    });

    const {
        data: userStats,
        refetch: refetchStats
    } = useGetUserStatsQuery(userId!, {
        skip: !userId,
    });

    const {
        data: createdChallenges,
        isLoading: loadingCreated,
        refetch: refetchCreated
    } = useGetChallengesQuery({
        creator_id: userId!,
        excludeCancelled: !showCancelled,
    }, { skip: !userId });

    const {
        data: joinedChallenges,
        isLoading: loadingJoined,
        refetch: refetchJoined
    } = useGetChallengesQuery({
        participant_id: userId!,
        excludeCancelled: !showCancelled,
    }, { skip: !userId });

    // Client-side filtering as backup
    const activeCreatedChallenges = useMemo(() => {
        if (!createdChallenges) return [];
        if (showCancelled) return createdChallenges;
        return createdChallenges.filter(c => 
            c.status !== 'CANCELLED' && c.status !== 'COMPLETED'
        );
    }, [createdChallenges, showCancelled]);

    const activeJoinedChallenges = useMemo(() => {
        if (!joinedChallenges) return [];
        if (showCancelled) return joinedChallenges;
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
        if (!userId) return;
        try {
            await createRelationship({
                relatedUserId: userId,
                relationshipType: RelationshipType.FRIEND
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
        return `Joined ${date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
        })}`;
    };

    // Render loading state
    if (loadingUser) {
        return (
            <SafeAreaView style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#4CAF50" />
                <Text style={styles.loadingText}>Loading profile...</Text>
            </SafeAreaView>
        );
    }

    // Render error state
    if (userError || !user) {
        return (
            <SafeAreaView style={styles.errorContainer}>
                <MaterialCommunityIcons name="alert-circle-outline" size={48} color="#F44336" />
                <Text style={styles.errorText}>Failed to load user profile.</Text>
                <TouchableOpacity style={styles.retryButton} onPress={onRefresh}>
                    <Text style={styles.retryButtonText}>Try Again</Text>
                </TouchableOpacity>
            </SafeAreaView>
        );
    }

    // Render stats item
    const renderStatsItem = (icon: string, label: string, value: number | undefined) => (
        <View style={styles.statItem}>
            <MaterialCommunityIcons name={icon} size={24} color="#4CAF50" />
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
                    isCancelled && styles.cancelledChallenge
                ]}
                onPress={() => navigateToChallengeDetails(item.id)}
            >
                <View style={styles.challengeHeader}>
                    <Text 
                        style={[
                            styles.challengeTitle,
                            isCancelled && styles.cancelledText
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
                        {formatDate(item.createdAt)}
                    </Text>
                </View>
                {item.description && (
                    <Text 
                        style={[
                            styles.challengeDescription,
                            isCancelled && styles.cancelledText
                        ]} 
                        numberOfLines={2}
                    >
                        {item.description}
                    </Text>
                )}
                <View style={styles.challengeFooter}>
                    <View style={styles.challengeTag}>
                        <MaterialCommunityIcons name="trophy-outline" size={16} color="#4CAF50" />
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
        <SafeAreaView style={styles.container}>
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
                                uri: user.avatar || 'https://via.placeholder.com/100x100?text=User'
                            }}
                            style={styles.avatar}
                        />
                        {isCurrentUser && (
                            <TouchableOpacity
                                style={styles.editAvatarButton}
                                onPress={handleEditProfile}
                            >
                                <MaterialCommunityIcons name="camera" size={20} color="white" />
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
                            <MaterialCommunityIcons name="pencil" size={18} color="white" />
                            <Text style={styles.editProfileButtonText}>Edit Profile</Text>
                        </TouchableOpacity>
                    ) : (
                        !relationship ? (
                            <TouchableOpacity
                                style={styles.addContactButton}
                                onPress={handleAddContact}
                                disabled={isSendingRequest}
                            >
                                {isSendingRequest ? (
                                    <ActivityIndicator size="small" color="white" />
                                ) : (
                                    <>
                                        <MaterialCommunityIcons name="account-plus" size={18} color="white" />
                                        <Text style={styles.addContactButtonText}>Add to Contacts</Text>
                                    </>
                                )}
                            </TouchableOpacity>
                        ) : relationship.status === RelationshipStatus.PENDING ? (
                            <View style={styles.pendingBadge}>
                                <Text style={styles.pendingText}>Request Pending</Text>
                            </View>
                        ) : null
                    )}
                </View>

                {/* Mutual Connections Section */}
                {!isCurrentUser && mutualConnections && mutualConnections.length > 0 && (
                    <View style={styles.mutualSection}>
                        <Text style={styles.sectionTitle}>Mutual Connections</Text>
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
                    <Text style={styles.sectionTitle}>Stats</Text>
                    <View style={styles.statsContainer}>
                        {renderStatsItem('trophy', 'Completed', userStats?.completed)}
                        {renderStatsItem('plus-circle', 'Created', userStats?.created)}
                        {renderStatsItem('check-circle', 'Success Rate', userStats?.success)}
                    </View>
                </View>

                {/* Challenges Section */}
                <View style={styles.challengesSection}>
                    <View style={styles.tabContainer}>
                        <TouchableOpacity
                            style={[styles.tab, activeTab === 'created' && styles.activeTab]}
                            onPress={() => setActiveTab('created')}
                        >
                            <Text style={[styles.tabText, activeTab === 'created' && styles.activeTabText]}>
                                Created ({activeCreatedChallenges?.length || 0})
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.tab, activeTab === 'joined' && styles.activeTab]}
                            onPress={() => setActiveTab('joined')}
                        >
                            <Text style={[styles.tabText, activeTab === 'joined' && styles.activeTabText]}>
                                Joined ({activeJoinedChallenges?.length || 0})
                            </Text>
                        </TouchableOpacity>
                    </View>

                    {/* NEW: Toggle for cancelled challenges */}
                    <TouchableOpacity 
                        style={styles.toggleCancelled}
                        onPress={() => setShowCancelled(!showCancelled)}
                    >
                        <MaterialCommunityIcons 
                            name={showCancelled ? "eye-off-outline" : "eye-outline"} 
                            size={16} 
                            color="#666" 
                        />
                        <Text style={styles.toggleCancelledText}>
                            {showCancelled ? "Hide Cancelled/Completed" : "Show All"}
                        </Text>
                    </TouchableOpacity>

                    {/* Challenge List */}
                    <View style={styles.challengesList}>
                        {activeTab === 'created' ? (
                            loadingCreated ? (
                                <View style={styles.loadingContainer}>
                                    <ActivityIndicator size="small" color="#4CAF50" />
                                    <Text style={styles.loadingText}>Loading created challenges...</Text>
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
                                    <MaterialCommunityIcons name="trophy-outline" size={48} color="#ccc" />
                                    <Text style={styles.emptyStateText}>
                                        {isCurrentUser ? "You haven't created any challenges yet" : "No challenges created"}
                                    </Text>
                                </View>
                            )
                        ) : (
                            loadingJoined ? (
                                <View style={styles.loadingContainer}>
                                    <ActivityIndicator size="small" color="#4CAF50" />
                                    <Text style={styles.loadingText}>Loading joined challenges...</Text>
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
                                    <MaterialCommunityIcons name="account-group-outline" size={48} color="#ccc" />
                                    <Text style={styles.emptyStateText}>
                                        {isCurrentUser ? "You haven't joined any challenges yet" : "No challenges joined"}
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

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    scrollView: {
        flex: 1,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    loadingText: {
        marginTop: 10,
        fontSize: 16,
        color: '#666',
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    errorText: {
        fontSize: 18,
        color: '#F44336',
        textAlign: 'center',
        marginVertical: 10,
    },
    retryButton: {
        backgroundColor: '#4CAF50',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 5,
        marginTop: 10,
    },
    retryButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
    profileHeader: {
        backgroundColor: 'white',
        padding: 20,
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    avatarContainer: {
        position: 'relative',
        marginBottom: 15,
    },
    avatar: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: '#eee',
    },
    editAvatarButton: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: '#4CAF50',
        borderRadius: 15,
        width: 30,
        height: 30,
        justifyContent: 'center',
        alignItems: 'center',
    },
    userInfo: {
        alignItems: 'center',
        marginBottom: 15,
    },
    username: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 5,
    },
    bio: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        marginBottom: 5,
    },
    joinDate: {
        fontSize: 14,
        color: '#999',
    },
    editProfileButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#4CAF50',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 20,
    },
    editProfileButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
        marginLeft: 5,
    },
    addContactButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#4CAF50',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 20,
    },
    addContactButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
        marginLeft: 5,
    },
    relationshipBadge: {
        backgroundColor: '#e8f5e9',
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
        marginTop: 5,
    },
    relationshipText: {
        color: '#4CAF50',
        fontSize: 12,
        fontWeight: 'bold',
        textTransform: 'uppercase',
    },
    pendingBadge: {
        backgroundColor: '#fff3e0',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 20,
    },
    pendingText: {
        color: '#ff9800',
        fontSize: 16,
        fontWeight: 'bold',
    },
    mutualSection: {
        backgroundColor: 'white',
        margin: 10,
        padding: 20,
        borderRadius: 10,
    },
    mutualAvatars: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 10,
    },
    mutualAvatarWrapper: {
        borderWidth: 2,
        borderColor: 'white',
        borderRadius: 20,
    },
    mutualAvatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
    },
    mutualMore: {
        marginLeft: 10,
        color: '#666',
        fontSize: 14,
    },
    statsSection: {
        backgroundColor: 'white',
        margin: 10,
        padding: 20,
        borderRadius: 10,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.22,
        shadowRadius: 2.22,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 15,
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
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
        marginTop: 5,
    },
    statLabel: {
        fontSize: 12,
        color: '#666',
        marginTop: 2,
    },
    challengesSection: {
        backgroundColor: 'white',
        margin: 10,
        borderRadius: 10,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.22,
        shadowRadius: 2.22,
    },
    tabContainer: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    tab: {
        flex: 1,
        paddingVertical: 15,
        alignItems: 'center',
    },
    activeTab: {
        borderBottomWidth: 2,
        borderBottomColor: '#4CAF50',
    },
    tabText: {
        fontSize: 16,
        color: '#666',
    },
    activeTabText: {
        color: '#4CAF50',
        fontWeight: 'bold',
    },
    challengesList: {
        padding: 20,
    },
    challengeItem: {
        padding: 15,
        borderRadius: 8,
        backgroundColor: '#f9f9f9',
        marginVertical: 5,
    },
    challengeHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    challengeTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
        flex: 1,
        marginRight: 10,
    },
    challengeDate: {
        fontSize: 12,
        color: '#999',
    },
    challengeDescription: {
        fontSize: 14,
        color: '#666',
        marginBottom: 10,
    },
    challengeFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    challengeTag: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#e8f5e8',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    challengeTagText: {
        fontSize: 12,
        color: '#4CAF50',
        marginLeft: 4,
    },
    challengeDifficulty: {
        fontSize: 12,
        color: '#666',
        fontWeight: '500',
    },
    separator: {
        height: 1,
        backgroundColor: '#eee',
        marginVertical: 5,
    },
    emptyState: {
        alignItems: 'center',
        padding: 40,
    },
    emptyStateText: {
        fontSize: 16,
        color: '#999',
        textAlign: 'center',
        marginTop: 10,
    },
    toggleCancelled: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
        gap: 5,
    },
    toggleCancelledText: {
        fontSize: 12,
        color: '#666',
    },
    cancelledChallenge: {
        opacity: 0.6,
        backgroundColor: '#f5f5f5',
    },
    cancelledText: {
        textDecorationLine: 'line-through',
        color: '#999',
    },
    statusBadge: {
        backgroundColor: '#F44336',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 4,
        marginRight: 8,
    },
    completedBadge: {
        backgroundColor: '#4CAF50',
    },
    statusBadgeText: {
        color: 'white',
        fontSize: 10,
        fontWeight: 'bold',
    },
});

export default UserProfileScreen;