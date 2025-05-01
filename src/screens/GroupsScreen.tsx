// src/screens/GroupsScreen.tsx
import React, {useState} from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {useSelector} from 'react-redux';
import {RootState} from '../app/providers/StoreProvider/store';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {FormatterService} from '../services/verification/ui/Services';
// Import the RTK Query hooks
import {Group, useGetUserGroupsQuery, useJoinGroupMutation} from '../entities/GroupState/model/slice/groupApi';

// Define the types for the navigation parameters
type RootStackParamList = {
    GroupDetails: { groupId: string };
    CreateGroup: undefined;
};

type GroupsScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;

const GroupsScreen: React.FC = () => {
    const navigation = useNavigation<GroupsScreenNavigationProp>();
    const { user } = useSelector((state: RootState) => state.auth);

    // State for filtering
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState<'ALL' | 'CHALLENGE' | 'SOCIAL'>('ALL');
    const [filterRole, setFilterRole] = useState<'ALL' | 'ADMIN' | 'MEMBER' | 'MODERATOR'>('ALL');

    // RTK Query hooks
    const { data: groups, isLoading, error, refetch } = useGetUserGroupsQuery();
    const [joinGroup, { isLoading: isJoining }] = useJoinGroupMutation();

    // Filter groups based on search term and filters
    const filteredGroups = React.useMemo(() => {
        if (!groups) return [];

        return groups.filter((group: Group) => {
            // Search term filter
            const matchesSearch =
                searchTerm === '' ||
                group.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                group.description.toLowerCase().includes(searchTerm.toLowerCase());

            // Type filter
            const matchesType =
                filterType === 'ALL' ||
                group.type === filterType;

            // Role filter
            const matchesRole =
                filterRole === 'ALL' ||
                group.role === filterRole;

            return matchesSearch && matchesType && matchesRole;
        });
    }, [groups, searchTerm, filterType, filterRole]);

    // Handle navigation to group details
    const navigateToGroupDetails = (groupId: string) => {
        // navigation.navigate('GroupDetails', { groupId });
        Alert.alert('Group Details', `Navigating to details for group ${groupId}`);
    };

    // Handle group creation
    const navigateToCreateGroup = () => {
        // navigation.navigate('CreateGroup');
        Alert.alert('Create Group', 'This would navigate to group creation screen');
    };

    // Handle joining a group
    const handleJoinGroup = async (groupId: string) => {
        try {
            await joinGroup(groupId).unwrap();
            Alert.alert('Success', 'You have joined this group!');
            refetch();
        } catch (error) {
            Alert.alert('Error', 'Failed to join group. Please try again.');
        }
    };

    // Get role badge style
    const getRoleBadgeStyle = (role: string) => {
        switch (role) {
            case 'ADMIN':
                return styles.adminBadge;
            case 'MODERATOR':
                return styles.moderatorBadge;
            case 'MEMBER':
                return styles.memberBadge;
            default:
                return {};
        }
    };

    // Get privacy icon
    const getPrivacyIcon = (privacySetting: string) => {
        switch (privacySetting) {
            case 'PUBLIC':
                return 'earth';
            case 'PRIVATE':
                return 'lock';
            case 'INVITATION_ONLY':
                return 'email-outline';
            default:
                return 'help-circle-outline';
        }
    };

    // Get type icon
    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'CHALLENGE':
                return 'trophy';
            case 'SOCIAL':
                return 'account-group';
            default:
                return 'help-circle-outline';
        }
    };

    // Render group item
    const renderGroupItem = ({ item }: { item: Group }) => {
        return (
            <TouchableOpacity
                style={styles.groupItem}
                onPress={() => navigateToGroupDetails(item.id)}
            >
                {/* Group Header */}
                <View style={styles.groupHeader}>
                    <View style={styles.groupTypeContainer}>
                        <MaterialCommunityIcons
                            name={getTypeIcon(item.type)}
                            size={16}
                            color="#4CAF50"
                        />
                        <Text style={styles.groupType}>{item.type}</Text>
                    </View>

                    <View style={styles.privacyContainer}>
                        <MaterialCommunityIcons
                            name={getPrivacyIcon(item.privacy_setting)}
                            size={16}
                            color="#757575"
                        />
                        <Text style={styles.privacyText}>
                            {item.privacy_setting.replace('_', ' ')}
                        </Text>
                    </View>
                </View>

                {/* Group Name & Description */}
                <Text style={styles.groupName}>{item.name}</Text>
                <Text style={styles.groupDescription} numberOfLines={2}>
                    {item.description}
                </Text>

                {/* Group Footer */}
                <View style={styles.groupFooter}>
                    <View style={styles.memberInfo}>
                        <MaterialCommunityIcons name="account-multiple" size={16} color="#757575" />
                        <Text style={styles.memberCount}>{item.member_count} members</Text>
                    </View>

                    <View style={styles.roleContainer}>
                        <View style={[styles.roleBadge, getRoleBadgeStyle(item.role)]}>
                            <Text style={styles.roleText}>{item.role}</Text>
                        </View>
                    </View>
                </View>

                {/* Created Date */}
                <Text style={styles.dateText}>
                    Created: {FormatterService.formatDate(item.created_at)}
                </Text>
            </TouchableOpacity>
        );
    };

    // Render loading state
    if (isLoading) {
        return (
            <SafeAreaView style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#4CAF50" />
                <Text style={styles.loadingText}>Loading groups...</Text>
            </SafeAreaView>
        );
    }

    // Render error state
    if (error) {
        return (
            <SafeAreaView style={styles.errorContainer}>
                <MaterialCommunityIcons name="alert-circle" size={48} color="#F44336" />
                <Text style={styles.errorText}>Failed to load groups.</Text>
                <TouchableOpacity style={styles.retryButton} onPress={() => refetch()}>
                    <Text style={styles.retryButtonText}>Retry</Text>
                </TouchableOpacity>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Groups</Text>
                <TouchableOpacity
                    style={styles.refreshButton}
                    onPress={() => refetch()}
                >
                    <MaterialCommunityIcons name="refresh" size={24} color="white" />
                </TouchableOpacity>
            </View>

            {/* Search Bar */}
            <View style={styles.searchContainer}>
                <View style={styles.searchInputContainer}>
                    <MaterialCommunityIcons name="magnify" size={20} color="#757575" style={styles.searchIcon} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search groups..."
                        value={searchTerm}
                        onChangeText={setSearchTerm}
                    />
                </View>
            </View>

            {/* Filter Options */}
            <View style={styles.filterContainer}>
                <Text style={styles.filterLabel}>Filter by:</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScrollView}>
                    {/* Type Filters */}
                    <View style={styles.filterGroup}>
                        <TouchableOpacity
                            style={[styles.filterButton, filterType === 'ALL' && styles.activeFilter]}
                            onPress={() => setFilterType('ALL')}
                        >
                            <Text style={[styles.filterText, filterType === 'ALL' && styles.activeFilterText]}>All</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.filterButton, filterType === 'CHALLENGE' && styles.activeFilter]}
                            onPress={() => setFilterType('CHALLENGE')}
                        >
                            <MaterialCommunityIcons name="trophy" size={16} color={filterType === 'CHALLENGE' ? 'white' : '#4CAF50'} />
                            <Text style={[styles.filterText, filterType === 'CHALLENGE' && styles.activeFilterText]}>Challenges</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.filterButton, filterType === 'SOCIAL' && styles.activeFilter]}
                            onPress={() => setFilterType('SOCIAL')}
                        >
                            <MaterialCommunityIcons name="account-group" size={16} color={filterType === 'SOCIAL' ? 'white' : '#4CAF50'} />
                            <Text style={[styles.filterText, filterType === 'SOCIAL' && styles.activeFilterText]}>Social</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Role Filters */}
                    <View style={styles.filterGroup}>
                        <TouchableOpacity
                            style={[styles.filterButton, filterRole === 'ALL' && styles.activeFilter]}
                            onPress={() => setFilterRole('ALL')}
                        >
                            <Text style={[styles.filterText, filterRole === 'ALL' && styles.activeFilterText]}>All Roles</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.filterButton, filterRole === 'ADMIN' && styles.activeFilter]}
                            onPress={() => setFilterRole('ADMIN')}
                        >
                            <Text style={[styles.filterText, filterRole === 'ADMIN' && styles.activeFilterText]}>My Groups</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.filterButton, filterRole === 'MEMBER' && styles.activeFilter]}
                            onPress={() => setFilterRole('MEMBER')}
                        >
                            <Text style={[styles.filterText, filterRole === 'MEMBER' && styles.activeFilterText]}>Joined</Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </View>

            {/* Groups List */}
            {filteredGroups.length > 0 ? (
                <FlatList
                    data={filteredGroups}
                    renderItem={renderGroupItem}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.groupList}
                />
            ) : (
                <View style={styles.emptyContainer}>
                    <MaterialCommunityIcons name="account-group" size={60} color="#e0e0e0" />
                    <Text style={styles.emptyText}>
                        {searchTerm || filterType !== 'ALL' || filterRole !== 'ALL'
                            ? 'No groups match your filters'
                            : 'You haven\'t joined any groups yet'}
                    </Text>
                    <TouchableOpacity
                        style={styles.createGroupButton}
                        onPress={navigateToCreateGroup}
                    >
                        <Text style={styles.createGroupButtonText}>Create a Group</Text>
                    </TouchableOpacity>
                </View>
            )}

            {/* Floating Action Button for Create Group */}
            <TouchableOpacity style={styles.fab} onPress={navigateToCreateGroup}>
                <Text style={styles.fabText}>+</Text>
            </TouchableOpacity>
        </SafeAreaView>
    );
};

// Styles unchanged, so I'm not including them here to save space

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        backgroundColor: '#4CAF50',
        elevation: 4,
        shadowOpacity: 0.2,
        shadowRadius: 3,
        shadowOffset: { width: 0, height: 2 },
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: 'white',
    },
    refreshButton: {
        padding: 8,
    },
    searchContainer: {
        padding: 16,
        paddingBottom: 8,
    },
    searchInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'white',
        borderRadius: 8,
        paddingHorizontal: 12,
        borderWidth: 1,
        borderColor: '#ddd',
    },
    searchIcon: {
        marginRight: 8,
    },
    searchInput: {
        flex: 1,
        height: 40,
        fontSize: 16,
        color: '#333',
    },
    filterContainer: {
        paddingHorizontal: 16,
        paddingBottom: 16,
    },
    filterLabel: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#555',
        marginBottom: 8,
    },
    filterScrollView: {
        flexDirection: 'row',
    },
    filterGroup: {
        flexDirection: 'row',
        marginRight: 16,
    },
    filterButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f0f0f0',
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 16,
        marginRight: 8,
    },
    activeFilter: {
        backgroundColor: '#4CAF50',
    },
    filterText: {
        fontSize: 14,
        color: '#555',
        marginLeft: 4,
    },
    activeFilterText: {
        color: 'white',
        fontWeight: 'bold',
    },
    groupList: {
        padding: 16,
        paddingBottom: 80, // Space for FAB
    },
    groupItem: {
        backgroundColor: 'white',
        borderRadius: 8,
        padding: 16,
        marginBottom: 12,
        elevation: 1,
        shadowOpacity: 0.1,
        shadowRadius: 2,
        shadowOffset: { width: 0, height: 1 },
    },
    groupHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    groupTypeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#E8F5E9',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
    },
    groupType: {
        fontSize: 12,
        color: '#4CAF50',
        marginLeft: 4,
        fontWeight: '500',
    },
    privacyContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    privacyText: {
        fontSize: 12,
        color: '#757575',
        marginLeft: 4,
    },
    groupName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 4,
    },
    groupDescription: {
        fontSize: 14,
        color: '#666',
        marginBottom: 12,
    },
    groupFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    memberInfo: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    memberCount: {
        fontSize: 14,
        color: '#757575',
        marginLeft: 4,
    },
    roleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    roleBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
        backgroundColor: '#f0f0f0',
    },
    adminBadge: {
        backgroundColor: '#FFF9C4',
    },
    moderatorBadge: {
        backgroundColor: '#E1F5FE',
    },
    memberBadge: {
        backgroundColor: '#F5F5F5',
    },
    roleText: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#555',
    },
    dateText: {
        fontSize: 12,
        color: '#888',
        fontStyle: 'italic',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 12,
        fontSize: 16,
        color: '#555',
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    errorText: {
        marginTop: 12,
        fontSize: 16,
        color: '#555',
        marginBottom: 16,
    },
    retryButton: {
        backgroundColor: '#4CAF50',
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 8,
    },
    retryButtonText: {
        color: 'white',
        fontWeight: 'bold',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    emptyText: {
        fontSize: 16,
        color: '#757575',
        textAlign: 'center',
        marginTop: 20,
        marginBottom: 20,
    },
    createGroupButton: {
        backgroundColor: '#4CAF50',
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 8,
    },
    createGroupButtonText: {
        color: 'white',
        fontWeight: 'bold',
    },
    fab: {
        position: 'absolute',
        bottom: 24,
        right: 24,
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: '#4CAF50',
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 6,
        shadowOpacity: 0.3,
        shadowRadius: 4,
        shadowOffset: { width: 0, height: 3 },
    },
    fabText: {
        fontSize: 24,
        fontWeight: 'bold',
        color: 'white',
    },
});

export default GroupsScreen;