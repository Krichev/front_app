import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, TouchableOpacity, Modal } from 'react-native';
import { useTheme } from '../shared/ui/theme';
import { 
    useGetReceivedInvitationsQuery, 
    useGetSentInvitationsQuery,
    useGetInvitationQuery
} from '../entities/InvitationState/model/slice/invitationApi';
import { InvitationCard } from '../features/Invitation/ui/InvitationCard';
import { InvitationResponseSheet } from '../features/Invitation/ui/InvitationResponseSheet';
import { QuestInvitationStatus } from '../entities/InvitationState/model/types';
import Icon from 'react-native-vector-icons/Ionicons';
import { InvitationDetailsCard } from '../features/Invitation/ui/InvitationDetailsCard';

export const InvitationsScreen: React.FC = () => {
    const { theme } = useTheme();
    const [activeTab, setActiveTab] = useState<'received' | 'sent'>('received');
    const [selectedInvitationId, setSelectedInvitationId] = useState<number | null>(null);
    const [showDetails, setShowDetails] = useState(false);

    // Received invitations query
    const { 
        data: receivedInvitations, 
        isLoading: isLoadingReceived, 
        refetch: refetchReceived 
    } = useGetReceivedInvitationsQuery();

    // Sent invitations query
    const { 
        data: sentInvitations, 
        isLoading: isLoadingSent, 
        refetch: refetchSent 
    } = useGetSentInvitationsQuery();

    // Selected invitation details query (only fetches if ID is set)
    const { 
        data: selectedInvitation,
        isLoading: isLoadingDetails 
    } = useGetInvitationQuery(selectedInvitationId!, { skip: !selectedInvitationId });

    const onRefresh = () => {
        if (activeTab === 'received') {
            refetchReceived();
        } else {
            refetchSent();
        }
    };

    const handlePressInvitation = (id: number) => {
        setSelectedInvitationId(id);
        setShowDetails(true);
    };

    const renderEmptyState = () => (
        <View style={styles.emptyContainer}>
            <Icon name="mail-open-outline" size={64} color={theme.colors.text.disabled} />
            <Text style={[styles.emptyText, { color: theme.colors.text.secondary }]}>
                No {activeTab} invitations found
            </Text>
        </View>
    );

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.background.default }]}>
            <View style={styles.tabContainer}>
                <TouchableOpacity 
                    style={[styles.tab, activeTab === 'received' && { borderBottomColor: theme.colors.primary.main }]}
                    onPress={() => setActiveTab('received')}
                >
                    <Text style={[
                        styles.tabText, 
                        { color: activeTab === 'received' ? theme.colors.primary.main : theme.colors.text.secondary }
                    ]}>
                        Received
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity 
                    style={[styles.tab, activeTab === 'sent' && { borderBottomColor: theme.colors.primary.main }]}
                    onPress={() => setActiveTab('sent')}
                >
                    <Text style={[
                        styles.tabText, 
                        { color: activeTab === 'sent' ? theme.colors.primary.main : theme.colors.text.secondary }
                    ]}>
                        Sent
                    </Text>
                </TouchableOpacity>
            </View>

            <FlatList
                data={activeTab === 'received' ? receivedInvitations : sentInvitations}
                renderItem={({ item }) => (
                    <InvitationCard 
                        invitation={item} 
                        onPress={() => handlePressInvitation(item.id)}
                        isSent={activeTab === 'sent'}
                    />
                )}
                keyExtractor={(item) => item.id.toString()}
                refreshControl={
                    <RefreshControl refreshing={isLoadingReceived || isLoadingSent} onRefresh={onRefresh} />
                }
                ListEmptyComponent={renderEmptyState}
                contentContainerStyle={styles.listContent}
            />

            {/* Modal for details / response sheet */}
            <Modal
                visible={showDetails}
                animationType="slide"
                presentationStyle="pageSheet"
                onRequestClose={() => {
                    setShowDetails(false);
                    setSelectedInvitationId(null);
                }}
            >
                <View style={{ flex: 1, backgroundColor: theme.colors.background.default }}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>Invitation Details</Text>
                        <TouchableOpacity onPress={() => setShowDetails(false)}>
                            <Icon name="close" size={24} color={theme.colors.text.primary} />
                        </TouchableOpacity>
                    </View>
                    
                    {selectedInvitationId && (
                        <InvitationResponseSheet 
                            invitationId={selectedInvitationId}
                            onClose={() => setShowDetails(false)}
                            isSentView={activeTab === 'sent'}
                        />
                    )}
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    tabContainer: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        elevation: 2,
    },
    tab: {
        flex: 1,
        paddingVertical: 16,
        alignItems: 'center',
        borderBottomWidth: 2,
        borderBottomColor: 'transparent',
    },
    tabText: {
        fontSize: 16,
        fontWeight: '600',
    },
    listContent: {
        paddingVertical: 12,
        flexGrow: 1,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 100,
    },
    emptyText: {
        marginTop: 16,
        fontSize: 16,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
    }
});
