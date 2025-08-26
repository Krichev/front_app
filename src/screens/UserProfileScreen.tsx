import React, {useState} from 'react';
import {
    ActivityIndicator,
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
import {useGetChallengesQuery} from '../entities/ChallengeState/model/slice/challengeApi';
import {NativeStackNavigationProp} from "react-native-screens/native-stack";
import {useSelector} from 'react-redux';
import {RootState} from '../app/providers/StoreProvider/store';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

// Define the types for the navigation parameters
type RootStackParamList = {
    Home: undefined;
    Challenges: undefined;
    ChallengeDetails: { challengeId: string };
    UserProfile: { userId: string };
    EditProfile: { userId: string };
};

type UserProfileRouteProp = RouteProp<RootStackParamList, 'UserProfile'>;
type UserProfileNavigationProp = NativeStackNavigationProp<RootStackParamList, 'UserProfile'>;

interface UserProfile {
    id: string;
    username: string;
    email: string;
    bio?: string;
    avatar?: string;
    createdAt: string;
    statsCompleted?: number;
    statsCreated?: number;
    statsSuccess?: number;
}

const UserProfileScreen: React.FC = () => {
    const route = useRoute<UserProfileRouteProp>();
    const navigation = useNavigation<UserProfileNavigationProp>();
    const { userId } = route.params;
    const { user: currentUser } = useSelector((state: RootState) => state.auth);

    // State for tab selection
    const [activeTab, setActiveTab] = useState<'created' | 'joined'>('created');
    const [refreshing, setRefreshing] = useState(false);

    // RTK Query hooks with proper error handling
    const {
        data: user,
        isLoading: loadingUser,
        error: userError,
        refetch: refetchUser
    } = useGetUserProfileQuery(userId, {
        // Enable refetching when user comes back to this screen
        refetchOnMountOrArgChange: true,
    });

    const {
        data: userStats,
        isLoading: loadingStats,
        refetch: refetchStats
    } = useGetUserStatsQuery(userId, {
        refetchOnMountOrArgChange: true,
    });

    const {
        data: createdChallenges,
        isLoading: loadingCreated,
        refetch: refetchCreated
    } = useGetChallengesQuery({
        creator_id: userId,
    });

    const {
        data: joinedChallenges,
        isLoading: loadingJoined,
        refetch: refetchJoined
    } = useGetChallengesQuery({
        participant_id: userId,
    });

    // Check if this is the current user's profile
    const isCurrentUser = currentUser?.id === userId;

    // Handle refresh
    const onRefresh = async () => {
        setRefreshing(true);
        try {
            await Promise.all([
                refetchUser(),
                refetchStats(),
                refetchCreated(),
                refetchJoined(),
            ]);
        } catch (error) {
            console.error('Error refreshing profile:', error);
        } finally {
            setRefreshing(false);
        }
    };

    // Handle editing profile
    const handleEditProfile = () => {
        navigation.navigate('EditProfile', { userId });
    };

    // Handle challenge tap
    const navigateToChallengeDetails = (challengeId: string) => {
        navigation.navigate('ChallengeDetails', { challengeId });
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

    // Render challenge item
    const renderChallengeItem = ({ item }: { item: any }) => (
        <TouchableOpacity
            style={styles.challengeItem}
            onPress={() => navigateToChallengeDetails(item.id)}
        >
            <View style={styles.challengeHeader}>
                <Text style={styles.challengeTitle}>{item.title}</Text>
                <View style={[styles.statusBadge, getStatusBadgeStyle(item.status)]}>
                    <Text style={[styles.statusText, getStatusTextStyle(item.status)]}>
                        {item.status}
                    </Text>
                </View>
            </View>
            {item.description && (
                <Text style={styles.challengeDescription} numberOfLines={2}>
                    {item.description}
                </Text>
            )}
            <View style={styles.challengeFooter}>
                <Text style={styles.challengeType}>{item.type}</Text>
                <Text style={styles.challengeDate}>
                    Created: {formatDate(item.created_at)}
                </Text>
            </View>
        </TouchableOpacity>
    );

    // Get status badge styling
    const getStatusBadgeStyle = (status: string) => {
        switch (status?.toLowerCase()) {
            case 'completed':
                return { backgroundColor: '#4CAF50' };
            case 'in_progress':
                return { backgroundColor: '#FF9800' };
            case 'open':
                return { backgroundColor: '#2196F3' };
            default:
                return { backgroundColor: '#757575' };
        }
    };

    const getStatusTextStyle = (status: string) => {
        return { color: 'white' };
    };

    // Get current challenges to display
    const currentChallenges = activeTab === 'created' ? createdChallenges : joinedChallenges;
    const isLoadingChallenges = activeTab === 'created' ? loadingCreated : loadingJoined;

    // Check if user has bio for conditional styling
    const hasBio = user && user.bio && user.bio.trim() !== '';

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
            >
                {/* Profile Header */}
                <View style={styles.profileHeader}>
                    <View style={styles.avatarContainer}>
                        {user.avatar ? (
                            <Image source={{ uri: user.avatar }} style={styles.avatar} />
                        ) : (
                            <View style={styles.avatarPlaceholder}>
                                <Text style={styles.avatarText}>
                                    {user.username ? user.username.charAt(0).toUpperCase() : 'U'}
                                </Text>
                            </View>
                        )}
                    </View>
                    <Text style={styles.username}>{user.username}</Text>
                    <Text style={styles.joinDate}>{formatJoinDate(user.createdAt)}</Text>

                    {isCurrentUser && (
                        <TouchableOpacity style={styles.editButton} onPress={handleEditProfile}>
                            <MaterialCommunityIcons name="pencil" size={16} color="white" />
                            <Text style={styles.editButtonText}>Edit Profile</Text>
                        </TouchableOpacity>
                    )}
                </View>

                {/* Bio Section */}
                {hasBio && (
                    <View style={styles.bioSection}>
                        <Text style={styles.bioLabel}>About</Text>
                        <Text style={styles.bioText}>{user.bio}</Text>
                    </View>
                )}

                {/* Stats Section */}
                <View style={hasBio ? styles.statsContainer : styles.statsContainerNoBio}>
                    <View style={styles.statItem}>
                        <Text style={styles.statNumber}>
                            {userStats?.created || 0}
                        </Text>
                        <Text style={styles.statLabel}>Created</Text>
                    </View>
                    <View style={styles.statItem}>
                        <Text style={styles.statNumber}>
                            {userStats?.completed || 0}
                        </Text>
                        <Text style={styles.statLabel}>Completed</Text>
                    </View>
                    <View style={styles.statItem}>
                        <Text style={styles.statNumber}>
                            {userStats?.success ? `${Math.round(userStats.success)}%` : '0%'}
                        </Text>
                        <Text style={styles.statLabel}>Success Rate</Text>
                    </View>
                </View>

                {/* Tabs */}
                <View style={styles.tabContainer}>
                    <TouchableOpacity
                        style={[
                            styles.tabButton,
                            activeTab === 'created' && styles.activeTabButton,
                        ]}
                        onPress={() => setActiveTab('created')}
                    >
                        <Text
                            style={[
                                styles.tabText,
                                activeTab === 'created' && styles.activeTabText,
                            ]}
                        >
                            Created ({createdChallenges?.length || 0})
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[
                            styles.tabButton,
                            activeTab === 'joined' && styles.activeTabButton,
                        ]}
                        onPress={() => setActiveTab('joined')}
                    >
                        <Text
                            style={[
                                styles.tabText,
                                activeTab === 'joined' && styles.activeTabText,
                            ]}
                        >
                            Joined ({joinedChallenges?.length || 0})
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* Challenges List */}
                <View style={styles.challengesContainer}>
                    {isLoadingChallenges ? (
                        <View style={styles.loadingChallenges}>
                            <ActivityIndicator size="small" color="#4CAF50" />
                            <Text style={styles.loadingText}>Loading challenges...</Text>
                        </View>
                    ) : currentChallenges && currentChallenges.length > 0 ? (
                        <FlatList
                            data={currentChallenges}
                            renderItem={renderChallengeItem}
                            keyExtractor={(item) => item.id}
                            scrollEnabled={false}
                            ItemSeparatorComponent={() => <View style={styles.separator} />}
                        />
                    ) : (
                        <View style={styles.emptyState}>
                            <MaterialCommunityIcons
                                name={activeTab === 'created' ? 'plus-circle-outline' : 'account-plus-outline'}
                                size={48}
                                color="#ccc"
                            />
                            <Text style={styles.emptyText}>
                                {activeTab === 'created'
                                    ? isCurrentUser
                                        ? "You haven't created any challenges yet"
                                        : "This user hasn't created any challenges yet"
                                    : isCurrentUser
                                        ? "You haven't joined any challenges yet"
                                        : "This user hasn't joined any challenges yet"
                                }
                            </Text>
                        </View>
                    )}
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
    profileHeader: {
        backgroundColor: '#4CAF50',
        paddingTop: 40,
        paddingBottom: 24,
        alignItems: 'center',
    },
    avatarContainer: {
        marginBottom: 12,
    },
    avatar: {
        width: 80,
        height: 80,
        borderRadius: 40,
        borderWidth: 3,
        borderColor: 'white',
    },
    avatarPlaceholder: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: 'rgba(255, 255, 255, 0.3)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 3,
        borderColor: 'white',
    },
    avatarText: {
        fontSize: 32,
        fontWeight: 'bold',
        color: 'white',
    },
    username: {
        fontSize: 24,
        fontWeight: 'bold',
        color: 'white',
        marginBottom: 4,
    },
    joinDate: {
        fontSize: 14,
        color: 'rgba(255, 255, 255, 0.8)',
        marginBottom: 16,
    },
    editButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.3)',
    },
    editButtonText: {
        color: 'white',
        fontWeight: '600',
        marginLeft: 4,
    },
    bioSection: {
        backgroundColor: 'white',
        padding: 16,
        marginHorizontal: 16,
        marginTop: -12,
        borderRadius: 8,
        elevation: 2,
        shadowOpacity: 0.1,
        shadowRadius: 2,
        shadowOffset: { width: 0, height: 1 },
    },
    bioLabel: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 8,
    },
    bioText: {
        fontSize: 14,
        lineHeight: 20,
        color: '#555',
    },
    statsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        padding: 16,
        backgroundColor: 'white',
        margin: 16,
        marginTop: 8,
        borderRadius: 8,
        elevation: 1,
        shadowOpacity: 0.1,
        shadowRadius: 2,
        shadowOffset: { width: 0, height: 1 },
    },
    statsContainerNoBio: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        padding: 16,
        backgroundColor: 'white',
        margin: 16,
        marginTop: 16,
        borderRadius: 8,
        elevation: 1,
        shadowOpacity: 0.1,
        shadowRadius: 2,
        shadowOffset: { width: 0, height: 1 },
    },
    statItem: {
        alignItems: 'center',
    },
    statNumber: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#4CAF50',
    },
    statLabel: {
        fontSize: 12,
        color: '#757575',
        marginTop: 4,
    },
    tabContainer: {
        flexDirection: 'row',
        marginHorizontal: 16,
        backgroundColor: 'white',
        borderRadius: 8,
        overflow: 'hidden',
        elevation: 1,
        shadowOpacity: 0.1,
        shadowRadius: 2,
        shadowOffset: { width: 0, height: 1 },
    },
    tabButton: {
        flex: 1,
        paddingVertical: 16,
        alignItems: 'center',
        borderBottomWidth: 3,
        borderBottomColor: 'transparent',
    },
    activeTabButton: {
        borderBottomColor: '#4CAF50',
    },
    tabText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#757575',
    },
    activeTabText: {
        color: '#4CAF50',
    },
    challengesContainer: {
        padding: 16,
        paddingTop: 8,
    },
    challengeItem: {
        backgroundColor: 'white',
        borderRadius: 8,
        padding: 16,
        elevation: 1,
        shadowOpacity: 0.1,
        shadowRadius: 2,
        shadowOffset: { width: 0, height: 1 },
    },
    challengeHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 8,
    },
    challengeTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
        flex: 1,
        marginRight: 8,
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    statusText: {
        fontSize: 10,
        fontWeight: '600',
        textTransform: 'uppercase',
    },
    challengeDescription: {
        fontSize: 14,
        color: '#666',
        marginBottom: 8,
        lineHeight: 18,
    },
    challengeFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    challengeType: {
        fontSize: 12,
        color: '#4CAF50',
        fontWeight: '600',
        textTransform: 'uppercase',
    },
    challengeDate: {
        fontSize: 12,
        color: '#757575',
    },
    separator: {
        height: 12,
    },
    emptyState: {
        alignItems: 'center',
        paddingVertical: 32,
    },
    emptyText: {
        textAlign: 'center',
        fontSize: 16,
        color: '#757575',
        marginTop: 12,
        maxWidth: 250,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f5f5f5',
    },
    loadingChallenges: {
        alignItems: 'center',
        paddingVertical: 20,
    },
    loadingText: {
        marginTop: 8,
        fontSize: 14,
        color: '#666',
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f5f5f5',
        padding: 16,
    },
    errorText: {
        fontSize: 16,
        color: '#F44336',
        textAlign: 'center',
        marginVertical: 16,
    },
    retryButton: {
        backgroundColor: '#4CAF50',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 8,
    },
    retryButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },
});

export default UserProfileScreen;