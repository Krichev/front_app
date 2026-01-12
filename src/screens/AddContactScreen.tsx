import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
    Image,
    Modal,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useSearchUsersQuery } from '../entities/UserState/model/slice/userApi';
import { useCreateRelationshipMutation } from '../entities/UserState/model/slice/relationshipApi';
import { 
    RelationshipType, 
    UserSearchResult 
} from '../entities/QuizState/model/types/question.types';

export const AddContactScreen: React.FC = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedQuery, setDebouncedQuery] = useState('');
    const [selectedUser, setSelectedUser] = useState<UserSearchResult | null>(null);
    const [showTypePicker, setShowTypePicker] = useState(false);
    const [nickname, setNickname] = useState('');

    const { data: searchResults, isFetching } = useSearchUsersQuery(
        { q: debouncedQuery, excludeConnected: true },
        { skip: debouncedQuery.length < 2 }
    );

    const [createRelationship, { isLoading: isCreating }] = useCreateRelationshipMutation();

    const handleSearch = (text: string) => {
        setSearchQuery(text);
        if (text.length >= 2) {
            // Simple debounce
            const timer = setTimeout(() => setDebouncedQuery(text), 500);
            return () => clearTimeout(timer);
        } else {
            setDebouncedQuery('');
        }
    };

    const handleSelectUser = (user: UserSearchResult) => {
        setSelectedUser(user);
        setShowTypePicker(true);
    };

    const handleSendRequest = async (type: RelationshipType) => {
        if (!selectedUser) return;

        try {
            await createRelationship({
                relatedUserId: selectedUser.id,
                relationshipType: type,
                nickname: nickname.trim() || undefined
            }).unwrap();

            Alert.alert('Success', `Relationship request sent to ${selectedUser.username}`);
            setShowTypePicker(false);
            setSelectedUser(null);
            setNickname('');
        } catch (error) {
            Alert.alert('Error', 'Failed to send request');
        }
    };

    const renderUserItem = ({ item }: { item: UserSearchResult }) => (
        <View style={styles.userCard}>
            <View style={styles.avatarContainer}>
                {item.avatar ? (
                    <Image source={{ uri: item.avatar }} style={styles.avatar} />
                ) : (
                    <View style={styles.avatarPlaceholder}>
                        <Icon name="person" size={24} color="#007AFF" />
                    </View>
                )}
            </View>
            <View style={styles.userInfo}>
                <Text style={styles.username}>{item.username}</Text>
                {item.mutualConnectionsCount > 0 && (
                    <Text style={styles.mutualText}>{item.mutualConnectionsCount} mutual connections</Text>
                )}
            </View>
            <TouchableOpacity 
                style={styles.addButton}
                onPress={() => handleSelectUser(item)}
            >
                <Icon name="person-add" size={20} color="#fff" />
                <Text style={styles.addButtonText}>Add</Text>
            </TouchableOpacity>
        </View>
    );

    return (
        <View style={styles.container}>
            <View style={styles.searchHeader}>
                <View style={styles.searchBar}>
                    <Icon name="search" size={20} color="#999" />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search by username or email..."
                        value={searchQuery}
                        onChangeText={handleSearch}
                        autoFocus
                    />
                    {isFetching && <ActivityIndicator size="small" color="#007AFF" />}
                </View>
            </View>

            <FlatList
                data={searchResults?.content || []}
                renderItem={renderUserItem}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.listContent}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        {debouncedQuery.length >= 2 ? (
                            <Text style={styles.emptyText}>No users found</Text>
                        ) : (
                            <Text style={styles.emptyText}>Type at least 2 characters to search</Text>
                        )}
                    </View>
                }
            />

            <Modal
                visible={showTypePicker}
                transparent
                animationType="slide"
                onRequestClose={() => setShowTypePicker(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Add {selectedUser?.username}</Text>
                        
                        <TextInput
                            style={styles.nicknameInput}
                            placeholder="Add nickname (optional)"
                            value={nickname}
                            onChangeText={setNickname}
                        />

                        <Text style={styles.pickerLabel}>Select relationship type:</Text>
                        
                        <View style={styles.typeGrid}>
                            {Object.values(RelationshipType).map((type) => (
                                <TouchableOpacity
                                    key={type}
                                    style={styles.typeButton}
                                    onPress={() => handleSendRequest(type)}
                                >
                                    <Text style={styles.typeButtonText}>
                                        {type.replace('_', ' ')}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <TouchableOpacity 
                            style={styles.cancelButton}
                            onPress={() => setShowTypePicker(false)}
                        >
                            <Text style={styles.cancelButtonText}>Cancel</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },
    searchHeader: {
        padding: 16,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    searchBar: {
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
    listContent: {
        padding: 16,
    },
    userCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 12,
        marginBottom: 12,
    },
    avatarContainer: {
        marginRight: 12,
    },
    avatar: {
        width: 44,
        height: 44,
        borderRadius: 22,
    },
    avatarPlaceholder: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#e7f1ff',
        alignItems: 'center',
        justifyContent: 'center',
    },
    userInfo: {
        flex: 1,
    },
    username: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1a1a1a',
    },
    mutualText: {
        fontSize: 12,
        color: '#666',
        marginTop: 2,
    },
    addButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#007AFF',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
        gap: 4,
    },
    addButtonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 14,
    },
    emptyContainer: {
        padding: 60,
        alignItems: 'center',
    },
    emptyText: {
        fontSize: 14,
        color: '#adb5bd',
        textAlign: 'center',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        padding: 24,
        maxHeight: '80%',
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 16,
        textAlign: 'center',
    },
    nicknameInput: {
        backgroundColor: '#f1f3f5',
        borderRadius: 8,
        padding: 12,
        marginBottom: 16,
        fontSize: 16,
    },
    pickerLabel: {
        fontSize: 14,
        color: '#666',
        marginBottom: 12,
    },
    typeGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: 20,
    },
    typeButton: {
        backgroundColor: '#e7f1ff',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
        minWidth: '30%',
        alignItems: 'center',
    },
    typeButtonText: {
        fontSize: 12,
        color: '#007AFF',
        fontWeight: '600',
    },
    cancelButton: {
        padding: 16,
        alignItems: 'center',
    },
    cancelButtonText: {
        color: '#ff4444',
        fontWeight: 'bold',
        fontSize: 16,
    },
});
