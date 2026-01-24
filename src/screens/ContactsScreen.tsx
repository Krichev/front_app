import React, { useState, useMemo } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    RefreshControl,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
    Image,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import {
    useGetRelationshipsQuery,
    useAcceptRelationshipMutation,
    useRejectRelationshipMutation,
    useRemoveRelationshipMutation,
    useToggleFavoriteMutation,
} from '../entities/UserState/model/slice/relationshipApi';
import {
    RelationshipStatus,
    RelationshipType,
    UserRelationship,
} from '../entities/QuizState/model/types/question.types';

const CATEGORIES = [
    { id: 'ALL', label: 'All', icon: 'people' },
    { id: 'FRIEND', label: 'Friends', icon: 'person' },
    { id: 'FAMILY', label: 'Family', icon: 'heart' },
    { id: 'COLLEAGUE', label: 'Work', icon: 'briefcase' },
    { id: 'FAVORITES', label: 'Favorites', icon: 'star' },
];

export const ContactsScreen: React.FC = () => {
    const [viewMode, setViewMode] = useState<'contacts' | 'requests'>('contacts');
    const [activeCategory, setActiveCategory] = useState('ALL');
    const [searchQuery, setSearchQuery] = useState('');
    const [sortBy, setSortBy] = useState<'name_asc' | 'date_desc'>('name_asc');

    // Contacts Query
    const {
        data: relationshipPage,
        isLoading: isLoadingContacts,
        isFetching: isFetchingContacts,
        refetch: refetchContacts,
    } = useGetRelationshipsQuery({
        type: activeCategory !== 'ALL' && activeCategory !== 'FAVORITES' ? activeCategory as RelationshipType : undefined,
        status: RelationshipStatus.ACCEPTED,
        sort: sortBy,
        size: 100,
    });

    // Pending Requests Query
    const {
        data: pendingRequestsPage,
        isLoading: isLoadingPending,
        isFetching: isFetchingPending,
        refetch: refetchPending,
    } = useGetRelationshipsQuery({
        status: RelationshipStatus.PENDING,
        sort: 'date_desc',
        size: 100,
    });

    const [toggleFavorite, { isLoading: isTogglingFavorite }] = useToggleFavoriteMutation();
    const [removeRelationship, { isLoading: isRemoving }] = useRemoveRelationshipMutation();
    const [acceptRelationship, { isLoading: isAccepting }] = useAcceptRelationshipMutation();
    const [rejectRelationship, { isLoading: isRejecting }] = useRejectRelationshipMutation();

    const relationships = useMemo(() => {
        let items = relationshipPage?.content || [];

        if (activeCategory === 'FAVORITES') {
            items = items.filter(r => r.isFavorite);
        }

        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            items = items.filter(r =>
                r.relatedUserUsername.toLowerCase().includes(query) ||
                (r.nickname && r.nickname.toLowerCase().includes(query))
            );
        }

        return items;
    }, [relationshipPage, activeCategory, searchQuery]);

    const pendingRequests = pendingRequestsPage?.content || [];

    const handleToggleFavorite = async (id: string) => {
        if (isTogglingFavorite) {return;}
        try {
            await toggleFavorite(id).unwrap();
        } catch (error) {
            Alert.alert('Error', 'Failed to update favorite status');
        }
    };

    const handleRemove = (id: string, name: string) => {
        if (isRemoving) {return;}
        Alert.alert(
            'Remove Contact',
            `Are you sure you want to remove ${name}?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Remove',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await removeRelationship(id).unwrap();
                        } catch (error) {
                            Alert.alert('Error', 'Failed to remove contact');
                        }
                    },
                },
            ]
        );
    };

    const handleAcceptRequest = async (id: string) => {
        if (isAccepting) {return;}
        try {
            await acceptRelationship(id).unwrap();
            // Automatically switch to contacts view to see new friend? Optional.
        } catch (error) {
            Alert.alert('Error', 'Failed to accept request');
        }
    };

    const handleRejectRequest = (id: string) => {
        if (isRejecting) {return;}
        Alert.alert(
            'Reject Request',
            'Are you sure you want to reject this request?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Reject',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await rejectRelationship(id).unwrap();
                        } catch (error) {
                            Alert.alert('Error', 'Failed to reject request');
                        }
                    },
                },
            ]
        );
    };

    const renderContactItem = ({ item }: { item: UserRelationship }) => (
        <View style={styles.contactCard}>
            <View style={styles.avatarContainer}>
                {item.relatedUserAvatar ? (
                    <Image source={{ uri: item.relatedUserAvatar }} style={styles.avatar} />
                ) : (
                    <View style={styles.avatarPlaceholder}>
                        <Text style={styles.avatarInitial}>
                            {item.relatedUserUsername.charAt(0).toUpperCase()}
                        </Text>
                    </View>
                )}
            </View>

            <View style={styles.contactInfo}>
                <Text style={styles.contactName}>
                    {item.nickname || item.relatedUserUsername}
                </Text>
                {item.nickname && (
                    <Text style={styles.username}>@{item.relatedUserUsername}</Text>
                )}
                <View style={styles.badgeContainer}>
                    <View style={[styles.typeBadge, { backgroundColor: getTypeColor(item.relationshipType) }]}>
                        <Text style={styles.typeBadgeText}>{item.relationshipType}</Text>
                    </View>
                </View>
            </View>

            <View style={styles.actions}>
                <TouchableOpacity onPress={() => handleToggleFavorite(item.id)} style={styles.actionButton}>
                    <Icon
                        name={item.isFavorite ? 'star' : 'star-outline'}
                        size={22}
                        color={item.isFavorite ? '#FFD700' : '#ccc'}
                    />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleRemove(item.id, item.relatedUserUsername)} style={styles.actionButton}>
                    <Icon name="trash-outline" size={22} color="#ff4444" />
                </TouchableOpacity>
            </View>
        </View>
    );

    const renderPendingRequestCard = ({ item }: { item: UserRelationship }) => (
        <View style={styles.requestCard}>
            <View style={styles.avatarContainer}>
                {item.relatedUserAvatar ? (
                    <Image source={{ uri: item.relatedUserAvatar }} style={styles.avatar} />
                ) : (
                    <View style={[styles.avatarPlaceholder, { backgroundColor: '#fff3cd' }]}>
                        <Text style={[styles.avatarInitial, { color: '#ffc107' }]}>
                            {item.relatedUserUsername.charAt(0).toUpperCase()}
                        </Text>
                    </View>
                )}
            </View>

            <View style={styles.contactInfo}>
                <Text style={styles.contactName}>
                    {item.relatedUserUsername}
                </Text>
                <Text style={styles.requestText}>
                    wants to connect as {item.relationshipType}
                </Text>
            </View>

            <View style={styles.actions}>
                <TouchableOpacity onPress={() => handleAcceptRequest(item.id)} style={styles.actionButton}>
                    <Icon name="checkmark-circle" size={28} color="#4CAF50" />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleRejectRequest(item.id)} style={styles.actionButton}>
                    <Icon name="close-circle" size={28} color="#ff4444" />
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Contacts</Text>
                <TouchableOpacity style={styles.addButton}>
                    <Icon name="person-add" size={24} color="#007AFF" />
                </TouchableOpacity>
            </View>

            <View style={styles.tabContainer}>
                <TouchableOpacity
                    style={[styles.tab, viewMode === 'contacts' && styles.activeTab]}
                    onPress={() => setViewMode('contacts')}
                >
                    <Text style={[styles.tabText, viewMode === 'contacts' && styles.activeTabText]}>
                        Contacts
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tab, viewMode === 'requests' && styles.activeTab]}
                    onPress={() => setViewMode('requests')}
                >
                    <Text style={[styles.tabText, viewMode === 'requests' && styles.activeTabText]}>
                        Requests
                    </Text>
                    {pendingRequests.length > 0 && (
                        <View style={styles.badge}>
                            <Text style={styles.badgeText}>{pendingRequests.length}</Text>
                        </View>
                    )}
                </TouchableOpacity>
            </View>

            {viewMode === 'contacts' ? (
                <>
                    <View style={styles.searchSection}>
                        <View style={styles.searchBar}>
                            <Icon name="search" size={20} color="#999" />
                            <TextInput
                                style={styles.searchInput}
                                placeholder="Search contacts..."
                                value={searchQuery}
                                onChangeText={setSearchQuery}
                            />
                        </View>
                        <TouchableOpacity
                            style={styles.sortButton}
                            onPress={() => setSortBy(sortBy === 'name_asc' ? 'date_desc' : 'name_asc')}
                        >
                            <Icon name="swap-vertical" size={20} color="#007AFF" />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.categoryContainer}>
                        <FlatList
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            data={CATEGORIES}
                            keyExtractor={(item) => item.id}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    style={[
                                        styles.categoryTab,
                                        activeCategory === item.id && styles.activeCategoryTab,
                                    ]}
                                    onPress={() => setActiveCategory(item.id)}
                                >
                                    <Icon
                                        name={item.icon}
                                        size={18}
                                        color={activeCategory === item.id ? '#fff' : '#666'}
                                    />
                                    <Text style={[
                                        styles.categoryLabel,
                                        activeCategory === item.id && styles.activeCategoryLabel,
                                    ]}>
                                        {item.label}
                                    </Text>
                                </TouchableOpacity>
                            )}
                            contentContainerStyle={styles.categoryList}
                        />
                    </View>

                    <FlatList
                        data={relationships}
                        renderItem={renderContactItem}
                        keyExtractor={(item) => item.id}
                        contentContainerStyle={styles.listContent}
                        refreshControl={
                            <RefreshControl refreshing={isFetchingContacts} onRefresh={refetchContacts} />
                        }
                        ListEmptyComponent={
                            <View style={styles.emptyContainer}>
                                {isLoadingContacts ? (
                                    <ActivityIndicator size="large" color="#007AFF" />
                                ) : (
                                    <>
                                        <Icon name="people-outline" size={64} color="#ccc" />
                                        <Text style={styles.emptyText}>No contacts found</Text>
                                    </>
                                )}
                            </View>
                        }
                    />
                </>
            ) : (
                <FlatList
                    data={pendingRequests}
                    renderItem={renderPendingRequestCard}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.listContent}
                    refreshControl={
                        <RefreshControl refreshing={isFetchingPending} onRefresh={refetchPending} />
                    }
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            {isLoadingPending ? (
                                <ActivityIndicator size="large" color="#007AFF" />
                            ) : (
                                <>
                                    <Icon name="mail-open-outline" size={64} color="#ccc" />
                                    <Text style={styles.emptyText}>No pending requests</Text>
                                </>
                            )}
                        </View>
                    }
                />
            )}
        </View>
    );
};

const getTypeColor = (type: RelationshipType) => {
    switch (type) {
        case RelationshipType.FRIEND: return '#4CAF50';
        case RelationshipType.CLOSE_FRIEND: return '#E91E63';
        case RelationshipType.FAMILY_PARENT:
        case RelationshipType.FAMILY_SIBLING:
        case RelationshipType.FAMILY_EXTENDED: return '#FF9800';
        case RelationshipType.COLLEAGUE: return '#2196F3';
        case RelationshipType.PARTNER: return '#9C27B0';
        default: return '#9e9e9e';
    }
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 60,
        paddingBottom: 20,
        backgroundColor: '#fff',
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#1a1a1a',
    },
    addButton: {
        padding: 8,
    },
    tabContainer: {
        flexDirection: 'row',
        padding: 16,
        backgroundColor: '#fff',
        gap: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    tab: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
        borderRadius: 8,
        backgroundColor: '#f8f9fa',
    },
    activeTab: {
        backgroundColor: '#e7f1ff',
    },
    tabText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#666',
    },
    activeTabText: {
        color: '#007AFF',
    },
    badge: {
        backgroundColor: '#ff4444',
        borderRadius: 10,
        paddingHorizontal: 6,
        paddingVertical: 2,
        marginLeft: 8,
    },
    badgeText: {
        color: '#fff',
        fontSize: 11,
        fontWeight: 'bold',
    },
    searchSection: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#fff',
        alignItems: 'center',
        gap: 12,
    },
    searchBar: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f1f3f5',
        borderRadius: 10,
        paddingHorizontal: 12,
        height: 44,
    },
    searchInput: {
        flex: 1,
        marginLeft: 8,
        fontSize: 16,
    },
    sortButton: {
        padding: 10,
        backgroundColor: '#e7f1ff',
        borderRadius: 10,
    },
    categoryContainer: {
        backgroundColor: '#fff',
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    categoryList: {
        paddingHorizontal: 16,
        gap: 8,
    },
    categoryTab: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: '#f1f3f5',
        marginRight: 8,
        gap: 6,
    },
    activeCategoryTab: {
        backgroundColor: '#007AFF',
    },
    categoryLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#666',
    },
    activeCategoryLabel: {
        color: '#fff',
    },
    listContent: {
        padding: 16,
    },
    contactCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 12,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
    },
    requestCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 12,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
        borderWidth: 1,
        borderColor: '#ffeeba',
    },
    avatarContainer: {
        marginRight: 12,
    },
    avatar: {
        width: 50,
        height: 50,
        borderRadius: 25,
    },
    avatarPlaceholder: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: '#e7f1ff',
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarInitial: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#007AFF',
    },
    contactInfo: {
        flex: 1,
    },
    contactName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1a1a1a',
    },
    username: {
        fontSize: 13,
        color: '#868e96',
        marginTop: 2,
    },
    requestText: {
        fontSize: 13,
        color: '#666',
        marginTop: 2,
    },
    badgeContainer: {
        flexDirection: 'row',
        marginTop: 6,
    },
    typeBadge: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 4,
    },
    typeBadgeText: {
        fontSize: 10,
        fontWeight: 'bold',
        color: '#fff',
    },
    actions: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    actionButton: {
        padding: 8,
        marginLeft: 4,
    },
    emptyContainer: {
        padding: 60,
        alignItems: 'center',
        justifyContent: 'center',
    },
    emptyText: {
        marginTop: 12,
        fontSize: 16,
        color: '#adb5bd',
    },
});
