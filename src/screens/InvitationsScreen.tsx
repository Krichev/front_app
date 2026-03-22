import React, { useState } from 'react';
import { View, Text, FlatList, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { RootState } from '../app/providers/StoreProvider/store';
import { useGetSentInvitationsQuery, useGetReceivedInvitationsQuery } from '../entities/InvitationState/model/slice/invitationApi';
import { InvitationCard } from '../features/Invitation/ui/InvitationCard';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useAppStyles } from '../shared/ui/hooks/useAppStyles';
import { createStyles } from '../shared/ui/theme/createStyles';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const InvitationsScreen = () => {
    const { t } = useTranslation();
    const { theme } = useAppStyles();
    const styles = themeStyles;
    const navigation = useNavigation<NavigationProp>();
    const [activeTab, setActiveTab] = useState<'RECEIVED' | 'SENT'>('RECEIVED');

    const { 
        data: receivedInvitations, 
        isLoading: isLoadingReceived, 
        refetch: refetchReceived 
    } = useGetReceivedInvitationsQuery();
    
    const { 
        data: sentInvitations, 
        isLoading: isLoadingSent, 
        refetch: refetchSent 
    } = useGetSentInvitationsQuery();

    const invitations = activeTab === 'RECEIVED' ? receivedInvitations : sentInvitations;
    const isLoading = activeTab === 'RECEIVED' ? isLoadingReceived : isLoadingSent;

    const handleRefresh = () => {
        if (activeTab === 'RECEIVED') refetchReceived();
        else refetchSent();
    };

    return (
        <View style={styles.container}>
            <View style={styles.tabBar}>
                <TouchableOpacity 
                    style={[styles.tab, activeTab === 'RECEIVED' && styles.activeTab]}
                    onPress={() => setActiveTab('RECEIVED')}
                >
                    <Text style={[styles.tabText, activeTab === 'RECEIVED' && styles.activeTabText]}>
                        {t('invitation.tabs.received')}
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity 
                    style={[styles.tab, activeTab === 'SENT' && styles.activeTab]}
                    onPress={() => setActiveTab('SENT')}
                >
                    <Text style={[styles.tabText, activeTab === 'SENT' && styles.activeTabText]}>
                        {t('invitation.tabs.sent')}
                    </Text>
                </TouchableOpacity>
            </View>

            {isLoading ? (
                <View style={styles.loader}>
                    <ActivityIndicator size="large" color={theme.colors.primary.main} />
                </View>
            ) : (
                <FlatList
                    data={invitations}
                    keyExtractor={(item) => item.id.toString()}
                    renderItem={({ item }) => (
                        <InvitationCard 
                            invitation={item} 
                            isSent={activeTab === 'SENT'}
                            onPress={() => {
                                // For now, if InvitationDetails is not in the param list, we just log it
                                // In a real scenario, we should add it to AppNavigator
                                console.log('Navigate to invitation', item.id);
                            }}
                        />
                    )}
                    onRefresh={handleRefresh}
                    refreshing={isLoading}
                    contentContainerStyle={styles.listContent}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Text style={styles.emptyText}>
                                {t('invitation.noInvitations')}
                            </Text>
                        </View>
                    }
                />
            )}
        </View>
    );
};

const themeStyles = createStyles(theme => ({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background.default,
    },
    tabBar: {
        flexDirection: 'row',
        backgroundColor: theme.colors.background.paper,
        borderBottomWidth: theme.layout.borderWidth.thin,
        borderBottomColor: theme.colors.border.main,
    },
    tab: {
        flex: 1,
        paddingVertical: theme.spacing.md,
        alignItems: 'center',
    },
    activeTab: {
        borderBottomWidth: theme.layout.borderWidth.thick,
        borderBottomColor: theme.colors.primary.main,
    },
    tabText: {
        fontSize: theme.typography.fontSize.sm,
        fontWeight: theme.typography.fontWeight.semibold,
        color: theme.colors.text.secondary,
    },
    activeTabText: {
        color: theme.colors.primary.main,
    },
    loader: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    listContent: {
        paddingVertical: theme.spacing.sm,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingTop: theme.spacing.xl * 2,
    },
    emptyText: {
        fontSize: theme.typography.fontSize.base,
        color: theme.colors.text.disabled,
    },
}));

export default InvitationsScreen;
