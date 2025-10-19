// src/screens/FriendsFamilyScreen.tsx
import React, {useState} from 'react';
import {
    ActivityIndicator,
    Alert,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import {
    useAcceptRelationshipMutation,
    useCreateRelationshipMutation,
    useGetMyRelationshipsQuery,
    useGetPendingRequestsQuery,
    useRejectRelationshipMutation,
    useRemoveRelationshipMutation,
} from '../entities/QuizState/model/slice/quizApi';
import {
    RelationshipStatus,
    RelationshipType,
    UserRelationship,
} from '../entities/QuizState/model/types/question.types';

export const FriendsFamilyScreen: React.FC = () => {
    const [selectedTab, setSelectedTab] = useState<'connections' | 'pending'>('connections');
    const [searchUserId, setSearchUserId] = useState('');
    const [selectedRelationType, setSelectedRelationType] = useState<RelationshipType>(RelationshipType.FRIEND);

    // API Hooks
    const {
        data: relationships = [],
        isLoading: isLoadingRelationships,
        refetch: refetchRelationships,
    } = useGetMyRelationshipsQuery();

    const {
        data: pendingRequests = [],
        isLoading: isLoadingPending,
        refetch: refetchPending,
    } = useGetPendingRequestsQuery();

    const [createRelationship, {isLoading: isCreating}] = useCreateRelationshipMutation();
    const [acceptRelationship, {isLoading: isAccepting}] = useAcceptRelationshipMutation();
    const [rejectRelationship, {isLoading: isRejecting}] = useRejectRelationshipMutation();
    const [removeRelationship, {isLoading: isRemoving}] = useRemoveRelationshipMutation();

    const [refreshing, setRefreshing] = useState(false);

    const onRefresh = async () => {
        setRefreshing(true);
        await Promise.all([refetchRelationships(), refetchPending()]);
        setRefreshing(false);
    };

    // Filter accepted relationships
    const acceptedRelationships = relationships.filter(
        (r) => r.status === RelationshipStatus.ACCEPTED
    );

    const handleSendRequest = async () => {
        if (!searchUserId.trim()) {
            Alert.alert('Error', 'Please enter a user ID');
            return;
        }

        try {
            await createRelationship({
                relatedUserId: parseInt(searchUserId),
                relationshipType: selectedRelationType,
            }).unwrap();

            Alert.alert('Success', 'Connection request sent!');
            setSearchUserId('');
        } catch (error: any) {
            Alert.alert('Error', error.data?.message || 'Failed to send request');
        }
    };

    const handleAcceptRequest = async (relationshipId: number) => {
        try {
            await acceptRelationship(relationshipId).unwrap();
            Alert.alert('Success', 'Connection accepted!');
        } catch (error: any) {
            Alert.alert('Error', error.data?.message || 'Failed to accept request');
        }
    };

    const handleRejectRequest = async (relationshipId: number) => {
        Alert.alert(
            'Reject Request',
            'Are you sure you want to reject this request?',
            [
                {text: 'Cancel', style: 'cancel'},
                {
                    text: 'Reject',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await rejectRelationship(relationshipId).unwrap();
                            Alert.alert('Success', 'Request rejected');
                        } catch (error: any) {
                            Alert.alert('Error', error.data?.message || 'Failed to reject request');
                        }
                    },
                },
            ]
        );
    };

    const handleRemoveConnection = async (relationshipId: number, username: string) => {
        Alert.alert(
            'Remove Connection',
            `Remove ${username} from your connections?`,
            [
                {text: 'Cancel', style: 'cancel'},
                {
                    text: 'Remove',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await removeRelationship(relationshipId).unwrap();
                            Alert.alert('Success', 'Connection removed');
                        } catch (error: any) {
                            Alert.alert('Error', error.data?.message || 'Failed to remove connection');
                        }
                    },
                },
            ]
        );
    };

    const renderAddConnectionSection = () => (
        <View style={styles.addSection}>
            <Text style={styles.addSectionTitle}>Add New Connection</Text>

            <View style={styles.relationTypeSelector}>
                <TouchableOpacity
                    style={[
                        styles.relationTypeOption,
                        selectedRelationType === RelationshipType.FRIEND && styles.relationTypeOptionSelected
                    ]}
                    onPress={() => setSelectedRelationType(RelationshipType.FRIEND)}
                >
                    <Icon
                        name="people"
                        size={20}
                        color={selectedRelationType === RelationshipType.FRIEND ? '#007AFF' : '#666'}
                    />
                    <Text style={[
                        styles.relationTypeText,
                        selectedRelationType === RelationshipType.FRIEND && styles.relationTypeTextSelected
                    ]}>
                        Friend
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[
                        styles.relationTypeOption,
                        selectedRelationType === RelationshipType.FAMILY && styles.relationTypeOptionSelected
                    ]}
                    onPress={() => setSelectedRelationType(RelationshipType.FAMILY)}
                >
                    <Icon
                        name="heart"
                        size={20}
                        color={selectedRelationType === RelationshipType.FAMILY ? '#007AFF' : '#666'}
                    />
                    <Text style={[
                        styles.relationTypeText,
                        selectedRelationType === RelationshipType.FAMILY && styles.relationTypeTextSelected
                    ]}>
                        Family
                    </Text>
                </TouchableOpacity>
            </View>

            <View style={styles.searchContainer}>
                <TextInput
                    style={styles.searchInput}
                    value={searchUserId}
                    onChangeText={setSearchUserId}
                    placeholder="Enter user ID to connect"
                    keyboardType="numeric"
                />
                <TouchableOpacity
                    style={[styles.sendButton, isCreating && styles.sendButtonDisabled]}
                    onPress={handleSendRequest}
                    disabled={isCreating}
                >
                    {isCreating ? (
                        <ActivityIndicator color="#fff" size="small" />
                    ) : (
                        <>
                            <Icon name="paper-plane" size={18} color="#fff" />
                            <Text style={styles.sendButtonText}>Send</Text>
                        </>
                    )}
                </TouchableOpacity>
            </View>

            <Text style={styles.helperText}>
                Users you add as friends or family can access questions you mark as "Friends & Family"
            </Text>
        </View>
    );

    const renderConnectionCard = (relationship: UserRelationship) => (
        <View key={relationship.id} style={styles.connectionCard}>
            <View style={styles.connectionCardLeft}>
                <View style={styles.avatarPlaceholder}>
                    <Icon name="person" size={24} color="#007AFF" />
                </View>
                <View style={styles.connectionInfo}>
                    <Text style={styles.connectionName}>{relationship.relatedUserUsername}</Text>
                    <View style={styles.connectionMeta}>
                        <Icon
                            name={relationship.relationshipType === RelationshipType.FAMILY ? 'heart' : 'people'}
                            size={14}
                            color="#666"
                        />
                        <Text style={styles.connectionType}>
                            {relationship.relationshipType === RelationshipType.FAMILY ? 'Family' : 'Friend'}
                        </Text>
                    </View>
                </View>
            </View>
            <TouchableOpacity
                onPress={() => handleRemoveConnection(relationship.id, relationship.relatedUserUsername)}
            >
                <Icon name="close-circle" size={24} color="#ff4444" />
            </TouchableOpacity>
        </View>
    );

    const renderPendingRequestCard = (request: UserRelationship) => (
        <View key={request.id} style={styles.requestCard}>
            <View style={styles.requestCardLeft}>
                <View style={styles.avatarPlaceholder}>
                    <Icon name="person" size={24} color="#FFA500" />
                </View>
                <View style={styles.connectionInfo}>
                    <Text style={styles.connectionName}>{request.relatedUserUsername}</Text>
                    <View style={styles.connectionMeta}>
                        <Icon
                            name={request.relationshipType === RelationshipType.FAMILY ? 'heart' : 'people'}
                            size={14}
                            color="#666"
                        />
                        <Text style={styles.connectionType}>
                            wants to connect as {request.relationshipType === RelationshipType.FAMILY ? 'Family' : 'Friend'}
                        </Text>
                    </View>
                </View>
            </View>
            <View style={styles.requestActions}>
                <TouchableOpacity
                    style={styles.acceptButton}
                    onPress={() => handleAcceptRequest(request.id)}
                    disabled={isAccepting}
                >
                    <Icon name="checkmark-circle" size={28} color="#4CAF50" />
                </TouchableOpacity>
                <TouchableOpacity
                    style={styles.rejectButton}
                    onPress={() => handleRejectRequest(request.id)}
                    disabled={isRejecting}
                >
                    <Icon name="close-circle" size={28} color="#ff4444" />
                </TouchableOpacity>
            </View>
        </View>
    );

    const renderConnections = () => {
        if (isLoadingRelationships) {
            return (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#007AFF" />
                </View>
            );
        }

        if (acceptedRelationships.length === 0) {
            return (
                <View style={styles.emptyState}>
                    <Icon name="people-outline" size={64} color="#ccc" />
                    <Text style={styles.emptyStateTitle}>No Connections Yet</Text>
                    <Text style={styles.emptyStateText}>
                        Add friends and family to share your custom questions with them
                    </Text>
                </View>
            );
        }

        return (
            <View style={styles.connectionsList}>
                {acceptedRelationships.map(renderConnectionCard)}
            </View>
        );
    };

    const renderPendingRequests = () => {
        if (isLoadingPending) {
            return (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#007AFF" />
                </View>
            );
        }

        if (pendingRequests.length === 0) {
            return (
                <View style={styles.emptyState}>
                    <Icon name="mail-outline" size={64} color="#ccc" />
                    <Text style={styles.emptyStateTitle}>No Pending Requests</Text>
                    <Text style={styles.emptyStateText}>
                        You'll see connection requests from other users here
                    </Text>
                </View>
            );
        }

        return (
            <View style={styles.requestsList}>
                {pendingRequests.map(renderPendingRequestCard)}
            </View>
        );
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Friends & Family</Text>
                <Text style={styles.headerSubtitle}>
                    Manage your connections to share questions
                </Text>
            </View>

            {renderAddConnectionSection()}

            <View style={styles.tabContainer}>
                <TouchableOpacity
                    style={[styles.tab, selectedTab === 'connections' && styles.tabActive]}
                    onPress={() => setSelectedTab('connections')}
                >
                    <Text style={[styles.tabText, selectedTab === 'connections' && styles.tabTextActive]}>
                        Connections ({acceptedRelationships.length})
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tab, selectedTab === 'pending' && styles.tabActive]}
                    onPress={() => setSelectedTab('pending')}
                >
                    <Text style={[styles.tabText, selectedTab === 'pending' && styles.tabTextActive]}>
                        Pending ({pendingRequests.length})
                    </Text>
                    {pendingRequests.length > 0 && (
                        <View style={styles.badge}>
                            <Text style={styles.badgeText}>{pendingRequests.length}</Text>
                        </View>
                    )}
                </TouchableOpacity>
            </View>

            <ScrollView
                style={styles.content}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
            >
                {selectedTab === 'connections' ? renderConnections() : renderPendingRequests()}
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    header: {
        backgroundColor: '#fff',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: '700',
        color: '#333',
    },
    headerSubtitle: {
        fontSize: 14,
        color: '#666',
        marginTop: 4,
    },
    addSection: {
        backgroundColor: '#fff',
        padding: 16,
        marginTop: 16,
        marginHorizontal: 16,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 2},
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    addSectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
        marginBottom: 16,
    },
    relationTypeSelector: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 16,
    },
    relationTypeOption: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 12,
        borderRadius: 8,
        borderWidth: 2,
        borderColor: '#e0e0e0',
        backgroundColor: '#fafafa',
        gap: 6,
    },
    relationTypeOptionSelected: {
        borderColor: '#007AFF',
        backgroundColor: '#e5f1ff',
    },
    relationTypeText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#666',
    },
    relationTypeTextSelected: {
        color: '#007AFF',
    },
    searchContainer: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 12,
    },
    searchInput: {
        flex: 1,
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        backgroundColor: '#fff',
    },
    sendButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#007AFF',
        paddingHorizontal: 20,
        borderRadius: 8,
        gap: 6,
    },
    sendButtonDisabled: {
        backgroundColor: '#ccc',
    },
    sendButtonText: {
        color: '#fff',
        fontSize: 15,
        fontWeight: '600',
    },
    helperText: {
        fontSize: 13,
        color: '#666',
        fontStyle: 'italic',
    },
    tabContainer: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        marginTop: 16,
        marginHorizontal: 16,
        borderRadius: 8,
        padding: 4,
    },
    tab: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 12,
        borderRadius: 6,
        position: 'relative',
    },
    tabActive: {
        backgroundColor: '#007AFF',
    },
    tabText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#666',
    },
    tabTextActive: {
        color: '#fff',
    },
    badge: {
        backgroundColor: '#ff4444',
        borderRadius: 10,
        paddingHorizontal: 6,
        paddingVertical: 2,
        marginLeft: 6,
    },
    badgeText: {
        color: '#fff',
        fontSize: 11,
        fontWeight: '700',
    },
    content: {
        flex: 1,
        marginTop: 16,
    },
    loadingContainer: {
        padding: 40,
        alignItems: 'center',
    },
    emptyState: {
        padding: 40,
        alignItems: 'center',
    },
    emptyStateTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#666',
        marginTop: 16,
    },
    emptyStateText: {
        fontSize: 14,
        color: '#999',
        marginTop: 8,
        textAlign: 'center',
    },
    connectionsList: {
        paddingHorizontal: 16,
        paddingBottom: 16,
    },
    connectionCard: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 1},
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    connectionCardLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    avatarPlaceholder: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#e5f1ff',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    connectionInfo: {
        flex: 1,
    },
    connectionName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 4,
    },
    connectionMeta: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    connectionType: {
        fontSize: 13,
        color: '#666',
    },
    requestsList: {
        paddingHorizontal: 16,
        paddingBottom: 16,
    },
    requestCard: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
        borderWidth: 2,
        borderColor: '#FFA500',
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 1},
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    requestCardLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    requestActions: {
        flexDirection: 'row',
        gap: 12,
    },
    acceptButton: {
        padding: 4,
    },
    rejectButton: {
        padding: 4,
    },
});