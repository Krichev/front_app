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
    useGetContactGroupsQuery,
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
    const [activeCategory, setActiveCategory] = useState('ALL');
    const [searchQuery, setSearchQuery] = useState('');
    const [sortBy, setSortBy] = useState<'name_asc' | 'date_desc'>('name_asc');

    const {
        data: relationshipPage,
        isLoading,
        isFetching,
        refetch
    } = useGetRelationshipsQuery({
        type: activeCategory !== 'ALL' && activeCategory !== 'FAVORITES' ? activeCategory as RelationshipType : undefined,
        status: RelationshipStatus.ACCEPTED,
        sort: sortBy,
        size: 100
    });

    const [toggleFavorite] = useToggleFavoriteMutation();
    const [removeRelationship] = useRemoveRelationshipMutation();

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

    const handleToggleFavorite = async (id: string) => {
        try {
            await toggleFavorite(id).unwrap();
        } catch (error) {
            Alert.alert('Error', 'Failed to update favorite status');
        }
    };

    const handleRemove = (id: string, name: string) => {
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
                    }
                }
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
                        name={item.isFavorite ? "star" : "star-outline"} 
                        size={22} 
                        color={item.isFavorite ? "#FFD700" : "#ccc"} 
                    />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleRemove(item.id, item.relatedUserUsername)} style={styles.actionButton}>
                    <Icon name="trash-outline" size={22} color="#ff4444" />
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
                                activeCategory === item.id && styles.activeCategoryTab
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
                                activeCategory === item.id && styles.activeCategoryLabel
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
                    <RefreshControl refreshing={isFetching} onRefresh={refetch} />
                }
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        {isLoading ? (
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
