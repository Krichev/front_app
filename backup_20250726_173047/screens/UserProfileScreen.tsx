import React, {useState} from 'react';
import {
    ActivityIndicator,
    Image,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import {RouteProp, useNavigation, useRoute} from '@react-navigation/native';
import {useGetUserProfileQuery} from '../entities/UserState/model/slice/userApi';
import {useGetChallengesQuery} from '../entities/ChallengeState/model/slice/challengeApi';
import {NativeStackNavigationProp} from "react-native-screens/native-stack";

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

    // State for tab selection
    const [activeTab, setActiveTab] = useState<'created' | 'joined'>('created');

    // RTK Query hooks
    const { data: user, isLoading: loadingUser, error: userError } = useGetUserProfileQuery(userId);

    const { data: createdChallenges, isLoading: loadingCreated } = useGetChallengesQuery({
        creator_id: userId,
    });

    const { data: joinedChallenges, isLoading: loadingJoined } = useGetChallengesQuery({
        participant_id: userId,
    });

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

    // Check if this is the current user's profile
    const isCurrentUser = true; // Replace with actual auth check in a real app

    // Render loading state
    if (loadingUser) {
        return (
            <SafeAreaView style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#4CAF50" />
            </SafeAreaView>
        );
    }

    // Render error state
    if (userError || !user) {
        return (
            <SafeAreaView style={styles.errorContainer}>
                <Text style={styles.errorText}>Failed to load user profile.</Text>
            </SafeAreaView>
        );
    }

    // Render challenge item
    const renderChallengeItem = ({ item }: { item: any }) => (
        <TouchableOpacity
            style={styles.challengeItem}
            onPress={() => navigateToChallengeDetails(item.id)}
        >
            <Text style={styles.challengeTitle}>{item.title}</Text>
            <Text style={styles.challengeType}>{item.type}</Text>
            <Text style={styles.challengeDate}>Created: {formatDate(item.created_at)}</Text>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView>
                {/* Profile Header */}
                <View style={styles.profileHeader}>
                    <View style={styles.avatarContainer}>
                        {user.avatar ? (
                            <Image source={{ uri: user.avatar }} style={styles.avatar} />
                        ) : (
                            <View style={styles.avatarPlaceholder}>
                                <Text style={styles.avatarText}>{user.username.charAt(0).toUpperCase()}</Text>
                            </View>
                        )}
                    </View>
                    <Text style={styles.username}>{user.username}</Text>
                    <Text style={styles.joinDate}>Member since {formatDate(user.createdAt)}</Text>

                    {isCurrentUser && (
                        <TouchableOpacity style={styles.editButton} onPress={handleEditProfile}>
                            <Text style={styles.editButtonText}>Edit Profile</Text>
                        </TouchableOpacity>
                    )}
                </View>

                {/* User Bio */}
                {user.bio && (
                    <View style={styles.bioSection}>
                        <Text style={styles.bioText}>{user.bio}</Text>
                    </View>
                )}

                {/* Stats */}
                <View style={styles.statsContainer}>
                    <View style={styles.statItem}>
                        <Text style={styles.statNumber}>{user.statsCreated || 0}</Text>
                        <Text style={styles.statLabel}>Created</Text>
                    </View>
                    <View style={styles.statItem}>
                        <Text style={styles.statNumber}>{user.statsCompleted || 0}</Text>
                        <Text style={styles.statLabel}>Completed</Text>
                    </View>
                    <View style={styles.statItem}>
                        <Text style={styles.statNumber}>{user.statsSuccess || 0}%</Text>
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
                            Created
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
                            Joined
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* Challenge Lists */}
                <View style={styles.challengesContainer}>
                    {activeTab === 'created' ? (
                        loadingCreated ? (
                            <ActivityIndicator size="small" color="#4CAF50" />
                        ) : createdChallenges && createdChallenges.length > 0 ? (
                            createdChallenges.map((challenge) => (
                                <View key={challenge.id}>
                                    {renderChallengeItem({ item: challenge })}
                                </View>
                            ))
                        ) : (
                            <Text style={styles.emptyText}>No challenges created</Text>
                        )
                    ) : loadingJoined ? (
                        <ActivityIndicator size="small" color="#4CAF50" />
                    ) : joinedChallenges && joinedChallenges.length > 0 ? (
                        joinedChallenges.map((challenge) => (
                            <View key={challenge.id}>
                                {renderChallengeItem({ item: challenge })}
                            </View>
                        ))
                    ) : (
                        <Text style={styles.emptyText}>No challenges joined</Text>
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
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    errorText: {
        fontSize: 16,
        color: '#d32f2f',
        marginBottom: 16,
    },
    profileHeader: {
        alignItems: 'center',
        padding: 20,
        backgroundColor: '#4CAF50',
    },
    avatarContainer: {
        marginBottom: 12,
    },
    avatar: {
        width: 100,
        height: 100,
        borderRadius: 50,
        borderWidth: 3,
        borderColor: 'white',
    },
    avatarPlaceholder: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: 'rgba(255, 255, 255, 0.3)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 3,
        borderColor: 'white',
    },
    avatarText: {
        fontSize: 40,
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
        marginBottom: 12,
    },
    editButton: {
        backgroundColor: 'rgba(255, 255, 255, 0.3)',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
    },
    editButtonText: {
        color: 'white',
        fontWeight: '600',
    },
    bioSection: {
        backgroundColor: 'white',
        padding: 16,
        marginHorizontal: 16,
        marginTop: -20,
        borderRadius: 8,
        elevation: 2,
        shadowOpacity: 0.1,
        shadowRadius: 2,
        shadowOffset: { width: 0, height: 1 },
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
        fontSize: 18,
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
        paddingVertical: 12,
        alignItems: 'center',
        borderBottomWidth: 2,
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
    },
    challengeItem: {
        backgroundColor: 'white',
        borderRadius: 8,
        padding: 16,
        marginBottom: 12,
        elevation: 1,
        shadowOpacity: 0.1,
        shadowRadius: 2,
        shadowOffset: { width: 0, height: 1 },
    },
    challengeTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 4,
        color: '#333',
    },
    challengeType: {
        fontSize: 12,
        color: '#757575',
        marginBottom: 4,
    },
    challengeDate: {
        fontSize: 12,
        color: '#757575',
    },
    emptyText: {
        textAlign: 'center',
        padding: 16,
        color: '#757575',
    },
});

export default UserProfileScreen;